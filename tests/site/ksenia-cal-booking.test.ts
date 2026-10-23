import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parsePersonalCalBookingUrl } from '@/lib/personal/ksenia-cal-booking-url';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Personal Cal.com booking — safe opt-in reactivation', () => {
  it('accepts only public HTTPS event links on cal.com', () => {
    expect(parsePersonalCalBookingUrl('https://cal.com/ksenia/consulta-15')).toBe('https://cal.com/ksenia/consulta-15');
    expect(parsePersonalCalBookingUrl('https://cal.com/ksenia/consulta-15?email=private@example.com')).toBe('https://cal.com/ksenia/consulta-15');
    for (const bad of [
      undefined, '', 'https://cal.com/ksenia', 'http://cal.com/ksenia/consulta',
      'https://cal.com.evil.com/ksenia/consulta', 'javascript:alert(1)',
      'https://user:pass@cal.com/ksenia/consulta',
    ]) {
      expect(parsePersonalCalBookingUrl(bad)).toBeNull();
    }
  });

  it('prioritizes Cal.com when explicitly configured and keeps the existing fallback', () => {
    const gate = read('components/personal/KseniaPersonalBookingGate.tsx');
    expect(gate).toContain('PERSONAL_CALCOM_BOOKING_URL');
    expect(gate).toContain('parsePersonalCalBookingUrl');
    expect(gate).toContain('<KseniaCalBookingEmbed');
    expect(gate).toContain('isBookingCalendarConfigured()');
    expect(gate).toContain('resolvePersonalCalBookingUrlByApi()');
    expect(gate.indexOf('if (calUrl || apiCalUrl)')).toBeLessThan(gate.indexOf('isBookingCalendarConfigured()'));
  });

  it('keeps credentials server-only, selects an explicit event and does not write to Cal.com', () => {
    const api = read('lib/personal/ksenia-calcom-api.ts');
    expect(api).toContain("import 'server-only'");
    expect(api).toContain('process.env.CAL_API_KEY');
    expect(api).toContain('process.env.cal_ksenia');
    expect(api).toContain('process.env.CAL_API_KEY?.trim() || process.env.cal_ksenia?.trim()');
    expect(api).toContain('process.env.PERSONAL_CALCOM_EVENT_TYPE_ID');
    expect(api).toContain("method: 'GET'");
    expect(api).toContain('https://api.cal.com/v2/event-types');
    expect(api).not.toContain("method: 'POST'");
  });

  it('does not load Cal.com before the visitor clicks and serves ES and RU', () => {
    const embed = read('components/personal/KseniaCalBookingEmbed.tsx');
    expect(embed).toContain('useState(false)');
    expect(embed).toContain('onClick={() => setLoaded(true)}');
    expect(embed).toContain('{!loaded ? (');
    expect(embed).toContain('<iframe');
    expect(embed).toContain("iframeUrl.searchParams.set('lang', locale)");
    expect(embed).toContain('Показать свободное время');
    expect(embed).toContain('Mostrar horarios disponibles');
  });
});
