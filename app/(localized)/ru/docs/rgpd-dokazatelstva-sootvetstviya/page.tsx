import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocalePubliclyEnabled, shouldIndexLocale } from '@/lib/i18n/feature-flags';
import { KiaRgpdAction } from '@/components/tools/KiaRgpdAction';

export const metadata: Metadata={
 title:"Как оценивать соблюдение RGPD: документы и реальные доказательства | EXPERT",description:"Опросник не подтверждает соблюдение закона. Ответственный должен принять меры и уметь это доказать.",
 alternates:{canonical:'https://expertconsulting.es/ru/docs/rgpd-dokazatelstva-sootvetstviya',languages:{'es-ES':'https://expertconsulting.es/docs/formacion-rgpd-criterios-cumplimiento-y-evidencias','ru-RU':'https://expertconsulting.es/ru/docs/rgpd-dokazatelstva-sootvetstviya'}},
 robots:{index:shouldIndexLocale('ru'),follow:shouldIndexLocale('ru')}
};
export default function RuRgpdResourcePage(){
 if(!isLocalePubliclyEnabled('ru'))notFound();
 return <main className="bg-[#F8F6F1] text-[#0D1B2A]"><article className="mx-auto max-w-4xl space-y-7 px-6 py-12"><div><p className="text-sm font-bold text-[#94700A]">EXPERT · База знаний · проверено 15.10.2026</p><h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Как оценивать соблюдение RGPD: документы и реальные доказательства</h1><p className="mt-4 leading-7">Опросник не подтверждает соблюдение закона. Ответственный должен принять меры и уметь это доказать.</p></div><section><h2 className="font-serif text-2xl font-bold">Что проверить</h2><p className="mt-3 leading-7">Перечень видов обработки (RAT), правовые основания, информацию для пользователей, договоры с обработчиками, безопасность, сроки хранения, права людей и управление рисками.</p></section>
<section><h2 className="font-serif text-2xl font-bold">Как оформлять вывод</h2><p className="mt-3 leading-7">Указать дату, область проверки, документы и факты, ограничения и задачи, которые ещё нужно решить. Не обещать стопроцентную неизменную защиту.</p></section>
<section><h2 className="font-serif text-2xl font-bold">Консультант или сертификат</h2><p className="mt-3 leading-7">Для обычной консультации не нужна общая аккредитация AEPD. Официальные схемы сертификации операций обработки регулируются статьями 42 и 43 RGPD и не снимают ответственность с организации.</p></section>
<section><h2 className="font-serif text-2xl font-bold">Когда нужна экспертная оценка</h2><p className="mt-3 leading-7">Чувствительные сведения, автоматизированные решения, крупные масштабы, инциденты и другие факторы высокого риска требуют индивидуального анализа.</p></section><section className="border border-[#D4A017]/30 bg-white p-6"><h2 className="font-serif text-xl font-bold">Бесплатные материалы и помощь EXPERT</h2><p className="mt-2 text-sm">Информация носит ориентировочный характер. Использование инструментов не подтверждает полное соблюдение RGPD. Правовая основа: Регламент (ЕС) 2016/679 (статьи 5, 6, 9, 24, 28, 35).</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/ru/instrumenty/rgpd" className="rounded border px-4 py-3 font-semibold">Бесплатная анкета RGPD</Link><Link href="/ru/uslugi/obuchenie-rgpd" className="rounded bg-[#D4A017] px-4 py-3 font-bold">Обучение 2 часа · 180 € + НДС</Link><KiaRgpdAction topic="rgpd-guided-ru">Спросить KIA</KiaRgpdAction></div><a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/rus" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm underline">Регламент (ЕС) 2016/679 →</a></section></article></main>;
}
