'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, TriangleAlert } from 'lucide-react';
import { RgpdImplementationPlan } from '@/components/tools/RgpdImplementationPlan';
import { RgpdWorkspace } from '@/components/tools/RgpdWorkspace';

type Answer = boolean | 'none' | 'basic' | 'advanced';

type Question = {
  id: string;
  title: string;
  description?: string;
  kind?: 'boolean' | 'cookies';
  hardRisk?: boolean;
  weight?: number;
};

const QUESTIONS: Question[] = [
  { id: 'employees', title: '¿Tienes empleados o colaboradores con acceso a datos personales?', weight: 1 },
  { id: 'website', title: '¿Tu web recoge datos mediante formularios, reservas, newsletter o cuentas de usuario?', weight: 1 },
  { id: 'cookies', title: '¿Utilizas analítica, publicidad, píxeles o cookies no necesarias?', kind: 'cookies', weight: 1 },
  { id: 'processors', title: '¿Usas proveedores que acceden a datos (gestoría, CRM, cloud, email marketing, soporte, IA)?', weight: 1 },
  { id: 'international', title: '¿Algún proveedor o subencargado trata datos fuera del EEE?', weight: 2 },
  { id: 'special', title: '¿Tratas datos de salud u otras categorías especiales del artículo 9 RGPD?', hardRisk: true, weight: 4 },
  { id: 'minors', title: '¿Tratas datos de menores de forma relevante para el servicio?', hardRisk: true, weight: 4 },
  { id: 'profiling', title: '¿Realizas perfiles, scoring, decisiones automatizadas o publicidad basada en comportamiento individual?', hardRisk: true, weight: 4 },
  { id: 'location', title: '¿Recoges geolocalización, monitorización sistemática, audio o videovigilancia avanzada?', hardRisk: true, weight: 4 },
  { id: 'largeScale', title: '¿Tratas datos a gran escala o de un número muy elevado de personas?', hardRisk: true, weight: 4 },
  { id: 'innovative', title: '¿Tu producto usa IA u otra tecnología innovadora para inferir, clasificar o predecir información sobre personas?', hardRisk: true, weight: 4 },
  { id: 'breach', title: '¿Tienes ahora una brecha o incidente de datos personales sin cerrar?', hardRisk: true, weight: 5 },
];

const MODULES = [
  ['rat', 'Registro de Actividades de Tratamiento (RAT)'],
  ['privacy', 'Cláusulas informativas y política de privacidad'],
  ['processors', 'Contratos y revisión de encargados'],
  ['security', 'Medidas de seguridad y control de accesos'],
  ['rights', 'Procedimiento para ejercicio de derechos'],
  ['breaches', 'Registro y protocolo de brechas'],
  ['retention', 'Conservación, bloqueo y supresión'],
  ['web', 'Web, formularios, cookies y comunicaciones'],
] as const;

function buildQuoteHref(params: {
  tier: string;
  score: number;
  modules: string[];
  hardFlags: string[];
}) {
  const summary = [
    `Resultado herramienta RGPD: ${params.tier}.`,
    `Puntuación orientativa: ${params.score}.`,
    `Módulos detectados: ${params.modules.join(', ')}.`,
    params.hardFlags.length ? `Señales de revisión profesional: ${params.hardFlags.join(', ')}.` : '',
    'Origen: herramienta pública de autoimplantación RGPD.',
  ].filter(Boolean).join(' ');

  const qs = new URLSearchParams({
    servicio: 'proteccion-datos-rgpd',
    origen: 'rgpd-autoimplantacion',
    tipo: 'caso-complejo',
    resumen: summary,
  });
  return `/solicitar-presupuesto?${qs.toString()}`;
}

export function RgpdSelfAssessment({ hourlyRateEur }: { hourlyRateEur?: number }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const current = QUESTIONS[step];
  const answered = current ? answers[current.id] !== undefined : true;

  const result = useMemo(() => {
    let score = 0;
    const hardFlags: string[] = [];

    for (const q of QUESTIONS) {
      const answer = answers[q.id];
      const positive = answer === true || answer === 'advanced';
      if (positive) {
        score += q.weight ?? 1;
        if (q.hardRisk) hardFlags.push(q.title);
      }
    }

    const modules = ['rat', 'privacy', 'security', 'rights', 'breaches', 'retention'];
    if (answers.processors === true || answers.international === true || answers.innovative === true) modules.push('processors');
    if (answers.website === true || answers.cookies === 'basic' || answers.cookies === 'advanced') modules.push('web');

    const moduleIds = MODULES.filter(([id]) => modules.includes(id)).map(([id]) => id);
    const moduleLabels = MODULES.filter(([id]) => modules.includes(id)).map(([, label]) => label);

    let tier = 'Autoimplantación guiada';
    let level: 'low' | 'medium' | 'high' = 'low';
    let message = 'Tu perfil encaja, a priori, con un recorrido guiado de bajo riesgo. La herramienta puede ayudarte a ordenar la documentación y tareas, pero no certifica cumplimiento.';

    if (hardFlags.length > 0 || score >= 8) {
      tier = 'Revisión profesional recomendada';
      level = 'high';
      message = 'Hay señales que requieren analizar el tratamiento con más detalle. No conviene cerrar la implantación únicamente con un asistente automático.';
    } else if (score >= 4) {
      tier = 'Autoimplantación + revisión final';
      level = 'medium';
      message = 'Puedes completar gran parte del trabajo con la herramienta, pero recomendamos una revisión final de coherencia, proveedores, web y medidas de seguridad.';
    }

    const estimatedHours =
      level === 'low'
        ? { min: 0, max: 2 }
        : level === 'medium'
          ? { min: 3, max: 5 }
          : hardFlags.length >= 3 || score >= 14
            ? { min: 8, max: 12 }
            : { min: 5, max: 8 };

    const estimatedPrice = hourlyRateEur && hourlyRateEur > 0
      ? {
          min: estimatedHours.min * hourlyRateEur,
          max: estimatedHours.max * hourlyRateEur,
        }
      : null;

    return { score, hardFlags, moduleIds, moduleLabels, tier, level, message, estimatedHours, estimatedPrice };
  }, [answers, hourlyRateEur]);

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
            <p className="mt-1 text-sm text-white/70">Las respuestas se calculan localmente en tu navegador. No se envían a EXPERT.</p>
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
            {current.description && <p className="mt-2 text-sm text-[#23364D]">{current.description}</p>}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {current.kind === 'cookies' ? (
                <>
                  {[
                    ['none', 'No / solo técnicas'],
                    ['basic', 'Analítica básica'],
                    ['advanced', 'Publicidad, píxeles o personalización'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAnswer(value as Answer)}
                      className={`min-h-12 border px-4 py-3 text-left text-sm font-semibold transition ${
                        answers[current.id] === value
                          ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#0D1B2A]'
                          : 'border-[#D4A017]/25 hover:border-[#D4A017]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setAnswer(true)}
                    className={`min-h-12 border px-4 py-3 text-sm font-semibold transition ${
                      answers[current.id] === true
                        ? 'border-[#D4A017] bg-[#D4A017]/10'
                        : 'border-[#D4A017]/25 hover:border-[#D4A017]'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswer(false)}
                    className={`min-h-12 border px-4 py-3 text-sm font-semibold transition ${
                      answers[current.id] === false
                        ? 'border-[#D4A017] bg-[#D4A017]/10'
                        : 'border-[#D4A017]/25 hover:border-[#D4A017]'
                    }`}
                  >
                    No
                  </button>
                </>
              )}
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

            <div className="mt-5 border border-[#D4A017]/20 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Esfuerzo profesional estimado</p>
              <p className="mt-1 text-lg font-bold">
                {result.estimatedHours.min === 0
                  ? 'Autoimplantación gratuita · revisión opcional hasta 2 h'
                  : `${result.estimatedHours.min}–${result.estimatedHours.max} h`}
              </p>
              {result.estimatedPrice && result.estimatedHours.min > 0 && (
                <p className="mt-1 text-sm text-[#23364D]">
                  Estimación económica: <strong>{result.estimatedPrice.min.toLocaleString('es-ES')}–{result.estimatedPrice.max.toLocaleString('es-ES')} € + IVA</strong>.
                  El presupuesto final depende del alcance validado.
                </p>
              )}
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <div className="border border-[#D4A017]/20 bg-[#F8F6F1] p-5">
                <h3 className="font-bold">Bloques que deberías implantar</h3>
                <ul className="mt-3 space-y-2 text-sm text-[#23364D]">
                  {result.moduleLabels.map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-[#D4A017]">•</span>{item}</li>
                  ))}
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
              </>
            )}

            {result.hardFlags.length > 0 && (
              <div className="mt-5 border-l-4 border-[#D4A017] bg-[#D4A017]/8 p-4">
                <p className="text-sm font-bold">Señales que requieren revisión</p>
                <ul className="mt-2 space-y-1 text-sm text-[#23364D]">
                  {result.hardFlags.map((flag) => <li key={flag}>• {flag}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {result.level === 'low' ? (
                <Link href="/docs/checklist-rgpd-autonomos-pymes" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A]">
                  Empezar autoimplantación <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href={buildQuoteHref({
                    tier: result.tier,
                    score: result.score,
                    modules: result.moduleLabels,
                    hardFlags: result.hardFlags,
                  })}
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
