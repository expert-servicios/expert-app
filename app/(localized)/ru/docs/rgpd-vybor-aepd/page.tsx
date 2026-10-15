import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocalePubliclyEnabled, shouldIndexLocale } from '@/lib/i18n/feature-flags';
import { KiaRgpdAction } from '@/components/tools/KiaRgpdAction';

export const metadata: Metadata={
 title:"Пошаговый выбор инструмента AEPD для предпринимателя | EXPERT",description:"Маршрут для autónomo, стартапа и компании с разными видами обработки персональных данных.",
 alternates:{canonical:'https://expertconsulting.es/ru/docs/rgpd-vybor-aepd',languages:{'es-ES':'https://expertconsulting.es/docs/rgpd-aepd-ruta-decisiones-para-startups','ru-RU':'https://expertconsulting.es/ru/docs/rgpd-vybor-aepd'}},
 robots:{index:shouldIndexLocale('ru'),follow:shouldIndexLocale('ru')}
};
export default function RuRgpdResourcePage(){
 if(!isLocalePubliclyEnabled('ru'))notFound();
 return <main className="bg-[#F8F6F1] text-[#0D1B2A]"><article className="mx-auto max-w-4xl space-y-7 px-6 py-12"><div><p className="text-sm font-bold text-[#94700A]">EXPERT · База знаний · проверено 15.10.2026</p><h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Пошаговый выбор инструмента AEPD для предпринимателя</h1><p className="mt-4 leading-7">Маршрут для autónomo, стартапа и компании с разными видами обработки персональных данных.</p></div><section><h2 className="font-serif text-2xl font-bold">Шаг 1: понять виды данных</h2><p className="mt-3 leading-7">Не нужно вводить сведения клиентов, фотографии и резюме: достаточно описания категорий и целей.</p></section>
<section><h2 className="font-serif text-2xl font-bold">Шаг 2: выбрать инструмент</h2><p className="mt-3 leading-7">Facilita RGPD подходит только для упрощённых случаев с низким риском; Facilita EMPRENDE — для инновационных проектов; Gestiona RGPD — для организации обработки и рисков.</p></section>
<section><h2 className="font-serif text-2xl font-bold">Шаг 3: выполнить реальные меры</h2><p className="mt-3 leading-7">Документы сами по себе не обеспечивают соблюдения: нужны работающие процессы, права, безопасность, контроль сроков и договоры.</p></section>
<section><h2 className="font-serif text-2xl font-bold">Шаг 4: проверить результат</h2><p className="mt-3 leading-7">В случае сомнений, данных о здоровье, профилирования и большого объёма информации требуется дополнительная профессиональная проверка.</p></section><section className="border border-[#D4A017]/30 bg-white p-6"><h2 className="font-serif text-xl font-bold">Бесплатные материалы и помощь EXPERT</h2><p className="mt-2 text-sm">Информация носит ориентировочный характер. Использование инструментов не подтверждает полное соблюдение RGPD. Правовая основа: Регламент (ЕС) 2016/679 (статьи 5, 6, 9, 24, 28, 35).</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/ru/instrumenty/rgpd" className="rounded border px-4 py-3 font-semibold">Бесплатная анкета RGPD</Link><Link href="/ru/uslugi/obuchenie-rgpd" className="rounded bg-[#D4A017] px-4 py-3 font-bold">Обучение 2 часа · 180 € + НДС</Link><KiaRgpdAction topic="rgpd-guided-ru">Спросить KIA</KiaRgpdAction></div><a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/rus" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm underline">Регламент (ЕС) 2016/679 →</a></section></article></main>;
}
