import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { HOLDED_READ_PERMISSION_KEYS, patchHoldedReadPermissions, type HoldedPermissions } from '@/lib/integrations/holded/holded-permissions';

const scopeSchema = z.object(Object.fromEntries(HOLDED_READ_PERMISSION_KEYS.map(key => [key, z.boolean().optional()])));
const bodySchema = z.object({
  companyId: z.string().uuid(),
  changes: scopeSchema.strict().refine(value => Object.keys(value).length > 0),
}).strict();

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origen no autorizado' }, { status: 403 });
  }
  const auth = createServerSupabaseClient(request);
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Permisos inválidos' }, { status: 400 });
  const { companyId, changes } = parsed.data;
  const admin = getSupabaseAdmin();
  const { data: member, error: membershipError } = await admin.from('profile_companies')
    .select('role').eq('profile_id',user.id).eq('company_id',companyId).maybeSingle();
  if (membershipError) return NextResponse.json({ error: 'No se pudo verificar la membresía' }, { status: 500 });
  if (!member || !['owner','admin'].includes(String(member.role))) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }
  const { data: integration, error: integrationError } = await admin.from('client_integrations')
    .select('id,mode,permissions_detected,permissions_enabled,updated_at')
    .eq('company_id',companyId).eq('provider','holded').eq('status','active')
    .order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (integrationError) return NextResponse.json({ error: 'Error consultando integración' }, { status: 500 });
  if (!integration || integration.mode !== 'client_account') {
    return NextResponse.json({ error: 'La integración no es autogestionada' }, { status: 403 });
  }
  const old = (integration.permissions_enabled ?? {}) as Partial<HoldedPermissions>;
  const permissions = patchHoldedReadPermissions(
    (integration.permissions_detected ?? {}) as Partial<HoldedPermissions>, old, changes,
  );
  const { data: updated, error: updateError } = await admin.from('client_integrations')
    .update({ permissions_enabled: permissions, updated_at: new Date().toISOString() })
    .eq('id',integration.id).eq('company_id',companyId).eq('status','active')
    .eq('updated_at',integration.updated_at).select('id').maybeSingle();
  if (updateError || !updated) return NextResponse.json({ error: 'Conflicto de permisos. Recarga e inténtalo de nuevo.' }, { status: 409 });
  await admin.from('audit_logs').insert({
    actor_id: user.id, action: 'holded.client_permissions_updated', entity: 'companies', entity_id: companyId,
    metadata: { integration_id: integration.id, changed_permissions: Object.keys(changes), enabled_permissions: permissions },
  });
  return NextResponse.json({ ok: true, permissions });
}
