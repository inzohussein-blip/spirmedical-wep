import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Spir Medical · سباير ميديكال',
    short_name: 'Spir Medical',
    description: 'منصة طبية رقمية متكاملة في العراق',
    start_url: '/',
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
        url: '/guest/sos',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
