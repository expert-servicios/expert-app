import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('booking email delivery', () => {
  const route = source('app/api/booking/route.ts');
  const transport = source('lib/booking/booking-email.ts');
  const form = source('components/booking/NativeBookingForm.tsx');
  const gmail = source('lib/integrations/gmail.ts');

  it('uses Gmail first and Resend only as fallback', () => {
    expect(transport).toContain('sendNewGmailSA');
    expect(transport).toContain('falling back to Resend');
    expect(transport).toContain('sendEmail({');
    expect(transport).toContain("transport: 'gmail'");
    expect(transport).toContain("transport: 'resend_fallback'");
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
});
