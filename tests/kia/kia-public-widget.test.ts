import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA public widget', () => {
  const layout = source('app/(public)/layout.tsx');
  const widget = source('components/site/KiaPublicWidget.tsx');
  const route = source('app/api/ai/kia/public/route.ts');
  const official = source('lib/integrations/official-sources.ts');

  it('replaces the public WhatsApp launcher with KIA', () => {
    expect(layout).toContain("KiaPublicWidget");
    expect(layout).toContain('<KiaPublicWidget />');
    expect(layout).not.toContain('WhatsAppChatWidget');
  });

  it('offers web chat, Telegram and an informational meeting without dashboard noise', () => {
    expect(widget).toContain("fetch('/api/ai/kia/public'");
    expect(widget).toContain("https://t.me/kia_expert_bot");
    expect(widget).toContain("fetch('/api/ai/kia/telegram-link'");
    expect(widget).toContain('Pedir reunión informativa');
    expect(widget).toContain('/cita?tipo=consulta-inicial');
    expect(widget).not.toContain('Abrir KIA con mis expedientes y datos');
  });

  it('protects anonymous chat with recaptcha, spam and rate limiting', () => {
    expect(route).toContain("getClientIp(request.headers)");
    expect(route).toContain("checkKiaMessageRateLimit(`public:${ip}`)");
    expect(route).toContain("checkSpam({ message: parsed.data.message })");
    expect(route).toContain("action: 'kia_public_chat'");
  });

  it('uses a plain-text public response contract instead of KiaDecision JSON', () => {
    expect(route).toContain('runKiaProviderRequest');
    expect(route).toContain('NO devuelvas JSON');
    expect(route).not.toContain('runKiaDecision');
    expect(route).not.toContain('responseSchema:');
    expect(official).toContain("tools: [{ type: 'google_search' }]");
  });

  it('maps commercial actions without forcing checkout for anonymous visitors', () => {
    expect(widget).toContain("data.nextAction === 'send_login_link'");
    expect(widget).toContain("data.nextAction === 'book_call'");
    expect(widget).toContain("data.nextAction === 'send_checkout_link'");
    expect(widget).toContain("['run_viability', 'run_readiness']");
  });
});
