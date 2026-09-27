import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('compact multi-calendar booking', () => {
  it('renders availability in three-day pages', () => {
    const form = source('components/booking/NativeBookingForm.tsx');
    expect(form).toContain('const daysPerPage = 3');
    expect(form).toContain('md:grid-cols-3');
    expect(form).toContain('Días siguientes');
  });

  it('combines EXPERT primary calendar with configured busy calendars', () => {
    const calendar = source('lib/integrations/google-calendar.ts');
    expect(calendar).toContain('BOOKING_GOOGLE_BUSY_CALENDAR_IDS');
    expect(calendar).toContain("new Set(['primary', ...configured])");
    expect(calendar).toContain('return windows.flat()');
  });
});
