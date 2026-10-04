import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('recurring meeting series', () => {
  const migration = source('supabase/migrations/20261004193000_kia_recurring_meeting_series.sql');
  const helper = source('lib/booking/recurring-meeting-series.ts');
  const cron = source('app/api/cron/recurring-meeting-series/route.ts');
  const definitions = source('lib/ai/kia/kia-tool-definitions.ts');
  const registry = source('lib/ai/kia/kia-tool-registry.ts');
  const executor = source('lib/ai/kia/kia-tool-executor.ts');
  const vercel = source('vercel.json');

  it('stores idempotent master series and monthly occurrences', () => {
    expect(migration).toContain('recurring_meeting_series');
    expect(migration).toContain('source_key text not null unique');
    expect(migration).toContain('unique(series_id, month_key)');
  });

  it('keeps recurring planning inside working days and handles conflicts', () => {
    expect(helper).toContain('nextWeekday');
    expect(helper).toContain('isMadridWeekday');
    expect(helper).toContain('next_available_weekday');
    expect(helper).toContain('listBookingCalendarBusyWindows');
  });

  it('creates canonical EXPERT appointments and tasks before marking occurrences confirmed', () => {
    expect(helper).toContain(".from('appointments')");
    expect(helper).toContain('ensureBookingAdminTask({');
    expect(helper).toContain('createBookingManagementToken');
    expect(helper).toContain('Cambiar hora:');
    expect(helper).toContain(".from('recurring_meeting_occurrences').update");
  });

  it('exposes recurring scheduling only to admin KIA', () => {
    expect(definitions).toContain('upsert_recurring_meeting_series');
    expect(registry).toContain("allowedChannels: ['admin']");
    expect(executor).toContain("case 'upsert_recurring_meeting_series'");
    expect(executor).toContain("onConflict: 'source_key'");
  });

  it('keeps dependent monthly meetings anchored to the primary series date', () => {
    expect(helper).toContain('anchor_source_key');
    expect(helper).toContain('resolveAnchoredLocalDate');
    expect(helper).toContain('recurring_meeting_anchor_not_ready');
    expect(helper).toContain('orderedSeriesRows');
  });

  it('runs a daily materializer cron', () => {
    expect(cron).toContain('materializeRecurringMeetingSeries');
    expect(vercel).toContain('/api/cron/recurring-meeting-series');
  });
});
