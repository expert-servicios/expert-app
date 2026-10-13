import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { RemainingRussianService, RU_REMAINING_SERVICES } from '@/components/services/RemainingRussianService';
import { getCatalogService } from '@/lib/utils/catalog';
const slug='baja-cese-actividad' as const;
const data=RU_REMAINING_SERVICES[slug];
const service=getCatalogService(slug);
const esUrl='https://expertconsulting.es/servicios/'+service!.categoria+'/'+slug;
const ruUrl='https://expertconsulting.es'+data.path;
export const metadata:Metadata={title:data.title+' | EXPERT',description:data.intro,alternates:{canonical:ruUrl,languages:{'es-ES':esUrl,'ru-RU':ruUrl,'x-default':esUrl}},robots:{index:false,follow:true}};
export default function Page(){if(!isLocalePubliclyEnabled('ru'))notFound();return <RemainingRussianService slug={slug}/>;}
