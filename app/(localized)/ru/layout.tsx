import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/lib/i18n/messages';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';

export const dynamic = 'force-dynamic';

export default function RuPublicLayout({ children }: { children: ReactNode }) {
  if (!isLocalePubliclyEnabled('ru')) notFound();

  return (
    <NextIntlClientProvider locale="ru" messages={getMessages('ru')}>
      {children}
    </NextIntlClientProvider>
  );
}
