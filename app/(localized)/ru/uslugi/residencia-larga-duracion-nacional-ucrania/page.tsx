import type { Metadata } from 'next';
import UkraineLongTermPage from '@/components/content/UkraineLongTermPage';
export const metadata: Metadata = { title: 'Residencia de larga duración nacional для украинцев', robots: { index: false, follow: true } };
export default function Page() { return <UkraineLongTermPage locale="ru" kind="service" />; }
