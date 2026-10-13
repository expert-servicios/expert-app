import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLaborRuArticle, laborRuArticles } from '@/lib/content/labor-bilingual-2026';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { RuLaborArticleSections } from '@/components/i18n/RuLaborArticleSections';
export function generateStaticParams(){ return laborRuArticles.map(a=>({slug:a.slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params; const a=getLaborRuArticle(slug);if(!a)return {};
 const esUrl='https://expertconsulting.es/blog/'+a.esSlug;
 const ruUrl='https://expertconsulting.es/ru/blog/'+a.slug;
 return {title:a.title+' | EXPERT',description:a.description,alternates:{canonical:ruUrl,languages:{'es-ES':esUrl,'ru-RU':ruUrl,'x-default':esUrl}},robots:{index:false,follow:true},openGraph:{type:'article',locale:'ru_RU',title:a.title,description:a.description,url:ruUrl}};
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const a=getLaborRuArticle(slug);
 if(!a||!isLocalePubliclyEnabled('ru'))notFound();
 return <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
  <header className="brand-blue-bg px-6 py-16 text-white"><div className="mx-auto max-w-4xl"><Link href="/ru" className="text-[#D4A017]">← Главная</Link><h1 className="mt-7 font-serif text-3xl font-bold md:text-5xl">{a.title}</h1><p className="mt-6 text-lg text-white/75">{a.description}</p><Link href={'/blog/'+a.esSlug} className="mt-6 inline-block text-sm text-[#D4A017] underline">Versión en español</Link></div></header>
  <article className="mx-auto max-w-4xl px-6 py-14"><RuLaborArticleSections sections={a.sections}/><div className="mt-10 border border-[#D4A017] p-5"><p>Есть вопросы по кадровому учёту (gestión laboral) и расчётным листам (nóminas)?</p><Link href="/ru/konsultatsiya" className="mt-3 inline-block font-bold text-[#0D1B2A] underline">Записаться на консультацию →</Link></div></article></main>;
}