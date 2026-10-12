import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { summarizeCaseHistory, detectMissingDocuments, draftClientMessage } from '@/lib/integrations/ai';

const bodySchema = z.object({
  action: z.enum(['summary', 'missing-docs', 'draft']),
  goal: z.string().min(5).max(500).optional(),
});

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type ScopedCase = {
  id: string;
  service: string;
  client_id: string;
  company_id: string | null;
  tenant_id: string | null;
};

async function getScopedCase(
  admin: AdminClient,
  caseId: string,
  actorTenantId: string | null,
): Promise<ScopedCase | null> {
  let query = admin
    .from('cases')
    .select('id,service,client_id,company_id,tenant_id')
    .eq('id', caseId);

  if (actorTenantId) query = query.eq('tenant_id', actorTenantId);

  const { data: caseRow, error } = await query.maybeSingle();
  if (error || !caseRow) return null;

  const scopeTenantId = actorTenantId ?? caseRow.tenant_id;
  if (scopeTenantId) {
    const [clientScope, companyScope] = await Promise.all([
      admin
        .from('profiles')
        .select('id')
        .eq('id', caseRow.client_id)
        .eq('tenant_id', scopeTenantId)
        .maybeSingle(),
      caseRow.company_id
        ? admin
            .from('companies')
            .select('id')
            .eq('id', caseRow.company_id)
            .eq('tenant_id', scopeTenantId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (clientScope.error || !clientScope.data) return null;
    if (caseRow.company_id && (companyScope.error || !companyScope.data)) return null;
  }

  if (caseRow.company_id) {
    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', caseRow.client_id)
      .eq('company_id', caseRow.company_id)
      .maybeSingle();

    if (membershipError || !membership) return null;
  }

  return caseRow as ScopedCase;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const admin = getSupabaseAdmin();
    const caseRow = await getScopedCase(admin, id, actor.tenantId);
    if (!caseRow) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Acción inválida. Use "summary", "missing-docs" o "draft".' },
        { status: 400 },
      );
    }

    const { action } = parsed.data;

    if (action === 'summary') {
      const result = await summarizeCaseHistory(caseRow.id);
      return NextResponse.json({ action, result });
    }

    if (action === 'missing-docs') {
      const result = await detectMissingDocuments(caseRow.id, caseRow.service);
      return NextResponse.json({ action, result });
    }

    const { goal } = parsed.data;
    if (!goal) return NextResponse.json({ error: 'Falta el campo "goal"' }, { status: 400 });

    const result = await draftClientMessage(caseRow.id, goal);
    return NextResponse.json({ action, result });
  } catch (err) {
    console.error('[admin/cases/[id]/ai] POST error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
