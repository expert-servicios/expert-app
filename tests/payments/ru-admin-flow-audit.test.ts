import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Russian nationality admin flow audit', () => {
  it('fulfills catalog services only after a definitively paid Checkout session', () => {
    const webhook = read('app/api/stripe/webhook/route.ts');
    expect(webhook).toContain(
      "productType === 'service' || productType === 'cart') && session.payment_status === 'paid'",
    );
    expect(webhook).toContain("order_id: catalogOrderId ?? null");
    expect(webhook).toContain("case_id: catalogCaseId");
    expect(webhook).toContain("catalogCaseId ? `/admin/expedientes/${catalogCaseId}` : '/admin/pagos'");
  });

  it('expires persisted service Checkout sessions too', () => {
    const webhook = read('app/api/stripe/webhook/route.ts');
    const expiredBlock = webhook.slice(
      webhook.indexOf("if (event.type === 'checkout.session.expired')"),
      webhook.indexOf("if (event.type === 'checkout.session.async_payment_succeeded')"),
    );
    expect(expiredBlock).toContain("from('checkout_sessions')");
    expect(expiredBlock).toContain("status: 'expired'");
    expect(expiredBlock).not.toContain("session.mode === 'subscription'");
  });

  it('does not flag valid personal billing as missing fiscal entity', () => {
    const inbox = read('app/api/admin/operations-inbox/route.ts');
    expect(inbox).toContain("const PROFILE_BILLING_SCOPE = 'profile'");
    expect(inbox).toContain('isPersonalBillingMetadata');
    expect(inbox).toContain('isPersonalBillingOrder');
    expect(inbox).toContain('const entitylessCheckouts =');
    expect(inbox).toContain('const entitylessOrders =');
  });

  it('creates one high-priority post-payment task linked to the case', () => {
    const migration = read('supabase/migrations/20260918073212_nationality_post_payment_admin_followup.sql');
    expect(migration).toContain('internal_tasks_one_open_nationality_review_per_case');
    expect(migration).toContain('Revisar expediente de nacionalidad recién pagado');
    expect(migration).toContain("'alta'");
    expect(migration).toContain('current_date + 1');
    expect(migration).toContain("'nationality_post_payment_review'");
  });

  it('shows editable next action and follow-up date in the Admin case detail', () => {
    const route = read('app/api/admin/cases/[id]/route.ts');
    const page = read('app/(protected)/admin/expedientes/[id]/page.tsx');
    const editor = read('components/admin/CaseOperationsEditor.tsx');

    expect(route).toContain('priority,next_action,due_date,order_id');
    expect(page).toContain('CaseOperationsEditor');
    expect(editor).toContain('Siguiente acción');
    expect(editor).toContain('Fecha de control');
    expect(editor).toContain("fetch(`/api/admin/cases/${caseId}`");
  });

  it('links the Russian admin email to the automatically created case', () => {
    const template = read('lib/email/service-payment-ru.ts');
    const send = read('lib/email/send.ts');
    expect(template).toContain('ACCIÓN: revisar expediente de nacionalidad');
    expect(template).toContain('expediente ya creado automáticamente');
    expect(template).toContain("detail('Case ID', safeCase)");
    expect(template).toContain("'/admin/expedientes/'");
    expect(send).toContain("caseId: stringMetadata(input.metadata, 'case_id')");
    expect(send).toContain('supabase.auth.admin.getUserById(checkout.user_id)');
  });
});
