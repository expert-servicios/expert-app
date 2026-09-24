import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Academy person-first checkout', () => {
  it('does not ask students for a Stripe tax ID by default', () => {
    const checkout = source('app/api/academy/checkout/route.ts');
    expect(checkout).toContain("billing_address_collection : 'required'");
    expect(checkout).not.toContain('tax_id_collection');
    expect(checkout).toContain("billing_scope: 'profile'");
  });

  it('keeps certification payment on the student profile', () => {
    const checkout = source('app/api/academy/certification/checkout/route.ts');
    expect(checkout).toContain("billing_address_collection : 'required'");
    expect(checkout).not.toContain('tax_id_collection');
    expect(checkout).toContain("billing_scope : 'profile'");
  });

  it('does not introduce company selection into Academy checkout payloads', () => {
    const programButton = source('components/site/AcademyCheckoutButton.tsx');
    const certificationPanel = source('components/dashboard/AcademyEnrollmentsPanel.tsx');
    expect(programButton).toContain('JSON.stringify({ programSlug })');
    expect(certificationPanel).toContain('JSON.stringify({ enrollmentId: enrollment.id })');
    expect(programButton).not.toContain('companyId');
    expect(certificationPanel).not.toContain('companyId');
  });
});
