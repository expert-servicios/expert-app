import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Bot, CheckCircle2, FileText,
  RefreshCcw, ShieldCheck, Sparkles, Users,
  CalendarDays, ExternalLink
} from 'lucide-react';

const ROOT = 'https://expertconsulting.es';
const LANDING = ROOT + '/holded/chatgpt';

export const metadata: Metadata = {
  title: 'Conecta Holded con ChatGPT y autogestiona tu empresa | EXPERT',
  description:
    'Descubre la conexión oficial de Holded con ChatGPT. Solicita 14 días de prueba de Holded con EXPERT Solution Partner. Autogestión, asesoría opcional y migración.',
  alternates: { canonical: LANDING },
  openGraph: {
    type: 'website',
    url: LANDING,
    title: 'Conecta Holded con ChatGPT y autogestiona tu empresa',
    description: 'Holded + ChatGPT para empresarios y autónomos. EXPERT Solution Partner te ayuda con la prueba, la implantación y la migración.',
    siteName: 'EXPERT CONSULTING',
    locale: 'es_ES',
    images: [{ url: ROOT + '/catalog/holded.png', width: 1200, height: 630, alt: 'Holded y EXPERT' }],
  },
  twitter: { card: 'summary_large_image', title: 'Holded + ChatGPT | EXPERT', images: [ROOT + '/catalog/holded.png'] },
};

const STEPS = [
  { number: '01', title: 'Empieza con Holded', description: 'Solicita la prueba de software de 14 días a través de EXPERT. Confirmamos el alta cuando esté disponible.' },
  { number: '02', title: 'Conecta tu ChatGPT', description: 'Autoriza el conector MCP oficial de Holded desde tu propia cuenta, si tu plan, acceso API y permisos lo permiten.' },
  { number: '03', title: 'Consulta la información', description: 'Pregunta por facturas, contactos y datos permitidos de tu negocio en lenguaje natural.' },
  { number: '04', title: 'Elige el apoyo que necesitas', description: 'Trabaja por tu cuenta o contrata ayuda profesional o una migración puntual de EXPERT.' },
] as const;

const TIERS = [
  { name: 'Supervisión', price: '49 €', description: 'Para quien trabaja en Holded y desea una revisión profesional básica.' },
  { name: 'Avanzado', price: '99 €', description: 'Seguimiento y servicios fiscales periódicos según el alcance del plan.' },
  { name: 'Colaborativo', price: '199 €', description: 'Gestión compartida, revisión y apoyo profesional recurrente.' },
] as const;

const FAQ = [
  { q: '¿Tengo que contratar la asesoría EXPERT para usar Holded con ChatGPT?', a: 'No. Puedes utilizar Holded por tu cuenta y conectar el MCP oficial con tu propio ChatGPT si tu cuenta y permisos lo permiten. Los servicios de EXPERT son opcionales.' },
  { q: '¿La licencia Holded está incluida en los planes de asesoría?', a: 'No. La licencia Holded y las suscripciones profesionales EXPERT son servicios contratados y facturados por separado.' },
  { q: '¿El conector hace toda mi contabilidad o presenta impuestos?', a: 'No debes darlo por supuesto. Las herramientas habilitadas dependen de tu acceso y permisos. La conexión no sustituye tus obligaciones ni las revisiones que requieran un profesional.' },
  { q: '¿La prueba se activa al enviar el formulario?', a: 'No. EXPERT revisa la solicitud y tramita el alta desde el canal Solution Partner. Recibirás confirmación cuando esté activada.' },
  { q: '¿Puedo cambiar desde otro programa?', a: 'Sí. EXPERT puede valorar la importación de datos y la configuración necesaria, de acuerdo con tu software de origen y el volumen de información.' },
] as const;

const primary = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-6 py-3 font-semibold text-[#071624] shadow-sm transition hover:bg-[#F2C14E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]';
const secondary = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D4A017]/60 px-6 py-3 font-semibold text-[#D4A017] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]';

export default function HoldedChatGPTLandingPage() {
  return (
    <main className="bg-white text-[#0D1B2A]">
      <section className="relative overflow-hidden bg-[#0D1B2A] px-6 py-16 text-white md:py-24">
        <div aria-hidden className="pointer-events-none absolute -right-28 -top-32 h-[450px] w-[450px] rounded-full bg-[#D4A017]/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#D4A017]/35 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-[#F2C14E]">
              <ShieldCheck size={15} aria-hidden /> EXPERT · Holded Solution Partner · Asesoría especializada
            </div>
            <h1 className="max-w-4xl text-4xl font-bold leading-[1.13] tracking-tight md:text-6xl">
              Conecta <span className="text-[#FF5454]">Holded</span> con ChatGPT y autogestiona tu empresa
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/80">
              Gestiona tu negocio con más autonomía. Consulta la información de Holded mediante su conector oficial con ChatGPT y decide si quieres hacerlo todo por tu cuenta o contar con EXPERT.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/planes/gratuito" className={primary}>Solicitar prueba gratis · 14 días <ArrowRight size={18} aria-hidden /></Link>
              <Link href="#como-funciona" className={secondary}>Cómo funciona</Link>
            </div>
            <p className="mt-5 text-sm text-white/65">
              La prueba se tramita por EXPERT y no se activa automáticamente. La conexión requiere acceso a la API de Holded y un plan compatible de ChatGPT.
            </p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-7 shadow-2xl md:p-9">
            <p className="mb-6 text-sm font-medium tracking-wide text-white/60">LA CONEXIÓN, SIN COMPLICACIONES</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-xl font-extrabold text-[#FF5454] shadow-xl sm:h-28 sm:w-28">Holded</div>
              <span className="text-4xl font-light text-[#F2C14E]" aria-hidden>+</span>
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white px-3 text-xl font-semibold text-[#0D1B2A] shadow-xl sm:h-28 sm:w-28">ChatGPT</div>
            </div>
            <div className="mt-7 flex items-start gap-3 rounded-xl bg-white/10 p-4 text-sm leading-6 text-white/80">
              <Bot className="mt-1 shrink-0 text-[#F2C14E]" size={19} aria-hidden />
              <p>Conector MCP oficial de Holded. La autorización y los permisos los controla el titular de cada cuenta.</p>
            </div>
            <p className="mt-5 text-center text-xs text-white/60">EXPERT es Solution Partner de Holded. No es el desarrollador del conector ni representa a OpenAI.</p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-24 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#A27A13]">El proceso</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold md:text-4xl">Empieza con Holded. Conéctalo con ChatGPT. Tú decides cómo continuar.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <article key={step.number} className="rounded-2xl border border-[#E7E0D3] bg-[#F8F6F1] p-6">
                <p className="text-3xl font-bold text-[#D4A017]">{step.number}</p>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#485364]">{step.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
            <Link href="https://help.holded.com/es/articles/15646468-conecta-holded-con-ia" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-[#305578] underline underline-offset-4">
              Consulta las instrucciones oficiales de Holded <ExternalLink size={15} aria-hidden />
            </Link>
            <span className="text-[#637081]">La disponibilidad depende de los planes, permisos y capacidades de cada cuenta.</span>
          </div>
        </div>
      </section>

      <section id="modalidades" className="bg-[#F8F6F1] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#A27A13]">Dos formas de gestionar</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">La tecnología es la misma. El acompañamiento lo eliges tú.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="flex flex-col rounded-3xl border border-[#E6DAC0] bg-white p-7 shadow-sm md:p-9">
              <Bot size={35} className="text-[#FF5454]" aria-hidden />
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#8F6E1A]">Opción A</p>
              <h3 className="mt-2 text-2xl font-bold">Autogestión con Holded + ChatGPT</h3>
              <p className="mt-4 flex-1 leading-7 text-[#485364]">Lleva por tu cuenta facturas, contactos y gestión empresarial con Holded. Utiliza el conector oficial cuando tu cuenta lo permita. Puedes solicitar ayuda puntual de EXPERT sin contratar una suscripción mensual.</p>
              <Link href="/planes/gratuito" className="mt-7 inline-flex items-center gap-2 font-bold text-[#805B06]">Solicitar 14 días de prueba <ArrowRight size={18} aria-hidden /></Link>
            </article>
            <article className="flex flex-col rounded-3xl border border-[#243650] bg-[#0D1B2A] p-7 text-white shadow-sm md:p-9">
              <Users size={35} className="text-[#D4A017]" aria-hidden />
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#F2C14E]">Opción B</p>
              <h3 className="mt-2 text-2xl font-bold">Gestión acompañada por EXPERT</h3>
              <p className="mt-4 flex-1 leading-7 text-white/80">Utiliza Holded y recibe supervisión, revisión o colaboración profesional según tu plan de asesoría. Conservas visibilidad sobre tu empresa y eliges el apoyo adecuado a tu actividad.</p>
              <Link href="/planes" className="mt-7 inline-flex items-center gap-2 font-bold text-[#F2C14E]">Comparar planes de EXPERT <ArrowRight size={18} aria-hidden /></Link>
            </article>
          </div>
        </div>
      </section>

      <section id="planes" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#A27A13]">Asesoría opcional</p>
              <h2 className="mt-3 text-3xl font-bold">EXPERT te acompaña cuando lo necesites</h2>
            </div>
            <Link href="/planes" className="inline-flex items-center gap-2 text-sm font-bold text-[#305578] underline underline-offset-4">Ver condiciones completas <ArrowRight size={16} aria-hidden /></Link>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {TIERS.map((tier) => (
              <article key={tier.name} className="rounded-2xl border border-[#E7E0D3] bg-white p-6">
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <p className="mt-3 text-3xl font-bold">{tier.price}<span className="text-sm font-normal text-[#536072]">/mes + IVA</span></p>
                <p className="mt-4 text-sm leading-6 text-[#485364]">{tier.description}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-[#637081]">La licencia Holded se contrata aparte. Los servicios incluidos y las limitaciones de cada plan se detallan en el catálogo de EXPERT.</p>
        </div>
      </section>

      <section id="migracion" className="bg-[#F8F6F1] px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[auto_1fr]">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-[#FF5454] shadow-sm"><RefreshCcw size={37} aria-hidden /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#A27A13]">Servicio puntual · Opción C</p>
            <h2 className="mt-3 text-3xl font-bold">¿Quieres pasar de otro programa a Holded?</h2>
            <p className="mt-4 max-w-3xl leading-7 text-[#485364]">EXPERT te ayuda a analizar los datos del programa anterior, preparar la configuración y verificar la migración. Es compatible con la autogestión y con los planes de asesoría.</p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/holded/migracion-sin-inventario" className="inline-flex items-center gap-2 font-bold text-[#805B06] underline underline-offset-4">Migración sin inventario <ArrowRight size={16} aria-hidden /></Link>
              <Link href="/holded/migracion-con-inventario" className="inline-flex items-center gap-2 font-bold text-[#805B06] underline underline-offset-4">Migración con inventario <ArrowRight size={16} aria-hidden /></Link>
            </div>
            <p className="mt-4 text-xs text-[#637081]">No hay promociones o descuentos estacionales activos en esta página.</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">Dudas habituales</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-[#E7E0D3] bg-white p-6">
                <summary className="cursor-pointer font-semibold">{q}</summary>
                <p className="mt-4 text-sm leading-7 text-[#485364]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] px-6 py-20 text-white">
        <div className="mx-auto max-w-6xl text-center">
          <Sparkles size={31} className="mx-auto text-[#D4A017]" aria-hidden />
          <h2 className="mt-5 text-3xl font-bold md:text-4xl">Empieza con Holded y ChatGPT, a tu manera</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">Solicita una prueba de Holded, reserva una demostración o descubre qué servicios profesionales pueden ayudarte a empezar.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/planes/gratuito" className={primary}><CheckCircle2 size={18} aria-hidden /> Solicitar prueba gratis 14 días</Link>
            <Link href="/cita?tipo=demo-holded" className={secondary}><CalendarDays size={18} aria-hidden /> Solicitar demostración</Link>
          </div>
          <p className="mt-6 text-xs text-white/65">La solicitud no supone contratación, alta automática de prueba ni reserva confirmada. EXPERT es un distribuidor y prestador de servicios independiente.</p>
          <Link href="/holded/conectores" className="mt-5 inline-flex items-center gap-2 text-sm text-[#F2C14E] underline underline-offset-4"><FileText size={16} aria-hidden /> Más información sobre conectores e IA</Link>
        </div>
      </section>
    </main>
  );
}
