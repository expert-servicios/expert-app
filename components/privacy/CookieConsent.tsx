'use client';

import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'expert-cookie-consent-v2';
const CONSENT_TTL_MS = 730 * 24 * 60 * 60 * 1000;
const GTM_ID = 'GTM-MKZ522HP';
const GA4_MEASUREMENT_ID = 'G-NWTGS6DH5E';

type ConsentValue = 'accepted' | 'rejected';
type StoredConsent = { value: ConsentValue; decidedAt: number };

function readConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (!parsed?.value || !parsed.decidedAt || Date.now() - parsed.decidedAt > CONSENT_TTL_MS) {
      window.localStorage.removeItem(CONSENT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [consent, setConsent] = useState<StoredConsent | null | undefined>(undefined);
  const accepted = consent?.value === 'accepted';

  useEffect(() => {
    setConsent(readConsent());
    const open = () => setConsent(null);
    window.addEventListener('expert:open-cookie-settings', open);
    return () => window.removeEventListener('expert:open-cookie-settings', open);
  }, []);

  const save = (value: ConsentValue) => {
    const next = { value, decidedAt: Date.now() } satisfies StoredConsent;
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    setConsent(next);
  };

  const showBanner = consent === null;
  const scripts = useMemo(() => accepted ? (
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
        dangerouslySetInnerHTML={{ __html: 'function loadScript(a){var b=document.getElementsByTagName("head")[0],c=document.createElement("script");c.type="text/javascript",c.src="https://tracker.metricool.com/resources/be.js",c.onreadystatechange=a,c.onload=a,b.appendChild(c)}loadScript(function(){beTracker.t({hash:"a5e06adb5ddd99592958d258ef71a513"})});' }}
      />
    </>
  ) : null, [accepted]);

  return (
    <>
      {scripts}
      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-[#D4A017]/40 bg-[#0D1B2A] px-5 py-5 text-[#F8F6F1] shadow-2xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-bold">Privacidad y medición</p>
              <p className="mt-1 text-sm leading-6 text-[#D1D5DB]">
                Usamos tecnologías necesarias para seguridad y funcionamiento. Google Analytics, Google Tag Manager y Metricool
                solo se cargan si aceptas la medición opcional. Puedes rechazarla sin perder acceso a los servicios.
              </p>
              <Link href="/cookies" className="mt-2 inline-block text-xs font-semibold text-[#D4A017] underline underline-offset-4">
                Ver política de cookies
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:shrink-0">
              <button
                type="button"
                onClick={() => save('rejected')}
                className="min-h-11 border border-[#D4A017] px-5 text-sm font-bold text-[#F8F6F1] transition hover:bg-white/5"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => save('accepted')}
                className="min-h-11 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
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
      onClick={() => window.dispatchEvent(new Event('expert:open-cookie-settings'))}
      className="transition hover:text-[#D4A017]"
    >
      Configurar cookies
    </button>
  );
}
