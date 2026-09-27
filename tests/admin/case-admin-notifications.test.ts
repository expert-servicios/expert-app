import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Admin case activity notifications', () => {
  it('fans active-case events out to PushApp, Telegram and Admin email', () => {
    const notifications = source('lib/admin/case-admin-notifications.ts');
    expect(notifications).toContain("eq('key', 'admin.case_activity')");
    expect(notifications).toContain('notifyAdmins({');
    expect(notifications).toContain('getAdminNotificationEmails()');
    expect(notifications).toContain('sendEmailOnce({');
    expect(notifications).toContain("kia_signature: false");
    expect(notifications).toContain('idempotencyKey:');
  });

  it('covers client messages, documents, review gates and case changes', () => {
    const messages = source('app/api/cases/[id]/messages/route.ts');
    const documents = source('app/api/cases/[id]/documents/route.ts');
    const review = source('app/api/cases/[id]/document-review/route.ts');
    const cases = source('app/api/admin/cases/[id]/route.ts');

    expect(messages).toContain("kind: 'client_message'");
    expect(documents).toContain("kind: 'document_uploaded'");
    expect(review).toContain("kind: 'document_ready_for_review'");
    expect(cases).toContain("kind: 'status_changed'");
    expect(cases).toContain("kind: body.next_action !== undefined ? 'next_action_changed' : 'case_updated'");
  });

  it('notifies only active cases for linked inbound email', () => {
    const sync = source('app/api/cron/email-sync/route.ts');
    expect(sync).toContain("kind: 'inbound_email'");
    expect(sync).toContain(".is('closed_at', null)");
    expect(sync).toContain('isNewLinkedInbound');
  });

  it('exposes the case activity toggle to Admin', () => {
    const catalog = source('lib/automations/catalog.ts');
    const panel = source('components/admin/AutomationSettingsPanel.tsx');
    expect(catalog).toContain("key: 'admin.case_activity'");
    expect(catalog).toContain('PushApp + Telegram + Email admin');
    expect(panel).toContain("'admin.case_activity'");
  });

  it('keeps all active cases visible in the daily summary', () => {
    const cron = source('app/api/cron/daily-summary/route.ts');
    const templates = source('lib/email/templates.ts');
    expect(cron).toContain('activeCaseRows');
    expect(cron).toContain(".is('closed_at', null)");
    expect(cron).toContain('activeCases: (activeCaseRows ?? []).map');
    expect(templates).toContain('activeCases      : Array');
    expect(templates).toContain('Expedientes activos');
    expect(templates).toContain('data.activeCases.length');
  });
});

describe('Provider email KIA signature', () => {
  it('decorates Gmail replies and provider compositions with the universal KIA signature', () => {
    const correo = source('app/api/admin/correo/route.ts');
    expect(correo).toContain('decorateProviderEmail');
    expect(correo).toContain('maybeAppendKiaContextualCta');
    expect(correo).toContain('appendKiaSignature');
    expect(correo).toContain('body: decoratedGmailBody');
    expect(correo).toContain('bodyHtml: true');
    expect(correo).toContain('body: decoratedBody');
  });

  it('uses the official Telegram logo image and contains no airplane emoji fallback', () => {
    const signature = source('lib/email/kia-signature.ts');
    expect(signature).toContain('https://telegram.org/img/t_logo.png');
    expect(signature).not.toContain('✈');
    expect(signature).not.toContain('🛩');
  });
});
