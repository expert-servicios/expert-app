import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const cta = readFileSync(resolve(process.cwd(), 'lib/email/kia-contextual-cta.ts'), 'utf8');
const send = readFileSync(resolve(process.cwd(), 'lib/email/send.ts'), 'utf8');

describe('KIA contextual email coverage', () => {
  it('auto-enables a contextual CTA for an identifiable case email', () => {
    expect(cta).toContain("const caseId = s(metadata, 'case_id', 'caseId')");
    expect(cta).toContain("if (!caseId && !explicitlyRequested) return input");
    expect(cta).toContain(".from('cases')");
    expect(cta).toContain("profileId = data.client_id");
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

  it('keeps the platform feature flag and explicit opt-out', () => {
    expect(cta).toContain('KIA_CONTEXTUAL_EMAIL_CTA_ENABLED');
    expect(cta).toContain('metadata.kia_contextual_cta === false');
    expect(send).toContain('maybeAppendKiaContextualCta');
  });
});
