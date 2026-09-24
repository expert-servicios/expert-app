import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { AlertCircle, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { getPublicServicePath } from '@/lib/i18n/service-routes';
import { verifyCompletedServiceCheckout } from '@/lib/payments/verify-service-checkout';

const NATIONALITY_SLUG = 'nacionalidad-espanola-menor-nacido-en-espana';
const CERTIFICATE_SERVICE_SLUGS = new Set([
  'certificado-digital-persona-fisica',
  'certificado-digital-entidad',
  'pack-certificados-digitales',
]);

export const metadata: Metadata = {
  title: 'Оплата подтверждена | EXPERT',
  robots: { index: false, follow: false },
};

function UnverifiedPayment() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A]">
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="mt-4 font-serif text-3xl font-bold">Проверяем оплату</h1>
        <p className="mt-3 text-sm leading-7 text-[#23364D]">
          Не удалось подтвердить связанную с Вашим аккаунтом сессию Stripe на этой странице. Не оплачивайте заказ повторно.
          Откройте Ваши expediente или войдите в аккаунт заново: после подтверждения оплаты заказ появится автоматически.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard/expedientes" className="bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A]">Мои expediente</Link>
          <Link href="/auth/login?next=/dashboard/expedientes" className="border border-[#D4A017] px-5 py-3 text-sm font-bold text-[#9a6a17]">Войти</Link>
        </div>
      </div>
    </main>
  );
}

function CertificateSuccess({ service }: { service: string }) {
  const isBundle = service === 'pack-certificados-digitales';
  const servicePath = getPublicServicePath(
    { slug: service, category: 'certificado-digital' },
    'ru',
  );

  return (
    <main className="min-h-screen bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#D4A017]/25 bg-white p-8 shadow-sm md:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Оплата подтверждена</p>
        <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
          {isBundle ? 'Заказ на два сертификата принят.' : 'Заказ на сертификат принят.'}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#23364D]">
          Оформление выполняется полностью онлайн, без личного визита. EXPERT проводит удалённую
          идентификацию и валидацию в рамках процесса Camerfirma.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
            <FileText className="h-5 w-5 text-[#D4A017]" />
            <p className="mt-3 text-sm font-semibold">1. Документы</p>
            <p className="mt-1 text-xs leading-5 text-[#23364D]/70">
              Проверьте личный кабинет и загрузите недостающие личные и, при необходимости, корпоративные документы.
            </p>
          </div>
          <div className="border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
            <ShieldCheck className="h-5 w-5 text-[#D4A017]" />
            <p className="mt-3 text-sm font-semibold">2. Онлайн-валидация</p>
            <p className="mt-1 text-xs leading-5 text-[#23364D]/70">
              EXPERT подтверждает личность, документы и полномочия представителя без посещения офиса.
            </p>
          </div>
          <div className="border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
            <CheckCircle2 className="h-5 w-5 text-[#D4A017]" />
            <p className="mt-3 text-sm font-semibold">3. Максимум 24 рабочих часа</p>
            <p className="mt-1 text-xs leading-5 text-[#23364D]/70">
              Срок начинается после получения полного комплекта документов и завершения всех проверок.
            </p>
          </div>
        </div>

        {isBundle && (
          <p className="mt-6 rounded-xl border border-[#D4A017]/25 bg-[#F8F6F1] px-4 py-3 text-xs leading-5 text-[#23364D]">
            Пакет оформляется одним заказом, но EXPERT ведёт два отдельных операционных результата:
            личный сертификат и сертификат выбранного юридического лица.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Перейти в личный кабинет
          </Link>
          <Link
            href={servicePath}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#D4A017]/10"
          >
            <FileText className="h-4 w-4" /> Вернуться к услуге
          </Link>
        </div>
      </div>
    </main>
  );
}

function NationalitySuccess() {
  const servicePath = getPublicServicePath(
    { slug: NATIONALITY_SLUG, category: 'extranjeria-nacionalidad' },
    'ru',
  );

  return (
    <main className="min-h-screen bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A]">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#D4A017]/25 bg-white p-8 shadow-sm md:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Оплата завершена</p>
        <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Спасибо! Оплата подтверждена.</h1>
        <p className="mt-4 text-sm leading-7 text-[#23364D]">
          Мы получили оплату услуги. Профессиональное вознаграждение и государственная пошлина 790-026 учитываются раздельно: пошлина 104,05 € является suplido и не входит в базу профессиональных услуг.
        </p>

        <div className="mt-6 grid gap-3 rounded-xl border border-[#D4A017]/20 bg-[#F8F6F1] p-5 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-[#23364D]/60">Услуги с IVA</p><p className="mt-1 font-bold">302,50 €</p></div>
          <div><p className="text-xs text-[#23364D]/60">Пошлина как suplido</p><p className="mt-1 font-bold">104,05 €</p></div>
          <div><p className="text-xs text-[#23364D]/60">Итого</p><p className="mt-1 font-bold">406,55 €</p></div>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="font-serif text-xl font-bold">Что дальше</h2>
          <p className="text-sm leading-7 text-[#23364D]">
            Откройте expediente в личном кабинете и проверьте checklist. Не загружайте повторно документы, которые уже есть у EXPERT.
            Сначала мы проверим представительство, собственную легальную резиденцию ребёнка и фамилии для будущей записи в Registro Civil.
            Только после этого подготовим окончательную форму для подписи, проведём финальную проверку, проверим наличие оплаты 790-026 и подадим заявление.
          </p>
          <p className="rounded-xl border border-[#D4A017]/25 bg-[#F8F6F1] px-4 py-3 text-xs leading-6 text-[#23364D]">
            Пошлина уже включена в заказ как suplido. Не оплачивайте её повторно самостоятельно, если EXPERT прямо этого не попросит.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/expedientes"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Открыть мои expediente
          </Link>
          <Link
            href={servicePath}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#D4A017]/10"
          >
            <FileText className="h-4 w-4" /> Вернуться к услуге
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function RuPaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; session_id?: string }>;
}) {
  const { service, session_id: sessionId } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <UnverifiedPayment />;

  const verification = await verifyCompletedServiceCheckout({
    sessionId,
    userId: user.id,
    expectedService: service ?? null,
  });
  if (!verification.ok || verification.locale !== 'ru') return <UnverifiedPayment />;

  if (service && CERTIFICATE_SERVICE_SLUGS.has(service)) {
    return <CertificateSuccess service={service} />;
  }

  return <NationalitySuccess />;
}
