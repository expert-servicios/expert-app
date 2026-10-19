import { describe, expect, it } from 'vitest';
import { circeEditorialArticles } from '@/lib/content/circe-editorial-blog';
import { circeFaqs } from '@/lib/content/circe-autogestion';
import { getArticlesForService } from '@/lib/utils/blog';
import { getService } from '@/lib/utils/catalog';

describe('CIRCE: contenidos y ficha comercial', () => {
  it('conecta dos artículos nuevos a los dos servicios de constitución', () => {
    expect(circeEditorialArticles).toHaveLength(2);
    for (const slug of ['constitucion-sl', 'constitucion-sl-circe']) {
      const service = getService('empresas-autonomos', slug);
      expect(service?.faqs?.length).toBeGreaterThanOrEqual(10);
      const linked = getArticlesForService(slug).map(article => article.slug);
      for (const article of circeEditorialArticles) expect(linked).toContain(article.slug);
    }
  });
  it('responde sobre trámites integrados sin presentar la vía pagada como obligatoria', () => {
    expect(circeFaqs.some(f => f.answer.includes('No hay que duplicarlos'))).toBe(true);
    expect(getService('empresas-autonomos', 'constitucion-sl')?.faqs.some(f => f.a.includes('No. La guía'))).toBe(true);
  });
});