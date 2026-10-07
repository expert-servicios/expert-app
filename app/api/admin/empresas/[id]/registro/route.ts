import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveClientRegistrySubject } from '@/lib/ai/kia/kia-client-ledger';
import { filterSupersededDocumentEvents } from '@/lib/documents/document-ledger-filter';
import {
  clientRegistryDetailCutoff,
  clientRegistryRetentionCutoff,
  recordConfirmedRegistryFact,
  recordConfirmedRegistryInstruction,
} from '@/lib/ai/kia/kia-client-registry-profile';

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'inactive' || !['admin', 'owner'].includes(profile.role)) return null;
  return { admin, actorId: user.id };
}

const mutationSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('fact'),
    id: z.string().uuid().optional(),
    category: z.string().trim().min(1).max(80).default('general'),
    value: z.string().trim().min(1).max(4000),
  }).strict(),
  z.object({
    kind: z.literal('instruction'),
    id: z.string().uuid().optional(),
    scope: z.string().trim().min(1).max(80).default('general'),
    text: z.string().trim().min(1).max(4000),
    priority: z.number().int().min(1).max(5).default(3),
  }).strict(),
]);

const revokeSchema = z.object({
  kind: z.enum(['fact', 'instruction']),
  id: z.string().uuid(),
}).strict();

async function assertCompany(admin: ReturnType<typeof getSupabaseAdmin>, companyId: string) {
  const { data, error } = await admin.from('companies').select('id').eq('id', companyId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireStaff(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: companyId } = await params;
    if (!(await assertCompany(ctx.admin, companyId))) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const subject = await resolveClientRegistrySubject(ctx.admin, { companyId });
    if (!subject) return NextResponse.json({ error: 'No se pudo resolver la hoja registral' }, { status: 409 });

    const [facts, instructions, events, summaries] = await Promise.all([
      ctx.admin.from('client_registry_facts')
        .select('id,fact_key,category,fact_value,valid_from,source_ref,updated_at')
        .eq('subject_id', subject.id)
        .eq('status', 'active')
        .eq('verification_status', 'confirmed')
        .is('valid_to', null)
        .order('updated_at', { ascending: false }),
      ctx.admin.from('client_registry_instructions')
        .select('id,instruction_key,scope,instruction_text,priority,valid_from,source_ref,updated_at')
        .eq('subject_id', subject.id)
        .eq('status', 'active')
        .eq('verification_status', 'confirmed')
        .is('valid_to', null)
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false }),
      ctx.admin.from('client_registry_events')
        .select('id,event_type,occurred_at,title,summary,channel,direction,importance,source_ref,case_id,source_table,source_id')
        .eq('subject_id', subject.id)
        .gte('occurred_at', clientRegistryDetailCutoff())
        .order('occurred_at', { ascending: false })
        .limit(150),
      ctx.admin.from('client_registry_period_summaries')
        .select('id,period_start,period_end,summary_text,event_count,generated_at')
        .eq('subject_id', subject.id)
        .eq('company_id', companyId)
        .is('case_id', null)
        .or(`retention_class.eq.legal_hold,period_end.gte.${clientRegistryRetentionCutoff().slice(0, 10)}`)
        .order('period_end', { ascending: false })
        .limit(6),
    ]);

    const firstError = [facts.error, instructions.error, events.error, summaries.error].find(Boolean);
    if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

    const filteredEvents = await filterSupersededDocumentEvents(ctx.admin, events.data ?? []);

    return NextResponse.json({
      subjectId: subject.id,
      lifecycleStage: subject.lifecycleStage,
      detailWindowMonths: 24,
      retentionYears: 6,
      facts: facts.data ?? [],
      instructions: instructions.data ?? [],
      events: filteredEvents,
      summaries: summaries.data ?? [],
    });
  } catch (error) {
    console.error('[admin/empresas/[id]/registro GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireStaff(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: companyId } = await params;
    if (!(await assertCompany(ctx.admin, companyId))) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const subject = await resolveClientRegistrySubject(ctx.admin, { companyId });
    if (!subject) return NextResponse.json({ error: 'No se pudo resolver la hoja registral' }, { status: 409 });

    let recordId: string;
    let previousId: string | null = null;

    if (parsed.data.kind === 'fact') {
      let key = `manual.fact.${randomUUID()}`;
      if (parsed.data.id) {
        const { data: current, error } = await ctx.admin.from('client_registry_facts')
          .select('id,fact_key')
          .eq('id', parsed.data.id)
          .eq('subject_id', subject.id)
          .eq('status', 'active')
          .maybeSingle();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (!current) return NextResponse.json({ error: 'Hecho no encontrado o ya sustituido' }, { status: 404 });
        key = current.fact_key;
        previousId = current.id;
      }

      recordId = await recordConfirmedRegistryFact(ctx.admin, {
        subjectId: subject.id,
        key,
        category: parsed.data.category,
        value: parsed.data.value,
        sourceRef: `admin-company360:${companyId}`,
        metadata: { entered_by: ctx.actorId, source: 'company_360_manual' },
      });
    } else {
      let key = `manual.instruction.${randomUUID()}`;
      if (parsed.data.id) {
        const { data: current, error } = await ctx.admin.from('client_registry_instructions')
          .select('id,instruction_key')
          .eq('id', parsed.data.id)
          .eq('subject_id', subject.id)
          .eq('status', 'active')
          .maybeSingle();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (!current) return NextResponse.json({ error: 'Instrucción no encontrada o ya sustituida' }, { status: 404 });
        key = current.instruction_key;
        previousId = current.id;
      }

      recordId = await recordConfirmedRegistryInstruction(ctx.admin, {
        subjectId: subject.id,
        key,
        scope: parsed.data.scope,
        text: parsed.data.text,
        priority: parsed.data.priority,
        sourceRef: `admin-company360:${companyId}`,
        metadata: { entered_by: ctx.actorId, source: 'company_360_manual' },
      });
    }

    await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.actorId,
      action: parsed.data.kind === 'fact' ? 'client_registry.fact_saved' : 'client_registry.instruction_saved',
      entity: 'companies',
      entity_id: companyId,
      metadata: {
        registry_subject_id: subject.id,
        previous_record_id: previousId,
        new_record_id: recordId,
        kind: parsed.data.kind,
      },
    }).then(() => {});

    return NextResponse.json({ ok: true, id: recordId });
  } catch (error) {
    console.error('[admin/empresas/[id]/registro POST]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireStaff(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: companyId } = await params;
    const parsed = revokeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const subject = await resolveClientRegistrySubject(ctx.admin, { companyId });
    if (!subject) return NextResponse.json({ error: 'No se pudo resolver la hoja registral' }, { status: 409 });

    const table = parsed.data.kind === 'fact' ? 'client_registry_facts' : 'client_registry_instructions';
    const now = new Date().toISOString();
    const { data, error } = await ctx.admin.from(table)
      .update({ status: 'revoked', valid_to: now, updated_at: now })
      .eq('id', parsed.data.id)
      .eq('subject_id', subject.id)
      .eq('status', 'active')
      .select('id')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Registro no encontrado o ya inactivo' }, { status: 404 });

    await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.actorId,
      action: parsed.data.kind === 'fact' ? 'client_registry.fact_revoked' : 'client_registry.instruction_revoked',
      entity: 'companies',
      entity_id: companyId,
      metadata: { registry_subject_id: subject.id, record_id: parsed.data.id, kind: parsed.data.kind },
    }).then(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/empresas/[id]/registro DELETE]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
