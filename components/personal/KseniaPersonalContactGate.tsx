import { KseniaPersonalContactForm } from '@/components/personal/KseniaPersonalContactForm';

type Props = { context?: 'general' | 'mentorias'; locale?: 'es' | 'ru' };

/**
 * The standalone personal Vercel project must not display a submit action
 * when its reCAPTCHA and CRM backend secrets are absent. Existing EXPERT
 * production configuration is left unchanged.
 */
export function KseniaPersonalContactGate({ context = 'general', locale = 'es' }: Props) {
  const enabled = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() &&
    process.env.RECAPTCHA_SECRET_KEY?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );

  if (enabled) return <KseniaPersonalContactForm context={context} locale={locale} />;

  return (
    <div role="status" className="border border-[#CBB68F] bg-white px-5 py-6 text-[#182A32] md:p-8">
      <h3 className="font-serif text-2xl">
        {locale === 'ru' ? 'Свяжитесь со мной по электронной почте' : 'Contacta directamente por correo'}
      </h3>
      <p className="mt-4 max-w-xl text-sm leading-7 text-[#536167]">
        {locale === 'ru'
          ? 'Форма временно недоступна, пока завершается безопасное подключение. Вы можете отправить своё предложение напрямую по электронной почте.'
          : 'El formulario está pendiente de su conexión segura. Puedes enviarme tu propuesta directamente por correo electrónico.'}
      </p>
      <a
        href="mailto:soy@kseniailicheva.com"
        className="mt-6 inline-flex min-h-12 items-center justify-center bg-[#182A32] px-6 py-3 text-sm font-semibold text-white"
      >
        {locale === 'ru' ? 'Написать письмо' : 'Escribirme por correo'}
      </a>
    </div>
  );
}
