import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CRM_ATTENTION_FILTER, CRM_STRIPE_HISTORY_FILTER, combineCrmOrFilters } from '@/lib/crm/lead-segment-filters';

describe('CRM attention and history segment contracts', () => {
  const api = readFileSync('app/api/admin/leads/route.ts', 'utf8');
  const page = readFileSync('app/(protected)/admin/leads/page.tsx', 'utf8');
  const consultation = readFileSync('app/api/consultation/route.ts', 'utf8');

  it('includes fresh unclassified leads and preserves explicit historical exclusions', () => {
    expect(CRM_ATTENTION_FILTER).toContain('state.eq.new');
    expect(CRM_ATTENTION_FILTER).toContain('metadata->>crm_needs_attention.is.null');
    expect(CRM_ATTENTION_FILTER).toContain('metadata->>crm_segment.is.null');
    expect(CRM_ATTENTION_FILTER).toContain('stripe_import');
    expect((consultation.match(/crm_needs_attention: true/g) ?? []).length).toBe(2);
    expect(api).toContain('.or(CRM_ATTENTION_FILTER)');
  });

  it('applies search and segment filters together', () => {
    expect(combineCrmOrFilters(CRM_ATTENTION_FILTER, 'email.ilike.%test%'))
      .toBe(`and(or(${CRM_ATTENTION_FILTER}),or(email.ilike.%test%))`);
    expect(combineCrmOrFilters(null, null)).toBeNull();
    expect(api).toContain('combineCrmOrFilters(segmentOr, searchOr)');
  });

  it('matches canonical Stripe import records', () => {
    expect(CRM_STRIPE_HISTORY_FILTER).toContain('stripe_import');
    expect(api).toContain('segmentOr = CRM_STRIPE_HISTORY_FILTER');
  });

  it('shows all segment choices and verified historical summaries', () => {
    expect(page).toContain('<option value="all">Todos los contactos</option>');
    expect(page).toContain('<option value="attention">Requieren atención</option>');
    expect(page).toContain('{lead.crm_summary}');
    expect(page).toContain('Resumen CRM verificado');
  });
});
