import type { MetadataRoute } from 'next';
import { SITE_TYPE } from '@/lib/site-config';

/**
 * ════════════════════════════════════════════════════════════════════
 * 📱 Manifest (V25.35)
 * ════════════════════════════════════════════════════════════════════
 *
 * Dynamic manifest حسب نوع الموقع:
 *   - app site:       start_url = /dashboard (PWA-first)
 *   - marketing site: لا يُقدّم manifest (لا PWA install)
 *   - all (default):  start_url = /
 * ════════════════════════════════════════════════════════════════════
 */
export default function manifest(): MetadataRoute.Manifest {
  // 🌐 على Marketing site - manifest محدود (لا install)
  if (SITE_TYPE === 'marketing') {
    return {
      name: 'سباير ميديكال — موقع تعريفي',
      short_name: 'سباير',
      description: 'منصة طبية رقمية متكاملة في العراق',
      start_url: '/',
      display: 'browser',
      lang: 'ar-IQ',
      dir: 'rtl',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
    };
  }

  // 📱 على App site أو all - manifest كامل (PWA-ready)
  const isAppSite = SITE_TYPE === 'app';

  return {
    name: 'Spir Medical · سباير ميديكال',
    short_name: 'Spir Medical',
    description: 'منصة طبية رقمية متكاملة في العراق',
    start_url: isAppSite ? '/dashboard?source=pwa&utm_source=homescreen' : '/?source=pwa&utm_source=homescreen',
    display: 'standalone',
    background_color: '#F4EFE2',
    theme_color: '#0E5C4D',
    orientation: 'portrait-primary',
    lang: 'ar-IQ',
    dir: 'rtl',
    scope: '/',
    categories: ['medical', 'health', 'lifestyle'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: 'حجز جديد',
        short_name: 'حجز',
        description: 'احجز خدمة طبية جديدة',
        url: '/appointments/new',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'حجوزاتي',
        short_name: 'حجوزات',
        description: 'عرض حجوزاتي',
        url: '/appointments',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'طوارئ',
        short_name: 'SOS',
        description: 'الاتصال بالطوارئ',
        url: isAppSite ? '/sos' : '/guest/sos',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
