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
        <a href="#elige">Elige tu camino</a><a href="#comparar">Autónomo o SL</a><a href="#pasos">Siete pasos</a><a href="#alcance">Qué tramita CIRCE</a><a href="#contenidos">Artículos y guías</a><a href="#manuales">Fuentes oficiales</a><a href="#opciones">EXPERT y Holded</a><a href="#faq">Preguntas frecuentes</a>
      </div>
    </nav>
    <section id="elige" className="mx-auto max-w-5xl px-6 py-12" aria-labelledby="elige-heading">
      <p className="text-xs font-bold uppercase tracking-widest text-[#886B13]">Una página para decidir y actuar</p>
      <h2 id="elige-heading" className="mt-3 font-serif text-3xl font-bold">¿Qué necesitas hacer hoy?</h2>
      <p className="mt-3 max-w-3xl leading-7">Aquí tienes recursos gratuitos para aprender y realizar el trámite, y ayuda profesional opcional. No tienes que registrarte para consultar las guías.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Link href="#comparar" className="border border-[#D4A017]/35 bg-white p-5 hover:bg-[#F2E9D3]" >
          <h3 className="font-serif text-xl font-bold">1. Elegir entre autónomo o SL</h3><p className="mt-2 text-sm leading-6">Comparar impuestos, cotizaciones, responsabilidad y costes.</p>
        </Link>
        <Link href="#pasos" className="border border-[#D4A017]/35 bg-white p-5 hover:bg-[#F2E9D3]">
          <h3 className="font-serif text-xl font-bold">2. Constituir la SL yo mismo</h3><p className="mt-2 text-sm leading-6">Seguir los siete pasos y abrir el DUE en el PAE Virtual.</p>
        </Link>
        <Link href="#contenidos" className="border border-[#D4A017]/35 bg-white p-5 hover:bg-[#F2E9D3]">
          <h3 className="font-serif text-xl font-bold">3. Consultar guías y artículos</h3><p className="mt-2 text-sm leading-6">Aprender a cumplimentar el DUE y comprender las obligaciones.</p>
        </Link>
        <Link href="#opciones" className="border border-[#D4A017]/35 bg-white p-5 hover:bg-[#F2E9D3]">
          <h3 className="font-serif text-xl font-bold">4. Pedir ayuda o implantar Holded</h3><p className="mt-2 text-sm leading-6">Elegir formación, gestión opcional o herramientas contables.</p>
        </Link>
      </div>
    </section>
    <section id="comparar" className="bg-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-widest text-[#886B13]">Antes de elegir</p>
        <h2 className="mt-3 font-serif text-3xl font-bold">Autónomo o sociedad limitada: compara el coste total</h2>
        <p className="mt-4 max-w-4xl leading-7">El volumen de ventas no decide por sí mismo. Interesan el beneficio después de gastos, la comunidad autónoma, la cotización, cómo retirarás el dinero de la SL y el coste anual de mantenerla. No conviene comparar simplemente un porcentaje de IRPF con otro de Sociedades.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/blog/autonomo-vs-sociedad-limitada-impuestos-costes-2026" className="inline-flex min-h-11 items-center bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#23364D]">Comparar fiscalidad y costes →</Link>
          <Link href="/blog/costes-constitucion-y-mantenimiento-sl-2026" className="inline-flex min-h-11 items-center border border-[#0D1B2A] px-5 py-3 text-sm font-semibold hover:bg-[#F8F6F1]">Ver gastos de una SL →</Link>
        </div>
        <div className="mt-6 border-l-4 border-[#D4A017] bg-[#F8F6F1] p-5">
          <h3 className="font-semibold">Calculadora comparativa IRPF / SL — propuesta en diseño</h3>
          <p className="mt-2 text-sm leading-7">Estamos diseñando una herramienta gratuita para introducir ingresos, gastos, comunidad autónoma, retribuciones y beneficios que se quieren reinvertir. Su resultado será orientativo e incluirá impuestos, cotizaciones y costes de gestión. No está disponible todavía: puedes utilizar mientras tanto los artículos y solicitar una revisión individual.</p>
        </div>
      </div>
    </section>
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
    <section id="contenidos" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-[#886B13]">Biblioteca EXPERT</p>
      <h2 className="mt-3 font-serif text-3xl font-bold">Artículos y guías para cada decisión</h2>
      <p className="mt-3 max-w-3xl leading-7">Primero consulta nuestra explicación; cuando debas hacer un trámite, utiliza el enlace oficial que encontrarás en el paso correspondiente.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {[
          {href: '/docs/constituir-sl-circe-pae-virtual', title: 'Guía de conocimiento: el DUE paso a paso', text: 'Preparación, firma, notaría, Registro y comprobación del alta.'},
          {href: '/blog/autonomo-vs-sociedad-limitada-impuestos-costes-2026', title: 'Autónomo o SL: comparación fiscal', text: 'IRPF, Sociedades, cuotas, remuneraciones, dividendos y reinversión.'},
          {href: '/blog/costes-constitucion-y-mantenimiento-sl-2026', title: 'Gastos iniciales y de mantenimiento', text: 'Aranceles, capital, contabilidad y obligaciones periódicas.'},
          {href: '/blog/alta-autonomo-espana', title: 'Alta como autónomo', text: 'Alternativa para quienes están valorando emprender individualmente.'},
          {href: '/herramientas/rgpd', title: 'Herramienta gratuita de protección de datos', text: 'Orientación inicial sobre obligaciones de RGPD de tu nuevo negocio.'},
        ].map(item => <Link key={item.href} href={item.href} className="border border-[#D4A017]/30 bg-white p-5 hover:bg-[#F2E9D3]">
          <h3 className="font-semibold underline underline-offset-4">{item.title}</h3>
          <p className="mt-2 text-sm leading-6">{item.text}</p>
        </Link>)}
      </div>
    </section>
    <section id="opciones" className="mx-auto max-w-5xl px-6 py-12">
      <h2 className="font-serif text-3xl font-bold">¿Quieres apoyo o herramientas para gestionar tu negocio?</h2>
      <p className="mt-3 leading-7">Puedes realizar el trámite íntegramente por tu cuenta. EXPERT ofrece alternativas voluntarias y herramientas de facturación o contabilidad para cuando la empresa empiece a funcionar.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <Link href="/servicios/empresas-autonomos/constitucion-sl-circe" className="border border-[#D4A017]/30 bg-white p-5 hover:bg-[#F8F6F1]">
          <h3 className="font-serif text-xl font-bold">Formación CIRCE o servicio completo</h3>
          <p className="mt-2 text-sm leading-6">Revisa ambas modalidades y solicita la que encaje con tu caso. La autogestión sigue siendo gratuita.</p>
          <span className="mt-4 block text-sm font-semibold underline">Ver modalidades →</span>
        </Link>
        <Link href="/holded" className="border border-[#D4A017]/30 bg-white p-5 hover:bg-[#F8F6F1]">
          <h3 className="font-serif text-xl font-bold">Holded y gestión contable</h3>
          <p className="mt-2 text-sm leading-6">Conoce las opciones para organizar facturas, bancos, contabilidad y obligaciones de una empresa.</p>
          <span className="mt-4 block text-sm font-semibold underline">Conocer Holded →</span>
        </Link>
        <Link href="/planes" className="border border-[#D4A017]/30 bg-white p-5 hover:bg-[#F8F6F1]">
          <h3 className="font-serif text-xl font-bold">Planes de acompañamiento</h3>
          <p className="mt-2 text-sm leading-6">Descubre los planes mensuales de supervisión y acompañamiento de EXPERT, disponibles para contratar según sus condiciones vigentes.</p>
          <span className="mt-4 block text-sm font-semibold underline">Consultar opciones →</span>
        </Link>
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
