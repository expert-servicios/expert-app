import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA public connection resilience', () => {
  const recaptcha = read('lib/utils/recaptcha-client.ts');
  const widget = read('components/site/KiaPublicWidget.tsx');

  it('bounds the reCAPTCHA ready/execute wait', () => {
    expect(recaptcha).toContain('window.setTimeout(() => finish');
    expect(recaptcha).toContain("finish('')");
  });

  it('bounds the public chat request', () => {
    expect(widget).toContain('PUBLIC_CHAT_TIMEOUT_MS = 45_000');
    expect(widget).toContain('const controller = new AbortController()');
    expect(widget).toContain('signal: controller.signal');
  });

  it('shows progressive thinking states', () => {
    for (const stage of ['verifying', 'searching', 'composing', 'slow']) {
      expect(widget).toContain(stage);
    }
    expect(widget).toContain('KIA está pensando');
    expect(widget).toContain('Las consultas con fuentes oficiales pueden tardar un poco más.');
  });

  it('keeps Telegram as a recovery path', () => {
    expect(widget).toContain('Puedes abrir KIA en Telegram');
    expect(widget).toContain('continuar ahora mismo en Telegram');
  });
});
