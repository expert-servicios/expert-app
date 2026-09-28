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
  const servicePage = source('app/(public)/servicios/[categoria]/[servicio]/page.tsx');
  const addToCart = source('components/services/AddToCartButton.tsx');
  const cartContext = source('contexts/CartContext.tsx');
  const quickProfileGate = source('components/cart/QuickProfileGate.tsx');
  const cartSidebar = source('components/cart/CartSidebar.tsx');
  const cartPage = source('app/(public)/carrito/page.tsx');
  const serviceCheckout = source('app/api/services/checkout/route.ts');
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

  it('calculates IRNR pricing by property-holder unit without changing price for rentals', () => {
    expect(calc).toContain('80 + Math.max(0, declarativeUnits - 1) * 30');
    expect(calc).toContain('Titulares no residentes');
    expect(calc).toContain('El uso del inmueble no cambia esta estimación');
    expect(calc).not.toContain('Está alquilado');
    expect(calc).toContain("intent: 'irnr_quote'");
    expect(calc).not.toContain('titulares por inmueble:');
    expect(calc).toContain('`Inmuebles: ${properties.length}`');
    expect(calc).toContain('`ejercicios: ${taxYears}`');
    expect(calc).toContain('`unidades declarativas por ejercicio: ${declarativeUnits}`');
  });

  it('captures free questions as demand leads', () => {
    expect(consultation).toContain("fetch('/api/consultas-gratuitas'");
    expect(consultationApi).toContain("category: 'Consulta gratuita'");
    expect(consultationApi).toContain("intent: 'free_question'");
    expect(consultationApi).toContain("title: 'Nueva consulta gratuita'");
    expect(consultationApi).toContain("last_acquisition: interaction");
    expect(consultationApi).toContain(".eq('email', normalizedEmail)");
    expect(consultationApi).not.toContain('escapeIlikeLiteral');
    expect(consultationApi).toContain('contact: {');
    expect(consultationApi).toContain('email: normalizedEmail');
    expect(consultationApi).toContain('phone: normalizedPhone');
    expect(consultationApi).toContain("service: parsed.data.service || 'consulta-general'");
    expect(consultationApi).not.toContain("acquisition: {\n              ...(typeof attribution.metadata?.acquisition");
    expect(consultationApi).toContain("url: `/admin/leads?focus=${leadId}`");
    expect(adminLeadsApi).toContain("message,country,state");
    expect(adminLeadsApi).toContain("latest_interaction: latestInteractionFromMetadata");
    expect(adminLeadsApi).toContain("query = query.eq('id', focus)");
    expect(adminLeadsPage).toContain('Ver consulta completa');
    expect(adminLeadsPage).toContain('Última interacción');
    expect(adminLeadsPage).toContain('Email enviado:');
    expect(adminLeadsPage).toContain('Teléfono enviado:');
  });

  it('preserves content origin when an article reader requests a quote', () => {
    expect(quoteForm).toContain('origin: originFromUrl ?? undefined');
    expect(quoteForm).toContain("{ id: 'modelo-151', name: 'Modelo 151 / Ley Beckham'");
    expect(quoteForm).toContain("modelo151: 'modelo-151'");
    expect(quoteApi).toContain("action: 'quote_request'");
    expect(quoteApi).toContain('origin: contentOrigin');
    expect(quoteApi).toContain('requested_services: serviceSlugs');
    expect(quoteApi).not.toContain("intent: 'quote_request'");
  });
  it('preserves blog/docs origin through a direct service purchase and admin payment notice', () => {
    expect(cta).toContain('?origen=${encodeURIComponent(origin)}');
    expect(servicePage).toContain('resolvedSearchParams.origen');
    expect(servicePage).toContain('contentOrigin: serviceOrigin');
    expect(addToCart).toContain('contentOrigin: item.contentOrigin?.trim()');
    expect(cartContext).toContain('collectCartContentOrigins');
    expect(cartContext).toContain('contentOrigins');
    expect(quickProfileGate).toContain('contentOrigins?: string[]');
    expect(quickProfileGate).toContain('...(contentOrigins.length > 0 ? { contentOrigins } : {})');
    expect(cartSidebar).toContain('contentOrigins={contentOrigins}');
    expect(cartPage).toContain('contentOrigins={contentOrigins}');
    expect(serviceCheckout).toContain('contentOrigins             : z.array');
    expect(serviceCheckout).toContain('content_origins: contentOrigins');
    expect(stripeWebhook).toContain('checkoutContentOriginLabel');
    expect(stripeWebhook).toContain('servicePaymentConfirmedAdmin(customerName, customerEmail, amountEur, serviceName, contentOriginLabel)');
    expect(stripeWebhook).toContain('contentOriginLabel ?');
  });

  it('preserves content origin through a completed 15-minute booking', () => {
    expect(bookingPage).toContain('origin={origin}');
    expect(bookingForm).toContain('origin: origin ?? undefined');
    expect(bookingApi).toContain('Origen CTA/contenido:');
    expect(bookingApi).toContain('content_origin: contentOrigin');
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
    expect(stripeWebhook).toContain('leadRequestedServices');
    expect(stripeWebhook).toContain('leadServiceSlugs');
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
    expect(questionnaire).toContain('taxYears: string[]');
    expect(questionnaire).toContain('Añadir ejercicio');
    expect(questionnaire).toContain('rentalPeriods');
    expect(questionnaire).toContain('soldDuringYear');
    expect(questionnaire).toContain('saleDate');
    expect(questionnaire).toContain('El inmueble se vendió durante este ejercicio');
    expect(questionnaire).not.toContain('<option value="sold">');
    expect(questionnaire).toContain('Importe bruto cobrado');
    expect(questionnaire).toContain('Booking.com, Airbnb');
    expect(questionnaire).toContain('Subir archivo');
    expect(questionnaire).toContain('legacyResidenceCountry');
    expect(questionnaire).toContain('legacyTaxId');
    expect(questionnaire).toContain('revisionAtStart');
    expect(questionnaire).toContain('revisionRef.current === revisionAtStart');
    expect(documentNotesApi).toContain("comment: z.string().max(20000)");
    expect(documentsApi).toContain("'no-residentes'");
    expect(documentsApi).toContain(".split(',')");
    expect(documentsApi).toContain('personalDocumentScope');
    expect(documentsApi).toContain('const explicitCompanyId = caseData.company_id ?? null');
    expect(documentsApi).toContain('const companyId = explicitCompanyId');
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
    expect(adminCasePage).toContain('irnrIntake.taxYears.join');
    expect(adminCasePage).toContain('Periodos de alquiler e ingresos');
    expect(adminCasePage).toContain('property.soldDuringYear');
    expect(adminCasePage).toContain('property.saleDate');
    expect(adminCasePage).toContain('period.grossIncome');
  });
});
