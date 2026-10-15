'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, TriangleAlert } from 'lucide-react';
import { RgpdImplementationPlan } from '@/components/tools/RgpdImplementationPlan';
import { RgpdWorkspace } from '@/components/tools/RgpdWorkspace';
import { RgpdProviderInventory } from '@/components/tools/RgpdProviderInventory';
import { RgpdRetentionMatrix } from '@/components/tools/RgpdRetentionMatrix';
import { RgpdDocumentPack } from '@/components/tools/RgpdDocumentPack';
import { RgpdFinalReview } from '@/components/tools/RgpdFinalReview';
import { RgpdAccountSave } from '@/components/tools/RgpdAccountSave';
import { AEPD_TOOLS, recommendAepdTools } from '@/lib/rgpd/aepd-tool-recommendation';
import { RGPD_MODULE_TOPICS, RGPD_SIGNAL_TOPICS } from '@/lib/rgpd/plain-language-review-topics';
import { RgpdReportLeadForm } from '@/components/tools/RgpdReportLeadForm';
import { RGPD_QUESTIONS, evaluateRgpdAssessment, getRgpdQuestion, type RgpdAnswer } from '@/lib/rgpd/assessment-contract';

type Answer = RgpdAnswer;
const QUESTIONS = RGPD_QUESTIONS.map(q => ({...q, title:q.title.es}));

function buildQuoteHref() {
  // No scores, answers, warning flags or notes in URL/query strings.
  return '/solicitar-presupuesto?servicio=proteccion-datos-rgpd&origen=rgpd-autoimplantacion';
}

export function RgpdSelfAssessment({ hourlyRateEur }: { hourlyRateEur?: number }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const current = QUESTIONS[step];
  const answered = current ? answers[current.id] !== undefined : true;

  const result = useMemo(() => evaluateRgpdAssessment(answers, hourlyRateEur), [answers, hourlyRateEur]);

  const aepdRecommendation = useMemo(() => recommendAepdTools(answers), [answers]);
  const isResult = step >= QUESTIONS.length;

  const setAnswer = (value: Answer) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const next = () => {
    if (!answered) return;
    setStep((s) => Math.min(QUESTIONS.length, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const reset = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <div className="border border-[#D4A017]/25 bg-white">
      <div className="border-b border-[#D4A017]/20 bg-[#0D1B2A] px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">Herramienta gratuita</p>
            <p className="mt-1 text-sm text-white/70">Las respuestas se procesan aquí, en tu navegador. Solo enviaremos las categorías necesarias si solicitas expresamente un informe personalizado.</p>
          </div>
          <ShieldCheck className="h-7 w-7 shrink-0 text-[#D4A017]" />
        </div>
        <div className="mt-4 h-1 overflow-hidden bg-white/10">
          <div
            className="h-full bg-[#D4A017] transition-all"
            style={{ width: `${Math.round((Math.min(step, QUESTIONS.length) / QUESTIONS.length) * 100)}%` }}
          />
        </div>
      </div>

      <div className="p-5 md:p-7">
        {!isResult && current && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">
              Pregunta {step + 1} de {QUESTIONS.length}
            </p>
            <h2 className="mt-3 font-serif text-2xl font-bold leading-tight">{current.title}</h2>
            
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {getRgpdQuestion(step,'es')?.options.map(option=><button
                key={String(option.value)}
                type="button"
                onClick={()=>setAnswer(option.value)}
                aria-pressed={answers[current.id] === option.value}
                className={`min-h-12 border px-4 py-3 text-left text-sm font-semibold transition ${answers[current.id] === option.value?'border-[#D4A017] bg-[#D4A017]/10':'border-[#D4A017]/25 hover:border-[#D4A017]'}`}
              >{option.label}</button>)}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <button type="button" onClick={back} disabled={step === 0} className="inline-flex min-h-11 items-center gap-2 border border-[#D4A017]/30 px-4 text-sm font-semibold disabled:invisible">
                <ChevronLeft className="h-4 w-4" /> Atrás
              </button>
              <button type="button" onClick={next} disabled={!answered} className="inline-flex min-h-11 items-center gap-2 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A] disabled:opacity-40">
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {isResult && (
          <div>
            <div className="flex items-start gap-3">
              {result.level === 'high' ? (
                <TriangleAlert className="mt-1 h-7 w-7 shrink-0 text-[#D4A017]" />
              ) : (
                <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#D4A017]" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Resultado orientativo</p>
                <h2 className="mt-1 font-serif text-2xl font-bold">{result.tier}</h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">{result.message}</p>
              </div>
            </div>

            <div className="mt-6 border-2 border-[#D4A017]/40 bg-[#F8F6F1] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Orientación gratuita · herramientas oficiales AEPD</p>
              <h3 className="mt-2 font-serif text-xl font-bold">Herramienta inicial recomendada: {AEPD_TOOLS[aepdRecommendation.primary].title}</h3>
              <p className="mt-2 text-sm leading-6">{aepdRecommendation.rationale}</p>
              <a href={AEPD_TOOLS[aepdRecommendation.primary].url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-bold underline">Abrir {AEPD_TOOLS[aepdRecommendation.primary].title} (AEPD) ↗</a>
              {aepdRecommendation.complementary.length > 0 && <p className="mt-3 text-sm">Como complemento: {aepdRecommendation.complementary.map(id => <a key={id} href={AEPD_TOOLS[id].url} target="_blank" rel="noopener noreferrer" className="mr-2 underline">{AEPD_TOOLS[id].title} ↗</a>)}</p>}
              {aepdRecommendation.cautions.map((warning,i)=><p key={i} className="mt-2 text-sm font-medium text-amber-900">{warning}</p>)}
              <p className="mt-3 text-xs text-slate-600">Esta sugerencia no acredita un nivel de riesgo ni certifica cumplimiento. La elección definitiva depende de los tratamientos reales.</p>
              <Link href="/servicios/empresas-autonomos/formacion-rgpd-aepd" className="mt-4 inline-flex font-semibold underline">Formación guiada 2 h · 180 € + IVA →</Link>
            </div>

            <div className="mt-5 border border-[#D4A017]/20 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">¿Necesitas ayuda para aplicar las recomendaciones?</p>
              <p className="mt-2 font-serif text-lg font-bold">Formación online guiada · 2 horas · 180 € + IVA</p>
              <p className="mt-2 text-sm leading-6">Te enseñamos a utilizar las herramientas gratuitas de la AEPD con ejemplos de tu negocio. No es una auditoría ni una certificación oficial.</p>
              <p className="mt-2 text-sm">Si necesitas revisión jurídica o implantación profesional completa, prepararemos un presupuesto independiente según el alcance.</p>
              <Link href="/servicios/empresas-autonomos/formacion-rgpd-aepd" className="mt-3 inline-block font-bold underline">Ver programa de formación y precio →</Link>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <div className="border border-[#D4A017]/20 bg-[#F8F6F1] p-5">
                <h3 className="font-serif text-xl font-bold">Tu plan de acción explicado paso a paso</h3>
                <p className="mt-2 text-sm">Son temas que conviene comprobar; no significa que estén incumplidos.</p>
                <ul className="mt-3 space-y-2 text-sm text-[#23364D]">
                  {result.moduleIds.map((id, index) => {
                    const topic = RGPD_MODULE_TOPICS[id];
                    return topic ? <li key={id} className="border-b border-[#D4A017]/15 pb-4 last:border-0">
                      <p className="font-bold">{index + 1}. {topic.title}</p>
                      <p className="mt-1"><strong>¿Por qué importa?</strong> {topic.why}</p>
                      <p className="mt-2"><strong>Qué puedes hacer:</strong> {topic.action}</p>
                      <Link href={topic.guide} className="mt-2 inline-block font-semibold text-[#94700A] underline">{topic.guideTitle} →</Link>
                    </li> : null;
                  })}
                </ul>
              </div>

              <div className="border border-[#D4A017]/20 bg-[#F8F6F1] p-5">
                <h3 className="font-bold">Siguiente paso</h3>
                {result.level === 'low' ? (
                  <p className="mt-3 text-sm leading-6 text-[#23364D]">
                    Continúa con las guías gratuitas de EXPERT y utiliza los modelos como punto de partida. Revisa el resultado cada vez que cambien tus tratamientos.
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[#23364D]">
                    Conviene que un profesional revise el alcance antes de cerrar documentos o tomar decisiones sobre riesgo, EIPD o transferencias.
                  </p>
                )}
              </div>
            </div>

            {result.level !== 'high' && (
              <>
                <RgpdImplementationPlan moduleIds={result.moduleIds} />
                <RgpdWorkspace />
                <RgpdProviderInventory />
                <RgpdRetentionMatrix />
                <RgpdDocumentPack />
                <RgpdFinalReview />
                <RgpdAccountSave />
              </>
            )}

            {QUESTIONS.some(q => q.hardRisk && (answers[q.id] === true || answers[q.id] === 'unknown')) && (
              <div className="mt-5 border-l-4 border-[#D4A017] bg-[#D4A017]/8 p-4">
                <p className="text-base font-bold">Temas que conviene aclarar antes de seguir</p>
                <ul className="mt-2 space-y-1 text-sm text-[#23364D]">
                  {QUESTIONS.filter(q => q.hardRisk && (answers[q.id] === true || answers[q.id] === 'unknown')).map(q => {
                    const topic = RGPD_SIGNAL_TOPICS[q.id];
                    return topic ? <li key={q.id} className="mb-4 border-b border-[#D4A017]/15 pb-3 last:border-0">
                      <p className="font-bold">{topic.title}{answers[q.id] === 'unknown' ? ' · Por aclarar' : ''}</p>
                      <p className="mt-1">{topic.why}</p>
                      <p className="mt-2"><strong>Qué revisar:</strong> {topic.action}</p>
                      <Link href={topic.guide} className="mt-2 inline-block font-semibold underline">{topic.guideTitle} →</Link>
                    </li> : null;
                  })}
                </ul>
              </div>
            )}

            {process.env.NEXT_PUBLIC_RGPD_REPORT_ENABLED === 'true' && <RgpdReportLeadForm answers={answers} />}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {result.level === 'low' ? (
                <Link href="/docs/checklist-rgpd-autonomos-pymes" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A]">
                  Empezar autoimplantación <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href={buildQuoteHref()}
                  className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A]"
                >
                  Solicitar presupuesto <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center border border-[#D4A017]/35 px-5 text-sm font-semibold">
                Repetir cuestionario
              </button>
            </div>

            <p className="mt-6 text-xs leading-5 text-[#6B7280]">
              Esta herramienta ofrece orientación inicial. No certifica el cumplimiento del RGPD/LOPDGDD ni sustituye una evaluación jurídica o de riesgos cuando sea necesaria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
