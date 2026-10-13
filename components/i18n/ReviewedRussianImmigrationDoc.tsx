import Link from 'next/link';
import { getReviewedImmigrationGuide, IMMIGRATION_REVIEWED_SOURCES, type ImmigrationGuideId } from '@/lib/content/immigration-reviewed-2026';
import { isLocalePubliclyEnabled } from '@/lib/i18n/feature-flags';
import { notFound } from 'next/navigation';
export function ReviewedRussianImmigrationDoc({id}:{id:ImmigrationGuideId}){
 if(!isLocalePubliclyEnabled('ru'))notFound();
 const guide=getReviewedImmigrationGuide(id);
 const sources=guide.sourceIds.map(k=>IMMIGRATION_REVIEWED_SOURCES.find(s=>s.id===k)).filter(s=>s!==undefined);
 const origin='docs:'+guide.ruSlug;
 return <main className="bg-[#F8F6F1] text-[#0D1B2A]">
   <header className="brand-blue-bg px-6 py-14 text-white"><div className="mx-auto max-w-4xl">
    <Link href="/ru/docs" className="font-semibold text-[#D4A017] underline">← База знаний</Link>
    <Link href={'/docs/'+guide.esSlug} className="ml-6 text-[#D4A017] underline">Español</Link>
    <h1 className="mt-6 font-serif text-3xl font-bold md:text-5xl">{guide.title.ru}</h1><p className="mt-4 leading-8 text-white/80">{guide.intro.ru}</p>
    <p className="mt-3 text-xs text-white/70">Проверено: {guide.revised}</p>
   </div></header>
   <article className="mx-auto max-w-4xl space-y-9 px-6 py-12">
    {guide.sections.map(s=><section key={s.id}><h2 className="font-serif text-2xl font-bold">{s.ru}</h2><p className="mt-4 leading-8">{s.pRu}</p></section>)}
    <section><h2 className="font-serif text-2xl font-bold">Официальные источники</h2><ul className="mt-4 space-y-3">{sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.name}</a>{s.lastEditorialRevision&&<span className="ml-2 text-xs text-gray-600">Редакция: {s.lastEditorialRevision}</span>}</li>)}</ul></section>
    <aside className="border border-[#D4A017]/30 bg-white p-6"><p className="font-semibold">Нужна консультация по вашему делу?</p><div className="mt-4 flex flex-wrap gap-4">
     <Link className="bg-[#D4A017] px-5 py-3 font-semibold" href={'/solicitar-presupuesto?origen='+encodeURIComponent(origin)}>Запросить услугу</Link>
     <Link className="border border-[#D4A017] px-5 py-3" href={'/consulta-gratuita?origen='+encodeURIComponent(origin)}>Задать бесплатный вопрос (форма на испанском)</Link>
    </div></aside>
   </article>
 </main>;
}
