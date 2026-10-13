import type { Metadata } from 'next';
import { PriorityRussianService, priorityRussianServices } from '@/components/services/PriorityRussianService';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { notFound } from 'next/navigation';
const key = 'modelo-151' as const;
const data = priorityRussianServices[key];
const ruUrl = 'https://expertconsulting.es' + data.path;
const esUrl = 'https://expertconsulting.es/servicios/declaraciones-impuestos/modelo-151';
export const metadata: Metadata = {
 title: data.title + ' | EXPERT',
 description: data.intro,
 alternates: { canonical: ruUrl, languages: { 'es-ES': esUrl, 'ru-RU': ruUrl, 'x-default': esUrl } },
 robots: { index: false, follow: true },
 openGraph: { title: data.title, description: data.intro, url: ruUrl, locale: 'ru_RU' },
};
export default function Page() {
 if (!isLocalePubliclyEnabled('ru')) notFound();
 return <PriorityRussianService slug={key} />;
}
