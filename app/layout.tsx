import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { headers } from 'next/headers';
import { type ReactNode } from 'react';
import { PwaRegister } from '@/components/PwaRegister';
import { CookieConsent } from '@/components/privacy/CookieConsent';


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#07111d',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://expertconsulting.es'),
  manifest: '/manifest.json',
  icons: { icon: [{ url: '/branding/expert-approved/favicon.png?v=2', sizes: '256x256', type: 'image/png' }], shortcut: [{ url: '/branding/expert-approved/favicon.ico?v=2', type: 'image/x-icon' }], apple: [{ url: '/branding/expert-approved/app-dark-192.png?v=2', sizes: '192x192', type: 'image/png' }] },
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed', title: 'EXPERT Blog RSS' },
        { url: '/rss', title: 'EXPERT Blog RSS alternativo' },
      ],
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EXPERT',
  },
  title: 'EXPERT | Asesoría fiscal, legal y administrativa',
  description:
    'Asesoría fiscal en España para empresas, autónomos y personas físicas. Impuestos, extranjería, trámites y gestión administrativa.',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    title: 'EXPERT | Asesoría fiscal, legal y administrativa',
    description:
      'Asesoría fiscal en España para empresas, autónomos y personas físicas. Impuestos, extranjería, trámites y gestión administrativa.',
    url: 'https://expertconsulting.es',
    images: [{ url: '/branding/expert-approved/og-expert-1200x630.png', width: 1200, height: 630, alt: 'EXPERT — Asesoría Fiscal y Legal' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EXPERT | Asesoría fiscal, legal y administrativa',
    description: 'Asesoría fiscal en España para empresas, autónomos y personas físicas.',
    images: ['/branding/expert-approved/og-expert-1200x630.png']
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const documentLocale = requestHeaders.get('x-expert-locale') === 'ru' ? 'ru' : 'es';

  return (
    <html lang={documentLocale} suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <CookieConsent />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
