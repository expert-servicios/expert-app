import type { Metadata } from 'next';
import Link from 'next/link';
import { circeFaqs, circeResources, circeSteps, CIRCE_REVIEW_DATE, CIRCE_MANUAL_DATE } from '@/lib/content/circe-autogestion';

export const metadata: Metadata = {
  title: 'Constituir una sociedad limitada por CIRCE paso a paso | EXPERT',
  description: 'Guía gratuita de EXPERT para crear una SL personalmente por PAE Virtual y CIRCE, sin duplicar altas en AEAT o Seguridad Social.',
  robots: { index: false, follow: false }, // En borrador: no indexar hasta QA y autorización editorial.
  alternates: { canonical: 'https://expertconsulting.es/herramientas/crear-sociedad-limitada' },
};

export default function CirceHelpPage() {
  return <main className="bg-[#F8F6F1] text-[#0D1B2A]">
    <header className="bg-[#0D1B2A] px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/docs" className="text-sm text-[#D4A017]">EXPERT · Base de conocimientos</Link>
        <h1 className="mt-5 font-serif text-3xl font-bold md:text-5xl">Crea tu sociedad limitada por tu cuenta con CIRCE</h1>
        <p className="mt-6 max-w-3xl leading-8 text-[#D1D5DB]">Guía gratuita en siete pasos, elaborada a partir del manual del PAE Virtual. Te explicamos qué preparar, cómo completar el Documento Único Electrónico y qué gestiones se tramitan conjuntamente.</p>
        <p className="mt-4 text-xs text-[#D1D5DB]">Revisión: {CIRCE_REVIEW_DATE} · Manual oficial: {CIRCE_MANUAL_DATE}</p>
      </div>
    </header>
    <nav className="border-b border-[#D4A017]/30 bg-white px-6 py-5" aria-label="Secciones de la guía">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-4 text-sm font-semibold">
        <a href="#pasos">Siete pasos</a><a href="#alcance">Qué tramita CIRCE</a><a href="#manuales">Manuales oficiales</a><a href="#faq">Preguntas frecuentes</a>
      </div>
    </nav>
    <section id="alcance" className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="font-serif text-2xl font-bold">Una sola tramitación para los trámites integrados</h2>
      <p className="mt-4 leading-8">CIRCE coordina la constitución notarial, la inscripción mercantil, la declaración censal inicial y los trámites de Seguridad Social aplicables mediante el DUE. <strong>No presentes nuevamente el modelo 036, pidas el NIF provisional por separado ni dupliques altas de la Seguridad Social por rutina</strong> cuando ya se están tramitando en CIRCE. Comprueba el estado de cada gestión al finalizar.</p>
      <p className="mt-3 leading-8">No incluye automáticamente todas las licencias, actividades reguladas ni el mantenimiento fiscal, contable y mercantil futuro. La intervención notarial sigue siendo necesaria.</p>
    </section>
    <section id="pasos" className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="font-serif text-3xl font-bold">Siete pasos para hacerlo tú mismo</h2>
      <div className="mt-8 space-y-5">
        {circeSteps.map((step, index) => <article key={step.id} id={step.id} className="border border-[#D4A017]/25 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#886B13]">Paso {index + 1}</p>
          <h3 className="mt-2 font-serif text-xl font-bold">{step.title}</h3>
          <p className="mt-3 leading-7">{step.summary}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-7">{step.actions.map(item => <li key={item}>{item}</li>)}</ul>
        </article>)}
      </div>
    </section>
    <section id="manuales" className="bg-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl font-bold">Manuales, portales y normativa oficial</h2>
        <p className="mt-3 leading-7">Consulta las fuentes originales en cada paso. EXPERT explica el procedimiento; la presentación y firma se realizan únicamente en el portal oficial.</p>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {circeResources.map(resource => <a key={resource.url} href={resource.url} target="_blank" rel="noopener noreferrer" className="block border border-[#D4A017]/30 p-5 hover:bg-[#F8F6F1] focus-visible:outline-2 focus-visible:outline-[#D4A017]">
            <h3 className="font-bold underline underline-offset-4">{resource.title} ↗</h3>
            <p className="mt-3 text-sm leading-6">{resource.detail}</p>
          </a>)}
        </div>
      </div>
    </section>
    <section id="faq" className="mx-auto max-w-5xl px-6 py-12">
      <h2 className="font-serif text-3xl font-bold">Preguntas frecuentes</h2>
      <div className="mt-6 space-y-3">
        {circeFaqs.map(faq => <details key={faq.question} className="border border-[#D4A017]/25 bg-white p-5">
          <summary className="cursor-pointer font-semibold">{faq.question}</summary>
          <p className="mt-4 leading-7">{faq.answer}</p>
        </details>)}
      </div>
      <div className="mt-10 border-t border-[#D4A017]/30 pt-6">
        <p className="leading-7">Puedes seguir gratuitamente esta guía sin abrir una cuenta. Si necesitas orientación puntual, <Link className="font-semibold underline" href="/consulta-gratuita?origen=circe_guia">solicita una consulta inicial</Link>. La contratación de formación o gestión no es necesaria para usar el PAE Virtual.</p>
        <p className="mt-3 text-sm">Fuente: PAE Electrónico, guía de cumplimentación del DUE para SRL y BOE. Revisión editorial pendiente antes de publicación.</p>
      </div>
    </section>
  </main>;
}
