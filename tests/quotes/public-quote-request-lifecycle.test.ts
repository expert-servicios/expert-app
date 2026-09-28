import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const route = readFileSync(
  resolve(process.cwd(), 'app/api/quotes/route.ts'),
  'utf8',
);

describe('public quote request lifecycle', () => {
  it('normalizes legacy service ids while keeping human-readable quote labels', () => {
    expect(route).toContain("noResidentes: 'no-residentes'");
    expect(route).toContain('canonicalServiceSlug');
    expect(route).toContain('serviceDisplayName');
    expect(route).toContain('getCatalogService(slug)?.name');
    expect(route).toContain('service: serviceSlugList');
    expect(route).toContain('const serviceList = serviceSlugs.map(serviceDisplayName).join');
  });

  it('lets the verified account claim its pending web quote by exact email', () => {
    expect(route).toContain("const normalizedEmail = validated.email.trim().toLowerCase()");
    expect(route).toContain("const verifiedEmail = user.email?.trim().toLowerCase()");
    expect(route).toContain(".eq('email', verifiedEmail)");
    expect(route).toContain(".update({ client_id: user.id })");
    expect(route).toContain(".is('client_id', null)");
    expect(route).toContain(".in('status', ['draft', 'sent', 'accepted'])");
  });

  it('creates an unpriced public request as draft without premature expiry', () => {
    expect(route).toContain("client_type: 'particular'");
    expect(route).toContain("status: 'draft'");
    expect(route).toContain('expires_at: null');
    expect(route).toContain("url: '/admin/presupuestos'");
    expect(route).not.toContain("client_type: 'persona_fisica'");
  });
});
