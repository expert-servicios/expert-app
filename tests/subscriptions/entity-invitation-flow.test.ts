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

  it('creates a claimable quote without requiring an existing auth user or company', () => {
    expect(adminInvite).toContain("client_id: null");
    expect(adminInvite).toContain("company_id: null");
    expect(adminInvite).toContain('createQuoteClaimToken');
    expect(adminInvite).toContain("source: 'subscription_invitation'");
    expect(adminInvite).not.toContain('listAllAuthUsers');
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
  });

  it('binds the accepted quote to the exact entity and checkout session', () => {
    expect(checkout).toContain('quoteId: z.string().uuid().optional()');
    expect(checkout).toContain('quote.client_id !== user.id');
    expect(checkout).toContain("code: 'quote_company_conflict'");
    expect(checkout).toContain("stripe_checkout_id: session.id");
    expect(checkout).toContain("status: 'accepted'");
    expect(checkout).toContain("quote_id: quoteId");
  });
});
