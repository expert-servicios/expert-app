import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Compass, FileText, Gauge, UsersRound } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mentorías para emprendedores | Ksenia Ilicheva · EXPERT',
  description:
    'Mentoría empresarial práctica con foco en viabilidad, fiscalidad, estructura legal, gestión, validación y toma de decisiones. Colaboración con programas de mentorDay.',
  alternates: { canonical: 'https://expertconsulting.es/mentorias' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/mentorias',
    title: 'Mentorías para emprendedores | EXPERT',
    description: 'Acompañamiento práctico para convertir hipótesis empresariales en decisiones, ejecución y evidencia.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'Mentorías EXPERT' }],
  },
};

const formats = [
  {
    title: 'Speed Mentoring',
    text: 'Sesiones breves y muy enfocadas para detectar el bloqueo principal, priorizar y dejar una siguiente acción concreta.',
    meta: 'Mentor Tips · mentorDay',
  },
  {
    title: 'Acompañamiento intensivo',
    text: 'Ciclos de varias sesiones para trabajar viabilidad, estructura legal-fiscal, números, ayudas, operativa y gestión.',
    meta: 'Programas como CiberEmprende',
  },
  {
    title: 'Mentoría longitudinal',
    text: 'Seguimiento durante varios meses para contrastar hipótesis, medir avances, documentar evidencia y adaptar la hoja de ruta.',
    meta: 'Matching anual · mentorDay',
  },
];

const method = [
  ['Diagnosticar', 'Entender problema, contexto y restricciones reales.'],
  ['Priorizar', 'Separar lo urgente, lo importante y lo que puede esperar.'],
  ['Ejecutar', 'Convertir la conversación en acciones, responsables y fechas.'],
  ['Medir', 'Buscar evidencia externa y resultados verificables.'],
  ['Decidir', 'Continuar, corregir, simplificar o cambiar de dirección.'],
];

export default function MentoriasPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Mentoría empresarial</p>
          <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight md:text-6xl">
            Menos teoría acumulada. Más decisiones que mueven el proyecto.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#C8CDD3] md:text-lg">
            Acompaño a personas emprendedoras en momentos en los que necesitan ordenar el proyecto,
            contrastar supuestos y convertir ideas en una hoja de ruta ejecutable. El objetivo no es
            producir más documentación, sino identificar qué hay que validar, qué evidencia falta y cuál
            es la siguiente decisión útil.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cita" className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]">
              Reservar una conversación
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sobre-mi" className="inline-flex min-h-12 items-center gap-2 border border-[#D4A017]/50 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017]/10">
              Sobre mí
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-[#D8CBB5] bg-white p-6">
              <UsersRound className="h-6 w-6 text-[#D4A017]" />
              <p className="mt-4 font-serif text-4xl font-bold">100</p>
              <p className="mt-1 text-sm text-[#526171]">proyectos revisados en convocatorias Mentor Tips de 2026</p>
            </div>
            <div className="border border-[#D8CBB5] bg-white p-6">
              <Compass className="h-6 w-6 text-[#D4A017]" />
              <p className="mt-4 font-serif text-4xl font-bold">13</p>
              <p className="mt-1 text-sm text-[#526171]">países representados en las convocatorias revisadas</p>
            </div>
            <div className="border border-[#D8CBB5] bg-white p-6">
              <Gauge className="h-6 w-6 text-[#D4A017]" />
              <p className="mt-4 font-serif text-4xl font-bold">3</p>
              <p className="mt-1 text-sm text-[#526171]">formatos de acompañamiento: breve, intensivo y longitudinal</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#756B5F]">
            Las cifras anteriores describen proyectos incluidos en las convocatorias revisadas; no implican que todos hayan recibido una mentoría individual completa.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Colaboración</p>
            <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Mentora acreditada en la comunidad mentorDay</h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D] md:text-base">
              Participo como experta y mentora en sesiones de Mentor Tips y en programas de acompañamiento
              más intensivos. Mi aportación se concentra especialmente en viabilidad, estructura fiscal y
              mercantil, organización empresarial, gestión, digitalización y contraste práctico del modelo.
            </p>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {formats.map((item) => (
              <article key={item.title} className="border border-[#D8CBB5] bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-[#D4A017]">{item.meta}</p>
                <h3 className="mt-3 font-serif text-2xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#526171]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Método de trabajo</p>
          <h2 className="mt-4 max-w-3xl font-serif text-3xl font-bold md:text-4xl">
            Cada sesión debe reducir una incertidumbre.
          </h2>
          <div className="mt-9 grid gap-4 md:grid-cols-5">
            {method.map(([title, text], index) => (
              <div key={title} className="border-t-2 border-[#D4A017] pt-4">
                <p className="text-xs font-bold text-[#D4A017]">0{index + 1}</p>
                <h3 className="mt-2 font-serif text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#526171]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Casos y aprendizajes</p>
            <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Documentar el proceso también genera conocimiento.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#23364D] md:text-base">
              Las mentorías se documentan internamente para poder revisar decisiones, evidencia y evolución.
              Cuando un caso aporta un aprendizaje útil, puede transformarse en artículo o caso práctico
              únicamente después de revisar qué información es publicable y contar con la autorización correspondiente.
            </p>
          </div>
          <div className="border border-[#D4A017]/25 bg-[#FFF9EA] p-6">
            <FileText className="h-6 w-6 text-[#D4A017]" />
            <h3 className="mt-4 font-serif text-xl font-bold">Qué puede publicarse</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#526171]">
              {[
                'Problema o reto empresarial claramente definido.',
                'Acciones y decisiones tomadas durante el acompañamiento.',
                'Resultados verificables y aprendizajes transferibles.',
                'Identidad, cifras o testimonios solo cuando exista autorización.',
              ].map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#D4A017]" />{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="brand-blue-bg px-6 py-14 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-3xl font-bold">¿Necesitas ordenar una decisión empresarial?</h2>
          <p className="mt-4 text-sm leading-7 text-[#C8CDD3]">
            Podemos empezar por una conversación concreta sobre el punto que está bloqueando el siguiente paso.
          </p>
          <Link href="/cita" className="mt-7 inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">
            Reservar cita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
