import type { Metadata } from 'next';
import UkraineLongTermPage from '@/components/content/UkraineLongTermPage';
export const metadata: Metadata = { title: 'Residencia de larga duración nacional · EXPERT', alternates: {canonical:'https://expertconsulting.es/blog/proteccion-temporal-ucrania-larga-duracion-2026',languages:{'es-ES':'https://expertconsulting.es/blog/proteccion-temporal-ucrania-larga-duracion-2026','ru-RU':'https://expertconsulting.es/ru/blog/ukraina-proteccion-temporal-larga-duracion-2026','x-default':'https://expertconsulting.es/blog/proteccion-temporal-ucrania-larga-duracion-2026'}}, robots: { index: false, follow: true } };
export default function Page() { return <UkraineLongTermPage locale="es" kind="overview" />; }
