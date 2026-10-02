import { describe, expect, it } from 'vitest';
import {
  MONTHLY_CALENDAR_BILLING_METADATA,
  currentCalendarMonthBillingWindow,
  nextMonthlyCalendarBillingAnchor,
} from '@/lib/subscriptions/calendar-month-billing';

describe('calendar-month subscription billing', () => {
  it('anchors a mid-month signup to the first day of the following month', () => {
    const anchor = nextMonthlyCalendarBillingAnchor(new Date('2026-09-20T10:00:00+02:00'));
    expect(new Date(anchor * 1000).toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });

  it('anchors a signup on day 1 to the first day of the following month, avoiding a double charge', () => {
    const anchor = nextMonthlyCalendarBillingAnchor(new Date('2026-10-01T09:00:00+02:00'));
    expect(new Date(anchor * 1000).toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('resolves the business month in Europe/Madrid around the UTC month boundary', () => {
    const anchor = nextMonthlyCalendarBillingAnchor(new Date('2026-09-30T22:30:00.000Z'));
    expect(new Date(anchor * 1000).toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('returns an idempotent billing window for the current natural month', () => {
    const window = currentCalendarMonthBillingWindow(new Date('2026-10-20T10:00:00+02:00'));
    expect(window.key).toBe('2026-10');
    expect(new Date(window.start * 1000).toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(new Date(window.end * 1000).toISOString()).toBe('2026-10-31T23:59:59.000Z');
    expect(new Date(window.nextAnchor * 1000).toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('declares full initial calendar-month billing with no proration', () => {
    expect(MONTHLY_CALENDAR_BILLING_METADATA).toEqual({
      billing_policy: 'calendar_month_full',
      billing_anchor_day: '1',
      initial_month_charge: 'full',
      initial_month_proration: 'none',
    });
  });
});
