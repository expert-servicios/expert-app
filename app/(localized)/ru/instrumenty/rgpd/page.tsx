import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RgpdAssessmentRu } from '@/components/tools/RgpdAssessmentRu';
import { KiaRgpdAction } from '@/components/tools/KiaRgpdAction';
import { isLocalePubliclyEnabled, shouldIndexLocale } from '@/lib/i18n/feature-flags';

export const metadata: Metadata = {
 title:'Бесплатная проверка RGPD и инструменты AEPD для бизнеса | EXPERT',
 description:'Бесплатная предварительная оценка GDPR/RGPD в Испании на русском языке. Советы KIA, официальные инструменты AEPD и обучение 2 часа за 180 € + НДС.',
 alternates:{canonical:'https://expertconsulting.es/ru/instrumenty/rgpd',languages:{'es-ES':'https://expertconsulting.es/herramientas/rgpd','ru-RU':'https://expertconsulting.es/ru/instrumenty/rgpd','x-default':'https://expertconsulting.es/herramientas/rgpd'}},
 robots:{index:shouldIndexLocale('ru'),follow:shouldIndexLocale('ru')},
};
export default function RgpdRussianPage(){
 if(!isLocalePubliclyEnabled('ru'))notFound();
 return <main className="bg-[#F8F6F1] text-[#0D1B2A]">
   <section className="bg-[#0D1B2A] px-6 py-12 text-white"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">EXPERT · RGPD · Испания</p><h1 className="mt-3 max-w-4xl font-serif text-3xl font-bold md:text-5xl">Защита персональных данных для предпринимателей в Испании</h1><p className="mt-4 max-w-3xl leading-7">Ответьте на простые вопросы, получите ориентировочный план действий и узнайте, какой бесплатный инструмент AEPD выбрать. Можно пройти вместе с KIA.</p><div className="mt-5 flex flex-wrap gap-3"><a href="#anketa" className="rounded bg-[#D4A017] px-5 py-3 font-bold text-[#0D1B2A]">Пройти анкету бесплатно ↓</a><KiaRgpdAction topic="rgpd-guided-ru">Поговорить с KIA</KiaRgpdAction></div></div></section>
   <section id="anketa" className="mx-auto max-w-6xl px-6 py-10"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]"><RgpdAssessmentRu/><aside className="space-y-4"><div className="border bg-white p-5"><h2 className="font-serif text-xl font-bold">Что вы узнаете</h2><p className="mt-2 text-sm leading-6">Какие темы следует проверить, где прочитать официальные правила и как продолжить работу самостоятельно.</p></div><div className="border bg-white p-5"><h2 className="font-serif text-xl font-bold">Помощь KIA</h2><p className="mt-2 text-sm">Ассистентка объяснит термин простыми словами и задаст вопросы по одному.</p><div className="mt-3"><KiaRgpdAction topic="rgpd-guided-ru">Задать вопрос KIA</KiaRgpdAction></div></div><div className="border bg-white p-5"><h2 className="font-serif text-xl font-bold">Обучение с EXPERT</h2><p className="mt-2 text-sm">Практическая онлайн-сессия 2 часа — 180 € + НДС (217,80 €).</p><Link href="/ru/uslugi/obuchenie-rgpd" className="mt-3 inline-block font-bold underline">Программа обучения →</Link></div></aside></div></section>
   <section id="resursy" className="border-t bg-white px-6 py-12"><div className="mx-auto max-w-6xl"><h2 className="font-serif text-2xl font-bold">Три бесплатных инструмента испанского регулятора AEPD</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{[
   {name:'Facilita RGPD',href:'https://www.aepd.es/guias-y-herramientas/herramientas/facilita-rgpd',desc:'Для типовых операций с персональными данными при низком риске.'},
   {name:'Facilita EMPRENDE',href:'https://www.aepd.es/guias-y-herramientas/herramientas/facilita-emprende',desc:'Для стартапов, приложений и инновационных проектов.'},
   {name:'Gestiona RGPD',href:'https://gestiona2.aepd.es/',desc:'Для учёта обработок и организации работы с рисками.'}
   ].map(x=><a key={x.name} href={x.href} target="_blank" rel="noopener noreferrer" className="border p-5 hover:border-[#D4A017]"><strong>{x.name} ↗</strong><p className="mt-2 text-sm">{x.desc}</p></a>)}</div><p className="mt-5 text-sm">Важно: использование инструмента или получение документов не означает автоматического соблюдения RGPD. Организация отвечает за выполнение требований и должна уметь подтвердить принятые меры.</p></div></section>
   <section className="px-6 py-12"><div className="mx-auto max-w-6xl"><h2 className="font-serif text-2xl font-bold">Статьи и инструкции</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
   <Link href="/ru/blog/instrumenty-aepd-rgpd-sravnenie" className="border bg-white p-5 font-semibold">Facilita RGPD, Facilita EMPRENDE и Gestiona RGPD: в чём разница →</Link>
   <Link href="/ru/blog/rgpd-platformy-kandidaty" className="border bg-white p-5 font-semibold">Персональные данные в цифровых платформах и при подборе персонала →</Link>
   <Link href="/ru/docs/rgpd-dokazatelstva-sootvetstviya" className="border bg-white p-5 font-semibold">Как проверить и подтвердить соблюдение RGPD →</Link>
   <Link href="/ru/docs/rgpd-vybor-aepd" className="border bg-white p-5 font-semibold">Как выбрать подходящий инструмент AEPD →</Link></div></div></section>
   <section className="border-t bg-white px-6 py-10"><div className="mx-auto max-w-6xl"><h2 className="font-serif text-2xl font-bold">Частые вопросы</h2><div className="mt-4 space-y-3">{[
   {q:'Нужно ли регистрироваться в AEPD?',a:'Обычно общей регистрации компании в AEPD нет. Необходимо соблюдать обязанности RGPD и, когда применимо, вести реестр операций обработки.'},
   {q:'Доказывает ли анкета соблюдение закона?',a:'Нет. Нужны реальные меры, документы и возможность подтвердить их применение.'},
   {q:'Нужна ли аккредитованная консалтинговая фирма?',a:'Для обычной консультации по RGPD специальная аккредитация AEPD не требуется; формальная сертификация регулируется отдельно.'},
   {q:'Можно ли пройти формы вместе с EXPERT?',a:'Да, предлагаем индивидуальное двухчасовое обучение онлайн за 180 € + НДС. Аудит и сертификация не входят в стоимость.'}
   ].map(x=><details key={x.q} className="border p-4"><summary className="cursor-pointer font-semibold">{x.q}</summary><p className="mt-2 text-sm">{x.a}</p></details>)}</div><div className="mt-6 flex flex-wrap gap-3"><Link href="/ru/uslugi/obuchenie-rgpd" className="rounded bg-[#D4A017] px-5 py-3 font-bold">Обучение RGPD · 180 € + НДС</Link><KiaRgpdAction topic="rgpd-guided-ru">Спросить KIA</KiaRgpdAction><a href="https://t.me/kia_expert_bot" target="_blank" rel="noopener noreferrer" className="rounded border px-5 py-3 font-semibold">KIA в Telegram ↗</a></div></div></section>
 </main>;
}
