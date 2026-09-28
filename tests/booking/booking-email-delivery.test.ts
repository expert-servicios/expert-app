import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('booking email delivery', () => {
  const route = source('app/api/booking/route.ts');
  const transport = source('lib/booking/booking-email.ts');
  const form = source('components/booking/NativeBookingForm.tsx');
  const gmail = source('lib/integrations/gmail.ts');
  const manageToken = source('lib/booking/booking-management-token.ts');
  const cancelRoute = source('app/api/booking/manage/cancel/route.ts');
  const invite = source('lib/booking/calendar-invite.ts');
  const template = source('lib/email/templates.ts');

  it('uses Gmail first and Resend only as fallback', () => {
    expect(transport).toContain('sendNewGmailSA');
    expect(transport).toContain('maybeAppendKiaContextualCta');
    expect(transport).toContain('falling back to Resend');
    expect(transport).toContain('sendEmail({');
    expect(transport).toContain("transport: 'gmail'");
    expect(transport).toContain("transport: 'resend_fallback'");
    expect(transport).toContain('Gmail audit persistence failed after successful send');
  });

  it('escapes public booking fields before rendering admin HTML', () => {
    expect(route).toContain('function escapeEmailHtml');
    expect(route).toContain('safeNotes = input.notes ? escapeEmailHtml(input.notes)');
    expect(route).toContain('safeName = escapeEmailHtml(input.name)');
  });

  it('notifies both the client and the admin for every confirmed booking', () => {
    expect(route).toContain("eventType: 'cita.confirmed'");
    expect(route).toContain("eventType: 'booking.confirmed.admin'");
    expect(route).toContain('getAdminNotificationEmails()');
    expect(route).toContain('adminEmails.map');
    expect(route).toContain('emailSent: clientEmailSent');
    expect(route).toContain('adminEmailSent');
  });

  it('does not claim email delivery when every transport failed', () => {
    expect(form).toContain('data.emailSent === false');
    expect(form).toContain('no hemos podido enviar el correo de confirmación');
  });

  it('returns the Gmail message id for auditability', () => {
    expect(gmail).toContain('Promise<string>');
    expect(gmail).toContain("return result.data?.id ?? ''");
  });

  it('attaches a portable ICS calendar file', () => {
    expect(route).toContain("filename: 'cita-expert.ics'");
    expect(route).toContain("type: 'text/calendar; charset=utf-8'");
    expect(invite).toContain('BEGIN:VCALENDAR');
    expect(invite).toContain('BEGIN:VEVENT');
    expect(gmail).toContain('multipart/mixed');
  });

  it('adds signed cancel and reschedule links to client confirmation', () => {
    expect(route).toContain('createBookingManagementToken');
    expect(route).toContain('bookingManagementUrls');
    expect(template).toContain('Cambiar cita');
    expect(template).toContain('Cancelar cita');
    expect(manageToken).toContain("purpose: 'booking_manage'");
  });

  it('cancels safely and restores state if Calendar deletion fails', () => {
    expect(cancelRoute).toContain("status: 'cancelled'");
    expect(cancelRoute).toContain("status: 'confirmed'");
    expect(cancelRoute).toContain('deleteBookingCalendarEvent');
    expect(cancelRoute).toContain('se restauró la cita');
  });

  it('keeps the original appointment until a replacement is confirmed', () => {
    expect(route).toContain("status: 'rescheduled'");
    expect(route).toContain('se conserva la cita original');
    expect(route.indexOf("status: 'confirmed'")).toBeLessThan(route.indexOf("status: 'rescheduled'"));
  });
});
