import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA public attachment + mobile composer regression', () => {
  const attachment = read('lib/ai/kia/kia-attachment.ts');
  const route = read('app/api/ai/kia/public/attachment/route.ts');
  const widget = read('components/site/KiaPublicWidget.tsx');
  const providerRouter = read('lib/ai/kia/kia-provider-router.ts');

  it('pins a dedicated attachment model instead of inheriting GEMINI_MODEL', () => {
    expect(attachment).toContain("GEMINI_ATTACHMENT_MODEL");
    expect(attachment).toContain("'gemini-3.8-flash'");
    expect(attachment).not.toContain("|| process.env.GEMINI_MODEL");
  });

  it('logs safe Gemini attachment diagnostics', () => {
    expect(attachment).toContain("[KIA attachment] Gemini request failed");
    expect(attachment).toContain("googleStatus");
    expect(attachment).toContain("googleCode");
    expect(route).toContain("[KIA public attachment] analysis failed");
  });

  it('keeps the mobile composer readable and touch-friendly', () => {
    expect(widget).toContain('placeholder="Escribe…"');
    expect(widget).toContain('min-h-11');
    expect(widget).toContain('text-sm');
    expect(widget).toContain("rows={attachment ? 2 : 1}");
    expect(widget).toContain('max-h-24');
    expect(widget).toContain('h-11 w-11');
    expect(widget).toContain('sm:h-9 sm:w-9');
  });

  it('keeps the analyzed attachment in the chat request and retries Gemini billing failures safely', () => {
    expect(widget).toContain('}, [attachment, history, loading]);');
    expect(widget).toContain('attachment: attachment ?? undefined');
    expect(providerRouter).toContain('GEMINI_DIRECT_FREE_FALLBACK_MODEL');
    expect(providerRouter).toContain('HTTP\\s+402');
    expect(attachment).toContain('freeFallbackModel');
    expect(attachment).toContain('attempt.response.status === 402');
  });
});
