import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Clock3, Video } from 'lucide-react';
import { NativeBookingForm } from '@/components/booking/NativeBookingForm';
export const metadata: Metadata = {
 metadataBase: new URL('https://kseniailicheva.com'),
 title: 'Запись на встречу | Ксения Ильичева',
 description: 'Забронируйте бесплатную вводную онлайн-встречу на 15 минут с Ксенией Ильичевой.',
 alternates: { canonical: 'https://kseniailicheva.com/ru/reservar', languages: { es: 'https://kseniailicheva.com/reservar',ru: 'https://kseniailicheva.com/ru/reservar' } },
 icons:{ icon:'/personal/ksenia-favicon.png' }
};
export default function PersonalRussianBooking(){
return <main lang="ru" className="min-h-screen bg-[#F7F4EE] text-[#182A32]"><header className="border-b border-[#182A32]/15 px-6 py-5"><nav className="mx-auto flex max-w-5xl flex-wrap justify-between gap-3"><Link href="/ru" className="font-serif text-xl">Ксения Ильичева · Главная</Link><Link href="/reservar" lang="es" className="text-sm underline">ES</Link></nav></header><section className="mx-auto max-w-5xl px-6 py-14"><p className="text-xs font-semibold uppercase tracking-widest text-[#A57931]">Личный календарь</p><h1 className="mt-5 font-serif text-4xl md:text-5xl">Запись на встречу</h1><p className="my-6 max-w-3xl text-base leading-8 text-[#536167]">Выберите удобное время для бесплатной первой беседы. За 15 минут обсудим вашу идею или предложение и определим следующие шаги. Подтверждение и ссылка Google Meet придут на электронную почту.</p><div className="mb-8 flex flex-wrap gap-5 text-sm"><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4"/>15 минут</span><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4"/>Свободные слоты</span><span className="inline-flex items-center gap-2"><Video className="h-4 w-4"/>Google Meet</span></div><NativeBookingForm serviceKey="consulta-inicial" origin="personal:kseniailicheva.com:ru" calendarLabel="Календарь Ксении Ильичевой" locale="ru"/><p className="mt-8 text-sm">Нет подходящего времени? Напишите мне: <a href="mailto:soy@kseniailicheva.com" className="underline">soy@kseniailicheva.com</a>.</p></section></main>
}
