import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { CookieConsent } from '@/components/legal/CookieConsent';

// خطوط
import '@fontsource/tajawal/300.css';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import '@fontsource/tajawal/900.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/500-italic.css';
import '@fontsource/fraunces/600-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';

import './globals.css';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spirmedical-wep.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'سباير ميديكال · Spir Medical — منصة طبية رقمية في العراق',
    template: '%s · Spir Medical',
  },
  description:
    'منصة طبية رقمية متكاملة في العراق · حجز سهل · توصيل سريع · أمان كامل',
  keywords: [
    'سباير ميديكال',
    'Spir Medical',
    'طب العراق',
    'سحب دم منزلي',
    'استشارة طبية',
    'صيدلية',
    'حجز طبيب',
  ],
  authors: [{ name: 'Spir Medical Team' }],
  creator: 'Spir Medical',
  publisher: 'Spir Medical',
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'ar-IQ': SITE_URL,
    },
  },
  openGraph: {
    title: 'سباير ميديكال · Spir Medical',
    description: 'الرعاية الصحية بين يديك',
    url: SITE_URL,
    siteName: 'Spir Medical · سباير ميديكال',
    locale: 'ar_IQ',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Spir Medical',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سباير ميديكال · Spir Medical',
    description: 'الرعاية الصحية بين يديك · منصة طبية رقمية في العراق',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0E5C4D',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar-IQ" dir="rtl">
      <body>
        {children}
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
