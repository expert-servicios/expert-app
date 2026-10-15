'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AEPD_TOOLS, recommendAepdTools } from '@/lib/rgpd/aepd-tool-recommendation';
import { KiaRgpdAction } from '@/components/tools/KiaRgpdAction';
import { RgpdReportLeadForm } from '@/components/tools/RgpdReportLeadForm';
import { RGPD_QUESTIONS, getRgpdQuestion, type RgpdAnswer } from '@/lib/rgpd/assessment-contract';

type Answer = RgpdAnswer;
const QUESTIONS = RGPD_QUESTIONS;
const GUIDES = [
 {id:'rat',title:'Составить перечень операций с данными',why:'Нужно знать, зачем вы собираете сведения о клиентах, работниках и пользователях.',action:'Запишите основные процессы, цель и виды данных.'},
 {id:'privacy',title:'Понятно объяснить, как используются данные',why:'Пользователь должен понимать, кто и зачем обрабатывает сведения.',action:'Проверьте формы, уведомления и политику конфиденциальности.'},
 {id:'processors',title:'Проверить поставщиков и подрядчиков',why:'Облачные платформы, CRM и сервисы почты могут иметь доступ к информации.',action:'Составьте список сервисов и проверьте условия и необходимость договора обработчика.'},
 {id:'security',title:'Защитить доступ и файлы',why:'Нужны меры безопасности с учётом реальных рисков.',action:'Проверьте роли пользователей, двухфакторную защиту и резервные копии.'},
 {id:'rights',title:'Настроить ответы на запросы людей',why:'Люди могут запросить доступ, исправление или удаление данных.',action:'Определите, кто принимает запросы и как соблюдаются сроки.'},
 {id:'breaches',title:'Подготовить порядок действий при утечке',why:'Инциденты нужно фиксировать и оценивать необходимость уведомления.',action:'Назначьте ответственного и документируйте инциденты.'},
 {id:'retention',title:'Установить сроки хранения',why:'Данные не следует хранить бесконечно без оснований.',action:'Определите сроки по цели и обязательствам закона.'},
 {id:'web',title:'Проверить сайт, формы и cookies',why:'Формы и средства аналитики могут собирать персональную информацию.',action:'Убедитесь в наличии необходимой информации и надлежащих настройках согласия.'},
];
const TOOLS_RU: Record<string,string> = {'facilita-rgpd':'Facilita RGPD — для обычных обработок с низким риском','facilita-emprende':'Facilita EMPRENDE — для стартапов и цифровых платформ','gestiona-rgpd':'Gestiona RGPD — для перечня обработок и управления рисками'};

export function RgpdAssessmentRu() {
 const [answers,setAnswers]=useState<Record<string,Answer>>({});
 const [step,setStep]=useState(0);
 const done=step>=QUESTIONS.length;
 const recommendation=useMemo(()=>recommendAepdTools(answers),[answers]);
 const riskIds=['special','minors','profiling','location','largeScale','innovative','breach'];
 const riskConcern=riskIds.some(id=>answers[id]===true||answers[id]==='unknown')||answers.businessType==='unknown'||answers.international==='unknown';
 const moduleIds=['rat','privacy',...(answers.processors===true||answers.international===true?['processors']:[]),'security','rights','breaches','retention',...(answers.website===true||answers.cookies==='basic'||answers.cookies==='advanced'?['web']:[])];
 const current=getRgpdQuestion(step,'ru');
 return <div className="border border-[#D4A017]/30 bg-white p-5 text-[#0D1B2A] md:p-8">
   <div className="mb-5 flex items-center justify-between gap-3"><span className="text-sm font-bold">Бесплатная предварительная оценка</span><span className="text-xs">{done?'Результат':`${step+1} из ${QUESTIONS.length}`}</span></div>
   {!done && current ? <div className="space-y-5">
     <div className="h-2 w-full bg-[#E9E2D6]"><div className="h-2 bg-[#D4A017]" style={{width:`${100*step/QUESTIONS.length}%`}} /></div>
     <h2 className="font-serif text-xl font-bold">{current.title}</h2>
     <div className="grid gap-3">{current.options.map(o=><button key={String(o.value)} type="button" onClick={()=>setAnswers(p=>({...p,[current.id]:o.value}))} aria-pressed={answers[current.id]===o.value} className={`min-h-12 rounded border px-4 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-[#D4A017] ${answers[current.id]===o.value?'border-[#D4A017] bg-[#FFF4D4] font-bold':'border-[#D4A017]/30'}`}>{o.label}</button>)}</div>
     <div className="flex items-center justify-between gap-3"><button type="button" disabled={step===0} onClick={()=>setStep(v=>v-1)} className="min-h-11 px-3 disabled:opacity-40">← Назад</button><button type="button" disabled={answers[current.id]===undefined} onClick={()=>setStep(v=>v+1)} className="min-h-11 rounded bg-[#D4A017] px-5 font-bold disabled:opacity-40">{step===QUESTIONS.length-1?'Показать рекомендации':'Далее →'}</button></div>
   </div> : <div className="space-y-6">
     <h2 className="font-serif text-2xl font-bold">Ваш первоначальный план действий</h2>
     <p className="text-sm leading-6">Это ориентир, а не проверка соблюдения закона. Вопросы не доказывают нарушение. Ответы обрабатываются в браузере. При заказе персонального отчёта необходимые категории ответов будут отправлены для его подготовки.</p>
     <section className="border border-[#D4A017]/30 bg-[#F8F6F1] p-4">
       <h3 className="font-bold">С чего начать: {TOOLS_RU[recommendation.primary]}</h3>
       <p className="mt-2 text-sm">{recommendation.primary==='facilita-emprende'?'Ваша деятельность похожа на технологический стартап. Официальная анкета поможет подготовить документы, которые затем нужно проверить и адаптировать.':recommendation.primary==='facilita-rgpd'?'Для обычных обработок с низким риском можно начать с облегчённого инструмента, но сначала убедиться в условиях его применимости.':'Для нескольких обработок или при неопределённости сначала составьте перечень операций и оцените риски.'}</p>
       <a href={AEPD_TOOLS[recommendation.primary].url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-bold underline">Открыть официальный инструмент AEPD ↗</a>
       {recommendation.complementary.map(id=><p key={id} className="mt-2 text-sm"><a href={AEPD_TOOLS[id].url} target="_blank" rel="noopener noreferrer" className="underline">Дополнительно: {TOOLS_RU[id]} ↗</a></p>)}
     </section>
     {riskConcern&&<div className="border-l-4 border-amber-600 bg-amber-50 p-4 text-sm"><strong>Требуется дополнительная проверка.</strong><p className="mt-1">Есть сложные или неуточнённые обработки. Возможно, необходимы анализ рисков и оценка воздействия (EIPD), но это нельзя автоматически определить по ответам.</p>{answers.breach===true&&<p className="mt-2 font-semibold">Если утечка происходит сейчас, не откладывайте проверку обязательств по уведомлению.</p>}</div>}
     <section><h3 className="font-serif text-xl font-bold">Что проверить на практике</h3><div className="mt-3 grid gap-3">{GUIDES.filter(g=>moduleIds.includes(g.id)).map((g,i)=><div key={g.id} className="border border-[#D4A017]/20 p-4"><h4 className="font-bold">{i+1}. {g.title}</h4><p className="mt-1 text-sm">{g.why}</p><p className="mt-2 text-sm"><strong>Первый шаг:</strong> {g.action}</p><Link href="/ru/instrumenty/rgpd#resursy" className="mt-2 inline-block text-sm font-semibold underline">Материалы и ссылки →</Link></div>)}</div></section>
     {process.env.NEXT_PUBLIC_RGPD_REPORT_ENABLED === 'true' && <RgpdReportLeadForm answers={answers} locale="ru" />}
     <div className="flex flex-wrap gap-3"><Link href="/ru/uslugi/obuchenie-rgpd" className="inline-flex min-h-11 items-center rounded bg-[#D4A017] px-4 font-bold">Обучение 2 часа — 180 € + НДС</Link><KiaRgpdAction topic="rgpd-guided-ru">Спросить KIA</KiaRgpdAction><button type="button" onClick={()=>{setAnswers({});setStep(0)}} className="min-h-11 px-4 underline">Начать заново</button></div>
   </div>}
 </div>;
}
