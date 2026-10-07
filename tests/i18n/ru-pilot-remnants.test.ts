import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('Russian pilot i18n remnants', () => {
  it('renders the root document language from a server request marker', () => {
    const proxy = source('proxy.ts');
    const layout = source('app/layout.tsx');
    const clientLanguage = source('components/i18n/DocumentLanguage.tsx');

    expect(proxy).toContain("pathname === '/ru' || pathname.startsWith('/ru/')");
    expect(proxy).toContain("requestHeaders.set('x-expert-locale', isRussianPublicPath ? 'ru' : 'es')");
    expect(proxy).toContain("'/ru'");
    expect(proxy).toContain("'/ru/:path*'");
    expect(layout).toContain("requestHeaders.get('x-expert-locale') === 'ru' ? 'ru' : 'es'");
    expect(layout).toContain('<html lang={documentLocale}');
    expect(layout).not.toContain('document-language');
    expect(clientLanguage).toContain("document.documentElement.lang = 'es'");
  });

  it('localizes Russian payment metadata and links the verified paid case directly', () => {
    const success = source('app/(localized)/ru/spasibo/oplata/page.tsx');
    const verification = source('lib/payments/verify-service-checkout.ts');

    expect(success).toContain("locale: 'ru_RU'");
    expect(success).toContain("description: 'Подтверждение оплаты услуги EXPERT");
    expect(success).toContain('caseId ? `/dashboard/expedientes/${caseId}`');
    expect(success).toContain('<NationalitySuccess caseId={verification.caseId} />');
    expect(verification).toContain('caseId: string | null');
    expect(verification).toContain(".from('orders')");
    expect(verification).toContain(".select('case_id')");
    expect(verification).toContain(".eq('stripe_payment_id', paymentId)");
  });

  it('uses the canonical profile preference for the protected case list', () => {
    const profile = source('app/api/profile/route.ts');
    const list = source('app/(protected)/dashboard/expedientes/page.tsx');
    const guidance = source('lib/ai/kia/kia-surface-guidance.ts');

    expect(profile).toContain('preferred_language');
    expect(list).toContain("profile?.preferred_language === 'ru' ? 'ru' : 'es'");
    expect(list).toContain("toLocaleDateString(isRu ? 'ru-RU' : 'es-ES')");
    expect(list).toContain("STATE_LABELS[c.state]?.[locale]");
    expect(guidance).toContain("locale: 'es' | 'ru' = 'es'");
    expect(guidance).toContain('Откройте expediente');
  });

  it('keeps protected case detail, messages, uploads and deliverables localized', () => {
    const detail = source('app/(protected)/dashboard/expedientes/[id]/page.tsx');
    const checklist = source('components/cases/CaseDocumentChecklist.tsx');
    const thread = source('components/cases/CaseMessageThread.tsx');
    const deliverable = source('components/cases/DeliverableRow.tsx');

    expect(detail).toContain('locale={locale}');
    expect(detail).toContain("locale === 'ru' ? 'Мои expediente'");
    expect(detail).toContain("locale === 'ru' ? 'Итоговые документы EXPERT'");
    expect(checklist).toContain("ru: {");
    expect(checklist).toContain('Документы по expediente');
    expect(thread).toContain("locale?: 'es' | 'ru'");
    expect(thread).toContain("isRu ? 'Сообщения' : 'Mensajes'");
    expect(deliverable).toContain("locale?: 'es' | 'ru'");
    expect(deliverable).toContain("isRu ? 'Скачать' : 'Descargar'");
  });
});
