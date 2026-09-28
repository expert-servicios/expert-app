import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('article intent CTA and IRNR funnel', () => {
  const cta = source('components/content/ArticleIntentCTA.tsx');
  const calc = source('components/services/IrnrPriceCalculator.tsx');
  const docsPage = source('app/(public)/docs/[slug]/page.tsx');
  const blogPage = source('app/(public)/blog/[slug]/page.tsx');
  const consultation = source('components/site/FreeConsultationForm.tsx');
  const consultationApi = source('app/api/consultas-gratuitas/route.ts');
  const quoteForm = source('components/site/SolicitudPresupuestoForm.tsx');
  const quoteApi = source('app/api/quotes/route.ts');
  const bookingPage = source('app/(public)/cita/page.tsx');
  const bookingForm = source('components/booking/NativeBookingForm.tsx');
  const bookingApi = source('app/api/booking/route.ts');
  const blueprint = source('lib/services/service-operational-blueprints.ts');
  const casePage = source('app/(protected)/dashboard/expedientes/[id]/page.tsx');
  const questionnaire = source('components/cases/IrnrCaseQuestionnaire.tsx');
  const adminLeadsApi = source('app/api/admin/leads/route.ts');
  const adminLeadsPage = source('app/(protected)/admin/leads/page.tsx');
  const adminCaseApi = source('app/api/admin/cases/[id]/route.ts');
  const adminCasePage = source('app/(protected)/admin/expedientes/[id]/page.tsx');
  const documentNotesApi = source('app/api/cases/[id]/document-notes/route.ts');
  const documentsApi = source('app/api/cases/[id]/documents/route.ts');
  const stripeWebhook = source('app/api/stripe/webhook/route.ts');

  it('offers three clear intents below articles', () => {
    expect(cta).toContain('Tengo una consulta');
    expect(cta).toContain('Quiero este servicio');
    expect(cta).toContain('Reunión informativa · 15 min');
    expect(cta).toContain('/consulta-gratuita');
    expect(cta).toContain('/cita?tipo=consulta-inicial');
    expect(cta).toContain('https://t.me/kia_expert_bot');
  });

  it('keeps the SEO CTA bundle lean', () => {
    expect(cta).not.toContain("import { services } from '@/lib/utils/catalog'");
    expect(cta).toContain("dynamic(");
    expect(blogPage).toContain('hasCheckout: Boolean(primaryService.stripePriceId)');
    expect(docsPage).toContain('hasCheckout: Boolean(relatedServices[0].stripePriceId)');
  });

  it('removes WhatsApp from article CTAs', () => {
    expect(docsPage).not.toContain('wa.me');
    expect(blogPage).not.toContain('wa.me');
  });

  it('calculates IRNR pricing by property-holder unit', () => {
    expect(calc).toContain('80 + Math.max(0, standardUnits - 1) * 30');
    expect(calc).toContain('Titulares no residentes');
    expect(calc).toContain('Está alquilado');
    expect(calc).toContain('unidades estándar no alquiladas');
    expect(calc).toContain('unidades alquiladas pendientes de revisión');
    expect(calc).toContain("intent: 'irnr_quote'");
    expect(calc).toContain('holderDistribution');
  });

  it('captures free questions as demand leads', () => {
    expect(consultation).toContain("fetch('/api/consultas-gratuitas'");
    expect(consultationApi).toContain("category: 'Consulta gratuita'");
    expect(consultationApi).toContain("intent: 'free_question'");
    expect(consultationApi).toContain("title: 'Nueva consulta gratuita'");
    expect(consultationApi).toContain("last_acquisition: interaction");
    expect(consultationApi).toContain("service: parsed.data.service || 'consulta-general'");
    expect(consultationApi).not.toContain("acquisition: {\n              ...(typeof attribution.metadata?.acquisition");
    expect(consultationApi).toContain("url: `/admin/leads?focus=${leadId}`");
    expect(adminLeadsApi).toContain("message,country,state");
    expect(adminLeadsApi).toContain("latest_interaction: latestInteractionFromMetadata");
    expect(adminLeadsApi).toContain("query = query.eq('id', focus)");
    expect(adminLeadsPage).toContain('Ver consulta completa');
    expect(adminLeadsPage).toContain('Última interacción');
  });

  it('preserves content origin when an article reader requests a quote', () => {
    expect(quoteForm).toContain('origin: originFromUrl ?? undefined');
    expect(quoteApi).toContain("action: 'quote_request'");
    expect(quoteApi).toContain('origin: validated.origin || null');
    expect(quoteApi).toContain('requested_services: serviceSlugs');
    expect(quoteApi).not.toContain("intent: 'quote_request'");
  });

  it('preserves content origin through a completed 15-minute booking', () => {
    expect(bookingPage).toContain('origin={origin}');
    expect(bookingForm).toContain('origin: origin ?? undefined');
    expect(bookingApi).toContain('Origen CTA/contenido:');
    expect(bookingApi).toContain('content_origin: input.origin ?? null');
    expect(consultation).toContain('href={meetingHref}');
    expect(consultation).toContain("encodeURIComponent(origin)");
  });

  it('creates a post-contract IRNR workflow', () => {
    expect(blueprint).toContain("slug: 'no-residentes'");
    expect(blueprint).toContain("key: 'acquisition_date'");
    expect(blueprint).toContain("key: 'ownership'");
    expect(blueprint).toContain("key: 'ibi'");
    expect(blueprint).toContain("title: 'Presentar Modelo 210'");
  });

  it('preserves IRNR service identity through quote payment into specialized fulfillment', () => {
    expect(stripeWebhook).toContain('leadBlueprintSlugs');
    expect(stripeWebhook).toContain('getServiceOperationalBlueprint');
    expect(stripeWebhook).toContain('quoteServiceSlugs');
    expect(stripeWebhook).toContain('ensureServiceOrderFulfillment');
    expect(stripeWebhook).toContain('specializedQuoteCaseId');
    expect(stripeWebhook).toContain('.update({ quote_id: quoteId })');
  });

  it('shows a property questionnaire inside the IRNR case', () => {
    expect(casePage).toContain('IrnrCaseQuestionnaire');
    expect(casePage).toContain("service_id?.split(',').includes('no-residentes')");
    expect(questionnaire).toContain("itemKey: 'irnr-intake'");
    expect(questionnaire).toContain('Fecha de adquisición');
    expect(questionnaire).toContain('Porcentaje de titularidad');
    expect(questionnaire).toContain('holders: Holder[]');
    expect(questionnaire).toContain('addHolder');
    expect(questionnaire).toContain('removeHolder');
    expect(questionnaire).toContain('foreignTaxId');
    expect(questionnaire).toContain('legacyResidenceCountry');
    expect(questionnaire).toContain('legacyTaxId');
    expect(questionnaire).toContain('revisionAtStart');
    expect(questionnaire).toContain('revisionRef.current === revisionAtStart');
    expect(documentNotesApi).toContain("comment: z.string().max(20000)");
    expect(documentsApi).toContain("'no-residentes'");
    expect(documentsApi).toContain(".split(',')");
    expect(documentsApi).toContain('personalDocumentScope');
  });

  it('exposes the completed IRNR intake to the administrative case workflow', () => {
    expect(adminCaseApi).toContain("from('case_document_notes')");
    expect(adminCaseApi).toContain('documentNotes: notesResult.data ?? []');
    expect(adminCasePage).toContain("note.item_key === 'irnr-intake'");
    expect(adminCasePage).toContain('Cuestionario de inmuebles y titulares');
    expect(adminCasePage).toContain('Referencia catastral');
    expect(adminCasePage).toContain('Titulares no residentes');
    expect(adminCasePage).toContain('holder.foreignTaxId');
    expect(adminCasePage).toContain('holder.ownershipPercent');
  });
});
