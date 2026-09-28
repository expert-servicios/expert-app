import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('booking final UX', () => {
  const form = source('components/booking/NativeBookingForm.tsx');
  const route = source('app/api/booking/route.ts');
  const template = source('lib/email/templates.ts');
  const calendar = source('lib/integrations/google-calendar.ts');

  it('shows one day on mobile and three days from tablet upwards', () => {
    expect(form).toContain("window.matchMedia('(min-width: 768px)')");
    expect(form).toContain('setDaysPerPage(media.matches ? 3 : 1)');
    expect(form).toContain('md:grid-cols-3');
    expect(form).toContain('min-h-11');
  });

  it('keeps Google Meet visible after booking and in both confirmation emails', () => {
    expect(form).toContain('Abrir Google Meet');
    expect(template).toContain('Unirme a la reunión');
    expect(template).toContain('Enlace de reunión');
    expect(route).toContain('<strong>Google Meet:</strong>');
  });

  it('includes calendar management and ICS affordances', () => {
    expect(template).toContain('Cambiar cita');
    expect(template).toContain('Cancelar cita');
    expect(route).toContain("filename: 'cita-expert.ics'");
  });

  it('supports extra calendars as busy-only sources across all result pages', () => {
    expect(calendar).toContain('BOOKING_GOOGLE_BUSY_CALENDAR_IDS');
    expect(calendar).toContain("new Set(['primary', ...configured])");
    expect(calendar).toContain('pageToken');
    expect(calendar).toContain('data.nextPageToken');
  });

  it('rebases the stored page when the responsive page count shrinks', () => {
    expect(form).toContain('setDayPage((current) => Math.min(current, pageCount - 1))');
    expect(form).toContain('}, [pageCount]);');
  });
});
