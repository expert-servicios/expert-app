import type { Metadata } from 'next';
import Link from 'next/link';
import { RgpdSelfAssessment } from '@/components/tools/RgpdSelfAssessment';

export const metadata: Metadata = {
  title: 'Autoimplantación RGPD para pymes | Herramienta gratuita EXPERT',
  description:
    'Cuestionario gratuito para orientar la implantación RGPD/LOPDGDD de autónomos y pymes y detectar cuándo conviene una revisión profesional.',
  alternates: { canonical: 'https://expertconsulting.es/herramientas/rgpd' },
  openGraph: {
    title: 'Autoimplantación RGPD para pymes | EXPERT',
    description: 'Evalúa tu situación, identifica módulos de cumplimiento y detecta señales de revisión profesional.',
    url: 'https://expertconsulting.es/herramientas/rgpd',
    type: 'website',
  },
};

export default function RgpdToolPage() {
  const configuredRate = Number(process.env.RGPD_PRO_HOURLY_RATE_EUR ?? '');
  const hourlyRateEur = Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : undefined;

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">EXPERT · Herramientas</p>
          <h1 className="mt-3 max-w-4xl font-serif text-3xl font-bold leading-tight md:text-5xl">
            Autoimplantación RGPD para autónomos y pequeñas empresas
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#D1D5DB]">
            Responde un cuestionario breve y obtén una ruta inicial de trabajo. Si aparecen factores de mayor riesgo, la herramienta te deriva a revisión profesional antes de cerrar la implantación.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-5"><div className="border border-[#D4A017]/40 bg-white p-5"><p className="font-bold">Aprende a utilizar las herramientas oficiales de la AEPD</p><p className="mt-2 text-sm">Formación online guiada de 2 horas con EXPERT: Facilita RGPD, Facilita EMPRENDE y Gestiona RGPD. Precio fijo 180 € + IVA. No equivale a una certificación de cumplimiento.</p><Link href="/servicios/empresas-autonomos/formacion-rgpd-aepd" className="mt-3 inline-block font-semibold underline">Ver la formación RGPD de 2 horas →</Link></div><RgpdSelfAssessment hourlyRateEur={hourlyRateEur} /></div>

        <aside className="space-y-5">
          <div className="border border-[#D4A017]/25 bg-white p-5">
            <h2 className="font-serif text-xl font-bold">Qué puede hacer esta herramienta</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#23364D]">
              <li>• Detectar los bloques de cumplimiento que necesitas.</li>
              <li>• Diferenciar bajo riesgo de casos que requieren revisión.</li>
              <li>• Llevarte a las guías y checklists gratuitos de EXPERT.</li>
              <li>• Preparar un resumen de alcance si solicitas presupuesto.</li>
            </ul>
          </div>

          <div className="border border-[#D4A017]/25 bg-white p-5">
            <h2 className="font-serif text-xl font-bold">Qué no hace</h2>
            <p className="mt-3 text-sm leading-6 text-[#23364D]">
              No certifica cumplimiento, no sustituye una EIPD, no toma decisiones jurídicas por el responsable y no convierte automáticamente en válido un documento generado.
            </p>
          </div>

          <div className="border border-[#D4A017]/25 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Recursos</p>
            <div className="mt-3 space-y-2 text-sm font-semibold">
              <Link href="/docs/checklist-rgpd-autonomos-pymes" className="block hover:text-[#D4A017]">Checklist RGPD →</Link>
              <Link href="/docs/registro-actividades-tratamiento-rat-pymes" className="block hover:text-[#D4A017]">Registro de Actividades →</Link>
              <Link href="/docs/privacidad-formularios-cookies-web" className="block hover:text-[#D4A017]">Web y cookies →</Link>
              <Link href="/docs/protocolo-brechas-datos-personales-72-horas" className="block hover:text-[#D4A017]">Brechas de datos →</Link>
              <Link href="/docs/alta-inscripcion-aepd-tramites-empresa" className="block hover:text-[#D4A017]">¿Hay que darse de alta en la AEPD? →</Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="border-t border-[#D4A017]/20 bg-[#F8F6F1] px-6 py-12">
        <div className="mx-auto max-w-6xl space-y-9">
          <div><p className="text-xs font-bold uppercase tracking-widest text-[#B38C13]">Sigue aprendiendo con EXPERT</p><h2 className="mt-2 font-serif text-3xl font-bold">Guías, artículos y formación recomendados</h2><p className="mt-2 text-sm">Explora recursos gratuitos y decide si necesitas una sesión práctica o una revisión profesional.</p></div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {title:'Facilita RGPD',desc:'Documentación inicial para tratamientos habituales de bajo riesgo.',href:'https://www.aepd.es/guias-y-herramientas/herramientas/facilita-rgpd'},
              {title:'Facilita EMPRENDE',desc:'Ayuda a startups, apps y modelos de negocio innovadores.',href:'https://www.aepd.es/guias-y-herramientas/herramientas/facilita-emprende'},
              {title:'Gestiona RGPD',desc:'Organiza tratamientos y factores de riesgo; no sustituye una EIPD.',href:'https://gestiona2.aepd.es/'}
            ].map(item => <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="border bg-white p-5 hover:border-[#D4A017]"><strong>{item.title} ↗</strong><p className="mt-2 text-sm text-[#23364D]">{item.desc}</p></a>)}
          </div>
          <div className="grid gap-7 lg:grid-cols-2">
            <div><h3 className="mb-3 font-serif text-2xl font-bold">Artículos recomendados</h3><div className="space-y-2">
              {[
                {title:'Facilita RGPD vs. Facilita EMPRENDE vs. Gestiona RGPD',href:'/blog/facilita-rgpd-facilita-emprende-gestiona-rgpd-diferencias'},
                {title:'RGPD en marketplaces y plataformas de empleo',href:'/blog/rgpd-marketplaces-candidatos-datos-sensibles-responsabilidad'},
                {title:'RGPD para autónomos y pymes en España',href:'/blog/rgpd-autonomos-pymes-espana-2026'},
                {title:'Web, formularios y cookies: obligaciones RGPD',href:'/blog/web-formularios-cookies-rgpd-lssi-espana'},
                {title:'Proveedores cloud e IA: contratos y encargados',href:'/blog/proveedores-cloud-ia-rgpd-encargados-tratamiento'}
              ].map(item => <Link key={item.href} href={item.href} className="block border bg-white px-4 py-3 text-sm font-semibold hover:border-[#D4A017]">{item.title} →</Link>)}
            </div></div>
            <div><h3 className="mb-3 font-serif text-2xl font-bold">Base de conocimiento</h3><div className="space-y-2">
              {[
                {title:'Cómo verificar el cumplimiento RGPD',href:'/docs/formacion-rgpd-criterios-cumplimiento-y-evidencias'},
                {title:'Qué herramienta AEPD elegir según tu empresa',href:'/docs/rgpd-aepd-ruta-decisiones-para-startups'},
                {title:'Checklist RGPD para autónomos y pymes',href:'/docs/checklist-rgpd-autonomos-pymes'},
                {title:'Registro de Actividades de Tratamiento (RAT)',href:'/docs/registro-actividades-tratamiento-rat-pymes'},
                {title:'Privacidad, formularios y cookies',href:'/docs/privacidad-formularios-cookies-web'}
              ].map(item => <Link key={item.href} href={item.href} className="block border bg-white px-4 py-3 text-sm font-semibold hover:border-[#D4A017]">{item.title} →</Link>)}
            </div></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/servicios/empresas-autonomos/formacion-rgpd-aepd" className="border border-[#D4A017] bg-white p-6"><p className="text-xs font-bold uppercase text-[#977316]">Acompañamiento en directo</p><h3 className="mt-2 font-serif text-xl font-bold">Formación RGPD de 2 horas · 180 € + IVA</h3><p className="mt-2 text-sm">Aprende a utilizar las herramientas de la AEPD con un profesional. No es una certificación.</p><span className="mt-4 block font-bold underline">Ver formación →</span></Link>
            <Link href="/solicitar-presupuesto?servicio=proteccion-datos-rgpd&origen=herramienta-rgpd" className="border bg-white p-6"><p className="text-xs font-bold uppercase text-[#977316]">Revisión profesional</p><h3 className="mt-2 font-serif text-xl font-bold">Evaluación de adecuación e implantación RGPD</h3><p className="mt-2 text-sm">Cuando hay mayor complejidad, solicita un alcance y presupuesto personalizados.</p><span className="mt-4 block font-bold underline">Solicitar revisión →</span></Link>
          </div>
          <p className="text-xs text-slate-600">Los recursos oficiales orientan y ayudan a documentar; el responsable debe adoptar medidas adecuadas y demostrar su cumplimiento. Ninguna herramienta constituye una certificación automática.</p>
        </div>
      </section>

      <section className="border-t border-[#D4A017]/20 bg-white px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl font-bold">Preguntas frecuentes sobre tus resultados</h2>
          <div className="mt-6 space-y-3">
            {[
              {q:'¿Los temas del resultado son incumplimientos?',a:'No. Son áreas que conviene comprobar. La herramienta no inspecciona tus sistemas ni puede saber si ya tienes cada medida correctamente implantada.'},
              {q:'¿Tengo que completar todos los puntos hoy?',a:'No necesariamente. Empieza por identificar qué datos utilizas, con qué fin y en qué herramientas; revisa primero las incidencias urgentes y los tratamientos de mayor riesgo.'},
              {q:'¿Cómo sé exactamente qué tengo que hacer?',a:'Cada tema incluye una explicación sencilla, una primera acción y una guía relacionada. Puedes empezar gratis y solicitar ayuda para trabajar con las herramientas oficiales.'},
              {q:'¿Puedo rellenar Facilita RGPD o Gestiona RGPD acompañado?',a:'Sí. EXPERT ofrece una formación online individual de dos horas por 180 € + IVA. Durante la sesión utilizamos las herramientas oficiales adecuadas, sin pedir datos personales de terceros.'},
              {q:'¿Terminar el cuestionario garantiza que cumplo el RGPD?',a:'No. La empresa debe implantar las medidas aplicables y poder demostrarlo. Las herramientas ayudan a organizar el trabajo, pero no son certificaciones oficiales.'}
            ].map(item=><details key={item.q} className="border bg-[#F8F6F1] p-4"><summary className="cursor-pointer font-semibold">{item.q}</summary><p className="mt-3 text-sm leading-6">{item.a}</p></details>)}
          </div>
          <Link href="/servicios/empresas-autonomos/formacion-rgpd-aepd" className="mt-5 inline-block font-bold underline">Formación RGPD guiada 2 horas · 180 € + IVA →</Link>
        </div>
      </section>

      <section className="border-t border-[#D4A017]/20 bg-white px-6 py-10">
        <div className="mx-auto max-w-5xl text-sm leading-7 text-[#23364D]">
          <p className="font-bold text-[#0D1B2A]">Base de la metodología</p>
          <p className="mt-2">
            La herramienta sigue el enfoque de responsabilidad proactiva del RGPD y toma como referencia las herramientas públicas de ayuda de la AEPD para tratamientos de bajo riesgo, emprendimiento y evaluación de riesgos. La evaluación es orientativa y debe adaptarse a cada tratamiento.
          </p>
        </div>
      </section>
    </main>
  );
}
