import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('document language for localized routes', () => {
  it('switches the root html language before hydration on RU routes', () => {
    const layout = read('app/layout.tsx');

    expect(layout).toContain('id="document-language"');
    expect(layout).toContain('strategy="beforeInteractive"');
    expect(layout).toContain("location.pathname.startsWith('/ru/')");
    expect(layout).toContain("'ru':'es'");
    expect(layout).toContain('suppressHydrationWarning');
  });

  it('sends an explicit Russian content-language header for RU paths', () => {
    const config = read('next.config.ts');

    expect(config).toContain("source: '/ru/:path*'");
    expect(config).toContain("{ key: 'Content-Language', value: 'ru' }");
  });
});
