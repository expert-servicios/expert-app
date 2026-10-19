'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { PUBLIC_NAV_DRAFT, PUBLIC_TOPICS, type PublicContentLocale } from '@/lib/content/public-autogestion-taxonomy';

/** Independent WEB-P1 navigation preview: not mounted on public layouts yet. */
export function PublicAutogestionNavigation({ locale = 'es' }: { locale?: PublicContentLocale }) {
  const [mobile, setMobile] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const reset = window.setTimeout(() => { setMobile(false); setTopicsOpen(false); }, 0);
    return () => window.clearTimeout(reset);
  }, [pathname]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setMobile(false); setTopicsOpen(false); } }
    function onOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setTopicsOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onOutside);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onOutside); };
  }, []);
  const close = () => { setMobile(false); setTopicsOpen(false); };
  const choose = (es: string, ru: string) => locale === 'ru' ? ru : es;
  const topics = PUBLIC_TOPICS.map(t => <Link key={t.id} href={t.href[locale]} onClick={close}
    className="block rounded px-3 py-2 text-sm hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4A017]">
    <strong className="block">{t.label[locale]}</strong>
    <span className="text-xs text-white/70">{t.description[locale]}</span>
    {locale === 'ru' && t.ruDestinationType === 'broader-hub' && <span className="block text-xs text-[#F2C14E]">Общий раздел</span>}
  </Link>);
  return <nav ref={navRef} aria-label={choose('Navegación de EXPERT','Навигация EXPERT')} className="relative bg-[#0D1B2A] text-white">
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
      <Link href={locale === 'ru' ? '/ru' : '/'} className="font-serif text-xl font-bold">EXPERT</Link>
      <div className="hidden flex-1 items-center justify-end gap-3 lg:flex">
        <button type="button" aria-expanded={topicsOpen} aria-controls="web-p1-topics" onClick={() => setTopicsOpen(!topicsOpen)}
          className="inline-flex items-center gap-1 rounded px-2 py-2 text-sm focus-visible:outline">
          {choose('Trámites por tema','Процедуры по темам')} <ChevronDown size={15}/>
        </button>
        {PUBLIC_NAV_DRAFT.filter(x => !['home','procedures','login'].includes(x.id)).map(link=>
          <Link key={link.id} href={link.href[locale]} onClick={close} className="px-2 py-2 text-sm hover:text-[#D4A017]">{link.label[locale]}</Link>)}
      </div>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('expert:kia-open'))}
        className="ml-auto rounded border border-[#D4A017] px-3 py-2 text-xs font-semibold text-[#D4A017] lg:ml-0">
        {choose('Preguntar a KIA','Спросить KIA')}
      </button>
      <Link href="/auth/login" className="hidden rounded bg-[#D4A017] px-3 py-2 text-xs font-bold text-[#0D1B2A] sm:block">{choose('Acceder','Войти')}</Link>
      <button type="button" aria-expanded={mobile} aria-controls="web-p1-mobile" onClick={() => setMobile(!mobile)}
        aria-label={choose('Abrir o cerrar menú','Открыть или закрыть меню')} className="rounded border border-white/40 p-2 lg:hidden">
        {mobile ? <X size={19}/> : <Menu size={19}/>}
      </button>
    </div>
    {topicsOpen && <div id="web-p1-topics" className="absolute inset-x-0 top-full z-50 hidden border-t border-white/20 bg-[#0D1B2A] shadow-xl lg:block">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2 p-3">{topics}</div>
    </div>}
    {mobile && <div id="web-p1-mobile" className="max-h-[75vh] overflow-y-auto border-t border-white/20 px-4 pb-6 lg:hidden">
      <details><summary className="cursor-pointer py-4 font-semibold">{choose('Trámites por tema','Процедуры по темам')}</summary><div className="grid gap-1">{topics}</div></details>
      {PUBLIC_NAV_DRAFT.filter(x=> x.id !== 'procedures').map(link=><Link key={link.id} href={link.href[locale]} onClick={close}
        className="block border-t border-white/10 py-3 text-sm">{link.label[locale]}</Link>)}
    </div>}
  </nav>;
}
