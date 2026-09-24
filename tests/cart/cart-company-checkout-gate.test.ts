import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const page = source('app/(public)/carrito/page.tsx');
const sidebar = source('components/cart/CartSidebar.tsx');
const quickProfile = source('components/cart/QuickProfileGate.tsx');
const companyGate = source('components/cart/CompanyCheckoutGate.tsx');

describe('cart company checkout gate', () => {
  it('escalates company_required in both cart surfaces', () => {
    for (const file of [page, sidebar]) {
      expect(file).toContain("data.code === 'company_required'");
      expect(file).toContain('setNeedsCompany(true)');
      expect(file).toContain('CompanyCheckoutGate');
      expect(file).toContain('buildCartCheckoutPayload(items, disbursementMandateAccepted, companyId)');
    }
  });

  it('preserves profile-completion flow before company selection', () => {
    expect(quickProfile).toContain("code?: 'profile_required' | 'company_required'");
    expect(quickProfile).toContain('onCompanyRequired');
    expect(quickProfile).toContain('...(companyId ? { companyId } : {})');
  });

  it('loads only companies linked to the authenticated user through the existing API', () => {
    expect(companyGate).toContain("fetch('/api/companies'");
    expect(companyGate).toContain('/dashboard/empresa/nueva');
    expect(companyGate).toContain('onContinue(selected)');
  });

  it('keeps Russian cart copy available', () => {
    expect(companyGate).toContain("ru: {");
    expect(sidebar).toContain('locale={locale}');
  });
});
