import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const route = readFileSync(resolve(process.cwd(), 'app/api/cron/kia-email-shadow/route.ts'), 'utf8');
const helper = readFileSync(resolve(process.cwd(), 'lib/integrations/operational-gmail.ts'), 'utf8');
const vercel = readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8');

describe('KIA email shadow evaluator', () => {
  it('is opt-in and never sends messages', () => {
    expect(route).toContain('KIA_EMAIL_SHADOW_ENABLED');
    expect(route).toContain("mode: 'shadow'");
    expect(route).toContain('sent: false');
    expect(route).toContain('sent: 0');
    expect(route).not.toContain('sendGmailReply');
    expect(route).not.toContain('sendEmail(');
  });

  it('only gives KIA read-only case tools', () => {
    for (const tool of [
      'get_case_status',
      'get_case_tasks',
      'get_case_documents',
      'get_case_timeline',
      'get_service_operational_blueprint',
    ]) expect(route).toContain(tool);
    expect(route).toContain("allowedEffects: ['read']");
    expect(route).toContain("autonomousOnly: true");
  });

  it('evaluates only unread Gmail already linked to a case and deduplicates by last message', () => {
    expect(route).toContain(".eq('provider', 'gmail')");
    expect(route).toContain(".eq('unread', true)");
    expect(route).toContain(".not('case_id', 'is', null)");
    expect(route).toContain("previous?.last_message_at === row.date");
  });

  it('uses only operational Gmail auth, never client productivity credentials', () => {
    expect(helper).toContain('getGmailThreadSA');
    expect(helper).toContain("from('gmail_tokens')");
    expect(helper).not.toContain('client_integration_secrets');
    expect(helper).not.toContain('google_workspace');
  });

  it('has a ten-minute cron but remains cost-free until the feature flag is enabled', () => {
    expect(vercel).toContain('/api/cron/kia-email-shadow');
    expect(vercel).toContain('*/10 * * * *');
  });
});
