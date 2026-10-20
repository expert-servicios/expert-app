import type { ReactNode } from 'react';
import Script from 'next/script';
import { KseniaWhatsAppWidget } from '@/components/personal/KseniaWhatsAppWidget';

const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function KseniaPersonalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {recaptchaKey && <Script id="recaptcha-v3-personal" src={'https://www.google.com/recaptcha/api.js?render=' + recaptchaKey} strategy="afterInteractive" />}
      {children}
      <KseniaWhatsAppWidget />
    </>
  );
}
