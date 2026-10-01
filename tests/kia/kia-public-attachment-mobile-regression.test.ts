import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA public attachment + mobile composer regression', () => {
  const attachment = read('lib/ai/kia/kia-attachment.ts');
  const route = read('app/api/ai/kia/public/attachment/route.ts');
  const widget = read('components/site/KiaPublicWidget.tsx');
  const providerRouter = read('lib/ai/kia/kia-provider-router.ts');
  const publicRoute = read('app/api/ai/kia/public/route.ts');

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
    expect(widget).toContain('min-h-16');
    expect(widget).toContain('text-[12px]');
    expect(widget).toContain("rows={attachment ? 3 : 2}");
    expect(widget).toContain('min-h-16');
    expect(widget).toContain('max-h-28');
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

  it('pins public chat language to the typed message and uses plain text', () => {
    expect(publicRoute).toContain("detectKiaMessageLocale(parsed.data.message) ?? 'es'");
    expect(publicRoute).toContain('runKiaProviderRequest');
    expect(publicRoute).toContain('NO devuelvas JSON');
    expect(publicRoute).not.toContain('runKiaDecision');
  });

  it('shows only the KIA thinking avatar without secondary loading animation', () => {
    expect(widget).toContain('state={loading ? "pensando" : "ayuda"}');
    expect(widget).toContain('KIA está pensando…');
    expect(widget).not.toContain('animate-bounce [animation-delay:-0.3s]');
    expect(widget).not.toContain('ring-2 ring-[#D4A017]/35');
  });
});
