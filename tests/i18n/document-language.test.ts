import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('document language for localized routes', () => {
  it('renders the root html language on the server for RU routes', () => {
    const proxy = read('proxy.ts');
    const layout = read('app/layout.tsx');

    expect(proxy).toContain("pathname === '/ru' || pathname.startsWith('/ru/')");
    expect(proxy).toContain("requestHeaders.set('x-expert-locale', isRussianPublicPath ? 'ru' : 'es')");
    expect(proxy).toContain("'/ru'");
    expect(proxy).toContain("'/ru/:path*'");
    expect(layout).toContain("requestHeaders.get('x-expert-locale') === 'ru' ? 'ru' : 'es'");
    expect(layout).toContain('<html lang={documentLocale}');
    expect(layout).toContain('suppressHydrationWarning');
    expect(layout).not.toContain('id="document-language"');
    expect(layout).not.toContain('strategy="beforeInteractive"');
  });

  it('sends an explicit Russian content-language header for RU paths', () => {
    const config = read('next.config.ts');

    expect(config).toContain("source: '/ru/:path*'");
    expect(config).toContain("{ key: 'Content-Language', value: 'ru' }");
  });
});
