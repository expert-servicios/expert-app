import { KseniaPersonalCTAAnalytics } from '@/components/personal/KseniaPersonalCTAAnalytics';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { KseniaWhatsAppWidget } from '@/components/personal/KseniaWhatsAppWidget';
import { KseniaSocialLinks } from '@/components/personal/KseniaSocialLinks';

const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function KseniaPersonalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {recaptchaKey && <Script id="recaptcha-v3-personal" src={'https://www.google.com/recaptcha/api.js?render=' + recaptchaKey} strategy="afterInteractive" />}
      {process.env.PERSONAL_WEB_ANALYTICS_ENABLED === 'true' && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}
      {process.env.PERSONAL_WEB_ANALYTICS_ENABLED === 'true' && <KseniaPersonalCTAAnalytics />}
      {children}
      <div className="border-t border-[#D3AD73]/30 bg-[#182A32]"><KseniaSocialLinks /></div>
      <KseniaWhatsAppWidget />
    </>
  );
}
