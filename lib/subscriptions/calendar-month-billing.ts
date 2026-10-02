export const MONTHLY_CALENDAR_BILLING_POLICY = 'calendar_month_full' as const;
export const MONTHLY_CALENDAR_BILLING_TIME_ZONE = 'Europe/Madrid' as const;

export const MONTHLY_CALENDAR_BILLING_METADATA = {
  billing_policy: MONTHLY_CALENDAR_BILLING_POLICY,
  billing_anchor_day: '1',
  initial_month_charge: 'full',
  initial_month_proration: 'none',
} as const;

/**
 * Returns the first day of the next calendar month as a Stripe UNIX timestamp.
 *
 * The business period is resolved in Europe/Madrid, while the anchor is emitted
 * at 00:00 UTC. Spain is ahead of UTC, so the resulting charge still falls on
 * day 1 locally. Resolving the current month in Madrid first avoids the
 * month-boundary bug where 00:30 in Spain can still be the previous UTC day.
 */
export function nextMonthlyCalendarBillingAnchor(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MONTHLY_CALENDAR_BILLING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Could not resolve Europe/Madrid calendar month for subscription billing');
  }

  return Math.floor(Date.UTC(year, month, 1, 0, 0, 0) / 1000);
}


export type CalendarMonthBillingWindow = {
  key: string;
  start: number;
  end: number;
  nextAnchor: number;
};

export function currentCalendarMonthBillingWindow(now: Date = new Date()): CalendarMonthBillingWindow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MONTHLY_CALENDAR_BILLING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Could not resolve Europe/Madrid calendar month for subscription billing');
  }

  const start = Math.floor(Date.UTC(year, month - 1, 1, 0, 0, 0) / 1000);
  const nextAnchor = Math.floor(Date.UTC(year, month, 1, 0, 0, 0) / 1000);

  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    start,
    end: nextAnchor - 1,
    nextAnchor,
  };
}
