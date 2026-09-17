import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RU_NATIONALITY_RESOURCES } from '@/lib/i18n/ru-nationality-resources';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Russian nationality pilot hardening', () => {
  it('keeps automatic Holded invoicing opt-in and resolves persisted order amount', () => {
    const source = read('lib/integrations/holded.ts');
    expect(source).toContain("process.env.HOLDED_CREATE_INVOICES_FROM_STRIPE === 'true'");
    expect(source).toContain("const automatic = params.source !== 'manual'");
    expect(source).toContain('if (automatic && !createInvoices)');
    expect(source).toContain(".select('amount_eur')");
    expect(source).toContain('resolvedAmountEur');
    expect(source).toContain('callerAmountEur');
  });

  it('versions idempotent case fulfillment and paid-order protections', () => {
    const uniqueCase = read('supabase/migrations/20260917212053_cases_order_id_unique.sql');
    const fulfillment = read('supabase/migrations/20260917212504_nationality_catalog_order_fulfillment.sql');
    const holdedStatus = read('supabase/migrations/20260917213213_preserve_paid_status_when_holded_skipped.sql');

    expect(uniqueCase).toContain('cases_order_id_unique_idx');
    expect(fulfillment).toContain('nacionalidad-espanola-menor-nacido-en-espana');
    expect(fulfillment).toContain('on conflict (order_id) where order_id is not null');
    expect(fulfillment).toContain("state, status, priority, next_action");
    expect(holdedStatus).toContain("old.status = 'paid'");
    expect(holdedStatus).toContain("new.status = 'paid_invoice_error'");
  });

  it('links all six Russian resources from the service route', () => {
    const layout = read('app/(localized)/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii/layout.tsx');
    const component = read('components/i18n/RuNationalityRelatedResources.tsx');

    expect(RU_NATIONALITY_RESOURCES).toHaveLength(6);
    expect(layout).toContain('RuNationalityRelatedResources');
    for (const resource of RU_NATIONALITY_RESOURCES) {
      expect(component).toContain("RU_NATIONALITY_RESOURCES");
      expect(['docs', 'blog']).toContain(resource.kind);
    }
  });
});
