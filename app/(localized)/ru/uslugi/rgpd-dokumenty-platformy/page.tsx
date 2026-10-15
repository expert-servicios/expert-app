import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocalePubliclyEnabled,shouldIndexLocale } from '@/lib/i18n/feature-flags';
import { PrivacyAndCompanyServices } from '@/components/services/PrivacyAndCompanyServices';
export const metadata:Metadata={title:'Политика конфиденциальности и RGPD | EXPERT',description:'Адаптация RGPD, политика конфиденциальности и юридические документы для бизнеса и платформ.',alternates:{canonical:'https://expertconsulting.es/ru/uslugi/rgpd-dokumenty-platformy',languages:{'es-ES':'https://expertconsulting.es/servicios/proteccion-datos','ru-RU':'https://expertconsulting.es/ru/uslugi/rgpd-dokumenty-platformy','x-default':'https://expertconsulting.es/servicios/proteccion-datos'}},robots:{index:shouldIndexLocale('ru'),follow:true}};
export default function Page(){if(!isLocalePubliclyEnabled('ru'))notFound();return <PrivacyAndCompanyServices locale="ru"/>;}
