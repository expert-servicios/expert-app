import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const cta = readFileSync(resolve(process.cwd(), 'lib/email/kia-contextual-cta.ts'), 'utf8');
const send = readFileSync(resolve(process.cwd(), 'lib/email/send.ts'), 'utf8');

describe('KIA contextual email coverage', () => {
  it('auto-enables contextual KIA links for an identifiable case email', () => {
    expect(cta).toContain("const caseId = s(metadata, 'case_id', 'caseId')");
    expect(cta).toContain("if (!caseId && !explicitlyRequested) return input");
    expect(cta).toContain(".from('cases')");
    expect(cta).toContain("profileId = data.client_id");
    expect(cta).toContain("kia_chat_href: chatHref");
    expect(cta).toContain("kia_telegram_href: telegramHref");
    expect(cta).not.toContain('data-kia-contextual-cta="true"');
  });

  it('normalizes legacy camelCase and canonical snake_case metadata', () => {
    expect(cta).toContain("'profile_id', 'profileId', 'client_id', 'clientId', 'user_id', 'userId'");
    expect(cta).toContain("'company_id', 'companyId'");
    expect(cta).toContain("'service_slug', 'serviceSlug', 'service_id', 'serviceId'");
    expect(cta).toContain("'task_id', 'taskId'");
  });

  it('fails closed for broadcasts and recipient mismatches', () => {
    expect(cta).toContain('input.recipients.length !== 1');
    expect(cta).toContain("profile.email?.trim().toLowerCase() !== input.recipients[0].trim().toLowerCase()");
    expect(cta).toContain("if (profileId && profileId !== data.client_id) return input");
  });

  it('revalidates company membership before adding company context', () => {
    expect(cta).toContain(".from('profile_companies')");
    expect(cta).toContain(".eq('profile_id', profileId)");
    expect(cta).toContain(".eq('company_id', companyId)");
  });

  it('keeps a global flag, explicit opt-out, and renders the signature after context resolution', () => {
    expect(cta).toContain('KIA_CONTEXTUAL_EMAIL_CTA_ENABLED');
    expect(cta).toContain('metadata.kia_contextual_cta === false');
    expect(send).toContain('maybeAppendKiaContextualCta');
    expect(send.indexOf('maybeAppendKiaContextualCta')).toBeLessThan(send.indexOf('appendKiaSignature(contextual.html, contextual.metadata)'));
  });
});
