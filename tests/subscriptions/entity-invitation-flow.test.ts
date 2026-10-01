import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('entity-scoped subscription invitations', () => {
  const adminInvite = source('app/api/admin/subscriptions/invitations/route.ts');
  const claim = source('app/api/quotes/claim/route.ts');
  const activationApi = source('app/api/subscriptions/invitation/route.ts');
  const activationPage = source('app/(protected)/dashboard/suscripciones/activar/page.tsx');
  const checkout = source('app/api/subscriptions/checkout/route.ts');
  const adminGenerator = source('components/admin/SubscriptionInvitationGenerator.tsx');
  const adminOnboarding = source('app/(protected)/admin/onboarding/page.tsx');
  const invitationPlans = source('lib/subscriptions/invitation-plans.ts');
  const readiness = source('lib/data/service-readiness-checks.ts');
  const subscriptionsPage = source('app/(protected)/dashboard/suscripciones/page.tsx');
  const planCards = source('components/subscriptions/SubscriptionPlanCards.tsx');
  const accountOnboarding = source('app/(protected)/dashboard/onboarding/page.tsx');
  const proxy = source('proxy.ts');

  it('creates a claimable quote without requiring an existing auth user or company', () => {
    expect(adminInvite).toContain("client_id: null");
    expect(adminInvite).toContain("company_id: null");
    expect(adminInvite).toContain('createQuoteClaimToken');
    expect(adminInvite).toContain("source: 'subscription_invitation'");
    expect(adminInvite).not.toContain('listAllAuthUsers');
    expect(adminInvite).toContain("billing: z.enum(['monthly', 'annual'])");
    expect(adminInvite).toContain(".from('quote_items').insert");
    expect(adminInvite).toContain('stripe_price_id: plan.priceId');
  });

  it('routes claimed plan quotes into the subscription activation form', () => {
    expect(claim).toContain("service_slugs");
    expect(claim).toContain("slug.startsWith('plan-')");
    expect(claim).toContain("'/dashboard/suscripciones/activar'");
    expect(claim).toContain("activationUrl.searchParams.set('quote', quote.id)");
  });

  it('requires the authenticated claimant and the quoted plan before exposing activation context', () => {
    expect(activationApi).toContain('quote.client_id !== user.id');
    expect(activationApi).toContain("['sent', 'accepted'].includes(quote.status)");
    expect(activationApi).toContain('getSubscriptionInvitePlanByServiceSlug');
    expect(activationApi).toContain('claimEmail && claimEmail !== userEmail');
  });

  it('collects minimal profile and fiscal entity data before checkout', () => {
    expect(activationPage).toContain("fetch('/api/profile'");
    expect(activationPage).toContain("fetch('/api/companies'");
    expect(activationPage).toContain("fetch('/api/subscriptions/checkout'");
    expect(activationPage).toContain('quoteId: context.quote.id');
    expect(activationPage).toContain('CompanyDataLookup');
    expect(activationPage).toContain('El cuestionario Company 360 completo podrá terminarse después');
    expect(activationPage).toContain('Selecciona una entidad o crea una nueva');
    expect(activationPage).toContain('Dar de alta un nuevo titular fiscal');
    expect(activationPage).toContain('setEntitySelection(created.company.id)');
  });

  it('exposes a reusable Admin generator without auto-emailing the link', () => {
    expect(adminGenerator).toContain("fetch('/api/admin/subscriptions/invitations'");
    expect(adminGenerator).toContain('Generar enlace EXPERT');
    expect(adminGenerator).toContain('No envía correo automáticamente');
    expect(adminOnboarding).toContain('<SubscriptionInvitationGenerator />');
    expect(adminGenerator).toContain('Anual · 2 meses gratis');
    expect(adminGenerator).toContain('billing,');
    expect(adminOnboarding).toContain("useState<'servicio' | 'formacion'>('servicio')");
    expect(adminOnboarding).not.toContain("useState<'plan' | 'servicio' | 'formacion'>");
  });

  it('binds the accepted quote to the exact entity and checkout session', () => {
    expect(checkout).toContain('quoteId: z.string().uuid().optional()');
    expect(checkout).toContain('quote.client_id !== user.id');
    expect(checkout).toContain("code: 'quote_company_conflict'");
    expect(checkout).toContain("stripe_checkout_id: session.id");
    expect(checkout).toContain("status: 'accepted'");
    expect(checkout).toContain("quote_id: quoteId");
    expect(checkout).toContain(".from('quote_items')");
    expect(checkout).toContain('getSubscriptionInvitePlanByPriceId');
  });

  it('supports monthly and annual invitations with a server-side price mapping', () => {
    expect(invitationPlans).toContain("export type SubscriptionInviteBilling = 'monthly' | 'annual'");
    expect(invitationPlans).toContain('STRIPE_PLAN_ANNUAL_49');
    expect(invitationPlans).toContain('STRIPE_PLAN_ANNUAL_99');
    expect(invitationPlans).toContain('STRIPE_PLAN_ANNUAL_199');
    expect(invitationPlans).toContain('getSubscriptionInvitePlanByPriceId');
    expect(activationApi).toContain('billing: plan.billing');
    expect(activationPage).toContain("context.plan.billing === 'annual'");
  });

  it('does not block Plan Supervisión checkout for Holded setup or included basic tax filing', () => {
    expect(readiness).toContain("label: 'Sí, que los presente EXPERT', nextAction: 'continue_checkout'");
    expect(readiness).toContain("label: 'No',       nextAction: 'continue_checkout'");
    expect(readiness).not.toContain("label: 'También impuestos',   nextAction: 'recommend_plan_avanzado'");
  });

  it('keeps direct plan links contextual after login', () => {
    expect(subscriptionsPage).toContain("params.plan as 'supervision' | 'avanzado' | 'colaborativo'");
    expect(subscriptionsPage).toContain('initialPlan={initialPlan}');
    expect(planCards).toContain('initialPlan');
    expect(planCards).toContain('Hemos abierto el plan solicitado');
    expect(planCards).toContain('titular fiscal correcto');
  });

  it('keeps Holded demo duration internal while hiding it from the booking UI', () => {
    const bookingForm = source('components/booking/NativeBookingForm.tsx');
    expect(bookingForm).toContain("serviceKey !== 'demo-holded'");
    expect(bookingForm).toContain('availability.service.durationMinutes');
  });

  it('preserves requested subscription context through login and first-time onboarding', () => {
    expect(proxy).toContain("request.nextUrl.searchParams.get('next')");
    expect(proxy).toContain('new URL(safeNext, request.url)');
    expect(subscriptionsPage).toContain('Completar perfil y entidad fiscal');
    expect(subscriptionsPage).toContain('/dashboard/onboarding?next=');
    expect(accountOnboarding).toContain("const next = safeNextPath(searchParams.get('next'))");
    expect(accountOnboarding).toContain('router.push(next)');
  });
});
