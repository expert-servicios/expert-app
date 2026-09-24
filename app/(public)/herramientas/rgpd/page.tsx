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
        <RgpdSelfAssessment hourlyRateEur={hourlyRateEur} />

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
            </div>
          </div>
        </aside>
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
