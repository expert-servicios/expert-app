import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { AcquisitionTracker } from '@/components/marketing/AcquisitionTracker';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { Footer } from '@/components/site/footer';
import { Header } from '@/components/site/header';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { KiaPublicWidget } from '@/components/site/KiaPublicWidget';
import { isLocalePubliclyEnabled as localeEnabled } from '@/lib/i18n/feature-flags';
import { DocumentLanguage } from '@/components/i18n/DocumentLanguage';
import { CartProvider } from '@/contexts/CartContext';
import { getMessages } from '@/lib/i18n/messages';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';

export const dynamic = 'force-dynamic';

export default function RuPublicLayout({ children }: { children: ReactNode }) {
  if (!isLocalePubliclyEnabled('ru')) notFound();

  return (
    <NextIntlClientProvider locale="ru" messages={getMessages('ru')}>
      <DocumentLanguage lang="ru" />
      <CartProvider>
        <AcquisitionTracker />
        <Header locale="ru" />
        <LanguageSwitcher ruEnabled={localeEnabled('ru')} enEnabled={localeEnabled('en')} />
        <div lang="ru">{children}</div>
        <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
        <Footer locale="ru" />
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] right-4 z-[70] flex flex-col items-center gap-3 sm:bottom-5 sm:right-5">
          <KiaPublicWidget />
        </div>
        <CartSidebar />
      </CartProvider>
    </NextIntlClientProvider>
  );
}
