import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('entity-scoped subscriptions and Company 360 registry locks', () => {
  it('keeps subscription checkout one plan per fiscal entity', () => {
    const cards = source('components/subscriptions/SubscriptionPlanCards.tsx');
    const disabledCart = source('app/api/subscriptions/cart-checkout/route.ts');
    expect(cards).toContain("fetch('/api/subscriptions/checkout'");
    expect(cards).toContain('JSON.stringify({ priceId, companyId })');
    expect(cards).not.toContain('addItem(cartItem)');
    expect(disabledCart).toContain("subscription_cart_disabled");
  });

  it('sets Holded demo to a free 30-minute meeting', () => {
    const booking = source('lib/booking/native-booking.ts');
    const demoBlock = booking.slice(booking.indexOf("'demo-holded': {"), booking.indexOf('onboarding:', booking.indexOf("'demo-holded': {")));
    expect(demoBlock).toContain("label: 'Demostración Holded gratuita'");
    expect(demoBlock).toContain('durationMinutes: 30');
  });

  it('includes periodic tax filing in all fixed monthly plans', () => {
    const plans = source('app/(public)/planes/page.tsx');
    const cards = source('components/subscriptions/SubscriptionPlanCards.tsx');
    expect(plans).toContain("supervision: 'Básicos'");
    expect(plans).toContain("avanzado: 'Básicos'");
    expect(plans).toContain("colaborativo: 'Incluida según alcance'");
    expect(cards).toContain('Preparación y presentación de impuestos periódicos básicos');
    expect(cards).toContain('Preparación y presentación de impuestos periódicos según alcance');
  });

  it('stores official registry provenance and blocks registry identity edits', () => {
    const migration = source('supabase/migrations/20261001183500_company_registry_locks_and_intake.sql');
    const clientApi = source('app/api/companies/[id]/route.ts');
    const adminApi = source('app/api/admin/companies/[id]/route.ts');
    const associateApi = source('app/api/company/associate/route.ts');
    const locks = source('lib/companies/registry-locks.ts');
    expect(migration).toContain('registry_locked_fields');
    expect(migration).toContain('registry_snapshot');
    expect(locks).toContain("'registradores_opendata'");
    expect(clientApi).toContain("code: 'registry_fields_locked'");
    expect(adminApi).toContain("code: 'registry_fields_locked'");
    expect(associateApi).toContain('const officialRegistry = false');
    expect(associateApi).toContain('registry_snapshot');
  });

  it('keeps Company 360 intake as autosaved partial operational data', () => {
    const api = source('app/api/companies/[id]/intake/route.ts');
    const ui = source('components/company/Company360Questionnaire.tsx');
    expect(api).toContain(".from('company_intake_profiles')");
    expect(api).toContain('completion_percent');
    expect(api).toContain('company360.intake.saved');
    expect(ui).toContain('Company 360 · Cuestionario operativo');
    expect(ui).toContain('window.setTimeout');
    expect(ui).toContain('Guardando…');
  });
});
