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

export type SubscriptionTaxEntitlement = {
  clientId: string;
  subscriptionId: string;
  companyId: string;
  companyName: string;
  planName: string;
};

function isAutonomo(value: string | null | undefined): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'autonomo'
    || normalized === 'autónomo'
    || normalized.includes('empresario individual')
    || normalized.includes('persona fisica')
    || normalized.includes('persona física');
}

function normalizedPlan(planName: string | null | undefined): string {
  return String(planName ?? '').trim().toLowerCase();
}

function isFixedTaxPlan(planName: string | null | undefined): boolean {
  const plan = normalizedPlan(planName);
  return plan.includes('supervisión')
    || plan.includes('supervision')
    || plan.includes('avanzado')
    || plan.includes('colaborativo');
}

function monthlyMeetingMinutes(
  planName: string | null | undefined,
  autonomo: boolean,
): 30 | 60 | null {
  const plan = normalizedPlan(planName);
  if (plan.includes('avanzado')) return autonomo ? 30 : 60;
  if ((plan.includes('supervisión') || plan.includes('supervision')) && autonomo) return 30;
  return null;
}

export async function listActiveSubscriptionTaxEntitlements(
  admin = getSupabaseAdmin(),
): Promise<SubscriptionTaxEntitlement[]> {
  const { data: subscriptions, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('id,client_id,company_id,plan_name,status')
    .in('status', ['active', 'trialing'])
    .not('company_id', 'is', null);

  if (subscriptionError) throw subscriptionError;

  const active = (subscriptions ?? []).filter((subscription) => isFixedTaxPlan(subscription.plan_name));
  if (!active.length) return [];

  const companyIds = [...new Set(active.map((subscription) => subscription.company_id).filter(Boolean))] as string[];
  const { data: companies, error: companyError } = await admin
    .from('companies')
    .select('id,razon_social,nombre_comercial')
    .in('id', companyIds);
  if (companyError) throw companyError;

  const companyById = new Map((companies ?? []).map((company) => [company.id, company]));
  return active.flatMap((subscription) => {
    if (!subscription.company_id) return [];
    const company = companyById.get(subscription.company_id);
    if (!company) return [];
    return [{
      clientId: subscription.client_id,
      subscriptionId: subscription.id,
      companyId: subscription.company_id,
      companyName: company.razon_social || company.nombre_comercial || 'Entidad',
      planName: subscription.plan_name,
    }];
  });
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

  const primaryCompanyIds = [...new Set(
    (subscriptions ?? []).map((subscription) => subscription.company_id).filter(Boolean),
  )] as string[];

  const { data: primaryCompanies, error: companyError } = primaryCompanyIds.length
    ? await admin
        .from('companies')
        .select('id,razon_social,nombre_comercial,forma_juridica')
        .in('id', primaryCompanyIds)
    : { data: [], error: null };
  if (companyError) throw companyError;

  const companyById = new Map((primaryCompanies ?? []).map((company) => [company.id, company]));
  const meetingSubscriptions = (subscriptions ?? []).filter((subscription) => {
    if (!subscription.company_id) return false;
    const company = companyById.get(subscription.company_id);
    if (!company) return false;
    return monthlyMeetingMinutes(subscription.plan_name, isAutonomo(company.forma_juridica)) !== null;
  });

  const subscriptionIds = meetingSubscriptions.map((subscription) => subscription.id);
  const { data: includedRows, error: includedError } = subscriptionIds.length
    ? await admin
        .from('subscription_entitlements')
        .select('id,client_id,subscription_id,beneficiary_company_id,active,coverage_scope,valid_from,valid_until')
        .in('subscription_id', subscriptionIds)
        .eq('feature_key', 'included_entity')
        .eq('active', true)
        .eq('coverage_scope', 'recurring_management')
    : { data: [], error: null };
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

  for (const company of includedCompanies ?? []) companyById.set(company.id, company);

  const subscriptionById = new Map(meetingSubscriptions.map((subscription) => [subscription.id, subscription]));
  const now = Date.now();
  const entitlements: SubscriptionMeetingEntitlement[] = [];

  for (const subscription of meetingSubscriptions) {
    if (!subscription.company_id) continue;
    const company = companyById.get(subscription.company_id);
    if (!company) continue;
    const autonomo = isAutonomo(company.forma_juridica);
    const durationMinutes = monthlyMeetingMinutes(subscription.plan_name, autonomo);
    if (!durationMinutes) continue;

    entitlements.push({
      clientId: subscription.client_id,
      subscriptionId: subscription.id,
      companyId: subscription.company_id,
      companyName: company.razon_social || company.nombre_comercial || 'Entidad',
      planName: subscription.plan_name,
      kind: autonomo ? 'autonomo' : 'company',
      durationMinutes,
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

    const autonomo = isAutonomo(company.forma_juridica);
    const durationMinutes = monthlyMeetingMinutes(subscription.plan_name, autonomo);
    if (!durationMinutes) continue;

    entitlements.push({
      clientId: row.client_id,
      subscriptionId: row.subscription_id,
      companyId: row.beneficiary_company_id,
      companyName: company.razon_social || company.nombre_comercial || 'Entidad incluida',
      planName: subscription.plan_name,
      kind: autonomo ? 'autonomo' : 'company',
      durationMinutes,
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
