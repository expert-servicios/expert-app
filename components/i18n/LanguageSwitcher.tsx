'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { SupportedLocale } from '@/lib/i18n/config';
import {
  getLocalizedPublicHref,
  inferPublicRouteKey,
} from '@/lib/i18n/public-routes';

const OPTIONS: Array<{ locale: SupportedLocale; label: string; short: string }> = [
  { locale: 'es', label: 'Español', short: 'ES' },
  { locale: 'ru', label: 'Русский', short: 'RU' },
  { locale: 'en', label: 'English', short: 'EN' },
];

export function LanguageSwitcher({
  ruEnabled,
  enEnabled,
  compact = false,
}: {
  ruEnabled: boolean;
  enEnabled: boolean;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState<SupportedLocale | null>(null);
  const currentLocale: SupportedLocale = pathname === '/ru' || pathname.startsWith('/ru/')
    ? 'ru'
    : pathname === '/en' || pathname.startsWith('/en/')
      ? 'en'
      : 'es';
  const routeKey = inferPublicRouteKey(pathname);

  function available(locale: SupportedLocale) {
    if (locale === 'es') return true;
    if (locale === 'ru') return ruEnabled;
    return enEnabled;
  }

  async function selectLocale(locale: SupportedLocale) {
    if (!available(locale) || pending) return;
    setPending(locale);
    try {
      const response = await fetch('/api/preferences/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      if (!response.ok) throw new Error('language_preference_failed');

      const href = getLocalizedPublicHref(routeKey, locale);
      if (href === pathname) {
        router.refresh();
      } else {
        router.push(href);
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      className={compact
        ? 'inline-flex items-center gap-1 rounded-full border border-current/15 bg-white/5 p-1 text-xs'
        : 'flex items-center justify-end gap-1 border-b border-[#D4A017]/15 bg-[#0D1B2A] px-4 py-2 text-xs text-[#F8F6F1] sm:px-6'}
      aria-label="Language / Язык / Idioma"
    >
      {!compact && <span className="mr-2 text-[#9CA3AF]">Idioma · Язык</span>}
      {OPTIONS.map((option) => {
        const isCurrent = currentLocale === option.locale;
        const isAvailable = available(option.locale);
        return (
          <button
            key={option.locale}
            type="button"
            onClick={() => void selectLocale(option.locale)}
            disabled={isCurrent || !isAvailable || Boolean(pending)}
            aria-current={isCurrent ? 'page' : undefined}
            title={!isAvailable ? `${option.label} — próximamente` : option.label}
            className={`rounded-full px-2.5 py-1 font-semibold transition ${
              isCurrent
                ? 'bg-[#D4A017] text-[#0D1B2A]'
                : isAvailable
                  ? 'text-inherit hover:bg-[#D4A017]/15 hover:text-[#D4A017]'
                  : 'cursor-not-allowed text-[#9CA3AF]/50'
            }`}
          >
            {pending === option.locale ? '…' : option.short}
          </button>
        );
      })}
    </div>
  );
}
