import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Calculator, ClipboardCheck, FileText, ShieldCheck } from 'lucide-react';
import { publicToolCategories, publicTools } from '@/lib/tools/public-tools';

const URL = 'https://expertconsulting.es/herramientas';

export const metadata: Metadata = {
  title: 'Herramientas gratuitas para empresas y autónomos | EXPERT',
  description: 'Accede a las herramientas gratuitas de EXPERT: autoevaluación RGPD y calculadoras de honorarios de IRPF, IRNR, Patrimonio, trámites para empresas y Holded.',
  alternates: { canonical: URL },
  openGraph: {
    type: 'website',
    url: URL,
    title: 'Herramientas gratuitas | EXPERT Consulting',
    description: 'Autoevaluación RGPD y calculadoras gratuitas de honorarios para empresas, autónomos y particulares.',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'Herramientas gratuitas EXPERT' }],
  },
};

const categoryIcons = {
  'proteccion-datos': ShieldCheck,
  fiscalidad: Calculator,
  empresas: FileText,
  holded: ClipboardCheck,
} as const;

export default function HerramientasPage() {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Herramientas gratuitas EXPERT',
    description: 'Catálogo de herramientas gratuitas disponibles para estimaciones y orientación inicial.',
    url: URL,
    inLanguage: 'es-ES',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: publicTools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tool.title,
        url: `https://expertconsulting.es${tool.href.split('#')[0]}`,
      })),
    },
  };

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <section className="bg-[#0D1B2A] px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.23em] text-[#D4A017]">EXPERT · Recursos gratuitos</p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-bold leading-tight md:text-5xl">Herramientas gratuitas para empresas y particulares</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#D1D5DB]">
            Reúne en un solo lugar nuestros cuestionarios y calculadoras disponibles. Puedes utilizarlos sin contratar ningún servicio; si necesitas una revisión profesional, podrás solicitarla después.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#catalogo" className="inline-flex min-h-11 items-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]">
              Ver herramientas <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/docs" className="inline-flex min-h-11 items-center gap-2 border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:border-[#D4A017]">
              <BookOpen className="h-4 w-4" /> Base de conocimientos
            </Link>
          </div>
        </div>
      </section>

      <nav aria-label="Categorías de herramientas" className="border-b border-[#D4A017]/20 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2">
          {publicToolCategories.map((category) => (
            <a key={category.id} href={`#${category.id}`} className="rounded border border-[#D4A017]/30 px-4 py-2 text-xs font-semibold text-[#23364D] hover:border-[#D4A017] hover:bg-[#F8F6F1]">
              {category.title}
            </a>
          ))}
        </div>
      </nav>

      <div id="catalogo" className="mx-auto max-w-6xl space-y-14 px-6 py-12 md:py-16">
        {publicToolCategories.map((category) => {
          const tools = publicTools.filter((tool) => tool.category === category.id);
          const Icon = categoryIcons[category.id];
          return (
            <section id={category.id} aria-labelledby={`titulo-${category.id}`} key={category.id} className="scroll-mt-28">
              <div className="flex items-start gap-3">
                <Icon className="mt-1 h-6 w-6 shrink-0 text-[#A27A16]" />
                <div>
                  <h2 id={`titulo-${category.id}`} className="font-serif text-2xl font-bold md:text-3xl">{category.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#52606D]">{category.description}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {tools.map((tool) => (
                  <article key={tool.id} className="flex h-full flex-col border border-[#D4A017]/25 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#977316]">{tool.type === 'diagnostico' ? 'Cuestionario gratuito' : 'Calculadora gratuita de honorarios'}</p>
                    <h3 className="mt-3 font-serif text-xl font-bold">{tool.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-7 text-[#52606D]">{tool.description}</p>
                    <Link href={tool.href} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 self-start bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]">
                      {tool.action} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        <aside className="border border-[#D4A017]/25 bg-white p-6 md:p-8">
          <h2 className="font-serif text-xl font-bold">Sobre los resultados de estas herramientas</h2>
          <p className="mt-3 text-sm leading-7 text-[#52606D]">
            Las calculadoras muestran honorarios orientativos de EXPERT, no el importe de los impuestos, las cotizaciones o posibles sanciones. La evaluación RGPD es informativa y no acredita el cumplimiento normativo. Las gestiones profesionales, si se solicitan, se presupuestan por separado.
          </p>
          <Link href="/consulta-gratuita?origen=herramientas" className="mt-5 inline-flex items-center gap-2 font-semibold text-[#8A6611] underline underline-offset-4">Solicitar orientación profesional <ArrowRight className="h-4 w-4" /></Link>
        </aside>
      </div>
    </main>
  );
}
