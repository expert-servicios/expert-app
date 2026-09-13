import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { RU_PUBLIC_CONTENT } from '@/lib/i18n/ru-public-content';
import {
  getLocalizedPublicHref,
  type PublicRouteKey,
} from '@/lib/i18n/public-routes';

const NAV: Array<{ route: PublicRouteKey; label: string }> = [
  { route: 'home', label: 'Главная' },
  { route: 'services', label: 'Услуги' },
  { route: 'holded', label: 'Holded' },
  { route: 'plans', label: 'Форматы' },
  { route: 'academy', label: 'Academy' },
  { route: 'consultation', label: 'Консультация' },
];

export function RuPublicPage({
  routeKey,
  ruEnabled,
  enEnabled,
}: {
  routeKey: PublicRouteKey;
  ruEnabled: boolean;
  enEnabled: boolean;
}) {
  const content = RU_PUBLIC_CONTENT[routeKey];
  const primaryHref = routeKey === 'consultation'
    ? getLocalizedPublicHref('consultation', 'es')
    : getLocalizedPublicHref(content.primaryRoute, 'ru');
  const secondaryHref = content.secondaryRoute
    ? getLocalizedPublicHref(content.secondaryRoute, 'ru')
    : null;

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
      <header className="border-b border-white/10 bg-[#0D1B2A] text-[#F8F6F1]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/ru" className="font-serif text-2xl font-bold tracking-[0.14em]">
            EXPERT
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#F8F6F1]/85" aria-label="Навигация">
            {NAV.map((item) => (
              <Link key={item.route} href={getLocalizedPublicHref(item.route, 'ru')} className="transition hover:text-[#D4A017]">
                {item.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher ruEnabled={ruEnabled} enEnabled={enEnabled} compact />
        </div>
      </header>

      <main>
        <section className="border-b border-[#D4A017]/20 bg-[#0D1B2A] px-5 py-20 text-[#F8F6F1] sm:px-8 md:py-28">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4A017]">{content.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">{content.title}</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#F8F6F1]/75">{content.description}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={primaryHref} className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-5 py-3 font-bold text-[#0D1B2A] transition hover:bg-[#E3B635]">
                {content.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {secondaryHref && content.secondaryCta && (
                <Link href={secondaryHref} className="inline-flex min-h-12 items-center border border-[#D4A017]/60 px-5 py-3 font-semibold text-[#D4A017] transition hover:bg-[#D4A017]/10">
                  {content.secondaryCta}
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8 md:py-20">
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {content.bullets.map((bullet) => (
              <article key={bullet} className="border border-[#0D1B2A]/10 bg-white p-6 shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-[#D4A017]" />
                <p className="mt-4 font-semibold leading-7">{bullet}</p>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-5xl text-sm leading-6 text-[#5F6B78]">
            Информация относится к сопровождению и услугам EXPERT в Испании. Язык страницы не определяет гражданство, налоговое резидентство или применимое право клиента.
          </p>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0D1B2A] px-5 py-9 text-sm text-[#F8F6F1]/70 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <p>EXPERT · Holded Solution Partner · Asesoría Holded acreditada</p>
          <div className="flex gap-4">
            <Link href="/contacto" className="hover:text-[#D4A017]">Контакты</Link>
            <Link href="/aviso-legal" className="hover:text-[#D4A017]">Юридическая информация</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
