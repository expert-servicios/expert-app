import type { Metadata } from 'next';
import { FreeConsultationForm } from '@/components/site/FreeConsultationForm';

export const metadata: Metadata = {
  title: 'Consulta gratuita | EXPERT',
  description: 'Cuéntanos tu duda sin compromiso. KIA y el equipo de EXPERT revisarán el caso y te orientarán sobre el siguiente paso.',
  alternates: { canonical: 'https://expertconsulting.es/consulta-gratuita' },
};

export default async function FreeConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string; servicio?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Consulta gratuita</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Cuéntanos qué necesitas</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#C9D1D9]">
            No es necesario saber qué servicio contratar. Describe la situación con tus palabras y utilizaremos esa información para orientarte y mejorar nuestros servicios y contenidos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="border border-[#D4A017]/25 bg-white p-6 md:p-8">
          <FreeConsultationForm origin={params.origen ?? null} service={params.servicio ?? null} />
        </div>
      </section>
    </main>
  );
}
