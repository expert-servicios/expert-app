import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const route = source('app/api/quotes/route.ts');
const claimRoute = source('app/api/quotes/claim/route.ts');
const claimToken = source('lib/quotes/quote-claim-token.ts');
const clientEmail = source('lib/email/templates.ts');

describe('public quote request lifecycle', () => {
  it('normalizes legacy service ids while keeping human-readable quote labels', () => {
    expect(route).toContain("noResidentes: 'no-residentes'");
    expect(route).toContain('canonicalServiceSlug');
    expect(route).toContain('serviceDisplayName');
    expect(route).toContain('getCatalogService(slug)?.name');
    expect(route).toContain('service: serviceSlugList');
    expect(route).toContain('const serviceList = serviceSlugs.map(serviceDisplayName).join');
  });

  it('requires the capability sent to the lead mailbox before claiming a quote', () => {
    expect(route).toContain('createQuoteClaimToken');
    expect(route).toContain('quoteReceivedClient(validated.name, serviceList, claimToken)');
    expect(route).not.toContain("const verifiedEmail = user.email?.trim().toLowerCase()");
    expect(claimToken).toContain("createHmac('sha256'");
    expect(claimToken).toContain('timingSafeEqual');
    expect(claimRoute).toContain('verifyQuoteClaimToken(token)');
    expect(claimRoute).toContain('userEmail !== claim.email');
    expect(claimRoute).toContain(".update({ client_id: user.id })");
    expect(claimRoute).toContain(".is('client_id', null)");
    expect(clientEmail).toContain('Acceder a mi presupuesto');
  });

  it('creates an unpriced public request as draft without premature expiry', () => {
    expect(route).toContain("client_type: 'particular'");
    expect(route).toContain("status: 'draft'");
    expect(route).toContain('expires_at: null');
    expect(route).toContain("url: '/admin/presupuestos'");
    expect(route).not.toContain("client_type: 'persona_fisica'");
  });
});
