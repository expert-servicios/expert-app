import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { decryptSecret } from '@/lib/security/encryption';
import { detectHoldedPermissions } from '@/lib/integrations/holded/holded-permission-probes';
import { refreshHoldedReadPermissions } from '@/lib/integrations/holded/holded-permissions';

export async function POST(request: NextRequest) {
  const auth = createServerSupabaseClient(request);
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles')
    .select('active_company_id').eq('id', user.id).maybeSingle();
  const companyId = profile?.active_company_id;
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa.' }, { status: 409 });
  const { data: member } = await admin.from('profile_companies')
    .select('role').eq('profile_id', user.id).eq('company_id', companyId).maybeSingle();
  if (!['owner','admin'].includes(String(member?.role ?? ''))) {
    return NextResponse.json({ error: 'Solo el titular o administrador puede revisar permisos.' }, { status: 403 });
  }
  const { data: integration } = await admin.from('client_integrations')
    .select('id,mode,api_version,status,permissions_enabled')
    .eq('company_id', companyId).eq('provider','holded').eq('status','active')
    .order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (!integration) return NextResponse.json({ error: 'Holded no está conectado.' }, { status: 404 });
  if (integration.mode !== 'client_account') {
    return NextResponse.json({ error: 'Esta conexión está gestionada por EXPERT.' }, { status: 403 });
  }
  const { data: secret } = await admin.from('client_integration_secrets')
    .select('encrypted_api_key').eq('integration_id',integration.id).maybeSingle();
  if (!secret?.encrypted_api_key) return NextResponse.json({ error: 'Falta la credencial cifrada.' }, { status: 409 });
  let result;
  try {
    result = await detectHoldedPermissions(decryptSecret(secret.encrypted_api_key),
      integration.api_version === 'v2' ? 'v2' : 'v1');
  } catch {
    return NextResponse.json({ error: 'Holded no permite verificar ahora los permisos. Se mantienen los últimos permisos confirmados.' }, { status: 503 });
  }
  if (!result.ok) return NextResponse.json({ error: 'El token no tiene capacidades de lectura verificables. Se mantienen los permisos anteriores.', warnings: result.warnings }, { status: 422 });
  const old = (integration.permissions_enabled ?? {}) as Record<string,boolean>;
  const requested = integration.api_version === 'v2' ? {
    ...result.permissions,
    laborEmployeesRead: old.laborEmployeesRead === true,
    laborPayrollsRead: old.laborPayrollsRead === true,
  } : old;
  const effective = refreshHoldedReadPermissions(result.permissions, old);
  const now = new Date().toISOString();
  const { error } = await admin.from('client_integrations')
    .update({ permissions_detected: result.permissions, permissions_enabled: effective,
      last_success_at: now, last_error: null, updated_at: now })
    .eq('id',integration.id).eq('company_id',companyId).eq('status','active');
  if (error) return NextResponse.json({ error: 'Error guardando permisos.' }, { status: 500 });
  await admin.from('audit_logs').insert({
    actor_id:user.id, action:'holded.client_permissions_refreshed',entity:'companies',entity_id:companyId,
    metadata:{ integration_id:integration.id, changed:JSON.stringify(old)!==JSON.stringify(effective) },
  });
  return NextResponse.json({ ok:true, permissions:effective, detected:result.permissions, warnings:result.warnings });
}
