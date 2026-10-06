import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export const CLIENT_REGISTRY_DETAIL_MONTHS = 24;
export const CLIENT_REGISTRY_RETENTION_YEARS = 6;

export type ClientRegistryProfileScope = {
  companyId?: string | null;
  caseId?: string | null;
};

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
  companyId: string | null;
  caseId: string | null;
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
  scope: ClientRegistryProfileScope = {},
  now = new Date(),
): Promise<KiaClientRegistryProfile> {
  let summariesQuery = admin.from('client_registry_period_summaries')
    .select('company_id,case_id,period_start,period_end,summary_text,event_count,generated_at,retention_class')
    .eq('subject_id', subjectId)
    .or(`retention_class.eq.legal_hold,period_end.gte.${clientRegistryRetentionCutoff(now).slice(0, 10)}`);

  if (scope.caseId) {
    summariesQuery = summariesQuery.eq('case_id', scope.caseId);
    if (scope.companyId) summariesQuery = summariesQuery.eq('company_id', scope.companyId);
  } else if (scope.companyId) {
    summariesQuery = summariesQuery.eq('company_id', scope.companyId).is('case_id', null);
  } else {
    summariesQuery = summariesQuery.is('company_id', null).is('case_id', null);
  }

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
    summariesQuery.order('period_end', { ascending: false }).limit(6),
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
      companyId: row.company_id,
      caseId: row.case_id,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      summaryText: row.summary_text,
      eventCount: Number(row.event_count ?? 0),
      generatedAt: row.generated_at,
    })),
  };
}

function requireProvenance(sourceRef?: string | null, sourceEventId?: string | null) {
  if (!sourceRef?.trim() && !sourceEventId) throw new Error('client_registry_provenance_required');
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
  const key = input.key.trim();
  const value = input.value.trim();
  if (!key || !value) throw new Error('client_registry_fact_invalid');
  requireProvenance(input.sourceRef, input.sourceEventId);

  const { data, error } = await admin.rpc('replace_client_registry_fact', {
    p_subject_id: input.subjectId,
    p_fact_key: key,
    p_category: input.category?.trim() || 'general',
    p_fact_value: value,
    p_source_ref: input.sourceRef ?? null,
    p_source_event_id: input.sourceEventId ?? null,
    p_valid_from: input.validFrom ?? new Date().toISOString(),
    p_metadata: input.metadata ?? {},
  });
  if (error) throw error;
  if (typeof data !== 'string' || !data) throw new Error('client_registry_fact_replace_failed');
  return data;
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
  const key = input.key.trim();
  const instructionText = input.text.trim();
  if (!key || !instructionText) throw new Error('client_registry_instruction_invalid');
  requireProvenance(input.sourceRef, input.sourceEventId);

  const { data, error } = await admin.rpc('replace_client_registry_instruction', {
    p_subject_id: input.subjectId,
    p_instruction_key: key,
    p_scope: input.scope?.trim() || 'general',
    p_instruction_text: instructionText,
    p_priority: Math.max(1, Math.min(5, input.priority ?? 3)),
    p_source_ref: input.sourceRef ?? null,
    p_source_event_id: input.sourceEventId ?? null,
    p_valid_from: input.validFrom ?? new Date().toISOString(),
    p_metadata: input.metadata ?? {},
  });
  if (error) throw error;
  if (typeof data !== 'string' || !data) throw new Error('client_registry_instruction_replace_failed');
  return data;
}

type HistoricalEventRow = {
  event_type: string;
  occurred_at: string;
  title: string | null;
  summary: string | null;
  importance: number | null;
  source_ref: string | null;
  company_id: string | null;
  case_id: string | null;
  retention_class: 'standard' | 'legal_hold';
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

type SummaryBucket = {
  year: string;
  companyId: string | null;
  caseId: string | null;
  events: HistoricalEventRow[];
};

function bucketKey(year: string, companyId: string | null, caseId: string | null) {
  return `${year}|${companyId ?? '-'}|${caseId ?? '-'}`;
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
      .select('event_type,occurred_at,title,summary,importance,source_ref,company_id,case_id,retention_class,retain_until')
      .eq('subject_id', subjectId)
      .lt('occurred_at', detailCutoff)
      .or(`retention_class.eq.legal_hold,retain_until.gte.${now.toISOString()}`)
      .order('occurred_at', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as HistoricalEventRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  const buckets = new Map<string, SummaryBucket>();
  const add = (year: string, companyId: string | null, caseId: string | null, row: HistoricalEventRow) => {
    const key = bucketKey(year, companyId, caseId);
    const bucket = buckets.get(key) ?? { year, companyId, caseId, events: [] };
    bucket.events.push(row);
    buckets.set(key, bucket);
  };

  for (const row of rows) {
    const year = row.occurred_at.slice(0, 4);
    add(year, null, null, row);
    if (row.company_id) add(year, row.company_id, null, row);
    if (row.case_id) add(year, row.company_id, row.case_id, row);
  }

  for (const bucket of buckets.values()) {
    const periodStart = `${bucket.year}-01-01`;
    const periodEnd = `${bucket.year}-12-31`;
    const legalHold = bucket.events.some((event) => event.retention_class === 'legal_hold');
    const summaryText = buildYearSummary(bucket.year, bucket.events);

    let currentQuery = admin.from('client_registry_period_summaries')
      .select('version')
      .eq('subject_id', subjectId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd);
    currentQuery = bucket.companyId
      ? currentQuery.eq('company_id', bucket.companyId)
      : currentQuery.is('company_id', null);
    currentQuery = bucket.caseId
      ? currentQuery.eq('case_id', bucket.caseId)
      : currentQuery.is('case_id', null);
    const { data: current, error: currentError } = await currentQuery.maybeSingle();
    if (currentError) throw currentError;

    const { error } = await admin.from('client_registry_period_summaries').upsert({
      subject_id: subjectId,
      company_id: bucket.companyId,
      case_id: bucket.caseId,
      period_start: periodStart,
      period_end: periodEnd,
      summary_text: summaryText,
      event_count: bucket.events.length,
      generated_at: now.toISOString(),
      version: Number(current?.version ?? 0) + 1,
      retention_class: legalHold ? 'legal_hold' : 'standard',
      metadata: {
        detail_window_months: CLIENT_REGISTRY_DETAIL_MONTHS,
        retention_years: CLIENT_REGISTRY_RETENTION_YEARS,
      },
      updated_at: now.toISOString(),
    }, { onConflict: 'subject_id,period_start,period_end,company_id,case_id' });
    if (error) throw error;
  }

  const { error: expiryError } = await admin.from('client_registry_period_summaries')
    .delete()
    .eq('subject_id', subjectId)
    .eq('retention_class', 'standard')
    .lt('period_end', retentionCutoff.slice(0, 10));
  if (expiryError) throw expiryError;
}
