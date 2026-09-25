import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Universal KIA email signature', () => {
  it('central sendEmail always resolves context before appending one KIA signature', () => {
    const send = source('lib/email/send.ts');
    expect(send).toContain('maybeAppendKiaContextualCta');
    expect(send).toContain('appendKiaSignature(contextual.html, contextual.metadata)');
  });

  it('routes outbound templates through the central sender instead of bypassing context/audit', () => {
    const reviews = source('app/api/reviews/request/route.ts');
    const campaigns = source('app/api/admin/campaigns/[id]/send/route.ts');
    const viability = source('app/api/services/viabilidad/route.ts');

    for (const route of [reviews, campaigns, viability]) {
      expect(route).toContain('sendEmail');
      expect(route).not.toContain('resend.emails.send');
    }
    expect(campaigns).toContain("eventType: 'campaign.send'");
    expect(viability).toContain("eventType: 'viability.assessment.client'");
    expect(viability).toContain("eventType: 'viability.assessment.admin'");
  });

  it('renders a single KIA CTA zone with Chat and Telegram', () => {
    const signature = source('lib/email/kia-signature.ts');
    expect(signature).toContain('data-kia-contact-cta="true"');
    expect(signature).toContain("ctaLabel = ru ? 'Поговорить с KIA:' : 'Hablar con KIA:'");
    expect(signature).toContain('https://telegram.org/img/t_logo.png');
    expect(signature).toContain('kia_chat_href');
    expect(signature).toContain('kia_telegram_href');
  });

  it('keeps the KIA signature idempotent', () => {
    const signature = source('lib/email/kia-signature.ts');
    expect(signature).toContain("if (html.includes('data-kia-signature=')) return html;");
  });
});
