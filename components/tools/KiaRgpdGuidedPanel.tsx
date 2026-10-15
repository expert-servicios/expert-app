'use client';
import { useMemo,useState } from 'react';
import Link from 'next/link';
import { RGPD_QUESTIONS,getRgpdQuestion,evaluateRgpdAssessment,type RgpdAnswer,type RgpdLanguage } from '@/lib/rgpd/assessment-contract';
import { AEPD_TOOLS,recommendAepdTools } from '@/lib/rgpd/aepd-tool-recommendation';

export function KiaRgpdGuidedPanel({locale,onClose}:{locale:RgpdLanguage;onClose:()=>void}) {
 const [answers,setAnswers]=useState<Record<string,RgpdAnswer>>({});
 const [step,setStep]=useState(0);
 const question=getRgpdQuestion(step,locale);
 const recommendation=useMemo(()=>recommendAepdTools(answers),[answers]);
 const evaluation=useMemo(()=>evaluateRgpdAssessment(answers),[answers]);
 const ru=locale==='ru';
 const choose=(value:RgpdAnswer)=>{
   if(!question)return;
   setAnswers(a=>({...a,[question.id]:value}));
   setStep(s=>Math.min(RGPD_QUESTIONS.length,s+1));
 };
 return <section aria-label={ru?'Анкета RGPD с KIA':'Cuestionario RGPD con KIA'} className="rounded-xl border-2 border-[#D4A017]/40 bg-[#f8f6f1] p-3 text-sm">
  <div className="mb-3 flex items-center justify-between gap-2"><strong>{ru?'KIA · Предварительная оценка RGPD':'KIA · Evaluación RGPD guiada'}</strong><button type="button" onClick={onClose} className="text-xs underline">{ru?'Закрыть':'Cerrar'}</button></div>
  {question ? <div className="space-y-3"><span className="text-xs">{ru?'Вопрос':'Pregunta'} {step+1}/{RGPD_QUESTIONS.length}</span><p className="font-semibold">{question.title}</p><div className="grid gap-2">{question.options.map(o=><button type="button" key={String(o.value)} onClick={()=>choose(o.value)} className="min-h-10 rounded border bg-white px-3 py-2 text-left hover:border-[#D4A017] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]">{o.label}</button>)}</div><button type="button" disabled={step===0} onClick={()=>setStep(v=>v-1)} className="text-xs underline disabled:opacity-40">{ru?'Назад':'Atrás'}</button></div>
  : <div className="space-y-3" role="status" aria-live="polite"><strong>{ru?'Ваша ориентировочная рекомендация':'Tu recomendación orientativa'}</strong><p>{AEPD_TOOLS[recommendation.primary].title}</p><p>{ru?'Это не сертификат соблюдения RGPD.':'Esto no certifica cumplimiento RGPD.'}</p><p>{ru?'Нужна дополнительная проверка: ':'Revisión profesional: '}{evaluation.level==='high'||recommendation.needsProfessionalReview?(ru?'рекомендуется':'recomendada'):(ru?'по обстоятельствам':'según el caso')}</p><a className="block underline" target="_blank" rel="noopener noreferrer" href={AEPD_TOOLS[recommendation.primary].url}>{ru?'Официальный инструмент AEPD ↗':'Herramienta oficial AEPD ↗'}</a><Link className="block underline" href={ru?'/ru/uslugi/obuchenie-rgpd':'/servicios/empresas-autonomos/formacion-rgpd-aepd'}>{ru?'Обучение 2 часа · 180 € + НДС':'Formación 2 horas · 180 € + IVA'}</Link><button className="block text-xs underline" type="button" onClick={()=>{setAnswers({});setStep(0)}}>{ru?'Начать заново':'Reiniciar'}</button></div>}
  <p className="mt-4 text-xs text-[#52606D]">{ru?'Вопросы и ответы остаются в вашем браузере и не отправляются в чат KIA.':'Las respuestas permanecen en este navegador; no se envían al chat ni se registran como lead.'}</p>
 </section>;
}
