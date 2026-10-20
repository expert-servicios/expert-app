import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, ClipboardList, Compass, GraduationCap, Handshake, ShieldCheck, UsersRound } from 'lucide-react';
import { KseniaPersonalContactForm } from '@/components/personal/KseniaPersonalContactForm';

const personalUrl = 'https://kseniailicheva.com';
const mentorsUrl = personalUrl + '/mentorias';

export const metadata: Metadata = {
  metadataBase: new URL(personalUrl),
  title: 'Mentorías y mentorDay | Ksenia Ilicheva',
  description: 'Mi actividad como mentora de emprendedores: mentorDay, Mentor Tips, CiberEmprende, formatos de acompañamiento, metodología y proyectos revisados.',
  alternates: { canonical: mentorsUrl },
  openGraph: {
    type: 'article', url: mentorsUrl, siteName: 'Ksenia Ilicheva', locale: 'es_ES',
    title: 'Mentorías para emprendedores | Ksenia Ilicheva',
    description: 'MentorDay, Mentor Tips, CiberEmprende y una metodología práctica centrada en decisiones verificables.',
    images: [{ url: '/personal/ksenia-retrato.webp', alt: 'Ksenia Ilicheva, mentora' }],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/personal/ksenia-favicon.png', shortcut: '/personal/ksenia-favicon.png', apple: '/personal/ksenia-favicon.png' },
};

const formats = [
  { name: 'Speed Mentoring', subtitle: 'Mentor Tips · mentorDay', text: 'Sesiones breves para identificar un bloqueo, ordenar prioridades y acordar una siguiente acción concreta. No equivalen a un programa intensivo completo.' },
  { name: 'Acompañamiento intensivo', subtitle: 'Programas como CiberEmprende', text: 'Un ciclo de varias sesiones para trabajar viabilidad, estructura legal y fiscal, números, ayudas, operativa y gestión con objetivos definidos.' },
  { name: 'Mentoría longitudinal', subtitle: 'Seguimiento a lo largo del tiempo', text: 'Contraste de hipótesis, revisión periódica de evidencia y adaptación de la hoja de ruta conforme madura el proyecto.' },
];

const method = [
  { step: '01', title: 'Diagnosticar', description: 'Comprender el problema, el contexto y las restricciones reales.' },
  { step: '02', title: 'Priorizar', description: 'Distinguir lo urgente, lo importante y lo que puede esperar.' },
  { step: '03', title: 'Ejecutar', description: 'Traducir lo hablado en responsables, acciones y fechas.' },
  { step: '04', title: 'Medir', description: 'Contrastar hipótesis con datos y evidencias externas.' },
  { step: '05', title: 'Decidir', description: 'Continuar, corregir, simplificar o cambiar de dirección.' },
];

const projects = [
  { title: 'CasaFix.io', href: 'https://casafix.io', about: 'Plataforma que conecta a usuarios con profesionales para transporte y montaje de muebles, con solicitudes y presupuestos desde el móvil.', source: 'Sitio público del proyecto' },
  { title: 'Regala por mí', href: 'https://regalapormi.com', about: 'Propuesta de asistencia para organizar regalos a lo largo del año, combinando recomendaciones, coordinación y productores independientes.', source: 'Proyecto reconocido en la edición 104 de mentorDay' },
  { title: 'Kidssmile Educational', href: 'https://kidssmile-educational.com', about: 'Servicio de cuidado y educación infantil en Tenerife con enfoque de educación positiva y consciente.', source: 'Sitio público del proyecto' },
];

export default function MentoriasPersonalesPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#182A32]">
      <header className="border-b border-[#182A32]/10 px-6 py-5 md:px-10">
        <nav aria-label="Navegación personal" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <a href={personalUrl} className="inline-flex min-h-11 items-center gap-3 font-serif text-xl font-semibold">
            <span className="relative h-10 w-10 overflow-hidden rounded-full border border-[#C7AC7F]">
              <Image src="/personal/ksenia-retrato.webp" alt="" fill sizes="40px" className="object-cover object-top" />
            </span>
            Ksenia Ilicheva<span className="text-[#A57931]">.</span>
          </a>
          <a href={personalUrl} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:text-[#A57931]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a mi web personal
          </a>
        </nav>
      </header>

      <main>
        <section className="overflow-hidden bg-[#182A32] px-6 py-16 text-[#F7F4EE] md:px-10 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_260px] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.23em] text-[#D3AD73]">Mi actividad como mentora</p>
              <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">Acompañar a emprendedores para tomar mejores decisiones.</h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#CED9D5] md:text-lg">
                La mentoría, para mí, no consiste en acumular consejos. Consiste en escuchar, contrastar los supuestos de cada proyecto y convertir la incertidumbre en una hoja de ruta concreta y verificable.
              </p>
              <a href="#colaborar" className="mt-8 inline-flex min-h-12 items-center gap-2 bg-[#D3AD73] px-6 py-3 text-sm font-semibold text-[#182A32] transition hover:bg-[#F2C14E]">
                Presentar una propuesta <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="relative mx-auto w-full max-w-[260px]">
              <div className="relative aspect-[4/5] overflow-hidden border border-[#D3AD73]/55 bg-[#B9A48D]">
                <Image src="/personal/ksenia-retrato.webp" alt="Ksenia Ilicheva" fill sizes="260px" priority className="object-cover object-top" />
              </div>
              <p className="mt-3 text-center text-xs tracking-wide text-[#CED9D5]">Ksenia Ilicheva · Economista y mentora</p>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:px-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A57931]">mentorDay</p>
            <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl">Formación y participación en programas de mentoría</h2>
                <p className="mt-5 text-base leading-8 text-[#536167]">
                  Superé el Taller Práctico de Mentoring de mentorDay el 5 de noviembre de 2024. Participo en sesiones Mentor Tips y en programas de acompañamiento donde aporto experiencia en fiscalidad, viabilidad, organización empresarial, gestión y digitalización.
                </p>
                <p className="mt-4 text-sm leading-7 text-[#536167]">
                  También he participado en acompañamientos intensivos vinculados a CiberEmprende. Los formatos y la duración varían según el programa: una conversación inicial no equivale a un proceso completo de mentoría.
                </p>
              </div>
              <aside className="border border-[#CBB68F] bg-white p-6 md:p-8">
                <Image src="/branding/mentorday-logo.png" alt="Logotipo de mentorDay" width={210} height={149} sizes="210px" className="mx-auto h-auto max-h-24 w-auto object-contain" />
                <div className="mt-6 flex items-start gap-3 border-t border-[#182A32]/10 pt-5">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#A57931]" aria-hidden="true" />
                  <p className="text-sm leading-7 text-[#536167]">Acreditación por haber completado el Taller Práctico de Mentoring. No implica que mentorDay certifique ni avale los proyectos aquí mencionados.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-20 md:px-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A57931]">Tres formas de acompañamiento</p>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl">Cada proyecto necesita una profundidad distinta.</h2>
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {formats.map(({ name, subtitle, text }) => (
                <article key={name} className="border border-[#CBB68F]/60 bg-[#F7F4EE] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A57931]">{subtitle}</p>
                  <h3 className="mt-4 font-serif text-2xl">{name}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#536167]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:px-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A57931]">Actividad documentada</p>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl">Proyectos revisados y contextos diversos</h2>
            <div className="mt-9 grid gap-5 sm:grid-cols-3">
              <div className="border-t-2 border-[#A57931] pt-5"><UsersRound className="h-6 w-6 text-[#A57931]" aria-hidden="true" /><p className="mt-4 font-serif text-5xl">100</p><p className="mt-2 text-sm leading-7 text-[#536167]">proyectos revisados en convocatorias Mentor Tips de 2026</p></div>
              <div className="border-t-2 border-[#A57931] pt-5"><Compass className="h-6 w-6 text-[#A57931]" aria-hidden="true" /><p className="mt-4 font-serif text-5xl">13</p><p className="mt-2 text-sm leading-7 text-[#536167]">países representados entre los proyectos de esas convocatorias</p></div>
              <div className="border-t-2 border-[#A57931] pt-5"><GraduationCap className="h-6 w-6 text-[#A57931]" aria-hidden="true" /><p className="mt-4 font-serif text-5xl">3</p><p className="mt-2 text-sm leading-7 text-[#536167]">formatos explicados: breve, intensivo y longitudinal</p></div>
            </div>
            <p className="mt-8 max-w-4xl text-sm leading-7 text-[#536167]"><ShieldCheck className="mr-2 inline h-4 w-4 text-[#A57931]" aria-hidden="true" />Estas cifras describen el alcance de las convocatorias revisadas. No significan que haya realizado 100 mentorías individuales ni que haya acompañado personalmente a todos los proyectos identificados.</p>
          </div>
        </section>

        <section className="bg-[#182A32] px-6 py-20 text-[#F7F4EE] md:px-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D3AD73]">Mi método</p>
            <h2 className="mt-4 max-w-3xl font-serif text-3xl md:text-4xl">Cada sesión debe reducir una incertidumbre.</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {method.map(({ step, title, description }) => (
                <div key={step} className="border-t border-[#D3AD73]/70 pt-5">
                  <p className="text-sm font-semibold text-[#D3AD73]">{step}</p>
                  <h3 className="mt-3 font-serif text-xl">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#CED9D5]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-20 md:px-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A57931]">Ecosistema emprendedor</p>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl">Ejemplos de proyectos presentes en convocatorias revisadas</h2>
            <p className="mt-5 max-w-4xl text-sm leading-7 text-[#536167]">
              Comparto aquí iniciativas con información pública. Su presencia no acredita una mentoría individual, una inversión, una colaboración comercial ni un caso de éxito atribuible a mi participación.
            </p>
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {projects.map(({ title, href, about, source }) => (
                <article key={title} className="flex flex-col border border-[#CBB68F]/50 bg-[#F7F4EE] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A57931]">{source}</p>
                  <h3 className="mt-4 font-serif text-2xl">{title}</h3>
                  <p className="mt-4 flex-1 text-sm leading-7 text-[#536167]">{about}</p>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#7B5929] underline underline-offset-4">
                    Conocer proyecto <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:px-10">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
            <div>
              <ClipboardList className="h-8 w-8 text-[#A57931]" aria-hidden="true" />
              <h2 className="mt-6 font-serif text-3xl md:text-4xl">Aprendizajes, evidencias y confidencialidad</h2>
              <p className="mt-5 text-base leading-8 text-[#536167]">
                Una mentoría se documenta para revisar qué se decidió, qué acciones se ejecutaron y qué cambió. Un aprendizaje puede convertirse en artículo o caso práctico solo tras verificar su exactitud y obtener la autorización correspondiente.
              </p>
            </div>
            <div className="border border-[#CBB68F]/50 bg-white p-7">
              <h3 className="font-serif text-xl">Qué comparto y qué no</h3>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-[#536167]">
                <li>Retos, decisiones y aprendizajes generales que puedan ser útiles a otras personas.</li>
                <li>Resultados solo cuando haya evidencia verificable.</li>
                <li>Identidades, cifras privadas o testimonios únicamente con autorización.</li>
                <li>Una sesión breve nunca se presenta como un programa completo.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="colaborar" className="scroll-mt-16 bg-[#EAE2D4] px-6 py-20 md:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-3xl md:text-5xl">¿Tienes un proyecto o una propuesta?</h2>
            <p className="mt-5 text-base leading-8 text-[#536167]">Hablemos de mentoría, colaboración o emprendimiento.</p>
            <div className="mt-8 grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="space-y-5">
                <a href="mailto:soy@kseniailicheva.com" className="block border-b border-[#182A32]/20 pb-4 font-semibold">soy@kseniailicheva.com</a>
                <a href="tel:+34669045528" className="block border-b border-[#182A32]/20 pb-4 font-semibold">+34 669 04 55 28</a>
                <a href="https://wa.me/34669045528" target="_blank" rel="noopener noreferrer" className="block border-b border-[#182A32]/20 pb-4 font-semibold">WhatsApp personal</a>
                <a href="/reservar" className="inline-flex min-h-12 items-center gap-2 bg-[#182A32] px-6 py-3 font-semibold text-white"><CalendarDays className="h-5 w-5" aria-hidden="true" />Reservar reunión de 15 minutos</a>
              </div>
              <div className="border border-[#CBB68F] bg-[#F7F4EE] p-6 md:p-8"><h3 className="mb-5 font-serif text-2xl">Enviar propuesta</h3><KseniaPersonalContactForm context="mentorias" /></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#182A32] px-6 py-8 text-[#F7F4EE] md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <span className="font-serif text-lg">Ksenia Ilicheva.</span>
          <a href={personalUrl} className="text-sm underline underline-offset-4">Volver al perfil personal</a>
          <a href="https://expertconsulting.es" className="text-sm underline underline-offset-4">EXPERT CONSULTING</a>
        </div>
      </footer>
    </div>
  );
}
