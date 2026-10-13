import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Briefcase, FileCheck, Globe2, ShieldCheck, Star } from 'lucide-react';

const heroBackgroundImage = '/hero/home-hero-background.png';

const trustItems: Array<{ title: string; text: string; Icon: LucideIcon }> = [
  { title: '+20 años', text: 'experiencia fiscal y legal', Icon: Star },
  { title: 'AEAT', text: 'colaboradora social', Icon: ShieldCheck },
  { title: 'Red PAE', text: 'apoyo a empresas', Icon: Briefcase },
  { title: 'Camerfirma', text: 'certificados digitales', Icon: FileCheck },
  { title: 'Expatriados', text: 'residencia y fiscalidad', Icon: Globe2 }
];

export function Hero({ locale = 'es' }: { locale?: 'es' | 'ru' }) {
  const ru = locale === 'ru';
  const items = ru ? [
    { ...trustItems[0], title: '+20 лет', text: 'опыта в налоговом и правовом сопровождении' },
    { ...trustItems[1], text: 'colaboradora social' },
    { ...trustItems[2], text: 'поддержка бизнеса' },
    { ...trustItems[3], text: 'электронные сертификаты' },
    { ...trustItems[4], text: 'residencia и налоги' },
  ] : trustItems;
  return (
    <section className="relative isolate overflow-hidden bg-[#0D1B2A] text-[#F8F6F1] lg:min-h-[760px]">
      <Image
        src={heroBackgroundImage}
        alt={ru ? "Налоговое и юридическое сопровождение" : "Asesoría fiscal y legal"}
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover object-[64%_center] lg:object-[58%_center]"
      />
      {/* Mobile: strong uniform overlay so text is always readable */}
      <div className="absolute inset-0 -z-20 bg-[#0D1B2A]/88 lg:hidden" />
      {/* Desktop: directional gradient revealing the image on the right */}
      <div className="absolute inset-0 -z-20 hidden bg-gradient-to-r from-[#0D1B2A]/94 via-[#0D1B2A]/62 to-[#0D1B2A]/8 lg:block" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0D1B2A]/75 via-transparent to-[#0D1B2A]/18" />

      <div className="mx-auto flex min-h-[650px] w-full max-w-7xl items-center px-6 py-20 lg:min-h-[650px] lg:px-20 lg:pb-32">
        <div className="max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#D4A017]">{ru ? "Налоги, право и умное управление" : "Fiscal, legal y gestión inteligente"}</p>

          <h1 className="font-serif text-[2.35rem] font-semibold leading-[1.05] text-[#F8F6F1] md:text-5xl xl:text-[3.65rem]">
            <span className="block">{ru ? "Умное сопровождение" : "Asesoría inteligente"}</span>
            <span className="block">{ru ? "для ответственных" : "para empresas"}</span>
            <span className="block text-[#D4A017]">{ru ? "компаний" : "responsables"}</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-[#F8F6F1]/88 md:text-xl">
            {ru ? "Чем активнее вы участвуете в управлении компанией, тем меньше платите. KIA отслеживает показатели, а наши специалисты помогают с налоговыми и юридическими вопросами." : "Cuanto más te impliques en la gestión de tu empresa, menos pagas. Kia vigila tus números todos los días y nuestro equipo fiscal y legal responde cuando de verdad importa."}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={ru ? "/ru/konsultatsiya" : "/cita?tipo=consulta-inicial"}
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              {ru ? 'Бесплатная консультация · 15 мин' : 'Consulta gratuita · 15 min'}
            </Link>
            <Link
              href={ru ? "/ru/plany" : "/planes"}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              {ru ? 'Как организована работа' : 'Ver cómo funcionan los planes'}
            </Link>
          </div>

          <p className="mt-6 text-sm text-[#F8F6F1]/70">{ru ? "Без поездок · Полное сопровождение · Понятный результат" : "Sin desplazamientos · Gestión completa · Resultados claros"}</p>

          <div className="mt-8 border-t border-[#D4A017]/20 pt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]/70">{ru ? "Вы работаете в asesoría или gestoría?" : "¿Eres asesoría o gestoría?"}</p>
            <Link
              href={ru ? "/para-asesorias" : "/para-asesorias"}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#F8F6F1]/70 transition hover:text-[#D4A017]"
            >
              {ru ? "Платформа для asesorías" : "Descubre la plataforma para asesorías"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-y border-[#D4A017]/25 bg-[#0D1B2A]/90 backdrop-blur-md lg:absolute lg:inset-x-0 lg:bottom-0">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[#D4A017]/18 px-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5 lg:px-20">
          {items.map(({ Icon, title, text }) => (
            <div key={title} className="flex min-h-24 items-center gap-4 py-4 sm:px-5">
              <Icon className="h-9 w-9 shrink-0 stroke-[#D4A017]" strokeWidth={1.6} />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#F8F6F1]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[#9CA3AF]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
