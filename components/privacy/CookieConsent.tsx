'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  clearAnalyticsCookies,
  OPEN_COOKIE_SETTINGS_EVENT,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentValue,
  type StoredCookieConsent,
} from '@/lib/privacy/cookie-consent';
import { clearClientAttribution } from '@/lib/marketing/client-attribution';

const GTM_ID = 'GTM-MKZ522HP';
const GA4_MEASUREMENT_ID = 'G-NWTGS6DH5E';

export function CookieConsent() {
  const [consent, setConsent] = useState<StoredCookieConsent | null | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const accepted = consent?.value === 'accepted';

  useEffect(() => {
    setConsent(readCookieConsent());
    const open = () => setSettingsOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  const save = (value: CookieConsentValue) => {
    const wasAccepted = consent?.value === 'accepted';
    const next = writeCookieConsent(value);
    setConsent(next);
    setSettingsOpen(false);

    if (value === 'rejected') {
      clearAnalyticsCookies();
      clearClientAttribution();
      if (wasAccepted) window.location.reload();
    }
  };

  const showBanner = consent === null || settingsOpen;

  return (
    <>
      {accepted && (
        <>
          <Script
            id="gtm-consented"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');` }}
          />
          <Script id="ga4-consented-lib" src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script
            id="ga4-consented-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_MEASUREMENT_ID}', { anonymize_ip: true });` }}
          />
          <Script
            id="metricool-consented"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: 'function loadMetricool(){var b=document.getElementsByTagName("head")[0],c=document.createElement("script");c.type="text/javascript",c.src="https://tracker.metricool.com/resources/be.js",c.onload=function(){if(window.beTracker){window.beTracker.t({hash:"a5e06adb5ddd99592958d258ef71a513"})}},b.appendChild(c)}loadMetricool();' }}
          />
        </>
      )}

      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-[#D4A017]/40 bg-[#0D1B2A] px-5 py-5 text-[#F8F6F1] shadow-2xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-bold">Privacidad y medición</p>
              <p className="mt-1 text-sm leading-6 text-[#D1D5DB]">
                Las tecnologías necesarias siguen activas. Google Analytics, Google Tag Manager, Metricool y la atribución comercial
                solo se activan si aceptas la medición opcional. Puedes retirar tu consentimiento en cualquier momento.
              </p>
              <Link href="/cookies" className="mt-2 inline-block text-xs font-semibold text-[#D4A017] underline underline-offset-4">
                Ver política de cookies
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:shrink-0">
              <button type="button" onClick={() => save('rejected')} className="min-h-11 border border-[#D4A017] px-5 text-sm font-bold text-[#F8F6F1] transition hover:bg-white/5">
                Rechazar
              </button>
              <button type="button" onClick={() => save('accepted')} className="min-h-11 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className="transition hover:text-[#D4A017]"
    >
      Configurar cookies
    </button>
  );
}
