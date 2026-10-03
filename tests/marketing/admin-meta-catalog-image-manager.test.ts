import { describe, expect, it } from 'vitest';
import {
  META_CATALOG_IMAGE_MAX_BYTES,
  buildMetaCatalogImageStoragePath,
  validateMetaCatalogImageMetadata,
  validateMetaCatalogImageSignature,
} from '@/lib/security/uploads';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Admin Meta catalog image manager', () => {
  it('accepts only catalog-safe image formats within 5 MB', () => {
    expect(validateMetaCatalogImageMetadata('foto.jpg', 'image/jpeg', 1024).ok).toBe(true);
    expect(validateMetaCatalogImageMetadata('foto.png', 'image/png', 1024).ok).toBe(true);
    expect(validateMetaCatalogImageMetadata('foto.webp', 'image/webp', 1024).ok).toBe(true);
    expect(validateMetaCatalogImageMetadata('foto.svg', 'image/svg+xml', 1024).ok).toBe(false);
    expect(validateMetaCatalogImageMetadata('foto.jpg', 'application/pdf', 1024).ok).toBe(false);
    expect(validateMetaCatalogImageMetadata('foto.jpg', 'image/jpeg', META_CATALOG_IMAGE_MAX_BYTES + 1).ok).toBe(false);
  });

  it('checks binary signatures instead of trusting MIME alone', () => {
    expect(validateMetaCatalogImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg')).toBe(true);
    expect(validateMetaCatalogImageSignature(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), 'image/jpeg')).toBe(false);
    expect(validateMetaCatalogImageSignature(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), 'image/png')).toBe(true);
    expect(validateMetaCatalogImageSignature(new TextEncoder().encode('RIFF0000WEBP'), 'image/webp')).toBe(true);
  });

  it('isolates assets by service and locale', () => {
    const path = buildMetaCatalogImageStoragePath(
      'certificado-digital-persona-fisica',
      'ru',
      'creativa.webp',
    );

    expect(path).toMatch(/^meta-catalog\/certificado-digital-persona-fisica\/ru\//);
    expect(path.endsWith('-creativa.webp')).toBe(true);
  });

  it('uploads only through the admin route and public catalog folder', () => {
    const route = read('app/api/admin/meta/catalog/[retailerId]/image/route.ts');

    expect(route).toContain("const PUBLIC_BUCKET = 'user-files'");
    expect(route).toContain('requireAdmin');
    expect(route).toContain('validateMetaCatalogImageSignature');
    expect(route).toContain('buildMetaCatalogImageStoragePath');
    expect(route).toContain("upsert: false");
  });

  it('keeps shared images until no service content row references them', () => {
    const route = read('app/api/admin/meta/catalog/[retailerId]/content/route.ts');

    expect(route).toContain('remainingReferences');
    expect(route).toContain(".eq('image_url', previousImageUrl)");
    expect(route).toContain("storage.from(META_ASSET_BUCKET).remove");
  });

  it('supports drag-drop, replacement and ES image reuse for RU', () => {
    const editor = read('components/admin/MetaCatalogContentEditor.tsx');

    expect(editor).toContain('onDrop=');
    expect(editor).toContain('Sustituir imagen');
    expect(editor).toContain('Usar imagen ES');
    expect(editor).toContain('500 × 500');
    expect(editor).toContain('createImageBitmap');
  });
});
