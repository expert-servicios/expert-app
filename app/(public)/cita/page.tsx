import type { Metadata } from 'next';
import { CheckCircle2, Clock, Phone, Calendar } from 'lucide-react';
import { NativeBookingForm } from '@/components/booking/NativeBookingForm';

export const metadata: Metadata = {
  title: 'Reservar cita | EXPERT — Asesoría Fiscal y Legal',
  description:
    'Reserva una cita con EXPERT. Consulta disponibilidad real y recibe una invitación de Google Meet.',
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/cita',
    title: 'Reservar cita | EXPERT',
    description: 'Reserva una cita con disponibilidad real de EXPERT y Google Meet.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'Reservar cita — EXPERT Asesoría' }],
  },
  twitter: { card: 'summary_large_image', images: ['/branding/expert%20servicios.png'] },
  alternates: { canonical: 'https://expertconsulting.es/cita' },
};

const PILLS = [
  { icon: CheckCircle2, label: 'Confirmación inmediata' },
  { icon: Clock, label: 'Disponibilidad real' },
  { icon: Phone, label: 'Google Meet' },
];

const HOW_IT_WORKS = [
  'EXPERT consulta la disponibilidad real del calendario',
  'Eliges un hueco libre',
  'Google crea la reunión Meet y envía la invitación',
  'La cita queda registrada también en tu expediente cuando corresponda',
];

export default async function CitaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const params = await searchParams;
  const serviceKey = params.tipo?.trim() || 'consulta-inicial';

  return (
    <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="bg-[#0D1B2A] px-6 py-10 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Agenda EXPERT</p>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight md:text-4xl">Reserva tu cita</h1>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {PILLS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 border border-[#D4A017]/30 bg-[#D4A017]/10 px-3 py-1.5">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#D4A017]" />
                <span className="text-xs font-semibold text-[#F8F6F1]/85">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-start">
          <NativeBookingForm serviceKey={serviceKey} />

          <div className="hidden space-y-4 lg:block">
            <div className="border border-[#D4A017]/20 bg-white p-6 shadow-[0_4px_16px_rgba(13,27,42,0.06)]">
              <h2 className="font-serif text-base font-bold text-[#0D1B2A]">¿Cómo funciona?</h2>
              <ul className="mt-4 space-y-3">
                {HOW_IT_WORKS.map((text) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-[#374151]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-[#D4A017]/20 bg-white p-6">
              <h2 className="font-serif text-base font-bold text-[#0D1B2A]">Horario</h2>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-[#374151]">
                  <span>Lunes – Viernes</span>
                  <span className="font-semibold text-[#0D1B2A]">9:00 – 18:00</span>
                </div>
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Sábado – Domingo</span>
                  <span>Cerrado</span>
                </div>
              </div>
            </div>

            <div className="border border-[#D4A017]/30 bg-[#D4A017]/5 p-5">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                <p className="text-sm leading-6 text-[#374151]">
                  Recibirás la invitación de Calendar y el enlace de Google Meet por email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
