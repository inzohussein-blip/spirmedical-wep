import type { Metadata, Viewport } from 'next';

// خطوط محلياً عبر @fontsource (لا حاجة لاتصال شبكة في الـ build)
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

export const metadata: Metadata = {
  title: 'سباير ميديكال · Spir Medical',
  description: 'منصة طبية رقمية متكاملة في العراق',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    title: 'Spir Medical · سباير ميديكال',
    description: 'الرعاية الصحية بين يديك',
    type: 'website',
    locale: 'ar_IQ',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0E5C4D',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
