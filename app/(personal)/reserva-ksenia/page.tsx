import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3, Video } from 'lucide-react';
import { NativeBookingForm } from '@/components/booking/NativeBookingForm';
import { KseniaPersonalBookingGate } from '@/components/personal/KseniaPersonalBookingGate';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { metadataBase: new URL('https://kseniailicheva.com'), title: 'Reservar reunión | Ksenia Ilicheva', description: 'Reserva una reunión inicial de 15 minutos con Ksenia Ilicheva.', alternates: { canonical: 'https://kseniailicheva.com/reservar', languages: { es: 'https://kseniailicheva.com/reservar', ru: 'https://kseniailicheva.com/ru/reservar' } }, icons: { icon: '/personal/ksenia-favicon.png' } };
export default function ReservaKsenia() {
 return <main className="min-h-screen bg-[#F7F4EE] text-[#182A32]">
  <header className="border-b border-[#182A32]/15 px-6 py-5"><Link href="/" className="inline-flex items-center gap-2 font-semibold"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a la web personal</Link><Link href="/ru/reservar" lang="ru" className="ml-5 text-sm font-semibold underline underline-offset-4">RU</Link></header>
  <section className="mx-auto max-w-5xl px-6 py-14">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A57931]">Agenda personal</p>
    <h1 className="mt-5 font-serif text-4xl md:text-5xl">Reservar una reunión conmigo</h1>
    <p className="my-6 max-w-3xl text-base leading-8 text-[#536167]">Una primera conversación gratuita de 15 minutos para comprender tu propuesta y elegir el siguiente paso. Consulta los horarios disponibles y recibe una invitación con el enlace a la reunión online.</p>
    <div className="mb-8 flex flex-wrap gap-5 text-sm"><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> 15 minutos</span><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Disponibilidad real</span><span className="inline-flex items-center gap-2"><Video className="h-4 w-4" /> Reunión online</span></div>
    <KseniaPersonalBookingGate locale="es"><NativeBookingForm serviceKey="consulta-inicial" origin="personal:kseniailicheva.com" calendarLabel="Agenda de Ksenia Ilicheva" /></KseniaPersonalBookingGate>
    <p className="mt-8 text-sm">¿No encuentras un horario? Escríbeme a <a href="mailto:soy@kseniailicheva.com" className="underline">soy@kseniailicheva.com</a>.</p>
    <p className="mt-4 text-sm leading-7 text-[#536167]">Si necesitas contratar asesoramiento fiscal, contable o laboral, consulta directamente los <a href="https://expertconsulting.es/servicios" target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[#A57931] underline-offset-4">servicios de EXPERT CONSULTING</a>.</p>
  </section>
 </main>;
}
