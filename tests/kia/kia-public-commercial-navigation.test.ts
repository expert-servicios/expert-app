import { describe, expect, it } from 'vitest';
import {
  findSelectedCategory,
  findSelectedService,
  findServicesMentioned,
  getPublicCategoryQuickReplies,
  getServiceQuickRepliesForCategory,
  getServiceSelectionQuickReplies,
  isCommercialMessage,
} from '@/lib/ai/kia/kia-public-commercial-nav';
import { categories, getCatalogService } from '@/lib/utils/catalog';

describe('KIA public guided commercial navigation', () => {
  it('uses the canonical public categories from the website catalog', () => {
    const replies = getPublicCategoryQuickReplies();
    const categoryLabels = replies
      .filter((reply) => reply.kind === 'category')
      .map((reply) => reply.label);

    expect(categoryLabels).toEqual(categories.map((category) => category.name));
    expect(replies.some((reply) => reply.label === 'Pedir reunión informativa')).toBe(true);
  });

  it('resolves category button messages without AI', () => {
    const category = findSelectedCategory('Quiero ver servicios de Fiscalidad');
    expect(category?.slug).toBe('declaraciones-impuestos');

    const replies = getServiceQuickRepliesForCategory('declaraciones-impuestos');
    expect(replies.some((reply) => reply.label === 'Declaración de la Renta (IRPF)')).toBe(true);
    expect(replies.some((reply) => reply.label === 'Mi caso es distinto')).toBe(true);
  });

  it('resolves a concrete service and exposes a detail action', () => {
    const service = findSelectedService('IRNR — No Residentes');
    expect(service?.slug).toBe('no-residentes');

    const replies = getServiceSelectionQuickReplies(service!);
    expect(replies[0]).toMatchObject({
      label: 'Ver detalles y precio',
      action: 'link',
      href: '/servicios/declaraciones-impuestos/no-residentes',
    });
  });

  it('converts services explicitly mentioned by KIA into buttons', () => {
    const mentioned = findServicesMentioned(
      'Podemos ayudarte con IRNR — No Residentes o con Certificado Digital de Persona Física — Camerfirma.',
    );
    expect(mentioned.map((service) => service.slug)).toContain('no-residentes');
    expect(mentioned.map((service) => service.slug)).toContain('certificado-digital-persona-fisica');
  });

  it('recognizes broad commercial requests but leaves specific explanations available', () => {
    expect(isCommercialMessage('¿Qué servicios ofrecéis para empresas?')).toBe(true);
    expect(isCommercialMessage('Necesito presupuesto para una gestión')).toBe(true);
    expect(getCatalogService('irpf')).toBeTruthy();
  });
});
