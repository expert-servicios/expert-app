'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function KseniaPersonalMobileNav({ locale }: { locale: 'es' | 'ru' }) {
  const [open, setOpen] = useState(false);
  const ru = locale === 'ru';
  const entries = ru ? [
    { label: 'Обо мне', href: '#obo-mne' },
    { label: 'Опыт', href: '#put' },
    { label: 'Наставничество', href: '/ru/mentorias' },
    { label: 'Статьи и идеи', href: '#lecturas' },
    { label: 'Вопросы', href: '#preguntas' },
    { label: 'Контакты', href: '#contact' },
  ] : [
    { label: 'Sobre mí', href: '#sobre-mi' },
    { label: 'Trayectoria', href: '#trayectoria' },
    { label: 'Mentorías', href: '/mentorias' },
    { label: 'Ideas y lecturas', href: '#lecturas' },
    { label: 'Preguntas frecuentes', href: '#preguntas' },
    { label: 'Contacto', href: '#contacto' },
  ];
  return (
    <div className="border-t border-[#182A32]/10 px-5 py-2 md:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <button
          type="button"
          aria-controls="ksenia-personal-mobile-navigation"
          aria-expanded={open}
          aria-label={open ? (ru ? 'Закрыть меню' : 'Cerrar menú') : (ru ? 'Открыть меню' : 'Abrir menú')}
          onClick={() => setOpen(value => !value)}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#182A32]/20 px-3 py-2 text-sm font-semibold text-[#182A32] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          {ru ? 'Меню' : 'Menú'}
        </button>
        <Link
          data-personal-cta="booking"
          data-personal-placement="mobile-nav"
          href={ru ? '/ru/reservar' : '/reservar'}
          className="inline-flex min-h-11 items-center justify-center bg-[#182A32] px-4 py-2 text-center text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {ru ? 'Запись · 15 мин' : 'Reservar · 15 min'}
        </Link>
      </div>
      {open && (
        <nav id="ksenia-personal-mobile-navigation" aria-label={ru ? 'Мобильная навигация' : 'Navegación móvil'} className="mx-auto mt-3 max-w-7xl border-t border-[#182A32]/10 pb-3">
          {entries.map(entry => (
            entry.href.startsWith('#') ?
              <a key={entry.href} href={entry.href} onClick={() => setOpen(false)} className="block min-h-11 border-b border-[#182A32]/10 px-2 py-3 text-sm font-medium text-[#293E43] hover:text-[#A57931]">{entry.label}</a>
              : <Link key={entry.href} href={entry.href} onClick={() => setOpen(false)} className="block min-h-11 border-b border-[#182A32]/10 px-2 py-3 text-sm font-medium text-[#293E43] hover:text-[#A57931]">{entry.label}</Link>
          ))}
          <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="block min-h-11 px-2 py-3 text-sm font-medium text-[#293E43]">EXPERT CONSULTING</a>
        </nav>
      )}
    </div>
  );
}
