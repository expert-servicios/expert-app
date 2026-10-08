import { describe, expect, it } from 'vitest';
import {
  kiaOperationalCategoryLabel,
  resolveKiaOperationalCategory,
} from '@/lib/ai/kia/kia-operational-routing';

describe('KIA operational routing categories', () => {
  it('fails closed to manual review when the decision requires human review', () => {
    expect(resolveKiaOperationalCategory({ requiresManualReview: true, detectedIntent: 'accounting_summary' }))
      .toBe('manual_review');
  });

  it('routes billing purpose and rental signals before generic domains', () => {
    expect(resolveKiaOperationalCategory({ recipientPurpose: 'billing' })).toBe('billing_collection');
    expect(resolveKiaOperationalCategory({ serviceSlug: 'arrendamiento-vivienda' })).toBe('rentals');
    expect(resolveKiaOperationalCategory({ serviceSlug: 'reclamacion-deuda-impagada' })).toBe('billing_collection');
  });

  it('maps canonical KIA skills and intents to business routing', () => {
    expect(resolveKiaOperationalCategory({ skillId: 'holded.readiness' })).toBe('holded_support');
    expect(resolveKiaOperationalCategory({ skillId: 'fiscal.viability' })).toBe('fiscal_accounting');
    expect(resolveKiaOperationalCategory({ skillId: 'accounting.operations' })).toBe('fiscal_accounting');
    expect(resolveKiaOperationalCategory({ skillId: 'labor.payroll_diagnostics' })).toBe('labor');
    expect(resolveKiaOperationalCategory({ skillId: 'immigration.advice' })).toBe('immigration');
    expect(resolveKiaOperationalCategory({ skillId: 'documents.case_review' })).toBe('case_operations');
  });

  it('maps commercial and case intents without a second classifier', () => {
    expect(resolveKiaOperationalCategory({ detectedIntent: 'service_selection' })).toBe('commercial');
    expect(resolveKiaOperationalCategory({ detectedIntent: 'checkout' })).toBe('commercial');
    expect(resolveKiaOperationalCategory({ detectedIntent: 'case_status' })).toBe('case_operations');
    expect(resolveKiaOperationalCategory({ detectedIntent: 'company_data_resolve' })).toBe('case_operations');
  });

  it('separates non-human envelopes and fails unknown inputs closed', () => {
    expect(resolveKiaOperationalCategory({ envelopeKind: 'marketing' })).toBe('non_human');
    expect(resolveKiaOperationalCategory({ envelopeKind: 'system' })).toBe('non_human');
    expect(resolveKiaOperationalCategory({ envelopeKind: 'provider' })).toBe('non_human');
    expect(resolveKiaOperationalCategory({ detectedIntent: 'unknown' })).toBe('manual_review');
  });

  it('provides stable Spanish labels for Admin', () => {
    expect(kiaOperationalCategoryLabel('commercial')).toBe('Comercial');
    expect(kiaOperationalCategoryLabel('fiscal_accounting')).toBe('Fiscal / contable');
    expect(kiaOperationalCategoryLabel('manual_review')).toBe('Otro / revisión manual');
  });
});
