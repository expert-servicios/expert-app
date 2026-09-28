import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, ClipboardList } from 'lucide-react';
import { PREQUOTE_QUESTIONNAIRE } from '@/lib/data/kia-knowledge/prequote-questionnaire';

export const metadata: Metadata = {
  title: 'Cuestionario previo a presupuesto | EXPERT',
  description: 'Preguntas necesarias para preparar un presupuesto firme y ajustado al alcance real.',
  alternates: { canonical: 'https://expertconsulting.es/presupuesto/aclaraciones' },
};

export default function QuoteClarificationsPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Presupuesto EXPERT</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">{PREQUOTE_QUESTIONNAIRE.name}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#C9D1D9]">
            No hace falta repetir lo que ya nos hayas contado. Responde solo a los puntos que falten para poder fijar alcance y precio con seguridad.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-6">
          {PREQUOTE_QUESTIONNAIRE.sections.map((section) => (
            <section key={section.id} className="border border-[#D4A017]/25 bg-white p-6 shadow-[0_8px_20px_rgba(13,27,42,0.05)]">
              <h2 className="font-serif text-xl font-bold">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#23364D]">
                {section.questions.map((question) => (
                  <li key={question} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A017]" />
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href={PREQUOTE_QUESTIONNAIRE.monthlyPlanLinks.all}
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017] px-6 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#D4A017]/10"
          >
            <ClipboardList className="h-4 w-4" />
            Ver planes mensuales
          </Link>
          <Link
            href={PREQUOTE_QUESTIONNAIRE.monthlyPlanLinks.meeting15}
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            <CalendarDays className="h-4 w-4" />
            Reunión informativa de 15 min
          </Link>
        </div>
      </section>
    </main>
  );
}
