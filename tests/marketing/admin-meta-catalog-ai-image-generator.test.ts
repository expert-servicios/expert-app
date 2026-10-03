import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  EXPERT_CATALOG_IMAGE_DEFAULT_MODEL,
  EXPERT_CATALOG_IMAGE_SIZE,
  buildExpertCatalogArtworkPrompt,
  getExpertCatalogImagePreset,
} from '@/lib/marketing/expert-catalog-image-ai';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Admin AI catalog image generator', () => {
  it('uses the premium square model and reserves deterministic overlay space', () => {
    expect(EXPERT_CATALOG_IMAGE_DEFAULT_MODEL).toBe('gpt-image-2.5-sunburst');
    expect(EXPERT_CATALOG_IMAGE_SIZE).toBe(1024);

    const prompt = buildExpertCatalogArtworkPrompt({
      categoryKey: 'certificado-digital',
      locale: 'es',
      serviceName: 'Certificado digital para persona física',
      shortDescription: 'Identificación y firma electrónica con acompañamiento profesional.',
    });

    expect(prompt).toContain('square 1:1');
    expect(prompt).toContain('DO NOT render any words');
    expect(prompt).toContain('clean cream negative space on the LEFT half');
    expect(prompt).toContain('BOTTOM for three feature cards');
    expect(prompt).toContain('3D still-life composition on the RIGHT half');
    expect(prompt).toContain('USB security token');
  });

  it('keeps ES and RU brand copy deterministic outside the image model', () => {
    const es = getExpertCatalogImagePreset('notaria-propiedades', 'es');
    const ru = getExpertCatalogImagePreset('empresas-autonomos', 'ru');

    expect(es.categoryLabel).toBe('Notaría y Propiedades');
    expect(es.features).toEqual([
      'Documentación revisada',
      'Trámites online',
      'Soporte profesional',
    ]);
    expect(ru.categoryLabel).toBe('Бизнес и самозанятые');
    expect(ru.categoryLabel).not.toContain('autónomos');
  });

  it('keeps the image generation route admin-gated, budget-gated and explicit', () => {
    const route = read('app/api/admin/meta/catalog/[retailerId]/image/generate/route.ts');

    expect(route).toContain('requireAdmin');
    expect(route).toContain('getKiaAiBudgetGuard');
    expect(route).toContain("blockedProviders.includes('openai')");
    expect(route).toContain('https://api.openai.com/v1/images/generations');
    expect(route).toContain("size: '1024x1024'");
    expect(route).toContain("output_format: 'png'");
    expect(route).toContain('ImageResponse');
    expect(route).toContain('expertconsulting.es/branding/expert-logo.png');
    expect(route).toContain("const PUBLIC_BUCKET = 'user-files'");
    expect(route).toContain('buildMetaCatalogImageStoragePath');
    expect(route).toContain('recordKiaProviderUsage');
    expect(route).toContain("taskType: 'catalog_image_generation'");
  });

  it('creates a preview asset but never auto-writes service_contents', () => {
    const route = read('app/api/admin/meta/catalog/[retailerId]/image/generate/route.ts');
    const editor = read('components/admin/MetaCatalogContentEditor.tsx');

    expect(route).not.toContain(".from('service_contents')");
    expect(editor).toContain('/image/generate');
    expect(editor).toContain('Generador IA EXPERT');
    expect(editor).toContain('Generar con IA');
    expect(editor).toContain('Regenerar con IA');
    expect(editor).toContain('customBrief');
    expect(editor).toContain('Revísala y pulsa Guardar si quieres usarla');
  });

  it('keeps the previous deterministic script as an API-free fallback', () => {
    const script = read('scripts/generate-service-cards.ts');

    expect(script).toContain('LEGACY / OFFLINE FALLBACK');
    expect(script).toContain('do not use it as the primary creative flow');
    expect(script).not.toContain('api.openai.com');
  });

  it('accounts for current GPT Image models in AI budget telemetry', () => {
    const tracker = read('lib/ai/kia/kia-cost-tracker.ts');

    expect(tracker).toContain("'gpt-image-2.5-sunburst'");
    expect(tracker).toContain("'gpt-image-2.5-flare'");
    expect(tracker).toContain("'gpt-image-2'");
  });
});
