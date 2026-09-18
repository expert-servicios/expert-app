import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { AcquisitionTracker } from '@/components/marketing/AcquisitionTracker';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { RuSiteFooter } from '@/components/i18n/RuSiteFooter';
import { CartProvider } from '@/contexts/CartContext';
import { getMessages } from '@/lib/i18n/messages';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';

export const dynamic = 'force-dynamic';

export default function RuPublicLayout({ children }: { children: ReactNode }) {
  if (!isLocalePubliclyEnabled('ru')) notFound();

  return (
    <NextIntlClientProvider locale="ru" messages={getMessages('ru')}>
      <CartProvider>
        <AcquisitionTracker />
        <div lang="ru">{children}</div>
        <RuSiteFooter />
        <CartSidebar />
      </CartProvider>
    </NextIntlClientProvider>
  );
}
