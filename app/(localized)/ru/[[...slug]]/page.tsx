import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RuPublicPage } from '@/components/i18n/RuPublicPage';
import { isLocalePubliclyEnabled, shouldIndexLocale } from '@/lib/i18n/feature-flags';
import {
  getLocalizedPublicHref,
  getRuRouteKey,
} from '@/lib/i18n/public-routes';
import { RU_PUBLIC_CONTENT } from '@/lib/i18n/ru-public-content';

const BASE_URL = 'https://expertconsulting.es';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const routeKey = getRuRouteKey(slug);
  if (!routeKey) return {};

  const content = RU_PUBLIC_CONTENT[routeKey];
  const ruPath = getLocalizedPublicHref(routeKey, 'ru');
  const esPath = getLocalizedPublicHref(routeKey, 'es');
  const indexable = shouldIndexLocale('ru');

  return {
    title: `${content.title} | EXPERT`,
    description: content.description,
    alternates: {
      canonical: `${BASE_URL}${ruPath}`,
      languages: {
        'es-ES': `${BASE_URL}${esPath}`,
        'ru-RU': `${BASE_URL}${ruPath}`,
        'x-default': `${BASE_URL}${esPath}`,
      },
    },
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: { index: indexable, follow: indexable },
    },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: 'EXPERT — Asesoría Fiscal y Legal',
      title: `${content.title} | EXPERT`,
      description: content.description,
      url: `${BASE_URL}${ruPath}`,
    },
  };
}

export default async function RussianPublicRoute({ params }: PageProps) {
  if (!isLocalePubliclyEnabled('ru')) notFound();

  const { slug } = await params;
  const routeKey = getRuRouteKey(slug);
  if (!routeKey) notFound();

  return (
    <RuPublicPage
      routeKey={routeKey}
      ruEnabled
      enEnabled={isLocalePubliclyEnabled('en')}
    />
  );
}
