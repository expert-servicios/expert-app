import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildKiaProactiveSuggestions } from '@/lib/ai/kia/kia-proactive-suggestions';
import { caseStatusLabel } from '@/lib/cases/case-status';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA proactive mobile conversation UX', () => {
  it('localizes client-facing case statuses', () => {
    expect(caseStatusLabel('pendiente_cliente', 'es')).toContain('Esperando');
    expect(caseStatusLabel('pendiente_cliente', 'ru')).toContain('Ожидаем');
    expect(caseStatusLabel('en_revision', 'ru')).toBe('На проверке EXPERT');
  });

  it('offers three useful case continuations without commercial CTAs', () => {
    const suggestions = buildKiaProactiveSuggestions({
      locale: 'ru',
      intent: 'case_status',
      nextAction: 'reply_only',
      hasCase: true,
      hasCompany: false,
      pendingDocuments: 0,
      existingQuickReplies: [],
    });
    expect(suggestions).toHaveLength(3);
    expect(suggestions).toContain('Что делать дальше?');
    expect(suggestions.join(' ')).not.toMatch(/оплат|куп|заказать|встреч/i);
  });

  it('keeps general proactive suggestions educational rather than sales-led', () => {
    const suggestions = buildKiaProactiveSuggestions({
      locale: 'es',
      intent: 'unknown',
      nextAction: 'reply_only',
      hasCase: false,
      hasCompany: false,
      pendingDocuments: 0,
      existingQuickReplies: [],
    });
    expect(suggestions).toEqual(['¿Qué puedes revisar?', 'Enséñame mis opciones', 'Guíame paso a paso']);
  });

  it('uses language-neutral context loading and localized thinking/input text', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    expect(widget).not.toContain('Estoy abriendo este expediente para ti');
    expect(widget).toContain("uiLocale === 'ru' ? 'Думаю…' : 'Pensando…'");
    expect(widget).toContain("uiLocale === 'ru' ? 'Напишите ваш вопрос…' : 'Escribe tu consulta…'");
  });

  it('uses a safe mobile sheet and hides the floating trigger while open on mobile', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    expect(widget).toContain('bottom-[calc(76px+env(safe-area-inset-bottom))]');
    expect(widget).toContain("open ? 'hidden sm:flex' : 'flex'");
    expect(widget).toContain('top-[max(10px,env(safe-area-inset-top))]');
  });

  it('stacks email CTAs so Hablar con KIA cannot overlap Telegram on mobile', () => {
    const signature = source('lib/email/kia-signature.ts');
    expect(signature).toContain("ctaLabel = ru ? 'Поговорить с KIA:' : 'Hablar con KIA:'");
    expect(signature).toContain('data-kia-contact-cta="true"');
    expect(signature).toContain('https://telegram.org/img/t_logo.png');
    expect(signature).toContain('data-kia-contact-cta="true"');
  });

  it('sends proactive suggestions separately from operational quick replies', () => {
    const route = source('app/api/ai/kia/route.ts');
    const widget = source('components/KiaCopilotWidget.tsx');
    expect(route).toContain('proactiveSuggestions');
    expect(route).toContain('buildKiaProactiveSuggestions');
    expect(widget).toContain('También puedo ayudarte con:');
    expect(widget).toContain('Я также могу помочь:');
  });

  it('localizes case status before it is exposed to the model prompt', () => {
    const engine = source('lib/ai/kia/kia-decision-engine.ts');
    expect(engine).toContain('localizedContext');
    expect(engine).toContain('caseStatusLabel(caseItem.status, locale)');
  });
});
