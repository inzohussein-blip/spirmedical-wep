import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { CookieConsent } from '@/components/legal/CookieConsent';
import StructuredData from '@/components/seo/StructuredData';
import PWAManager from '@/components/ui/PWAManager';
import NetworkStatusDetector from '@/components/ui/NetworkStatusDetector';
import SWUpdateBanner from '@/components/ui/SWUpdateBanner';
import WebVitalsReporter from '@/components/seo/WebVitalsReporter';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

// خطوط — Tajawal فقط (وحّدنا الخط في V15)
// JetBrains-Mono للأرقام والوقت فقط
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import '@fontsource/jetbrains-mono/500.css';

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
    'منصة طبية رقمية متكاملة في العراق · سحب دم منزلي · تحاليل · استشارات طبية · طبيب عائلة · ١٤+ خدمة طبية',
  applicationName: 'Spir Medical',
  category: 'Healthcare',
  classification: 'Medical Platform',

  // كلمات مفتاحية شاملة
  keywords: [
    // عربي
    'سباير ميديكال',
    'منصة طبية',
    'تطبيق طبي',
    'سحب دم منزلي',
    'تحاليل طبية',
    'استشارة طبية',
    'صيدلية',
    'حجز طبيب',
    'طبيب عائلة',
    'مستشفيات العراق',
    'العراق',
    'بغداد',
    // English
    'Spir Medical',
    'Iraq medical platform',
    'home blood draw Iraq',
    'medical consultation Iraq',
    'Iraqi pharmacies',
    'doctor booking Iraq',
    'health Iraq',
    'medical app Iraq',
    'Baghdad health',
    'telemedicine Iraq',
  ],

  authors: [{ name: 'Spir Medical Team', url: SITE_URL }],
  creator: 'Spir Medical',
  publisher: 'Spir Medical',
  generator: 'Next.js',

  // 📞 لا تحول الأرقام لـ tel: links تلقائياً
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },

  // 🌍 اللغات والمناطق
  alternates: {
    canonical: SITE_URL,
    languages: {
      'ar-IQ': SITE_URL,
      'ar': SITE_URL,
      'en-US': `${SITE_URL}/en`,
      'ku': `${SITE_URL}/ku`,
      'x-default': SITE_URL,
    },
  },

  // 📱 OpenGraph - معاينات السوشيال
  openGraph: {
    title: 'سباير ميديكال · Spir Medical',
    description:
      'الرعاية الصحية بين يديك · ١٤+ خدمة طبية · في كل المحافظات العراقية',
    url: SITE_URL,
    siteName: 'Spir Medical · سباير ميديكال',
    locale: 'ar_IQ',
    alternateLocale: ['en_US', 'ku_IQ'],
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Spir Medical · سباير ميديكال - منصة طبية رقمية',
        type: 'image/png',
      },
    ],
  },

  // 🐦 Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'سباير ميديكال · Spir Medical',
    description: 'الرعاية الصحية بين يديك · منصة طبية رقمية في العراق',
    images: ['/api/og'],
    creator: '@spirmedical',
    site: '@spirmedical',
  },

  // 🤖 Robots - تحكم تفصيلي
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // 🎨 Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },

  manifest: '/manifest.json',

  // 📝 Meta tags إضافية (للـ AI agents الحديثة)
  other: {
    // Apple Mobile Web App
    'apple-mobile-web-app-title': 'Spir Medical',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',

    // محتوى للـ AI
    'ai:purpose': 'medical-platform',
    'ai:target-audience': 'Iraqi patients and medical specialists',
    'ai:content-type': 'healthcare-information',
    'ai:languages': 'ar,en,ku',
    'ai:region': 'IQ',

    // Microsoft Tiles
    'msapplication-TileColor': '#0E5C4D',
    'msapplication-config': '/browserconfig.xml',

    // Geo Tags
    'geo.region': 'IQ',
    'geo.placename': 'Baghdad',
    'geo.position': '33.3152;44.3661',
    'ICBM': '33.3152, 44.3661',

    // Rating
    'rating': 'general',

    // Content Language
    'content-language': 'ar, en',

    // DC Metadata (Dublin Core - للأرشفة)
    'DC.title': 'Spir Medical - سباير ميديكال',
    'DC.subject': 'Healthcare, Medical Platform, Iraq',
    'DC.creator': 'Spir Medical Team',
    'DC.publisher': 'Spir Medical',
    'DC.language': 'ar',
    'DC.rights': '© 2026 Spir Medical',
  },

  // ✅ Verification (Google Search Console, Bing)
  verification: {
    // أضف الـ verification codes هنا عند الحصول عليها:
    // google: 'verification_code_here',
    // yandex: 'verification_code_here',
    // bing: 'verification_code_here',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0E5C4D' },
    { media: '(prefers-color-scheme: dark)', color: '#073B30' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar-IQ" dir="rtl">
      <head>
        {/* DNS Prefetch للأداء */}
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />

        {/* Preconnect مهم */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />

        {/* JSON-LD Structured Data */}
        <StructuredData />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
        <NetworkStatusDetector />
        <SWUpdateBanner />
        <CookieConsent />
        <PWAManager />
        <WebVitalsReporter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
