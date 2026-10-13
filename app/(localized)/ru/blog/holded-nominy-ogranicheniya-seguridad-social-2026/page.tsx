import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { laborRuArticles } from '@/lib/content/labor-bilingual-2026';
import { isLocalePubliclyEnabled, shouldIndexLocale } from '@/lib/i18n/feature-flags';
import { RuLaborArticleSections } from '@/components/i18n/RuLaborArticleSections';

const article = laborRuArticles.find(item => item.slug === 'holded-nominy-ogranicheniya-seguridad-social-2026');
const esPath = '/blog/holded-nominas-limites-seguridad-social-2026';
const ruPath = '/ru/blog/holded-nominy-ogranicheniya-seguridad-social-2026';
export const metadata: Metadata = article ? {
 title: article.title + ' | EXPERT',
 description: article.description,
 alternates: {
  canonical: 'https://expertconsulting.es' + ruPath,
  languages: {'es-ES':'https://expertconsulting.es'+esPath,'ru-RU':'https://expertconsulting.es'+ruPath,'x-default':'https://expertconsulting.es'+esPath}
 },
 robots: {index:shouldIndexLocale('ru'),follow:true},
 openGraph:{type:'article',locale:'ru_RU',title:article.title,description:article.description,url:'https://expertconsulting.es'+ruPath}
} : {};

export default function Page() {
 if (!article || !isLocalePubliclyEnabled('ru')) notFound();
 return <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
  <header className="brand-blue-bg px-6 py-16 text-white"><div className="mx-auto max-w-4xl">
   <Link href="/ru/blog" className="text-[#D4A017]">← Статьи</Link>
   <h1 className="mt-7 font-serif text-3xl font-bold md:text-5xl">{article.title}</h1>
   <p className="mt-6 text-lg text-white/75">{article.description}</p>
   <Link href={esPath} className="mt-6 inline-block text-sm text-[#D4A017] underline">Читать по-испански (Español)</Link>
  </div></header>
  <article className="mx-auto max-w-4xl px-6 py-14">
   <RuLaborArticleSections sections={article.sections}/>
   <div className="mt-10 border border-[#D4A017] p-5">
    <p>Вопросы по кадровому учёту (gestión laboral), расчётным листам (nóminas) или социальному страхованию (Seguridad Social)?</p>
    <Link href="/ru/konsultatsiya" className="mt-3 inline-block font-bold text-[#0D1B2A] underline">Записаться на консультацию →</Link>
   </div>
  </article>
 </main>;
}
