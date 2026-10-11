import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';

const payloadSchema = z.object({
  cnae: z.string().trim().max(20).optional().nullable(),
  iae: z.string().trim().max(80).optional().nullable(),
  administrator: z.string().trim().max(250).optional().nullable(),
  shareholders_over_25: z.string().trim().max(2000).optional().nullable(),
  work_centers: z.string().trim().max(2000).optional().nullable(),
  properties_and_ibi: z.string().trim().max(3000).optional().nullable(),
  has_rent_withholding_115_180: z.boolean().optional().nullable(),
  has_payroll_withholding_111_190: z.boolean().optional().nullable(),
  has_nonresident_payments_216: z.boolean().optional().nullable(),
  foreign_operations_notes: z.string().trim().max(3000).optional().nullable(),
  accounting_notes: z.string().trim().max(3000).optional().nullable(),
}).strict();

type Payload = z.infer<typeof payloadSchema>;

const COMPLETION_KEYS: Array<keyof Payload> = [
  'cnae',
  'iae',
  'administrator',
  'shareholders_over_25',
  'work_centers',
  'properties_and_ibi',
  'has_rent_withholding_115_180',
  'has_payroll_withholding_111_190',
  'has_nonresident_payments_216',
];

function completionPercent(payload: Payload): number {
  const complete = COMPLETION_KEYS.filter((key) => {
    const value = payload[key];
    return typeof value === 'boolean' || (typeof value === 'string' && value.trim().length > 0);
  }).length;
  return Math.round((complete / COMPLETION_KEYS.length) * 100);
}

async function authorize(request: NextRequest, companyId: string) {
  const actor = await requireActiveActor(request);
  if (!actor) return null;

  const admin = getSupabaseAdmin();
  const staff = actor.role === 'admin' || actor.role === 'owner';

  if (!staff) {
    // A tenant administrator must have a canonical tenant before using service-role data.
    if (actor.role === 'tenant_admin' && !actor.tenantId) return null;

    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('role')
      .eq('profile_id', actor.userId)
      .eq('company_id', companyId)
      .maybeSingle();
    if (membershipError || !membership) return null;

    // A membership alone must not allow a cross-tenant company lookup or update.
    if (actor.tenantId) {
      const { data: company, error: companyError } = await admin
        .from('companies')
        .select('tenant_id')
        .eq('id', companyId)
        .maybeSingle();
      if (companyError || !company) return null;
      if (company.tenant_id !== actor.tenantId) {
        // Legacy rows with a null tenant are permitted only when every recorded
        // owner belongs to this actor's tenant. Membership alone is insufficient.
        if (company.tenant_id !== null) return null;
        const { data: owners, error: ownersError } = await admin
          .from('profile_companies')
          .select('profile_id')
          .eq('company_id', companyId)
          .eq('role', 'owner');
        if (ownersError || !owners?.length) return null;
        const ownerIds = [...new Set(owners.map((owner) => owner.profile_id).filter(Boolean))];
        if (ownerIds.length !== owners.length) return null;
        const { data: ownerProfiles, error: profilesError } = await admin
          .from('profiles')
          .select('id,tenant_id')
          .in('id', ownerIds);
        if (profilesError || !ownerProfiles || ownerProfiles.length !== ownerIds.length) return null;
        if (ownerProfiles.some((profile) => profile.tenant_id !== actor.tenantId)) return null;
      }
    }
  }

  return { admin, userId: actor.userId, staff };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(request, id);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data, error } = await auth.admin
    .from('company_intake_profiles')
    .select('company_id,client_id,status,payload,completion_percent,last_saved_at,completed_at')
    .eq('company_id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    intake: data ?? {
      company_id: id,
      client_id: auth.userId,
      status: 'draft',
      payload: {},
      completion_percent: 0,
      last_saved_at: null,
      completed_at: null,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(request, id);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await auth.admin
    .from('company_intake_profiles')
    .select('payload,client_id')
    .eq('company_id', id)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const previous = existing?.payload && typeof existing.payload === 'object' && !Array.isArray(existing.payload)
    ? existing.payload as Payload
    : {};
  const payload: Payload = { ...previous, ...parsed.data };
  const completion = completionPercent(payload);
  const now = new Date().toISOString();

  const { data, error } = await auth.admin
    .from('company_intake_profiles')
    .upsert({
      company_id: id,
      client_id: existing?.client_id ?? auth.userId,
      status: completion === 100 ? 'ready' : 'draft',
      payload,
      completion_percent: completion,
      last_saved_at: now,
      updated_at: now,
    }, { onConflict: 'company_id' })
    .select('company_id,status,payload,completion_percent,last_saved_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auth.admin.from('audit_logs').insert({
    actor_id: auth.userId,
    action: 'company360.intake.saved',
    entity: 'companies',
    entity_id: id,
    metadata: {
      completion_percent: completion,
      source: auth.staff ? 'admin' : 'client',
      fields: Object.keys(parsed.data),
    },
  }).then(() => null, () => null);

  return NextResponse.json({ ok: true, intake: data });
}
