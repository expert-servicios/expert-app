import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const cron = readFileSync(resolve(process.cwd(), 'app/api/cron/email-sync/route.ts'), 'utf8');
const vercel = readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8');

describe('operational Gmail sync for KIA', () => {
  it('prefers service account but falls back to admin OAuth', () => {
    expect(cron).toContain('Gmail service account unavailable, trying admin OAuth');
    expect(cron).toContain("from('gmail_tokens')");
    expect(cron).toContain("authMode: 'service_account'");
    expect(cron).toContain("authMode: 'oauth'");
  });

  it('never reuses client productivity credentials for EXPERT mailbox', () => {
    expect(cron).not.toContain('client_integration_secrets');
    expect(cron).not.toContain('google_workspace');
  });

  it('propagates the provider thread link into case-aware inbox state', () => {
    expect(cron).toContain("from('email_threads')");
    expect(cron).toContain("from('email_inbox_cache').update({ case_id: link.case_id })");
    expect(cron).toContain('last_message_at: mail.date');
  });

  it('polls often enough for operational case intake', () => {
    expect(vercel).toContain('"path": "/api/cron/email-sync"');
    expect(vercel).toContain('"schedule": "*/10 * * * *"');
  });
});
