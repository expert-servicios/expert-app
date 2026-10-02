import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileText,
  Gauge,
  Handshake,
  Lightbulb,
  UsersRound,
} from 'lucide-react';
import { MentoringContactForm } from '@/components/site/MentoringContactForm';

export const metadata: Metadata = {
  title: 'Mentorías para emprendedores | Ksenia Ilicheva · EXPERT',
  description:
    'Mentoría empresarial práctica con foco en viabilidad, fiscalidad, estructura legal, gestión, validación y toma de decisiones. Mentora certificada por mentorDay.',
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

const publicProjects = [
  {
    name: 'CasaFix.io',
    text: 'Plataforma que conecta a usuarios con profesionales verificados para transporte y montaje de muebles, con solicitud y comparación de presupuestos desde el móvil.',
    href: 'https://casafix.io',
    logo: 'https://casafix.io/logo.png',
    source: 'Web pública del proyecto',
  },
  {
    name: 'Regala por mí',
    text: 'Asistente personal para simplificar la gestión de regalos durante el año, combinando recomendaciones personalizadas, coordinación y una selección de productos de pequeños productores y artesanos.',
    href: 'https://regalapormi.com',
    logo: null,
    source: 'Proyecto ganador de la edición 104 de mentorDay',
  },
  {
    name: 'Kidssmile Educational',
    text: 'Servicio de cuidado infantil en Tenerife con enfoque de educación positiva y consciente, metodología inspirada en Montessori, Waldorf y Reggio Emilia y atención personalizada a las familias.',
    href: 'https://kidssmile-educational.com',
    logo: null,
    source: 'Web pública del proyecto',
  },
];

export default function MentoriasPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-14 text-[#F8F6F1] md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Mentoría empresarial</p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight md:text-6xl">
              Menos teoría acumulada. Más decisiones que mueven el proyecto.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#C8CDD3] md:text-lg">
              Acompaño a personas emprendedoras que necesitan ordenar el proyecto, contrastar supuestos y convertir
              ideas en una hoja de ruta ejecutable. El objetivo es identificar qué hay que validar, qué evidencia falta
              y cuál es la siguiente decisión útil.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cita?tipo=consulta-inicial&origen=landing%3Amentorias"
                className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                Consulta privada · 15 min
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#propuesta"
                className="inline-flex min-h-12 items-center gap-2 border border-[#D4A017]/50 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017]/10"
              >
                Enviar una propuesta
              </a>
            </div>
          </div>

          <aside className="border border-white/10 bg-[#23364D]/55 p-5 shadow-2xl shadow-black/20">
            <div className="relative mx-auto h-52 w-52 overflow-hidden rounded-full border-4 border-[#D4A017]/35">
              <Image
                src="/avatars/ksenia-perfil.png"
                alt="Ksenia Ilicheva"
                fill
                sizes="208px"
                priority
                className="object-cover object-top"
              />
            </div>
            <div className="mt-5 text-center">
              <h2 className="font-serif text-2xl font-bold">Ksenia Ilicheva</h2>
              <p className="mt-1 text-sm text-[#C8CDD3]">Mentora empresarial · fiscal · mercantil · gestión</p>
            </div>
            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="mx-auto flex min-h-20 items-center justify-center bg-white px-4 py-3">
                <Image
                  src="/branding/mentorday-logo.png"
                  alt="mentorDay"
                  width={210}
                  height={149}
                  className="h-auto max-h-16 w-auto object-contain"
                />
              </div>
              <p className="mt-3 text-center text-xs leading-5 text-[#C8CDD3]">
                Certificada por mentorDay tras superar el Taller Práctico de Mentoring · 5 de noviembre de 2024.
              </p>
            </div>
          </aside>
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
            Las cifras describen proyectos incluidos en las convocatorias revisadas; no implican que todos hayan recibido una mentoría individual completa.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">mentorDay</p>
              <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Mentoría certificada y orientada a ejecución</h2>
              <p className="mt-4 text-sm leading-7 text-[#23364D] md:text-base">
                Participo como mentora en sesiones Mentor Tips y en programas de acompañamiento más intensivos. Mi
                aportación se concentra en viabilidad, estructura fiscal y mercantil, organización empresarial,
                gestión, digitalización y contraste práctico del modelo.
              </p>
              <div className="mt-6 flex items-start gap-3 border border-[#D4A017]/25 bg-[#FFF9EA] p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                <p className="text-sm leading-6 text-[#526171]">
                  La acreditación mentorDay certifica la superación del Taller Práctico de Mentoring y el cumplimiento
                  de las condiciones para acompañar a una persona emprendedora.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {formats.map((item) => (
                <article key={item.title} className="border border-[#D8CBB5] bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#D4A017]">{item.meta}</p>
                  <h3 className="mt-3 font-serif text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#526171]">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Método de trabajo</p>
          <h2 className="mt-4 max-w-3xl font-serif text-3xl font-bold md:text-4xl">Cada sesión debe reducir una incertidumbre.</h2>
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
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Ecosistema emprendedor</p>
            <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Algunos proyectos de las convocatorias revisadas</h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D]">
              Estas fichas describen proyectos con información pública verificable. No todos los proyectos revisados
              se publican aquí y la aparición en esta sección no equivale por sí sola a una relación de mentoría individual.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {publicProjects.map((project) => (
              <article key={project.name} className="flex flex-col border border-[#D8CBB5] bg-white p-6 shadow-sm">
                <div className="flex h-16 items-center">
                  {project.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.logo} alt={project.name} className="max-h-12 max-w-[180px] object-contain" />
                  ) : (
                    <div className="flex h-12 min-w-12 items-center justify-center border border-[#D4A017]/25 bg-[#FFF9EA] px-3 font-serif text-lg font-bold text-[#0D1B2A]">
                      {project.name}
                    </div>
                  )}
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold">{project.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[#526171]">{project.text}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#8C6A22]">{project.source}</p>
                <a href={project.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#8A6111] hover:underline">
                  Ver proyecto <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Casos y aprendizajes</p>
            <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Documentar el proceso también genera conocimiento.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#23364D] md:text-base">
              Las mentorías se documentan internamente para revisar decisiones, evidencia y evolución. Cuando un caso
              aporta un aprendizaje útil, puede transformarse en artículo o caso práctico únicamente después de revisar
              qué información es publicable y contar con la autorización correspondiente.
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

      <section id="propuesta" className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Contacto</p>
            <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Mentoría, colaboración, inversión o alianza.</h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D]">
              Si quieres plantear una colaboración, presentar un proyecto, explorar una inversión o proponer una alianza,
              deja el contexto aquí. La propuesta se registra directamente en EXPERT para poder darle seguimiento.
            </p>
            <div className="mt-6 border border-[#D4A017]/25 bg-[#FFF9EA] p-5">
              <Handshake className="h-5 w-5 text-[#D4A017]" />
              <p className="mt-3 text-sm font-semibold">¿Prefieres hablar primero?</p>
              <p className="mt-2 text-sm leading-6 text-[#526171]">
                La reunión informativa de 15 minutos sirve para comprobar encaje y definir el siguiente paso, sin convertirla en una sesión larga de mentoring.
              </p>
              <Link href="/cita?tipo=consulta-inicial&origen=landing%3Amentorias" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#8A6111] hover:underline">
                Reservar 15 minutos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="border border-[#D8CBB5] bg-white p-6 shadow-sm md:p-8">
            <MentoringContactForm />
          </div>
        </div>
      </section>

      <section className="brand-blue-bg px-6 py-14 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <Lightbulb className="mx-auto h-7 w-7 text-[#D4A017]" />
          <h2 className="mt-4 font-serif text-3xl font-bold">¿Necesitas ordenar una decisión empresarial?</h2>
          <p className="mt-4 text-sm leading-7 text-[#C8CDD3]">
            Podemos empezar por una conversación concreta sobre el punto que está bloqueando el siguiente paso.
          </p>
          <Link href="/cita?tipo=consulta-inicial&origen=landing%3Amentorias" className="mt-7 inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">
            Consulta informativa · 15 min
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
