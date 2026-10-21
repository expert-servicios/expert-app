import { KseniaPersonalCTASection } from '@/components/personal/KseniaPersonalCTASection';
import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowDownRight, ArrowRight, ArrowUpRight, BookOpenText, BriefcaseBusiness, CalendarDays, GraduationCap, Mail, MessageCircle, MoveUpRight, Phone, Sparkles } from 'lucide-react';
import { KseniaPersonalContactGate } from '@/components/personal/KseniaPersonalContactGate';
import { KSENIA_SOCIAL_PROFILES } from '@/lib/personal/ksenia-social-profiles';

const personalUrl = 'https://kseniailicheva.com';

export const metadata: Metadata = {
  metadataBase: new URL(personalUrl),
  title: 'Ksenia Ilicheva | Economista, mentora y creadora de EXPERT',
  description:
    'Soy Ksenia Ilicheva: economista, asesora fiscal, laboral y contable, formadora y mentora. Mi trayectoria, mis valores y el proyecto EXPERT.',
  alternates: { canonical: personalUrl, languages: { es: personalUrl, ru: personalUrl + '/ru' } },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: '/personal/ksenia-favicon.png', type: 'image/png', sizes: '48x48' }], shortcut: '/personal/ksenia-favicon.png', apple: '/personal/ksenia-favicon.png' },
  openGraph: {
    type: 'profile',
    url: personalUrl,
    siteName: 'Ksenia Ilicheva',
    title: 'Ksenia Ilicheva | Trayectoria profesional y proyecto EXPERT',
    description: 'Más de dos décadas de experiencia en gestión profesional y una visión de la asesoría conectada con la tecnología.',
    locale: 'es_ES',
    images: [{ url: '/avatars/ksenia-hero-clean.png', alt: 'Ksenia Ilicheva' }],
  },
  twitter: { card: 'summary_large_image', title: 'Ksenia Ilicheva | Proyecto EXPERT', images: ['/avatars/ksenia-hero-clean.png'] },
};

const trajectory = [
  { years: '2000', title: 'Una nueva etapa en España', detail: 'Me establecí en España después de formarme en Economía en San Petersburgo. Aprender a desenvolverse entre idiomas, instituciones y realidades distintas marcó mi forma de trabajar.' },
  { years: '2003–2008', title: 'Empresa y gestión', detail: 'Inicié mi actividad profesional en el entorno inmobiliario y financiero: decisiones reales, personas reales y una relación directa con la gestión de negocios.' },
  { years: '2008–2023', title: 'Asesoramiento desde dentro', detail: 'Desarrollé mi trayectoria en E-Consulting Abogados & Gestores, combinando gestión de equipos y asesoramiento a empresas y particulares.' },
  { years: '2023–hoy', title: 'Nace una nueva etapa: EXPERT', detail: 'Impulso EXPERT como proyecto de servicios profesionales y tecnología aplicada, con el objetivo de que la gestión sea más clara y útil para quienes la necesitan.' },
];

const values = [
  { Icon: BriefcaseBusiness, title: 'Experiencia aplicada', text: 'El conocimiento normativo importa, pero también entender cómo funciona una empresa y cómo afectan las decisiones a las personas.' },
  { Icon: BookOpenText, title: 'Compartir conocimiento', text: 'La formación y la mentoría forman parte de mi trabajo: explicar, escuchar y acompañar a quienes están construyendo algo.' },
  { Icon: Sparkles, title: 'Innovación con criterio', text: 'La automatización y la inteligencia artificial tienen sentido cuando hacen más transparente el trabajo y dejan las decisiones importantes en manos de las personas.' },
];

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Ksenia Ilicheva',
  url: personalUrl,
  image: personalUrl + '/personal/ksenia-hero-approved.webp',
  jobTitle: 'Economista y asesora fiscal, laboral y contable',
  description: 'Formadora, mentora y promotora del proyecto EXPERT.',
  worksFor: { '@type': 'Organization', name: 'EXPERT CONSULTING', url: 'https://expertconsulting.es' },
  knowsLanguage: ['es', 'ru'],
  sameAs: [...KSENIA_SOCIAL_PROFILES.map(profile => profile.url), 'https://expertconsulting.es'],
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A57931]">{children}</p>;
}

export default function KseniaPersonalHome() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#182A32]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />

      <header className="border-b border-[#182A32]/10 bg-[#F7F4EE]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4 md:px-10">
          <a href="#inicio" aria-label="Ksenia Ilicheva · volver al inicio" className="inline-flex items-center gap-3 font-serif text-base font-semibold tracking-tight sm:text-xl">
            <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[#C7AC7F] bg-[#E8E3D9]">
              <Image src="/personal/ksenia-avatar-approved.webp" alt="" fill sizes="44px" className="object-cover object-top" />
            </span>
            <span>Ksenia Ilicheva<span className="text-[#B5894B]">.</span></span>
          </a>
          <nav aria-label="Navegación personal" className="hidden items-center gap-7 text-xs font-medium uppercase tracking-widest text-[#49575B] md:flex">
            <a href="#sobre-mi" className="hover:text-[#A57931]">Sobre mí</a>
            <a href="#trayectoria" className="hover:text-[#A57931]">Trayectoria</a>
            <a href="/mentorias" className="hover:text-[#A57931]">Mentorías</a>
            <a href="#expert" className="hover:text-[#A57931]">EXPERT</a>
          </nav>
          <a href="#contacto" className="inline-flex min-h-10 items-center gap-2 border border-[#182A32]/20 px-4 py-2 text-xs font-semibold transition hover:border-[#A57931] hover:text-[#A57931]">
            Contacto <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </header>

      <main id="inicio">
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#E2D0B2]/30 blur-3xl" />
          <div className="mx-auto grid max-w-7xl gap-9 px-5 pb-14 pt-10 sm:gap-14 sm:px-6 md:px-10 md:pb-28 md:pt-20 lg:grid-cols-[1.03fr_0.97fr] lg:items-center">
            <div className="relative z-10">
              <Eyebrow>Economista · asesora · formadora · mentora</Eyebrow>
              <h1 className="mt-7 max-w-2xl font-serif text-[clamp(2.85rem,11vw,6.7rem)] font-medium leading-[1.03] tracking-[-0.045em]">
                Soy Ksenia <em className="font-normal text-[#A57931]">Ilicheva.</em>
              </h1>
              <p className="mt-5 max-w-xl font-serif text-2xl leading-snug text-[#30454B] md:text-3xl">
                Experiencia profesional que mira hacia adelante.
              </p>
              <p className="mt-8 max-w-xl text-lg leading-8 text-[#536167]">
                Soy economista y asesora fiscal, contable y laboral. Llevo más de dos décadas trabajando con personas y empresas en España.
                Hoy combino esa experiencia con la formación, la mentoría y mi proyecto <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[#A57931] underline-offset-4 hover:text-[#A57931]">EXPERT</a>: una forma de acercar el conocimiento profesional y la tecnología.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-4 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
                <a href="#sobre-mi" className="inline-flex min-h-12 items-center gap-3 bg-[#182A32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#30454B]">
                  Conocer mi historia <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href="#expert" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-[#182A32] underline decoration-[#B5894B] underline-offset-8">
                  Mi proyecto EXPERT <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <div className="mt-8 border-t border-[#182A32]/15 pt-5 text-[11px] font-medium uppercase leading-6 tracking-[0.12em] text-[#7A8587] sm:mt-12 sm:text-xs sm:tracking-[0.2em]">
                Alicante · España <span className="mx-2 text-[#B5894B] sm:mx-3">/</span> Español · Ruso
              </div>
            </div>
            <div className="relative">
              <div aria-hidden="true" className="absolute -right-2 -top-3 h-full w-full border border-[#C2A477]/70 sm:-right-5 sm:-top-5 md:-right-7 md:-top-7" />
              <div className="relative aspect-video overflow-hidden bg-[#E8E3D9] shadow-[0_30px_65px_rgba(24,42,50,0.13)]">
                <Image src="/personal/ksenia-hero-approved.webp" alt="Ksenia Ilicheva, economista y creadora del proyecto EXPERT" fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-contain object-center" />
              </div>
              <div className="relative mt-3 w-full bg-[#FFFFFF] px-5 py-4 shadow-md sm:absolute sm:-bottom-7 sm:left-8 sm:mt-0 sm:max-w-[85%] sm:px-6 sm:shadow-lg">
                <span className="block font-serif text-xl text-[#182A32]">Rigor. Cercanía. Evolución.</span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A57931]">Mi manera de entender el trabajo</span>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre-mi" className="scroll-mt-16 border-t border-[#182A32]/10 bg-white px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.7fr_1.3fr]">
            <div>
              <Eyebrow>Quién soy</Eyebrow>
              <h2 className="mt-5 font-serif text-[clamp(2.05rem,8vw,3rem)] leading-tight tracking-tight md:text-5xl">Una vida entre personas, empresas y cambios.</h2>
            </div>
            <div className="space-y-6 text-base leading-8 text-[#536167] md:text-lg">
              <p>Estudié Economía en la Universidad de Economía y Finanzas de San Petersburgo y vivo en España desde el año 2000. Mi recorrido profesional me ha llevado de la gestión financiera e inmobiliaria al asesoramiento fiscal, contable y laboral, y de la dirección de equipos a la creación de nuevos proyectos.</p>
              <p>Entiendo la asesoría como una profesión que exige escuchar, comprender el contexto y explicar bien las decisiones. Por eso también disfruto enseñando, formando a profesionales y acompañando a emprendedores en sus primeros pasos.</p>
              <p>No concibo la experiencia como algo estático. Sigo aprendiendo y explorando cómo aplicar la tecnología sin perder el criterio profesional ni el trato personal.</p>
            </div>
          </div>
        </section>

        <section id="trayectoria" className="scroll-mt-16 px-6 py-24 md:px-10">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>Mi camino</Eyebrow>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
              <h2 className="font-serif text-4xl tracking-tight md:text-5xl">Trayectoria</h2>
              <p className="max-w-md text-sm leading-7 text-[#536167]">Cada etapa ha aportado una perspectiva distinta a la forma en que trabajo hoy.</p>
            </div>
            <ol className="mt-12 border-t border-[#182A32]/20">
              {trajectory.map((entry) => (
                <li key={entry.years} className="grid gap-4 border-b border-[#182A32]/15 py-7 md:grid-cols-[190px_1fr_1.55fr] md:items-start">
                  <span className="font-serif text-2xl text-[#A57931]">{entry.years}</span>
                  <h3 className="text-lg font-semibold">{entry.years === '2023–hoy' ? <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" className="underline decoration-[#A57931] underline-offset-4 hover:text-[#A57931]">{entry.title}</a> : entry.title}</h3>
                  <p className="text-sm leading-7 text-[#536167]">{entry.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-[#182A32] px-6 py-24 text-[#F7F4EE] md:px-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D3AD73]">Lo que guía mi trabajo</p>
            <h2 className="mt-5 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">Experiencia, conocimiento y ganas de seguir mejorando.</h2>
            <div className="mt-12 grid gap-7 md:grid-cols-3">
              {values.map(({ Icon, title, text }) => (
                <article key={title} className="border-t border-[#D3AD73]/50 pt-7">
                  <Icon className="h-7 w-7 text-[#D3AD73]" strokeWidth={1.4} aria-hidden="true" />
                  <h3 className="mt-7 font-serif text-2xl">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#BCC7C6]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="expert" className="scroll-mt-16 bg-[#F7F4EE] px-6 py-24 md:px-10">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Eyebrow>El proyecto que impulso</Eyebrow>
              <h2 className="mt-6 font-serif text-5xl tracking-tight md:text-6xl"><a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" aria-label="Visitar EXPERT Consulting" className="inline-block decoration-[#A57931] underline-offset-8 hover:underline">EXPERT<span className="text-[#A57931]">.</span></a></h2>
              <p className="mt-6 text-xl leading-8 text-[#33494C]">Una nueva forma de unir asesoramiento profesional, formación y tecnología.</p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#536167]">
                <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[#A57931] underline-offset-4 hover:text-[#A57931]">EXPERT</a> nace de una convicción personal: los procesos administrativos y la gestión de negocios pueden ser más comprensibles y eficientes. Aplicamos automatización, herramientas de trabajo conectadas e inteligencia artificial, siempre con supervisión y criterio profesional.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#536167]">KIA es el asistente digital que desarrollamos para facilitar la comunicación y orientar las gestiones dentro del ecosistema <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[#A57931] underline-offset-4 hover:text-[#A57931]">EXPERT</a>. Es parte de la evolución del proyecto, no un sustituto del trabajo humano.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-3 bg-[#182A32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#30454B]">
                  Visitar EXPERT CONSULTING <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href="https://expertconsulting.es/servicios" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 border border-[#182A32]/30 px-6 py-3 text-sm font-semibold text-[#182A32] transition hover:border-[#A57931] hover:text-[#A57931]">
                  Ver los servicios de EXPERT <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            <aside className="border border-[#CBB68F] bg-white p-8 md:p-10">
              <div className="border-b border-[#182A32]/15 pb-8">
                <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" className="inline-block" aria-label="Ir a la web de EXPERT CONSULTING">
                  <Image src="/branding/expert-approved/horizontal-claro.webp" width={600} height={151} alt="EXPERT CONSULTING" className="h-auto w-full max-w-[300px]" />
                </a>
              </div>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-[#A57931]">Por qué existe</p>
              <blockquote className="mt-4 font-serif text-2xl leading-snug text-[#182A32]">
                La tecnología tiene sentido cuando nos ayuda a comprender mejor y tomar decisiones con criterio.
              </blockquote>
              <p className="mt-5 text-sm text-[#647276]">Una convicción que guía mi manera de desarrollar <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[#A57931] underline-offset-4 hover:text-[#A57931]">EXPERT</a>.</p>
            </aside>
          </div>
        </section>

        <KseniaPersonalCTASection locale="es" />
        <section id="mentoria" className="scroll-mt-16 border-t border-[#182A32]/10 bg-white px-6 py-20 md:px-10">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="flex items-start gap-4">
              <GraduationCap className="mt-2 h-9 w-9 shrink-0 text-[#A57931]" strokeWidth={1.4} aria-hidden="true" />
              <div><Eyebrow>Mi actividad como mentora</Eyebrow><h2 className="mt-3 font-serif text-3xl md:text-4xl">Aprender también es compartir.</h2></div>
            </div>
            <div>
              <p className="text-base leading-8 text-[#536167]">Participo en mentorDay, Mentor Tips y programas como CiberEmprende. Trabajo con personas emprendedoras para analizar la viabilidad de sus proyectos, ordenar prioridades y convertir las decisiones en acciones verificables.</p>
              <p className="mt-4 text-sm leading-7 text-[#536167]">En mi espacio personal encontrarás mis acreditaciones, los formatos de acompañamiento, mi método y ejemplos de iniciativas públicas, diferenciando los proyectos revisados de las mentorías individuales.</p>
              <a href="/mentorias" className="mt-6 inline-flex min-h-12 items-center gap-2 border-b-2 border-[#A57931] text-sm font-semibold text-[#182A32] hover:text-[#A57931]">Conocer mi actividad como mentora <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section id="contacto" className="scroll-mt-16 bg-[#EAE2D4] px-6 py-20 md:px-10">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>Contacto personal</Eyebrow>
            <h2 className="mt-5 font-serif text-4xl md:text-5xl">Las buenas conversaciones abren caminos.</h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#536167]">Puedes escribirme para colaboraciones, mentorías o propuestas profesionales. Para contratar servicios de asesoría, visita <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[#A57931] underline-offset-4 hover:text-[#A57931]">EXPERT CONSULTING</a>.</p>
            <div className="mt-10 grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="space-y-5">
                <a href="mailto:soy@kseniailicheva.com" className="flex min-h-12 items-center gap-3 border-b border-[#182A32]/20 pb-3 font-semibold"><Mail className="h-5 w-5 text-[#A57931]" aria-hidden="true" />soy@kseniailicheva.com</a>
                <a href="tel:+34669045528" className="flex min-h-12 items-center gap-3 border-b border-[#182A32]/20 pb-3 font-semibold"><Phone className="h-5 w-5 text-[#A57931]" aria-hidden="true" />+34 669 04 55 28</a>
                <a href="https://wa.me/34669045528" target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-3 border-b border-[#182A32]/20 pb-3 font-semibold"><MessageCircle className="h-5 w-5 text-[#1E7657]" aria-hidden="true" />WhatsApp</a>
                <a href="/reservar" className="inline-flex min-h-12 items-center gap-2 bg-[#182A32] px-6 py-3 font-semibold text-white"><CalendarDays className="h-5 w-5" aria-hidden="true" />Reservar reunión de 15 minutos</a>
                <a href="https://expertconsulting.es/servicios" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 border-b-2 border-[#A57931] px-1 py-3 text-sm font-semibold hover:text-[#A57931]">Solicitar un servicio de EXPERT <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
              </div>
              <div className="border border-[#CBB68F] bg-[#F7F4EE] p-6 md:p-8"><h3 className="mb-5 font-serif text-2xl">Envíame tu propuesta</h3><KseniaPersonalContactGate /></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#182A32] px-6 py-9 text-[#D6DFDC] md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5">
          <span className="font-serif text-lg text-white">Ksenia Ilicheva<span className="text-[#D3AD73]">.</span></span>
          <p className="text-xs">© 2026 Ksenia Ilicheva · Perfil profesional personal</p>
          <div className="flex gap-5 text-xs underline-offset-4">
            <a href="https://expertconsulting.es" className="hover:underline">EXPERT CONSULTING</a>
            <a href="https://expertconsulting.es/privacidad" className="hover:underline">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
