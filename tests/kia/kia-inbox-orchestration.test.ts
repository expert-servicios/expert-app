import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA inbox orchestration', () => {
  const classifier = source('lib/email/kia-inbox-classifier.ts');
  const escalation = source('lib/admin/kia-admin-escalation.ts');
  const gmail = source('lib/integrations/gmail.ts');
  const operational = source('lib/integrations/operational-gmail.ts');

  it('separates marketing, official, provider, system and human traffic', () => {
    expect(classifier).toContain("'marketing'");
    expect(classifier).toContain("'official'");
    expect(classifier).toContain("'provider'");
    expect(classifier).toContain("'system'");
    expect(classifier).toContain("'human'");
    expect(classifier).toContain('CATEGORY_PROMOTIONS');
    expect(classifier).toContain('OFFICIAL_DOMAIN');
    expect(classifier).toContain('PROVIDER_DOMAIN');
    expect(classifier).toContain('einforma\\.com');
  });

  it('treats deadlines and formal notices as actionable', () => {
    expect(classifier).toContain('CRITICAL_OFFICIAL_SIGNAL');
    expect(classifier).toContain("'critical'");
    expect(classifier).toContain("'00 KIA/URGENTE'");
    expect(classifier).toContain('normalizedSignalBody');
    expect(classifier).toContain('hasActionableAttachment');
    expect(classifier).toContain("official_attachment_requires_review");
  });

  it('keeps noreply as a functional purpose and supports operational aliases', () => {
    expect(classifier).toContain('noreply@expertconsulting.es');
    expect(classifier).toContain('documentos@expertconsulting.es');
    expect(classifier).toContain('citas@expertconsulting.es');
    expect(classifier).toContain('facturacion@expertconsulting.es');
    expect(classifier).toContain('kia@expertconsulting.es');
  });

  it('uses Gmail modify scope to create and apply labels', () => {
    expect(gmail).toContain('gmail.modify');
    expect(gmail).toContain('gmail.users.labels.create');
    expect(gmail).toContain('gmail.users.messages.modify');
    expect(operational).toContain('applyOperationalGmailLabel');
  });

  it('escalates to push, Telegram fanout and Ksenia email only for intervention', () => {
    expect(escalation).toContain('await sendEmailOnce({');
    expect(escalation).toContain('await notifyAdmins({');
    expect(escalation).toContain('to: getAdminOwnerEmail()');
    const adminOwner = source('lib/admin/admin-owner.ts');
    expect(adminOwner).toContain("DEFAULT_ADMIN_OWNER_EMAIL = 'soy@kseniailicheva.com'");
    expect(escalation).toContain('KIA necesita tu intervención');
    expect(escalation).toContain("from: 'KIA Alertas <noreply@expertconsulting.es>'");
  });
});
