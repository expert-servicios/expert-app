import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getCatalogService } from '@/lib/utils/catalog';
import { getCompanionServices } from '@/lib/services/service-merchandising';

const read = (path: string) => readFileSync(path, 'utf8');

const PUBLIC_WHITE_LABEL_FILES = [
  'lib/utils/catalog.ts',
  'lib/utils/blog.ts',
  'lib/utils/docs.ts',
  'lib/marketing/catalog-launch-social.ts',
  'lib/marketing/july-2026.ts',
  'lib/ai/kia/prompts/kia-identification-flow.ts',
  'app/(public)/servicios/formacion/FormacionFaqs.tsx',
  'app/(public)/holded/migracion-laboral/page.tsx',
  'lib/data/academy-catalog.ts',
  'content/academy/gestion-laboral/course.es.md',
  'content/academy/gestion-laboral/knowledge/03-alta-y-contratacion.md',
  'content/academy/gestion-laboral/knowledge/06-variaciones.md',
  'content/academy/gestion-laboral/knowledge/10-mapa-herramientas.md',
  'content/academy/gestion-laboral/knowledge/14-delegared-netcontrata-contratos.md',
] as const;

const RU_CERTIFICATE_PAGES = [
  'app/(localized)/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa/page.tsx',
  'app/(localized)/ru/uslugi/cifrovoi-sertifikat-organizatsii/page.tsx',
  'app/(localized)/ru/uslugi/paket-cifrovyh-sertifikatov/page.tsx',
] as const;

describe('punctual service template', () => {
  it('keeps the white-label intermediary out of customer-facing copy', () => {
    for (const path of PUBLIC_WHITE_LABEL_FILES) {
      const source = read(path);
      expect(source, path).not.toContain('Creative Quality');
      expect(source, path).not.toContain('creative-quality.es');
    }
  });

  it('curates companion services without Holded or training products', () => {
    const service = getCatalogService('certificado-digital-persona-fisica');
    expect(service).toBeDefined();

    const companions = getCompanionServices(service!);
    expect(companions.map((item) => item.slug)).toEqual([
      'pack-certificados-digitales',
      'alta-autonomo',
      'nie-pasaporte',
    ]);
    expect(companions.every((item) => item.categoria !== 'holded' && item.categoria !== 'formacion')).toBe(true);
  });

  it('requires stars and keeps the review comment optional', () => {
    const page = read('app/(public)/gracias/opinion/page.tsx');
    const api = read('app/api/reviews/submit/route.ts');

    expect(page).toContain("if (rating === 0)");
    expect(page).toContain('Comentario');
    expect(page).toContain('(opcional)');
    expect(api).toContain('parsedRating < 1 || parsedRating > 5');
    expect(api).toContain('cleanedComment || null');
  });

  it('publishes only moderated reviews with explicit client consent', () => {
    const moderation = read('app/api/admin/resenas/[id]/route.ts');
    const publicReviews = read('lib/services/public-service-reviews.ts');

    expect(moderation).toContain("current.allow_publish === true");
    expect(moderation).toContain("update.published = false");
    expect(publicReviews).toContain(".eq('status', 'approved')");
    expect(publicReviews).toContain(".eq('published', true)");
    expect(publicReviews).toContain(".eq('allow_publish', true)");
  });

  it('adds ratings, sharing and curated companions to the generic punctual-service page', () => {
    const page = read('app/(public)/servicios/[categoria]/[servicio]/page.tsx');

    expect(page).toContain('ServiceRatingSummary');
    expect(page).toContain('ServiceShareActions');
    expect(page).toContain('getCompanionServices(service)');
    expect(page).toContain('Servicios complementarios');
  });

  it('keeps KIA moderation blind to rating and client identity', () => {
    const moderation = read('lib/ai/kia/kia-review-moderation.ts');

    expect(moderation).toContain(".select('id,comment,allow_publish,status')");
    expect(moderation).not.toContain("select('id,comment,rating");
    expect(moderation).not.toContain('client_id');
    expect(moderation).toContain('No protejas la reputación de EXPERT');
    expect(moderation).toContain('La opinión negativa');
  });

  it('keeps the rating publishable when only a comment is withheld', () => {
    const moderation = read('lib/ai/kia/kia-review-moderation.ts');
    const publicReviews = read('lib/services/public-service-reviews.ts');

    expect(moderation).toContain("moderationStatus = 'comment_not_publishable'");
    expect(moderation).toContain('published = review.allow_publish === true');
    expect(moderation).toContain('commentPublishable = false');
    expect(publicReviews).toContain('review.comment_publishable === true');
  });

  it('fails closed to human review when automatic moderation is uncertain', () => {
    const moderation = read('lib/ai/kia/kia-review-moderation.ts');

    expect(moderation).toContain("decision: 'hold_for_review'");
    expect(moderation).toContain("moderationStatus = 'hold_for_review'");
    expect(moderation).toContain("status = 'pending'");
  });

  it('publishes a transparent review policy and links it from consent', () => {
    const policy = read('app/(public)/politica-de-resenas/page.tsx');
    const form = read('app/(public)/gracias/opinion/page.tsx');

    expect(policy).toContain('Una valoración puede ser positiva, neutra o negativa');
    expect(policy).toContain('no recibe la puntuación en estrellas');
    expect(policy).toContain('no crea reseñas ficticias');
    expect(form).toContain('/politica-de-resenas');
    expect(form).toContain('publicar mi valoración de forma anónima');
  });

  it('does not offer routine rejection of a verified review from the admin card', () => {
    const card = read('components/admin/ReviewModerationCard.tsx');
    const api = read('app/api/admin/resenas/[id]/route.ts');

    expect(card).not.toContain('> Rechazar');
    expect(api).toContain('Una reseña verificada no se rechaza por su contenido');
    expect(card).toContain('Ocultar comentario');
  });

  it('uses localized social images and sharing on the three RU certificate pages', () => {
    for (const path of RU_CERTIFICATE_PAGES) {
      const page = read(path);
      expect(page, path).toContain('&lang=ru');
      expect(page, path).toContain('ServiceRatingSummary');
      expect(page, path).toContain('ServiceShareActions');
      expect(page, path).toContain('locale="ru"');
      expect(page, path).toContain('Сопутствующие услуги');
    }
  });
});
