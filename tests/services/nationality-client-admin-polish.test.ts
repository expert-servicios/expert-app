import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('nationality client/admin polish', () => {
  it('binds catalog success pages to the authenticated paid Stripe session', () => {
    const checkout = read('app/api/services/checkout/route.ts');
    const verification = read('lib/payments/verify-service-checkout.ts');
    const esSuccess = read('app/(public)/gracias/pago/page.tsx');
    const ruSuccess = read('app/(localized)/ru/spasibo/oplata/page.tsx');

    expect(checkout).toContain('session_id={CHECKOUT_SESSION_ID}');
    expect(verification).toContain("session.client_reference_id !== input.userId");
    expect(verification).toContain("session.status !== 'complete'");
    expect(verification).toContain("session.payment_status !== 'paid'");
    expect(esSuccess).toContain('verifyCompletedServiceCheckout');
    expect(ruSuccess).toContain('verifyCompletedServiceCheckout');
    expect(esSuccess).toContain('No repitas el pago');
    expect(ruSuccess).toContain('Не оплачивайте заказ повторно');
  });

  it('routes nationality documents through the case instead of WhatsApp after payment', () => {
    const esSuccess = read('app/(public)/gracias/pago/page.tsx');
    const ruSuccess = read('app/(localized)/ru/spasibo/oplata/page.tsx');

    expect(esSuccess).toContain('Tu expediente se prepara desde el área privada');
    expect(esSuccess).toContain('href="/dashboard/expedientes"');
    expect(ruSuccess).toContain('href="/dashboard/expedientes"');
    expect(ruSuccess).not.toContain('Отправить документы в WhatsApp');
    expect(ruSuccess).toContain('Не загружайте повторно документы, которые уже есть у EXPERT');
  });

  it('preserves Russian locale from checkout through case and cart', () => {
    const webhook = read('app/api/stripe/webhook/route.ts');
    const fulfillment = read('lib/payments/service-order-fulfillment.ts');
    const cases = read('app/api/cases/route.ts');
    const casePage = read('app/(protected)/dashboard/expedientes/[id]/page.tsx');
    const cart = read('app/(public)/carrito/page.tsx');

    expect(webhook).toContain("checkoutLocale: session.metadata?.checkout_locale === 'ru' ? 'ru' : 'es'");
    expect(fulfillment).toContain("checkout_locale: input.checkoutLocale ?? 'es'");
    expect(cases).toContain("checklist.checkout_locale === 'ru'");
    expect(casePage).toContain("if (caseItem.locale === 'ru' || caseItem.locale === 'es')");
    expect(cart).toContain("searchParams.get('lang') === 'ru'");
    expect(cart).toContain("const cartPath = locale === 'ru' ? '/carrito?lang=ru' : '/carrito'");
    expect(cart).toContain('loginNextPath={cartPath}');
    expect(cart).toContain('locale={locale}');
  });

  it('exposes only the next unblocked client action, not internal workflow metadata', () => {
    const cases = read('app/api/cases/route.ts');
    const casePage = read('app/(protected)/dashboard/expedientes/[id]/page.tsx');
    const blueprint = read('lib/services/service-operational-blueprints.ts');

    expect(blueprint).toContain('clientActionRequired?: boolean');
    expect(blueprint).toContain('Confirmar con ambos progenitores');
    expect(blueprint).toContain('Подтвердить с обоими родителями');
    expect(cases).toContain("task.metadata.client_action_required === true");
    expect(cases).toContain('client_action: typeof clientAction ===');
    expect(cases).toContain("delete (safeCase as { checklist_json?: unknown }).checklist_json");
    expect(casePage).toContain('caseItem.client_action');
    expect(casePage).toContain('Necesitamos una acción por tu parte');
    expect(casePage).toContain('Нужно Ваше действие');
  });

  it('makes document review idempotent and treats later uploads as additional documents', () => {
    const route = read('app/api/cases/[id]/document-review/route.ts');
    const checklist = read('components/cases/CaseDocumentChecklist.tsx');

    expect(route).toContain('canonicalReviewTask.due_date ??');
    expect(route).toContain('Revisar documentación adicional — Nacionalidad menor');
    expect(route).toContain('No reiniciar ni retroceder el workflow principal');
    expect(route).toContain('const shouldMoveToReview');
    expect(checklist).toContain('No vuelvas a subir documentos que EXPERT ya tenga');
    expect(checklist).toContain("reviewMode?: 'initial' | 'additional' | 'closed'");
    expect(checklist).toContain('Avisar de documentos adicionales');
  });

  it('supports explicit not-applicable resolution only for skippable workflow tasks', () => {
    const blueprint = read('lib/services/service-operational-blueprints.ts');
    const fulfillment = read('lib/payments/service-order-fulfillment.ts');
    const api = read('app/api/admin/tasks/route.ts');
    const page = read('app/(protected)/admin/tareas/page.tsx');

    expect(blueprint).toContain('skipAllowed?: boolean');
    expect(blueprint).toContain('skipAllowed: true');
    expect(fulfillment).toContain('skip_allowed: Boolean(task.skipAllowed)');
    expect(api).toContain("metadata.skip_allowed !== true");
    expect(api).toContain('WORKFLOW_SKIP_REASON_REQUIRED');
    expect(api).toContain('skipped_reason: parsed.data.skipReason');
    expect(api).toContain("metadata.skipped_as_not_applicable === true");
    expect(api).toContain('isSatisfiedTask');
    expect(page).toContain('window.prompt');
    expect(page).toContain('No aplica');
  });

  it('gives Admin a focused per-case workflow with readable dependencies and references', () => {
    const api = read('app/api/admin/tasks/route.ts');
    const tasks = read('app/(protected)/admin/tareas/page.tsx');
    const casePage = read('app/(protected)/admin/expedientes/[id]/page.tsx');

    expect(api).toContain("const caseId = searchParams.get('caseId')");
    expect(api).toContain('blocked_by_titles: blockedByTitles');
    expect(tasks).toContain("const caseId = searchParams.get('caseId')");
    expect(tasks).toContain('blocked_by_titles');
    expect(tasks).toContain('reference_urls');
    expect(tasks).toContain('/admin/expedientes/');
    expect(casePage).toContain('/admin/tareas?caseId=');
    expect(casePage).toContain("c.category !== 'extranjeria-nacionalidad'");
  });
});
