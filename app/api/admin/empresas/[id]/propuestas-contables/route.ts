import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { saveKiaJournalInboxProposal } from '@/lib/ai/kia/kia-journal-inbox-save';

const input = z.object({
  date: z.string(),
  reason: z.string(),
  evidenceRefs: z.array(z.string()),
  lines: z.array(z.object({
    account: z.string(),
    debitCents: z.number(),
    creditCents: z.number(),
    explanation: z.string().optional(),
  }).strict()),
}).strict();

const decisionId = z.object({
  id: z.string().uuid(),
}).passthrough();

const decision = z.object({
  id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  note: z.string().trim().min(3).max(2000),
}).strict();

type RouteContext = { params: Promise<{ id: string }> };
type AdminClient = ReturnType<typeof getSupabaseAdmin>;

async function authorize(request: NextRequest, companyId: string) {
  const actor = await requireActiveActor(request, ['admin', 'owner']);
  if (!actor) return null;

  const admin = getSupabaseAdmin();
  let companyQuery = admin
    .from('companies')
    .select('id,tenant_id')
    .eq('id', companyId);

  if (actor.tenantId) companyQuery = companyQuery.eq('tenant_id', actor.tenantId);

  const { data: company, error: companyError } = await companyQuery.maybeSingle();
  if (companyError || !company) return null;

  const scopeTenantId = actor.tenantId ?? company.tenant_id ?? null;
  const { data: memberships, error: membershipError } = await admin
    .from('profile_companies')
    .select('profile_id')
    .eq('company_id', companyId);

  const memberProfileIds = (memberships ?? []).map((row) => row.profile_id);
  if (membershipError || memberProfileIds.length === 0) return null;

  let memberQuery = admin
    .from('profiles')
    .select('id')
    .in('id', memberProfileIds);
  if (scopeTenantId) memberQuery = memberQuery.eq('tenant_id', scopeTenantId);

  const { data: members, error: memberError } = await memberQuery.limit(1);
  if (memberError || !members?.[0]) return null;

  return {
    admin,
    userId: actor.userId,
    companyId: company.id,
    tenantId: scopeTenantId,
  };
}

async function getPendingProposal(
  admin: AdminClient,
  companyId: string,
  proposalId: string,
) {
  return admin
    .from('kia_journal_proposals')
    .select('id,company_id,status')
    .eq('id', proposalId)
    .eq('company_id', companyId)
    .eq('status', 'pending_review')
    .maybeSingle();
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const ctx = await authorize(request, id);
  if (!ctx) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const { data, error } = await ctx.admin
    .from('kia_journal_proposals')
    .select('id,company_id,entry_date,reason,evidence_refs,lines,total_debit_cents,total_credit_cents,status,created_at,review_note,reviewed_at')
    .eq('company_id', ctx.companyId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'No se pudo cargar la bandeja' }, { status: 500 });
  return NextResponse.json({ proposals: data, holdedMutated: false });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const ctx = await authorize(request, id);
  if (!ctx) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const raw = await request.json().catch(() => null);
  const parsed = input.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Formato de asiento inválido' }, { status: 400 });

  const saved = await saveKiaJournalInboxProposal(ctx.admin, ctx.userId, {
    companyId: ctx.companyId,
    ...parsed.data,
  });
  if (!saved.ok) {
    return NextResponse.json(
      { error: saved.error },
      { status: saved.duplicate ? 409 : 422 },
    );
  }

  return NextResponse.json(
    {
      proposal: saved.proposal,
      alreadyExists: saved.alreadyExists,
      holdedMutated: false,
    },
    { status: saved.alreadyExists ? 200 : 201 },
  );
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const ctx = await authorize(request, id);
  if (!ctx) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const raw = await request.json().catch(() => null);
  const parsedId = decisionId.safeParse(raw);
  if (!parsedId.success) return NextResponse.json({ error: 'Decisión inválida' }, { status: 400 });

  const { data: pendingProposal, error: proposalError } = await getPendingProposal(
    ctx.admin,
    ctx.companyId,
    parsedId.data.id,
  );
  if (proposalError) {
    return NextResponse.json(
      { error: 'No se pudo comprobar la propuesta' },
      { status: 500 },
    );
  }
  if (!pendingProposal) {
    return NextResponse.json(
      { error: 'Propuesta inexistente o ya revisada' },
      { status: 409 },
    );
  }

  const parsed = decision.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Decisión inválida' }, { status: 400 });

  const { data, error } = await ctx.admin
    .from('kia_journal_proposals')
    .update({
      status: parsed.data.status,
      review_note: parsed.data.note,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', pendingProposal.id)
    .eq('company_id', ctx.companyId)
    .eq('status', 'pending_review')
    .select('id,status')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'No se pudo registrar la revisión' }, { status: 500 });
  if (!data) {
    return NextResponse.json(
      { error: 'Propuesta inexistente o ya revisada' },
      { status: 409 },
    );
  }

  return NextResponse.json({ proposal: data, holdedMutated: false });
}
