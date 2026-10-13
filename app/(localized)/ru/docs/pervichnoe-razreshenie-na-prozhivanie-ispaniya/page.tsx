import type { Metadata } from 'next';
import { getReviewedImmigrationGuide } from '@/lib/content/immigration-reviewed-2026';
import { ReviewedRussianImmigrationDoc } from '@/components/i18n/ReviewedRussianImmigrationDoc';
import { shouldIndexLocale } from '@/lib/i18n/feature-flags';
const guide=getReviewedImmigrationGuide('initial');
const ru='https://expertconsulting.es/ru/docs/'+guide.ruSlug;
const es='https://expertconsulting.es/docs/'+guide.esSlug;
export const metadata:Metadata={
 title:guide.title.ru+' | EXPERT',description:guide.intro.ru,
 alternates:{canonical:ru,languages:{'es-ES':es,'ru-RU':ru,'x-default':es}},
 robots:{index:shouldIndexLocale('ru'),follow:true},
 openGraph:{type:'article',locale:'ru_RU',title:guide.title.ru,description:guide.intro.ru,url:ru},
};
export default function Page(){return <ReviewedRussianImmigrationDoc id="initial"/>;}
