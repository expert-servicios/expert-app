import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export const CLIENT_REGISTRY_DETAIL_MONTHS = 24;
export const CLIENT_REGISTRY_RETENTION_YEARS = 6;

export type KiaRegistryStructuralFact = {
  key: string;
  category: string;
  value: string;
  validFrom: string;
  sourceRef: string | null;
};

export type KiaRegistryOperationalInstruction = {
  key: string;
  scope: string;
  text: string;
  priority: number;
  validFrom: string;
  sourceRef: string | null;
};

export type KiaRegistryHistoricalSummary = {
  periodStart: string;
  periodEnd: string;
  summaryText: string;
  eventCount: number;
  generatedAt: string;
};

export type KiaClientRegistryProfile = {
  structuralFacts: KiaRegistryStructuralFact[];
  operationalInstructions: KiaRegistryOperationalInstruction[];
  historicalSummaries: KiaRegistryHistoricalSummary[];
};

function addUtcMonths(date: Date, months: number) {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function addUtcYears(date: Date, years: number) {
  const result = new Date(date.getTime());
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

export function clientRegistryRetentionDates(occurredAt: string): {
  detailUntil: string;
  retainUntil: string;
} {
  const base = new Date(occurredAt);
  if (!Number.isFinite(base.getTime())) throw new Error('client_registry_invalid_occurred_at');
  return {
    detailUntil: addUtcMonths(base, CLIENT_REGISTRY_DETAIL_MONTHS).toISOString(),
    retainUntil: addUtcYears(base, CLIENT_REGISTRY_RETENTION_YEARS).toISOString(),
  };
}

export function clientRegistryDetailCutoff(now = new Date()): string {
  return addUtcMonths(now, -CLIENT_REGISTRY_DETAIL_MONTHS).toISOString();
}

export function clientRegistryRetentionCutoff(now = new Date()): string {
  return addUtcYears(now, -CLIENT_REGISTRY_RETENTION_YEARS).toISOString();
}

export async function loadClientRegistryProfile(
  admin: AdminClient,
  subjectId: string,
): Promise<KiaClientRegistryProfile> {
  const [factsResult, instructionsResult, summariesResult] = await Promise.all([
    admin.from('client_registry_facts')
      .select('fact_key,category,fact_value,valid_from,source_ref')
      .eq('subject_id', subjectId)
      .eq('status', 'active')
      .eq('verification_status', 'confirmed')
      .is('valid_to', null)
      .order('updated_at', { ascending: false })
      .limit(40),
    admin.from('client_registry_instructions')
      .select('instruction_key,scope,instruction_text,priority,valid_from,source_ref')
      .eq('subject_id', subjectId)
      .eq('status', 'active')
      .eq('verification_status', 'confirmed')
      .is('valid_to', null)
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(30),
    admin.from('client_registry_period_summaries')
      .select('period_start,period_end,summary_text,event_count,generated_at')
      .eq('subject_id', subjectId)
      .order('period_end', { ascending: false })
      .limit(6),
  ]);

  if (factsResult.error) throw factsResult.error;
  if (instructionsResult.error) throw instructionsResult.error;
  if (summariesResult.error) throw summariesResult.error;

  return {
    structuralFacts: (factsResult.data ?? []).map((row) => ({
      key: row.fact_key,
      category: row.category,
      value: row.fact_value,
      validFrom: row.valid_from,
      sourceRef: row.source_ref,
    })),
    operationalInstructions: (instructionsResult.data ?? []).map((row) => ({
      key: row.instruction_key,
      scope: row.scope,
      text: row.instruction_text,
      priority: Number(row.priority ?? 3),
      validFrom: row.valid_from,
      sourceRef: row.source_ref,
    })),
    historicalSummaries: (summariesResult.data ?? []).map((row) => ({
      periodStart: row.period_start,
      periodEnd: row.period_end,
      summaryText: row.summary_text,
      eventCount: Number(row.event_count ?? 0),
      generatedAt: row.generated_at,
    })),
  };
}

export async function recordConfirmedRegistryFact(
  admin: AdminClient,
  input: {
    subjectId: string;
    key: string;
    category?: string;
    value: string;
    sourceRef?: string | null;
    sourceEventId?: string | null;
    validFrom?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<string> {
  const now = new Date().toISOString();
  const key = input.key.trim();
  const value = input.value.trim();
  if (!key || !value) throw new Error('client_registry_fact_invalid');

  const { data: current, error: currentError } = await admin.from('client_registry_facts')
    .select('id,fact_value')
    .eq('subject_id', input.subjectId)
    .eq('fact_key', key)
    .eq('status', 'active')
    .is('valid_to', null)
    .maybeSingle();
  if (currentError) throw currentError;
  if (current?.fact_value === value) return current.id;

  const { data: created, error: createError } = await admin.from('client_registry_facts')
    .insert({
      subject_id: input.subjectId,
      fact_key: key,
      category: input.category?.trim() || 'general',
      fact_value: value,
      verification_status: 'confirmed',
      source_ref: input.sourceRef ?? null,
      source_event_id: input.sourceEventId ?? null,
      valid_from: input.validFrom ?? now,
      status: current?.id ? 'staged' : 'active',
      metadata: input.metadata ?? {},
      updated_at: now,
    })
    .select('id')
    .single();
  if (createError) throw createError;

  if (current?.id) {
    const { error: supersedeError } = await admin.from('client_registry_facts')
      .update({
        status: 'superseded',
        valid_to: input.validFrom ?? now,
        superseded_by_fact_id: created.id,
        updated_at: now,
      })
      .eq('id', current.id)
      .eq('subject_id', input.subjectId)
      .eq('status', 'active');
    if (supersedeError) throw supersedeError;

    const { error: activateError } = await admin.from('client_registry_facts')
      .update({ status: 'active', updated_at: now })
      .eq('id', created.id)
      .eq('subject_id', input.subjectId)
      .eq('status', 'staged');
    if (activateError) throw activateError;
  }

  return created.id;
}

export async function recordConfirmedRegistryInstruction(
  admin: AdminClient,
  input: {
    subjectId: string;
    key: string;
    scope?: string;
    text: string;
    priority?: number;
    sourceRef?: string | null;
    sourceEventId?: string | null;
    validFrom?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<string> {
  const now = new Date().toISOString();
  const key = input.key.trim();
  const instructionText = input.text.trim();
  if (!key || !instructionText) throw new Error('client_registry_instruction_invalid');

  const { data: current, error: currentError } = await admin.from('client_registry_instructions')
    .select('id,instruction_text')
    .eq('subject_id', input.subjectId)
    .eq('instruction_key', key)
    .eq('status', 'active')
    .is('valid_to', null)
    .maybeSingle();
  if (currentError) throw currentError;
  if (current?.instruction_text === instructionText) return current.id;

  const { data: created, error: createError } = await admin.from('client_registry_instructions')
    .insert({
      subject_id: input.subjectId,
      instruction_key: key,
      scope: input.scope?.trim() || 'general',
      instruction_text: instructionText,
      priority: Math.max(1, Math.min(5, input.priority ?? 3)),
      verification_status: 'confirmed',
      source_ref: input.sourceRef ?? null,
      source_event_id: input.sourceEventId ?? null,
      valid_from: input.validFrom ?? now,
      status: current?.id ? 'staged' : 'active',
      metadata: input.metadata ?? {},
      updated_at: now,
    })
    .select('id')
    .single();
  if (createError) throw createError;

  if (current?.id) {
    const { error: supersedeError } = await admin.from('client_registry_instructions')
      .update({
        status: 'superseded',
        valid_to: input.validFrom ?? now,
        superseded_by_instruction_id: created.id,
        updated_at: now,
      })
      .eq('id', current.id)
      .eq('subject_id', input.subjectId)
      .eq('status', 'active');
    if (supersedeError) throw supersedeError;

    const { error: activateError } = await admin.from('client_registry_instructions')
      .update({ status: 'active', updated_at: now })
      .eq('id', created.id)
      .eq('subject_id', input.subjectId)
      .eq('status', 'staged');
    if (activateError) throw activateError;
  }

  return created.id;
}

type HistoricalEventRow = {
  event_type: string;
  occurred_at: string;
  title: string | null;
  summary: string | null;
  importance: number | null;
  source_ref: string | null;
};

function buildYearSummary(year: string, rows: HistoricalEventRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.event_type, (counts.get(row.event_type) ?? 0) + 1);
  const topTypes = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => `${type} (${count})`)
    .join(', ');
  const important = [...rows]
    .filter((row) => Number(row.importance ?? 0) >= 2)
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 12)
    .map((row) => `${row.occurred_at.slice(0, 10)} · ${row.title ?? row.event_type}${row.summary ? ` · ${row.summary}` : ''}`)
    .join('\n');

  return [
    `${year} · ${rows.length} eventos registrados.`,
    topTypes ? `Tipos principales: ${topTypes}.` : null,
    important ? `Hitos relevantes:\n${important}` : null,
  ].filter(Boolean).join('\n').slice(0, 7000);
}

export async function refreshClientRegistryHistoricalSummaries(
  admin: AdminClient,
  subjectId: string,
  now = new Date(),
): Promise<void> {
  const detailCutoff = clientRegistryDetailCutoff(now);
  const retentionCutoff = clientRegistryRetentionCutoff(now);

  const rows: HistoricalEventRow[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin.from('client_registry_events')
      .select('event_type,occurred_at,title,summary,importance,source_ref')
      .eq('subject_id', subjectId)
      .gte('occurred_at', retentionCutoff)
      .lt('occurred_at', detailCutoff)
      .order('occurred_at', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as HistoricalEventRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  if (!rows.length) return;
  const byYear = new Map<string, HistoricalEventRow[]>();
  for (const row of rows) {
    const year = row.occurred_at.slice(0, 4);
    const bucket = byYear.get(year) ?? [];
    bucket.push(row);
    byYear.set(year, bucket);
  }

  for (const [year, events] of byYear.entries()) {
    const periodStart = `${year}-01-01`;
    const periodEnd = `${year}-12-31`;
    const summaryText = buildYearSummary(year, events);
    const { data: current, error: currentError } = await admin.from('client_registry_period_summaries')
      .select('version')
      .eq('subject_id', subjectId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle();
    if (currentError) throw currentError;

    const { error } = await admin.from('client_registry_period_summaries').upsert({
      subject_id: subjectId,
      period_start: periodStart,
      period_end: periodEnd,
      summary_text: summaryText,
      event_count: events.length,
      generated_at: now.toISOString(),
      version: Number(current?.version ?? 0) + 1,
      metadata: {
        detail_window_months: CLIENT_REGISTRY_DETAIL_MONTHS,
        retention_years: CLIENT_REGISTRY_RETENTION_YEARS,
      },
      updated_at: now.toISOString(),
    }, { onConflict: 'subject_id,period_start,period_end' });
    if (error) throw error;
  }
}
