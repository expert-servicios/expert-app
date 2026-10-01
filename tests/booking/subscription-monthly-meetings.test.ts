import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('subscription monthly meeting entitlements', () => {
  const booking = source('lib/booking/native-booking.ts');
  const auth = source('lib/booking/private-booking-authorization.ts');
  const route = source('app/api/booking/route.ts');
  const planner = source('app/api/cron/subscription-monthly-meetings/route.ts');
  const entitlements = source('lib/subscriptions/meeting-entitlements.ts');
  const plans = source('components/subscriptions/SubscriptionPlanCards.tsx');

  it('keeps onboarding at 60 minutes and adds plan-specific monthly durations', () => {
    expect(booking).toContain("key: 'onboarding'");
    expect(booking).toContain('durationMinutes: 60');
    expect(booking).toContain("key: 'seguimiento-mensual-empresa'");
    expect(booking).toContain("key: 'seguimiento-mensual-autonomo'");
    expect(booking).toContain('durationMinutes: 30');
  });

  it('protects monthly meetings with private booking authorization', () => {
    expect(auth).toContain("'seguimiento-mensual-empresa'");
    expect(auth).toContain("'seguimiento-mensual-autonomo'");
    expect(route).toContain("code: 'monthly_meeting_already_booked'");
  });

  it('derives Advanced plan entitlements by beneficiary entity type', () => {
    expect(entitlements).toContain("includes('avanzado')");
    expect(entitlements).toContain("durationMinutes: autonomo ? 30 : 60");
    expect(entitlements).toContain('quarterlyTaxFiling: true');
    expect(entitlements).toContain("feature_key', 'included_entity'");
  });

  it('plans one invitation/task per entity and month near month end', () => {
    expect(planner).toContain('if (day < 20)');
    expect(planner).toContain('monthly-review:${key}:${entitlement.subscriptionId}:${entitlement.companyId}');
    expect(planner).toContain("eventType: 'subscription.monthly_meeting.invitation'");
    expect(planner).toContain("task_kind: 'subscription_monthly_review'");
  });

  it('adds quarterly close review without hardcoding tax filing deadlines', () => {
    expect(planner).toContain('[3, 6, 9, 12].includes(month)');
    expect(planner).toContain('obligaciones fiscales del calendario');
  });

  it('publishes Advanced onboarding and meeting inclusions', () => {
    expect(plans).toContain('Onboarding inicial de 60 min incluido');
    expect(plans).toContain('Reunión mensual: 60 min por sociedad / 30 min por autónomo');
    expect(plans).toContain('Impuestos trimestrales básicos si aplica');
  });
});
