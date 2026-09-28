import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('email locale guard transport coverage', () => {
  it('guards the Resend HTML and text payloads', () => {
    const send = source('lib/email/send.ts');
    expect(send).toContain('keepEmailKnowledgeContentInLocale');
    expect(send).toContain('text = localeFiltered.text');
  });

  it('guards direct booking Gmail sends', () => {
    const booking = source('lib/booking/booking-email.ts');
    expect(booking).toContain('keepEmailKnowledgeLinksInLocale');
    expect(booking).toContain('sendNewGmailSA');
  });

  it('guards KIA operational Gmail replies at the transport boundary', () => {
    const operational = source('lib/integrations/operational-gmail.ts');
    expect(operational).toContain('keepEmailKnowledgeLinksInLocale');
    expect(operational).toContain('keepEmailKnowledgeTextLinksInLocale');
    expect(operational).toContain('const safeInput = { ...input, body }');
  });

  it('guards Admin Gmail and Microsoft 365 compose/reply flows', () => {
    const admin = source('app/api/admin/correo/route.ts');
    expect(admin).toContain('keepEmailKnowledgeLinksInLocale');
    expect(admin).toContain('keepEmailKnowledgeTextLinksInLocale');
    expect(admin).toContain('comment: safeMs365Comment');
    expect(admin).toContain('const decoratedBody = decorated.html');
  });
});
