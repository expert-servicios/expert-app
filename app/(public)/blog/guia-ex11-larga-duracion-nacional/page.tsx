import type { Metadata } from 'next';
import UkraineLongTermPage from '@/components/content/UkraineLongTermPage';
export const metadata: Metadata = { title: 'Residencia de larga duración nacional · EXPERT', robots: { index: false, follow: true } };
export default function Page() { return <UkraineLongTermPage locale="es" kind="guide" />; }
