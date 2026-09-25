import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA delegated preview language and provider fallback', () => {
  it('never renders a blank assistant bubble when the provider fails', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    expect(widget).toContain("data.reply?.trim() || kiaFriendlyError");
    const engine = source('lib/ai/kia/kia-decision-engine.ts');
    expect(engine).toContain("userMessage: kiaFriendlyError('kia_error', locale)");
  });

  it('does not mix opposite-language case fields into contextual welcome', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    expect(widget).toContain('contextualFieldForLocale');
    expect(widget).toContain('detectKiaMessageLocale');
    expect(widget).toContain('detected && detected !== locale ? null : text');
  });

  it('keeps localized contextual quick replies', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    expect(widget).toContain("'Что сейчас нужно сделать?'");
    expect(widget).toContain("'¿Qué tengo que hacer ahora?'");
  });

  it('attributes exhausted provider errors to the last failed provider', () => {
    const router = source('lib/ai/kia/kia-provider-router.ts');
    expect(router).toContain('lastFailedProvider = provider');
    expect(router).toContain('const failedProvider = lastFailedProvider');
  });
});
