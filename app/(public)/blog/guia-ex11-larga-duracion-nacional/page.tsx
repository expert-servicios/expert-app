import type { Metadata } from 'next';
import UkraineLongTermPage from '@/components/content/UkraineLongTermPage';
export const metadata: Metadata = { title: 'Residencia de larga duración nacional · EXPERT', alternates: {canonical:'https://expertconsulting.es/blog/guia-ex11-larga-duracion-nacional',languages:{'es-ES':'https://expertconsulting.es/blog/guia-ex11-larga-duracion-nacional','ru-RU':'https://expertconsulting.es/ru/blog/instruktsiya-ex11-larga-duracion','x-default':'https://expertconsulting.es/blog/guia-ex11-larga-duracion-nacional'}}, robots: { index: false, follow: true } };
export default function Page() { return <UkraineLongTermPage locale="es" kind="guide" />; }
