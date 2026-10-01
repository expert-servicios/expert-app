import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type SubscriptionMeetingKind = 'company' | 'autonomo';

export type SubscriptionMeetingEntitlement = {
  clientId: string;
  subscriptionId: string;
  companyId: string;
  companyName: string;
  planName: string;
  kind: SubscriptionMeetingKind;
  durationMinutes: 60 | 30;
  quarterlyTaxFiling: boolean;
  source: 'primary' | 'included_entity';
};

function isAutonomo(value: string | null | undefined): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'autonomo'
    || normalized === 'autónomo'
    || normalized.includes('empresario individual')
    || normalized.includes('persona fisica')
    || normalized.includes('persona física');
}

function advancedPlan(planName: string | null | undefined): boolean {
  return String(planName ?? '').toLowerCase().includes('avanzado');
}

export async function listActiveSubscriptionMeetingEntitlements(
  admin = getSupabaseAdmin(),
): Promise<SubscriptionMeetingEntitlement[]> {
  const { data: subscriptions, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('id,client_id,company_id,plan_name,status')
    .in('status', ['active', 'trialing'])
    .not('company_id', 'is', null);

  if (subscriptionError) throw subscriptionError;

  const active = (subscriptions ?? []).filter((subscription) => advancedPlan(subscription.plan_name));
  if (!active.length) return [];

  const subscriptionIds = active.map((subscription) => subscription.id);
  const primaryCompanyIds = active.map((subscription) => subscription.company_id).filter(Boolean) as string[];

  const [{ data: primaryCompanies, error: companyError }, { data: includedRows, error: includedError }] = await Promise.all([
    admin
      .from('companies')
      .select('id,razon_social,nombre_comercial,forma_juridica')
      .in('id', primaryCompanyIds),
    admin
      .from('subscription_entitlements')
      .select('id,client_id,subscription_id,beneficiary_company_id,active,coverage_scope,valid_from,valid_until')
      .in('subscription_id', subscriptionIds)
      .eq('feature_key', 'included_entity')
      .eq('active', true)
      .eq('coverage_scope', 'recurring_management'),
  ]);

  if (companyError) throw companyError;
  if (includedError) throw includedError;

  const includedCompanyIds = (includedRows ?? [])
    .map((row) => row.beneficiary_company_id)
    .filter(Boolean) as string[];

  const { data: includedCompanies, error: includedCompanyError } = includedCompanyIds.length
    ? await admin
        .from('companies')
        .select('id,razon_social,nombre_comercial,forma_juridica')
        .in('id', includedCompanyIds)
    : { data: [], error: null };

  if (includedCompanyError) throw includedCompanyError;

  const companyById = new Map(
    [...(primaryCompanies ?? []), ...(includedCompanies ?? [])]
      .map((company) => [company.id, company]),
  );
  const subscriptionById = new Map(active.map((subscription) => [subscription.id, subscription]));
  const now = Date.now();

  const entitlements: SubscriptionMeetingEntitlement[] = [];

  for (const subscription of active) {
    if (!subscription.company_id) continue;
    const company = companyById.get(subscription.company_id);
    if (!company) continue;
    const autonomo = isAutonomo(company.forma_juridica);
    entitlements.push({
      clientId: subscription.client_id,
      subscriptionId: subscription.id,
      companyId: subscription.company_id,
      companyName: company.razon_social || company.nombre_comercial || 'Entidad',
      planName: subscription.plan_name,
      kind: autonomo ? 'autonomo' : 'company',
      durationMinutes: autonomo ? 30 : 60,
      quarterlyTaxFiling: true,
      source: 'primary',
    });
  }

  for (const row of includedRows ?? []) {
    if (!row.subscription_id || !row.beneficiary_company_id) continue;
    if (row.valid_from && new Date(row.valid_from).getTime() > now) continue;
    if (row.valid_until && new Date(row.valid_until).getTime() < now) continue;
    const subscription = subscriptionById.get(row.subscription_id);
    const company = companyById.get(row.beneficiary_company_id);
    if (!subscription || !company) continue;

    // Included entities in an Advanced relationship inherit the recurring
    // management cadence. Autonomous beneficiaries receive 30 minutes/month;
    // legal entities receive the standard 60-minute company review.
    const autonomo = isAutonomo(company.forma_juridica);
    entitlements.push({
      clientId: row.client_id,
      subscriptionId: row.subscription_id,
      companyId: row.beneficiary_company_id,
      companyName: company.razon_social || company.nombre_comercial || 'Entidad incluida',
      planName: subscription.plan_name,
      kind: autonomo ? 'autonomo' : 'company',
      durationMinutes: autonomo ? 30 : 60,
      quarterlyTaxFiling: true,
      source: 'included_entity',
    });
  }

  const unique = new Map<string, SubscriptionMeetingEntitlement>();
  for (const entitlement of entitlements) {
    unique.set(`${entitlement.subscriptionId}:${entitlement.companyId}`, entitlement);
  }
  return [...unique.values()];
}

export function monthlyMeetingServiceKey(entitlement: SubscriptionMeetingEntitlement) {
  return entitlement.kind === 'autonomo'
    ? 'seguimiento-mensual-autonomo'
    : 'seguimiento-mensual-empresa';
}
