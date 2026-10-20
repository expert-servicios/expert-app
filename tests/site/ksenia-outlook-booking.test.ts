import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Personal Outlook booking guard and provider-accurate copy', () => {
  it('never renders the personal booking form when its calendar is unconfigured', () => {
    const gate = read('components/personal/KseniaPersonalBookingGate.tsx');
    expect(gate).toContain('isBookingCalendarConfigured()');
    expect(gate).toContain('if (ready) return <>{children}</>');
    expect(gate).toContain('soy@kseniailicheva.com');
  });
  it('keeps public ES and RU bookings isolated behind the connection gate', () => {
    const es = read('app/(personal)/reserva-ksenia/page.tsx');
    const ru = read('app/(personal)/reserva-ksenia-ru/page.tsx');
    for (const page of [es, ru]) {
      expect(page).toContain('KseniaPersonalBookingGate');
      expect(page).not.toContain('Google Meet');
      expect(page).toContain("export const dynamic = 'force-dynamic'");
    }
  });
  it('reports the current calendar meeting provider instead of hardcoding Google Meet', () => {
    const api = read('app/api/booking/availability/route.ts');
    const form = read('components/booking/NativeBookingForm.tsx');
    expect(api).toContain("getConfiguredBookingCalendarProvider() === 'ms365' ? 'teams' : 'meet'");
    expect(form).toContain("availability?.meetingProvider === 'teams' ? 'Microsoft Teams' : 'Google Meet'");
  });
});
