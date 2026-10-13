import type { Metadata } from 'next';
import UkraineLongTermPage from '@/components/content/UkraineLongTermPage';
export const metadata: Metadata = { title: 'EX-11: инструкция по larga duración nacional', robots: { index: false, follow: true } };
export default function Page() { return <UkraineLongTermPage locale="ru" kind="guide" />; }
