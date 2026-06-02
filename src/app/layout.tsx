import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { CookieConsent } from '@/components/legal/CookieConsent';
import StructuredData from '@/components/seo/StructuredData';
import PWAModeProvider from '@/components/pwa/PWAModeProvider';
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar';
import NetworkStatusDetector from '@/components/ui/NetworkStatusDetector';
import SWUpdateBanner from '@/components/ui/SWUpdateBanner';
import WebVitalsReporter from '@/components/seo/WebVitalsReporter';
import PerformanceMonitor from '@/components/dev/PerformanceMonitor';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import SmartInstallPrompt from '@/components/pwa/SmartInstallPrompt';
import IOSInstallPrompt from '@/components/pwa/IOSInstallPrompt';
import IOSSplashScreens from '@/components/pwa/IOSSplashScreens';
import AppBackHandler from '@/components/pwa/AppBackHandler';
import SessionSync from '@/components/pwa/SessionSync';

// خطوط — Tajawal فقط (وحّدنا الخط في V15)
// JetBrains-Mono للأرقام والوقت فقط
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import '@fontsource/jetbrains-mono/500.css';

import './styles/shared.css';
import './pwa.css';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spir-medical.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'سباير ميديكال · Spir Medical — منصة طبية رقمية في العراق',
    template: '%s · Spir Medical',
  },
  description:
    'منصة طبية رقمية متكاملة في العراق · سحب دم منزلي · تحاليل · استشارات طبية · طبيب عائلة · 15 خدمة طبية · 18 محافظة · 24/7',
  applicationName: 'Spir Medical',
  category: 'Healthcare',
  classification: 'Medical Platform',

  // كلمات مفتاحية شاملة
  keywords: [
    // عربي - الأساسية
    'سباير ميديكال',
    'سباير ميديكل',
    'منصة طبية عراقية',
    'تطبيق طبي عراقي',
    // الخدمات الرئيسية
    'سحب دم منزلي',
    'سحب دم بغداد',
    'تحاليل طبية',
    'فحوصات منزلية',
    'استشارة طبية أونلاين',
    'صيدلية منزلية',
    'حجز طبيب',
    'طبيب عائلة',
    'مختبر طبي',
    // المحافظات
    'العراق',
    'بغداد',
    'البصرة',
    'الموصل',
    'النجف',
    'كربلاء',
    'أربيل',
    'كركوك',
    'صناعة عراقية',
    // English
    'Spir Medical',
    'Iraq medical platform',
    'home blood draw Iraq',
    'home lab tests Iraq',
    'medical consultation Iraq',
    'Iraqi pharmacies',
    'doctor booking Iraq',
    'health Iraq',
    'medical app Iraq',
    'Baghdad health',
    'Basra health',
    'Mosul health',
    'telemedicine Iraq',
    'Iraqi made',
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
      'الرعاية الصحية بين يديك · 15 خدمة طبية · 18 محافظة · 24/7 · صناعة عراقية',
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
    description: 'الرعاية الصحية بين يديك · 18 محافظة · 24/7 · صناعة عراقية',
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
    // 🍎 Apple PWA Maximum - V25.23
    'apple-mobile-web-app-title': 'سباير',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'application-name': 'Spir Medical',
    'theme-color': '#0E5C4D',
    'msapplication-tap-highlight': 'no',
    'msapplication-TileColor': '#0E5C4D',

    // محتوى للـ AI
    'ai:purpose': 'medical-platform',
    'ai:target-audience': 'Iraqi patients and medical specialists',
    'ai:content-type': 'healthcare-information',
    'ai:languages': 'ar,en,ku',
    'ai:region': 'IQ',
    // ✨ V25.4: AI tags إضافية
    'ai:services': 'home-blood-draw,lab-tests,medical-consultation,family-doctor,pharmacy',
    'ai:coverage': '18-governorates',
    'ai:availability': '24/7',
    'ai:made-in': 'Iraq',

    // Microsoft Tiles
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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

        {/* ✨ V25.17: iOS Splash Screens */}
        <IOSSplashScreens />
      </head>
      <body>
        {/* ♿ Skip to content link (a11y) */}
        <a href="#main-content" className="skip-link">
          تخطّي إلى المحتوى
        </a>

        <PWAModeProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <ServiceWorkerRegistrar />
          <Toaster />
          <NetworkStatusDetector />
          <SWUpdateBanner />
          <CookieConsent />
          <SmartInstallPrompt />
          <IOSInstallPrompt />
          <AppBackHandler />
          <SessionSync />
          <WebVitalsReporter />
          <Analytics />
          <SpeedInsights />
          <PerformanceMonitor />
        </PWAModeProvider>
      </body>
    </html>
  );
}
