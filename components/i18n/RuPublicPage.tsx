import Link from 'next/link';
import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import { EXPERT_IDENTITY } from '@/config/identity';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { RU_PUBLIC_CONTENT } from '@/lib/i18n/ru-public-content';
import { RU_COMMERCIAL_DATA } from '@/lib/i18n/ru-commercial-data';
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

const TRUST_ITEMS = [
  EXPERT_IDENTITY.credentials.holdedSolutionPartner,
  EXPERT_IDENTITY.credentials.holdedAccreditedAdvisory,
  EXPERT_IDENTITY.credentials.aeatSocialCollaborator,
  EXPERT_IDENTITY.credentials.academy,
] as const;

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
  const commercial = RU_COMMERCIAL_DATA[routeKey];
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

        <section className="border-b border-[#D4A017]/20 bg-[#FFFDF8] px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-[#4D5A68]">
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#D4A017]" /> {item}
              </span>
            ))}
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
        </section>

        {commercial?.offers && commercial.offers.length > 0 && (
          <section className="border-y border-[#0D1B2A]/10 bg-white px-5 py-16 sm:px-8 md:py-20">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">EXPERT · единый каталог</p>
                <h2 className="mt-3 font-serif text-3xl font-bold">{commercial.offerTitle ?? 'Варианты работы'}</h2>
                {commercial.offerIntro && <p className="mt-4 leading-7 text-[#5F6B78]">{commercial.offerIntro}</p>}
              </div>
              <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {commercial.offers.map((offer) => (
                  <article key={`${offer.title}-${offer.href}`} className="flex flex-col border border-[#D4A017]/25 bg-[#F8F6F1] p-6">
                    {offer.badge && <p className="text-[11px] font-bold uppercase tracking-wider text-[#B47B13]">{offer.badge}</p>}
                    <h3 className="mt-2 font-serif text-xl font-bold">{offer.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-[#5F6B78]">{offer.description}</p>
                    {offer.price && <p className="mt-5 font-serif text-2xl font-bold text-[#0D1B2A]">{offer.price}</p>}
                    <Link href={offer.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#9B6810] hover:underline">
                      Подробнее <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {commercial?.sections && commercial.sections.length > 0 && (
          <section className="px-5 py-16 sm:px-8 md:py-20">
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
              {commercial.sections.map((section) => (
                <article key={section.title} className="border border-[#0D1B2A]/10 bg-[#FFFDF8] p-7">
                  <h2 className="font-serif text-2xl font-bold">{section.title}</h2>
                  <p className="mt-4 leading-7 text-[#5F6B78]">{section.text}</p>
                  {section.items && section.items.length > 0 && (
                    <ul className="mt-5 space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-6 text-[#344252]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {commercial?.notice && (
          <section className="px-5 pb-16 sm:px-8 md:pb-20">
            <div className="mx-auto max-w-5xl border-l-4 border-[#D4A017] bg-[#0D1B2A] p-6 text-[#F8F6F1]">
              <p className="font-serif text-xl font-bold">{commercial.notice.title}</p>
              <p className="mt-2 text-sm leading-7 text-[#F8F6F1]/75">{commercial.notice.text}</p>
            </div>
          </section>
        )}

        <section className="px-5 pb-14 sm:px-8 md:pb-20">
          <p className="mx-auto max-w-5xl border-t border-[#0D1B2A]/10 pt-8 text-sm leading-6 text-[#5F6B78]">
            Информация относится к сопровождению и услугам EXPERT в Испании. Язык страницы не определяет гражданство, налоговое резидентство или применимое право клиента.
          </p>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0D1B2A] px-5 py-9 text-sm text-[#F8F6F1]/70 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p>{EXPERT_IDENTITY.credentials.holdedSolutionPartner} · {EXPERT_IDENTITY.credentials.holdedAccreditedAdvisory}</p>
            <a href={`mailto:${EXPERT_IDENTITY.publicEmail}`} className="mt-1 block hover:text-[#D4A017]">{EXPERT_IDENTITY.publicEmail}</a>
            <a href={`tel:${EXPERT_IDENTITY.phoneE164}`} className="mt-1 block hover:text-[#D4A017]">WhatsApp / Tel. {EXPERT_IDENTITY.phoneDisplay}</a>
          </div>
          <div className="flex gap-4">
            <Link href="/contacto" className="hover:text-[#D4A017]">Контакты</Link>
            <Link href="/aviso-legal" className="hover:text-[#D4A017]">Юридическая информация</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
