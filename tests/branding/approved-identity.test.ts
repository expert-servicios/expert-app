import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const absolute = (file: string) => resolve(root, file);
const read = (file: string) => readFileSync(absolute(file), 'utf8');

const brandDir = 'public/branding/expert-approved';
const publicPages = [
  'app/layout.tsx',
  'app/(public)/page.tsx',
  'app/(public)/blog/page.tsx',
  'app/(public)/blog/[slug]/page.tsx',
  'app/(public)/sobre-mi/page.tsx',
  'app/(public)/cita/page.tsx',
  'app/(public)/solicitar-presupuesto/layout.tsx',
  'app/(public)/contacto/page.tsx',
  'app/(public)/para-asesorias/page.tsx',
  'app/(public)/servicios/page.tsx',
  'app/(public)/mentorias/page.tsx',
];

describe('Approved EXPERT identity regression guards', () => {
  it('uses the exact approved binary icons in file-based Next.js metadata', () => {
    for (const [target, approved] of [
      ['app/icon.png', `${brandDir}/app-dark-512.png`],
      ['app/apple-icon.png', `${brandDir}/app-dark-192.png`],
      ['public/favicon.ico', `${brandDir}/favicon.ico`],
      ['public/og-image.png', `${brandDir}/og-expert-1200x630.png`],
    ]) {
      expect(readFileSync(absolute(target)).equals(readFileSync(absolute(approved)))).toBe(true);
    }
  });

  it('provides a maskable 512px PWA icon and approved push notification artwork', () => {
    const manifest = JSON.parse(read('public/manifest.json')) as {
      icons: Array<{ src: string; sizes: string; purpose: string }>;
    };
    expect(manifest.icons).toContainEqual(expect.objectContaining({
      src: '/branding/expert-approved/app-dark-512.png',
      sizes: '512x512',
      purpose: 'maskable',
    }));
    const sw = read('public/sw.js');
    expect(sw).toContain('/branding/expert-approved/app-dark-192.png');
    expect(sw).not.toContain('/branding/expert-app.png');
  });

  it('exposes four approved designs with their real preview dimensions', () => {
    const page = read('app/(public)/marca/page.tsx');
    for (const [file, width, height] of [
      ['horizontal-claro', 600, 151],
      ['horizontal-oscuro', 600, 149],
      ['isotipo-claro', 512, 313],
      ['isotipo-oscuro', 512, 317],
    ] as const) {
      expect(existsSync(absolute(`${brandDir}/${file}.webp`))).toBe(true);
      expect(existsSync(absolute(`${brandDir}/${file}.png`))).toBe(true);
      expect(page).toContain(`file: '${file}', width: ${width}, height: ${height}`);
    }
    expect(existsSync(absolute(`${brandDir}/Manual-de-marca.pdf`))).toBe(true);
    expect(existsSync(absolute(`${brandDir}/Pack-de-marca.zip`))).toBe(true);
  });

  it('prevents the rejected EX reconstruction from returning to active public metadata', () => {
    for (const page of publicPages) {
      const code = read(page);
      expect(code, page).not.toContain('/branding/expert-2026/');
      expect(code, page).not.toContain('/branding/expert%20servicios.png');
      expect(code, page).not.toContain('/branding/expert-app.png');
    }
  });

  it('keeps obsolete generation and SVG download tools retired', () => {
    expect(existsSync(absolute('components/site/BrandDownload.tsx'))).toBe(false);
    expect(existsSync(absolute('scripts/generate-brand-images.mjs'))).toBe(false);
    expect(existsSync(absolute('scripts/import-branding-assets.ps1'))).toBe(false);
  });
});
