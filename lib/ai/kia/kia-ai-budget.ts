import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { estimateCost } from './kia-cost-tracker';

export type KiaAiBudgetMode = 'normal' | 'economy' | 'restricted' | 'protected' | 'reserve' | 'exhausted';

type BudgetRow = {
  id: string;
  period_start: string;
  period_end: string;
  currency: string;
  usd_to_eur_rate: number | string;
  target_spend_eur: number | string;
  alert_spend_eur: number | string;
  hard_cap_eur: number | string;
  reserve_eur: number | string;
  provider_caps_eur: Record<string, number> | null;
  audience_caps_eur: Record<string, number> | null;
  thresholds: number[] | null;
  target_ai_revenue_pct: number | string;
  policy_version: string;
};

type CostRow = {
  provider: string | null;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  estimated_cost_usd: number | string | null;
  client_id: string | null;
  lead_id: string | null;
  case_id: string | null;
  company_id: string | null;
  service_slug: string | null;
};

type HealthCostRow = {
  provider: string | null;
  model: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_estimate: number | string | null;
};

export type KiaAiBudgetSnapshot = {
  policyId: string;
  policyVersion: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  usdToEurRate: number;
  targetSpendEur: number;
  alertSpendEur: number;
  hardCapEur: number;
  reserveEur: number;
  targetAiRevenuePct: number;
  providerCapsEur: Record<string, number>;
  audienceCapsEur: Record<string, number>;
  thresholds: number[];
  spentUsd: number;
  spentEur: number;
  spendRatio: number;
  remainingHardCapEur: number;
  providerSpendEur: Record<string, number>;
  providerRatios: Record<string, number>;
  blockedProviders: string[];
  mode: KiaAiBudgetMode;
  decisionCount: number;
  healthCheckCount: number;
  unknownPricingCount: number;
  serviceSpendEur: Record<string, number>;
  relatedRevenueEur: number;
  directKiaRevenueEur: number;
  aiToRelatedRevenuePct: number | null;
  elapsedDays: number;
  forecastReliable: boolean;
  projectedSpendEur: number;
  projectedRelatedRevenueEur: number;
  recommendedNextPeriodBudgetEur: number | null;
};

const PAGE_SIZE = 1000;
const MAX_ROWS = 20000;

function n(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function modeForRatio(ratio: number): KiaAiBudgetMode {
  if (ratio >= 1) return 'exhausted';
  if (ratio >= 0.95) return 'reserve';
  if (ratio >= 0.90) return 'protected';
  if (ratio >= 0.80) return 'restricted';
  if (ratio >= 0.60) return 'economy';
  return 'normal';
}

async function loadPaged<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message?: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message || 'budget telemetry query failed');
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function loadActivePolicy(now: Date): Promise<BudgetRow | null> {
  const admin = getSupabaseAdmin();
  const date = now.toISOString().slice(0, 10);
  const { data, error } = await admin
    .from('kia_ai_budget_periods')
    .select('id,period_start,period_end,currency,usd_to_eur_rate,target_spend_eur,alert_spend_eur,hard_cap_eur,reserve_eur,provider_caps_eur,audience_caps_eur,thresholds,target_ai_revenue_pct,policy_version')
    .lte('period_start', date)
    .gt('period_end', date)
    .eq('status', 'active')
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as BudgetRow | null;
}

export async function getKiaAiBudgetSnapshot(now = new Date()): Promise<KiaAiBudgetSnapshot | null> {
  const policy = await loadActivePolicy(now);
  if (!policy) return null;

  const admin = getSupabaseAdmin();
  const startIso = new Date(`${policy.period_start}T00:00:00.000Z`).toISOString();
  const endIso = new Date(`${policy.period_end}T00:00:00.000Z`).toISOString();

  const [decisionRows, healthRows, ordersResult] = await Promise.all([
    loadPaged<CostRow>((from, to) => admin
      .from('kia_decision_logs')
      .select('provider,model,tokens_in,tokens_out,estimated_cost_usd,client_id,lead_id,case_id,company_id,service_slug')
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .range(from, to)),
    loadPaged<HealthCostRow>((from, to) => admin
      .from('kia_health_check_results')
      .select('provider,model,tokens_input,tokens_output,cost_estimate')
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .range(from, to)),
    admin
      .from('orders')
      .select('id,client_id,company_id,case_id,amount_eur,source,status,created_at')
      .eq('status', 'paid')
      .gte('created_at', startIso)
      .lt('created_at', endIso),
  ]);
  if (ordersResult.error) throw new Error(ordersResult.error.message);

  const usdToEur = n(policy.usd_to_eur_rate) || 1;
  const providerUsd: Record<string, number> = {};
  const serviceUsd: Record<string, number> = {};
  let decisionUsd = 0;
  let healthUsd = 0;
  let unknownPricingCount = 0;

  const touchedClients = new Set<string>();
  const touchedCompanies = new Set<string>();
  const touchedCases = new Set<string>();

  for (const row of decisionRows) {
    const model = row.model ?? 'unknown';
    const fallbackEstimate = estimateCost(model, n(row.tokens_in), n(row.tokens_out));
    const stored = n(row.estimated_cost_usd);
    const cost = stored > 0 ? stored : fallbackEstimate.estimatedCostUsd;
    if (!fallbackEstimate.pricingKnown && stored <= 0 && (n(row.tokens_in) > 0 || n(row.tokens_out) > 0)) {
      unknownPricingCount += 1;
    }
    decisionUsd += cost;
    const provider = row.provider ?? 'unknown';
    providerUsd[provider] = (providerUsd[provider] ?? 0) + cost;
    if (row.service_slug) serviceUsd[row.service_slug] = (serviceUsd[row.service_slug] ?? 0) + cost;
    if (row.client_id) touchedClients.add(row.client_id);
    if (row.company_id) touchedCompanies.add(row.company_id);
    if (row.case_id) touchedCases.add(row.case_id);
  }

  for (const row of healthRows) {
    const model = row.model ?? 'unknown';
    const fallbackEstimate = estimateCost(model, n(row.tokens_input), n(row.tokens_output));
    const stored = n(row.cost_estimate);
    const cost = stored > 0 ? stored : fallbackEstimate.estimatedCostUsd;
    if (!fallbackEstimate.pricingKnown && stored <= 0 && (n(row.tokens_input) > 0 || n(row.tokens_output) > 0)) {
      unknownPricingCount += 1;
    }
    healthUsd += cost;
    const provider = row.provider ?? 'unknown';
    providerUsd[provider] = (providerUsd[provider] ?? 0) + cost;
  }

  const orders = ordersResult.data ?? [];
  let relatedRevenueEur = 0;
  let directKiaRevenueEur = 0;
  for (const order of orders) {
    const amount = n(order.amount_eur);
    const related =
      (order.client_id && touchedClients.has(order.client_id))
      || (order.company_id && touchedCompanies.has(order.company_id))
      || (order.case_id && touchedCases.has(order.case_id));
    if (related) relatedRevenueEur += amount;
    if (/kia/i.test(String(order.source ?? ''))) directKiaRevenueEur += amount;
  }

  const spentUsd = decisionUsd + healthUsd;
  const spentEur = spentUsd * usdToEur;
  const hardCap = n(policy.hard_cap_eur);
  const providerCaps = (policy.provider_caps_eur ?? {}) as Record<string, number>;
  const providerSpendEur = Object.fromEntries(
    Object.entries(providerUsd).map(([provider, usd]) => [provider, round(usd * usdToEur)]),
  );
  const providerRatios: Record<string, number> = {};
  const blockedProviders: string[] = [];
  for (const [provider, capValue] of Object.entries(providerCaps)) {
    const cap = n(capValue);
    const ratio = cap > 0 ? (providerSpendEur[provider] ?? 0) / cap : 0;
    providerRatios[provider] = round(ratio, 6);
    if (cap > 0 && ratio >= 1) blockedProviders.push(provider);
  }

  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const effectiveNow = Math.min(Math.max(now.getTime(), start), end);
  const elapsedMs = Math.max(1, effectiveNow - start);
  const periodMs = Math.max(1, end - start);
  const elapsedFraction = Math.min(1, elapsedMs / periodMs);
  const elapsedDays = elapsedMs / 86_400_000;
  const projectedSpendEur = spentEur / elapsedFraction;
  const projectedRelatedRevenueEur = relatedRevenueEur / elapsedFraction;
  const targetPct = n(policy.target_ai_revenue_pct);
  const forecastReliable = elapsedDays >= 7;
  const revenueBudget = projectedRelatedRevenueEur > 0
    ? projectedRelatedRevenueEur * (targetPct / 100)
    : null;
  const recommended = forecastReliable
    ? Math.min(
        hardCap,
        Math.max(25, Math.min(projectedSpendEur * 1.20, revenueBudget ?? projectedSpendEur * 1.20)),
      )
    : null;

  return {
    policyId: policy.id,
    policyVersion: policy.policy_version,
    periodStart: policy.period_start,
    periodEnd: policy.period_end,
    currency: policy.currency,
    usdToEurRate: usdToEur,
    targetSpendEur: n(policy.target_spend_eur),
    alertSpendEur: n(policy.alert_spend_eur),
    hardCapEur: hardCap,
    reserveEur: n(policy.reserve_eur),
    targetAiRevenuePct: targetPct,
    providerCapsEur: providerCaps,
    audienceCapsEur: (policy.audience_caps_eur ?? {}) as Record<string, number>,
    thresholds: Array.isArray(policy.thresholds) ? policy.thresholds.map(n) : [0.6, 0.8, 0.9, 0.95, 1],
    spentUsd: round(spentUsd, 6),
    spentEur: round(spentEur),
    spendRatio: hardCap > 0 ? round(spentEur / hardCap, 6) : 0,
    remainingHardCapEur: round(Math.max(0, hardCap - spentEur)),
    providerSpendEur,
    providerRatios,
    blockedProviders,
    mode: blockedProviders.length >= Object.keys(providerCaps).length && Object.keys(providerCaps).length > 0
      ? 'exhausted'
      : modeForRatio(hardCap > 0 ? spentEur / hardCap : 0),
    decisionCount: decisionRows.length,
    healthCheckCount: healthRows.length,
    unknownPricingCount,
    serviceSpendEur: Object.fromEntries(
      Object.entries(serviceUsd).map(([service, usd]) => [service, round(usd * usdToEur)]),
    ),
    relatedRevenueEur: round(relatedRevenueEur, 2),
    directKiaRevenueEur: round(directKiaRevenueEur, 2),
    aiToRelatedRevenuePct: relatedRevenueEur > 0 ? round((spentEur / relatedRevenueEur) * 100, 3) : null,
    elapsedDays: round(elapsedDays, 2),
    forecastReliable,
    projectedSpendEur: round(projectedSpendEur),
    projectedRelatedRevenueEur: round(projectedRelatedRevenueEur, 2),
    recommendedNextPeriodBudgetEur: recommended === null ? null : round(recommended, 2),
  };
}

export async function persistKiaAiBudgetSnapshot(snapshot: KiaAiBudgetSnapshot): Promise<void> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('kia_ai_budget_periods')
    .update({
      actuals: {
        spent_usd: snapshot.spentUsd,
        spent_eur: snapshot.spentEur,
        provider_spend_eur: snapshot.providerSpendEur,
        service_spend_eur: snapshot.serviceSpendEur,
        decision_count: snapshot.decisionCount,
        health_check_count: snapshot.healthCheckCount,
        unknown_pricing_count: snapshot.unknownPricingCount,
        related_revenue_eur: snapshot.relatedRevenueEur,
        direct_kia_revenue_eur: snapshot.directKiaRevenueEur,
        ai_to_related_revenue_pct: snapshot.aiToRelatedRevenuePct,
        updated_at: now,
      },
      forecast: {
        reliable: snapshot.forecastReliable,
        elapsed_days: snapshot.elapsedDays,
        projected_spend_eur: snapshot.projectedSpendEur,
        projected_related_revenue_eur: snapshot.projectedRelatedRevenueEur,
        recommended_next_period_budget_eur: snapshot.recommendedNextPeriodBudgetEur,
        mode: snapshot.mode,
        next_review: '2026-10-29',
        updated_at: now,
      },
      last_evaluated_at: now,
      updated_at: now,
    })
    .eq('id', snapshot.policyId);
  if (error) throw new Error(error.message);
}

let guardCache: { expiresAt: number; mode: KiaAiBudgetMode; blockedProviders: string[] } | null = null;

export async function getKiaAiBudgetGuard(): Promise<{ mode: KiaAiBudgetMode; blockedProviders: string[] }> {
  if (guardCache && guardCache.expiresAt > Date.now()) {
    return { mode: guardCache.mode, blockedProviders: guardCache.blockedProviders };
  }
  try {
    const snapshot = await getKiaAiBudgetSnapshot();
    const value = {
      mode: snapshot?.mode ?? 'normal',
      blockedProviders: snapshot?.blockedProviders ?? [],
    };
    guardCache = { ...value, expiresAt: Date.now() + 60_000 };
    return value;
  } catch (error) {
    console.error('[KIA budget guard] unavailable:', error instanceof Error ? error.message : String(error));
    return { mode: 'normal', blockedProviders: [] };
  }
}
