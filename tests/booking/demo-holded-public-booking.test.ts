import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('public Holded demo booking', () => {
  it('offers a visible 30-minute public Holded demo', () => {
    const services = source('lib/booking/native-booking.ts');
    const page = source('app/(public)/cita/page.tsx');
    const demoBlock = services.slice(services.indexOf("'demo-holded': {"), services.indexOf('onboarding:', services.indexOf("'demo-holded': {")));
    expect(demoBlock).toContain("label: 'Demostración Holded gratuita'");
    expect(demoBlock).toContain('durationMinutes: 30');
    expect(demoBlock).toContain('public: true');
    expect(page).toContain('/cita?tipo=demo-holded');
    expect(page).toContain('30 minutos · permite invitados');
  });

  it('validates, stores and invites additional attendees', () => {
    const form = source('components/booking/NativeBookingForm.tsx');
    const route = source('app/api/booking/route.ts');
    const google = source('lib/integrations/google-calendar.ts');
    const microsoft = source('lib/integrations/microsoft365.ts');
    expect(form).toContain('hasta 8 personas');
    expect(route).toContain('guest_emails: z.array');
    expect(route).toContain('additional_attendees: guestEmails.length');
    expect(route).toContain('additionalAttendeeEmails: guestEmails');
    expect(google).toContain('...(input.additionalAttendeeEmails ?? [])');
    expect(microsoft).toContain('...(input.additionalAttendeeEmails ?? [])');
  });
});
