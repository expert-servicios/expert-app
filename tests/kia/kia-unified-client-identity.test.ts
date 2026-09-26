import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const signature = readFileSync(resolve(process.cwd(), 'lib/email/kia-signature.ts'), 'utf8');
const contextual = readFileSync(resolve(process.cwd(), 'lib/email/kia-contextual-cta.ts'), 'utf8');
const widget = readFileSync(resolve(process.cwd(), 'components/KiaCopilotWidget.tsx'), 'utf8');
const prompt = readFileSync(resolve(process.cwd(), 'lib/ai/kia/prompts/kia-core-policy.ts'), 'utf8');
const kiaRoute = readFileSync(resolve(process.cwd(), 'app/api/ai/kia/route.ts'), 'utf8');

describe('Unified KIA client identity', () => {
  it('uses one visual KIA signature for Chat and Telegram', () => {
    expect(signature).toContain('/avatars/kia/kia-bienvenida.webp');
    expect(signature).toContain("ctaLabel = ru ? 'Поговорить с KIA:' : 'Hablar con KIA:'");
    expect(signature).toContain('https://t.me/kia_expert_bot');
    expect(signature).toContain('KIA es una asistente virtual de EXPERT');
  });

  it('puts contextual Chat and Telegram links into that same signature metadata', () => {
    expect(contextual).toContain('kia_chat_href: chatHref');
    expect(contextual).toContain('kia_telegram_href: telegramHref');
    expect(contextual).toContain('?start=ctx_');
    expect(contextual).not.toContain('data-kia-contextual-cta="true"');
  });

  it('opens a contextual email case before showing generic Holded shortcuts', () => {
    expect(widget).toContain('contextToken ? [] : [welcomeMessage()]');
    expect(widget).not.toContain('Estoy abriendo este expediente para ti… 😊');
    expect(widget).toContain('<span aria-hidden="true">•••</span>');
    expect(widget).toContain('setMessages([contextualWelcome(context)])');
    expect(widget).toContain('contextSummary ? [contextualWelcome(contextSummary)] : [welcomeMessage(true)]');
  });

  it('keeps delegated staff preview case scope authoritative', () => {
    expect(kiaRoute).toContain('const resolvedCompanyId = staffPreview');
    expect(kiaRoute).toContain('staffPreview.companyId ?? undefined');
    expect(kiaRoute).toContain('clientId    : staffPreview?.clientId ?? user.id');
  });

  it('enforces the agreed KIA voice', () => {
    expect(prompt).toContain('cercana, alegre, positiva y resolutiva');
    expect(prompt).toContain('Incluye siempre al menos 1 emoji pertinente');
    expect(prompt).toContain('responde primero sobre ese expediente');
  });
});
