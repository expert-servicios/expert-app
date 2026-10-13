import type { Metadata } from 'next';
import UkraineLongTermPage from '@/components/content/UkraineLongTermPage';
export const metadata: Metadata = { title: 'Residencia de larga duración nacional для украинцев', alternates: {canonical:'https://expertconsulting.es/ru/uslugi/residencia-larga-duracion-nacional-ucrania',languages:{'es-ES':'https://expertconsulting.es/servicios/extranjeria-nacionalidad/residencia-larga-duracion-nacional-ucrania','ru-RU':'https://expertconsulting.es/ru/uslugi/residencia-larga-duracion-nacional-ucrania','x-default':'https://expertconsulting.es/servicios/extranjeria-nacionalidad/residencia-larga-duracion-nacional-ucrania'}}, robots: { index: false, follow: true } };
export default function Page() { return <UkraineLongTermPage locale="ru" kind="service" />; }
