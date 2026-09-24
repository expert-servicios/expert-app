import { cookies } from 'next/headers';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { AlertCircle, Calendar, CheckCircle2, FileText, GraduationCap, ShieldCheck } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { computeProfileReadiness } from '@/lib/utils/profile-readiness';
import { getCalOnboardingUrl, getCalFormacionUrl } from '@/lib/utils/cal';
import { CalButton } from '@/components/site/CalButton';
import { PostPurchaseProfileStep } from '@/components/profile/PostPurchaseProfileStep';
import { EventTracker } from '@/components/site/EventTracker';
import { verifyCompletedServiceCheckout } from '@/lib/payments/verify-service-checkout';

const HOLDED_MIGRATION_SLUGS = ['holded-migracion-sin-inventario', 'holded-migracion-con-inventario'];
const NATIONALITY_MINOR_SLUG = 'nacionalidad-espanola-menor-nacido-en-espana';

const CERTIFICATE_SERVICE_SLUGS = [
  'certificado-digital-persona-fisica',
  'certificado-digital-entidad',
  'pack-certificados-digitales',
];

interface Props {
  searchParams: Promise<{ source?: string; service?: string; session_id?: string }>;
}

function ThankYou() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-serif text-4xl">¡Gracias!</h1>
      <p className="mt-3 text-brand-slate">Pago confirmado.</p>
    </main>
  );
}

function UnverifiedPayment() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
      <h1 className="mt-4 font-serif text-3xl">Estamos verificando el pago</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#23364D]">
        Esta pantalla no ha podido validar la sesión de Stripe vinculada a tu usuario. No repitas el pago.
        Revisa tus expedientes o vuelve a iniciar sesión; si el cargo se ha completado, el pedido aparecerá automáticamente.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/dashboard/expedientes" className="bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A]">Ver mis expedientes</Link>
        <Link href="/auth/login?next=/dashboard/expedientes" className="border border-[#D4A017] px-5 py-3 text-sm font-bold text-[#9a6a17]">Iniciar sesión</Link>
      </div>
    </main>
  );
}

function NationalitySuccessSection() {
  return (
    <section className="mx-auto mt-10 max-w-3xl border border-[#D4A017]/30 bg-[#F8F6F1] p-6 text-left md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Nacionalidad de menor · siguiente paso</p>
      <h2 className="mt-2 font-serif text-2xl font-bold text-[#0D1B2A]">Tu expediente se prepara desde el área privada</h2>
      <p className="mt-3 text-sm leading-6 text-[#23364D]">
        El pago del servicio está confirmado. La tasa 790-026 incluida en el pedido queda registrada como suplido:
        EXPERT comprobará antes de abonarla que el expediente esté validado y que no exista ya un justificante de pago.
        No debes pagarla de nuevo por tu cuenta salvo que el equipo te lo indique expresamente.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {[
          ['1. Documentación', 'Revisa el checklist del expediente. Aporta solo lo que falte; no vuelvas a subir documentos que EXPERT ya tenga.'],
          ['2. Representación, residencia y apellidos', 'Verificamos quién firma, la residencia legal propia del menor y los apellidos para la futura inscripción española antes de preparar el modelo.'],
          ['3. Modelo y firmas', 'Solo se firma la versión final que EXPERT haya validado expresamente. Una versión retirada no debe reutilizarse.'],
          ['4. Validación, tasa y presentación', 'Tras la revisión final, comprobamos la tasa y presentamos únicamente cuando el expediente esté listo y autorizado.'],
        ].map(([title, text]) => (
          <div key={title} className="border border-[#D4A017]/20 bg-white p-4">
            <p className="text-sm font-semibold text-[#0D1B2A]">{title}</p>
            <p className="mt-1 text-xs leading-5 text-[#23364D]/75">{text}</p>
          </div>
        ))}
      </div>
      <Link href="/dashboard/expedientes" className="mt-6 inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]">
        Abrir mis expedientes
      </Link>
    </section>
  );
}

function CertificateSuccessSection({ service }: { service: string }) {
  const isBundle = service === 'pack-certificados-digitales';
  const title = isBundle
    ? 'Pedido recibido: vamos a tramitar tus dos certificados'
    : 'Pedido recibido: empezamos la tramitación de tu certificado';

  return (
    <section className="mx-auto mt-10 max-w-3xl border border-[#D4A017]/30 bg-[#F8F6F1] p-6 text-left md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Siguiente paso</p>
      <h2 className="mt-2 font-serif text-2xl font-bold text-[#0D1B2A]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#23364D]">
        La tramitación se realiza 100 % online, sin presencia física. EXPERT revisará la documentación
        y realizará la identificación/validación necesaria dentro del proceso Camerfirma.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="border border-[#D4A017]/20 bg-white p-4">
          <FileText className="h-5 w-5 text-[#D4A017]" />
          <p className="mt-3 text-sm font-semibold text-[#0D1B2A]">1. Documentación</p>
          <p className="mt-1 text-xs leading-5 text-[#23364D]/70">
            Revisa tu expediente y aporta los documentos pendientes desde tu área privada.
          </p>
        </div>
        <div className="border border-[#D4A017]/20 bg-white p-4">
          <ShieldCheck className="h-5 w-5 text-[#D4A017]" />
          <p className="mt-3 text-sm font-semibold text-[#0D1B2A]">2. Validación online</p>
          <p className="mt-1 text-xs leading-5 text-[#23364D]/70">
            Confirmamos identidad, documentación y, cuando corresponda, facultades de representación.
          </p>
        </div>
        <div className="border border-[#D4A017]/20 bg-white p-4">
          <CheckCircle2 className="h-5 w-5 text-[#D4A017]" />
          <p className="mt-3 text-sm font-semibold text-[#0D1B2A]">3. Máximo 24 h laborables</p>
          <p className="mt-1 text-xs leading-5 text-[#23364D]/70">
            El plazo comienza cuando toda la documentación está completa y las validaciones han finalizado.
          </p>
        </div>
      </div>

      {isBundle && (
        <p className="mt-5 rounded-lg border border-[#D4A017]/25 bg-white px-4 py-3 text-xs leading-5 text-[#23364D]">
          El pack genera un único pedido y expediente, con dos tareas operativas separadas:
          certificado personal y certificado de entidad.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]"
        >
          Ir a mi área privada
        </a>
        <a
          href="https://wa.me/34669045528"
          className="inline-flex min-h-11 items-center justify-center border border-[#D4A017] px-5 py-2.5 text-sm font-semibold text-[#D4A017]"
        >
          Contactar por WhatsApp
        </a>
      </div>
    </section>
  );
}

function HoldedBookingSection() {
  const onboardingUrl = getCalOnboardingUrl();
  const formacionUrl = getCalFormacionUrl();
  if (!onboardingUrl && !formacionUrl) return null;

  return (
    <div className="mx-auto mt-10 max-w-3xl border border-[#D4A017]/25 bg-[#F8F6F1] p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Acompañamiento incluido</p>
      <h2 className="mt-2 font-serif text-xl font-bold text-[#0D1B2A]">Reserva tu onboarding y formación</h2>
      <p className="mt-2 text-sm leading-6 text-[#23364D]">
        Tu servicio incluye 1 hora de onboarding gratuita y 2 horas de formación especializada. Reserva ambas sesiones cuando te venga bien.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {onboardingUrl && (
          <div className="flex-1">
            <CalButton
              url={onboardingUrl}
              fallbackHref={onboardingUrl}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <Calendar className="h-4 w-4" />
              Reservar onboarding (1h)
            </CalButton>
            <p className="mt-1.5 text-center text-xs text-[#23364D]/60">60 min · Europe/Madrid</p>
          </div>
        )}
        {formacionUrl && (
          <div className="flex-1">
            <CalButton
              url={formacionUrl}
              fallbackHref={formacionUrl}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017]/10"
            >
              <GraduationCap className="h-4 w-4" />
              Reservar formación (2h)
            </CalButton>
            <p className="mt-1.5 text-center text-xs text-[#23364D]/60">120 min · Europe/Madrid</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function GraciasPagoPage({ searchParams }: Props) {
  const { source, service, session_id: sessionId } = await searchParams;
  const showHoldedBooking = Boolean(service && HOLDED_MIGRATION_SLUGS.includes(service));
  const showCertificateSuccess = Boolean(service && CERTIFICATE_SERVICE_SLUGS.includes(service));
  const showNationalitySuccess = service === NATIONALITY_MINOR_SLUG;
  const isServiceCheckout = source === 'service' || source === 'cart';
  const academySuccessTracker = source === 'academy'
    ? <EventTracker event="course_checkout_success" eventProps={{ program_slug: service }} />
    : null;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll : () => cookieStore.getAll(),
        setAll : () => {}
      }
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  if (isServiceCheckout && !user) {
    return <UnverifiedPayment />;
  }

  if (isServiceCheckout && user) {
    const verification = await verifyCompletedServiceCheckout({
      sessionId,
      userId: user.id,
      expectedService: service ?? null,
    });
    if (!verification.ok) return <UnverifiedPayment />;
  }

  if (!user) {
    return (
      <>
        {academySuccessTracker}
        <ThankYou />
        {showCertificateSuccess && service && <CertificateSuccessSection service={service} />}
        {showNationalitySuccess && <NationalitySuccessSection />}
      </>
    );
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('client_type,company,tax_id,address,city,postal_code,province,billing_country,habitual_address,habitual_city,habitual_postal_code,habitual_province,habitual_country,billing_ready,habitual_address_ready')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <>
        {academySuccessTracker}
        <ThankYou />
        {showHoldedBooking && <HoldedBookingSection />}
        {showCertificateSuccess && service && <CertificateSuccessSection service={service} />}
        {showNationalitySuccess && <NationalitySuccessSection />}
      </>
    );
  }

  const readiness = computeProfileReadiness(profile);

  if (readiness.billingReady && readiness.habitualAddressReady) {
    return (
      <>
        {academySuccessTracker}
        <ThankYou />
        {showHoldedBooking && <HoldedBookingSection />}
        {showCertificateSuccess && service && <CertificateSuccessSection service={service} />}
        {showNationalitySuccess && <NationalitySuccessSection />}
      </>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl">¡Gracias!</h1>
        <p className="mt-3 text-brand-slate">Pago confirmado.</p>
      </div>
      {academySuccessTracker}
      <PostPurchaseProfileStep profile={profile} missingBilling={!readiness.billingReady} />
      {showHoldedBooking && <HoldedBookingSection />}
      {showCertificateSuccess && service && <CertificateSuccessSection service={service} />}
      {showNationalitySuccess && <NationalitySuccessSection />}
    </main>
  );
}
