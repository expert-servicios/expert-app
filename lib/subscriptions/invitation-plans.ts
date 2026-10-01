export type SubscriptionInvitePlanSlug = 'supervision' | 'avanzado' | 'colaborativo';

export type SubscriptionInvitePlan = {
  slug: SubscriptionInvitePlanSlug;
  serviceSlug: string;
  name: string;
  amountEur: number;
  priceId: string;
  planPath: string;
};

export function subscriptionInvitePlans(): Record<SubscriptionInvitePlanSlug, SubscriptionInvitePlan> {
  return {
    supervision: {
      slug: 'supervision',
      serviceSlug: 'plan-supervision',
      name: 'Plan Supervisión',
      amountEur: 49,
      priceId: process.env.STRIPE_PLAN_MONTHLY_49 ?? '',
      planPath: '/planes/supervision',
    },
    avanzado: {
      slug: 'avanzado',
      serviceSlug: 'plan-avanzado',
      name: 'Plan Avanzado',
      amountEur: 99,
      priceId: process.env.STRIPE_PLAN_MONTHLY_99 ?? '',
      planPath: '/planes/avanzado',
    },
    colaborativo: {
      slug: 'colaborativo',
      serviceSlug: 'plan-colaborativo',
      name: 'Plan Colaborativo',
      amountEur: 199,
      priceId: process.env.STRIPE_PLAN_MONTHLY_199 ?? '',
      planPath: '/planes/colaborativo',
    },
  };
}

export function getSubscriptionInvitePlan(slug: string | null | undefined): SubscriptionInvitePlan | null {
  if (!slug) return null;
  const plans = subscriptionInvitePlans();
  return slug in plans ? plans[slug as SubscriptionInvitePlanSlug] : null;
}

export function getSubscriptionInvitePlanByServiceSlug(
  serviceSlug: string | null | undefined,
): SubscriptionInvitePlan | null {
  if (!serviceSlug) return null;
  return Object.values(subscriptionInvitePlans()).find((plan) => plan.serviceSlug === serviceSlug) ?? null;
}
