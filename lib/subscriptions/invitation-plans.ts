export type SubscriptionInvitePlanSlug = 'supervision' | 'avanzado' | 'colaborativo';
export type SubscriptionInviteBilling = 'monthly' | 'annual';

export type SubscriptionInvitePlan = {
  slug: SubscriptionInvitePlanSlug;
  serviceSlug: string;
  name: string;
  billing: SubscriptionInviteBilling;
  interval: 'month' | 'year';
  amountEur: number;
  priceId: string;
  planPath: string;
};

const PLAN_BASE = {
  supervision: {
    serviceSlug: 'plan-supervision',
    name: 'Plan Supervisión',
    monthlyAmountEur: 49,
    annualAmountEur: 490,
    monthlyPriceId: () => process.env.STRIPE_PLAN_MONTHLY_49 ?? '',
    annualPriceId: () => process.env.STRIPE_PLAN_ANNUAL_49 ?? '',
    planPath: '/planes/supervision',
  },
  avanzado: {
    serviceSlug: 'plan-avanzado',
    name: 'Plan Avanzado',
    monthlyAmountEur: 99,
    annualAmountEur: 990,
    monthlyPriceId: () => process.env.STRIPE_PLAN_MONTHLY_99 ?? '',
    annualPriceId: () => process.env.STRIPE_PLAN_ANNUAL_99 ?? '',
    planPath: '/planes/avanzado',
  },
  colaborativo: {
    serviceSlug: 'plan-colaborativo',
    name: 'Plan Colaborativo',
    monthlyAmountEur: 199,
    annualAmountEur: 1990,
    monthlyPriceId: () => process.env.STRIPE_PLAN_MONTHLY_199 ?? '',
    annualPriceId: () => process.env.STRIPE_PLAN_ANNUAL_199 ?? '',
    planPath: '/planes/colaborativo',
  },
} as const;

export function getSubscriptionInvitePlan(
  slug: string | null | undefined,
  billing: SubscriptionInviteBilling = 'monthly',
): SubscriptionInvitePlan | null {
  if (!slug || !(slug in PLAN_BASE)) return null;
  const typedSlug = slug as SubscriptionInvitePlanSlug;
  const base = PLAN_BASE[typedSlug];

  return {
    slug: typedSlug,
    serviceSlug: base.serviceSlug,
    name: base.name,
    billing,
    interval: billing === 'annual' ? 'year' : 'month',
    amountEur: billing === 'annual' ? base.annualAmountEur : base.monthlyAmountEur,
    priceId: billing === 'annual' ? base.annualPriceId() : base.monthlyPriceId(),
    planPath: base.planPath,
  };
}

export function subscriptionInvitePlans(
  billing: SubscriptionInviteBilling = 'monthly',
): Record<SubscriptionInvitePlanSlug, SubscriptionInvitePlan> {
  return {
    supervision: getSubscriptionInvitePlan('supervision', billing)!,
    avanzado: getSubscriptionInvitePlan('avanzado', billing)!,
    colaborativo: getSubscriptionInvitePlan('colaborativo', billing)!,
  };
}

export function getSubscriptionInvitePlanByServiceSlug(
  serviceSlug: string | null | undefined,
  billing: SubscriptionInviteBilling = 'monthly',
): SubscriptionInvitePlan | null {
  if (!serviceSlug) return null;
  return Object.values(subscriptionInvitePlans(billing)).find((plan) => plan.serviceSlug === serviceSlug) ?? null;
}

export function getSubscriptionInvitePlanByPriceId(
  priceId: string | null | undefined,
): SubscriptionInvitePlan | null {
  if (!priceId) return null;
  const candidates = [
    ...Object.values(subscriptionInvitePlans('monthly')),
    ...Object.values(subscriptionInvitePlans('annual')),
  ];
  return candidates.find((plan) => plan.priceId && plan.priceId === priceId) ?? null;
}
