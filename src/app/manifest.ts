import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'سباير ميديكال · Spir Medical',
    short_name: 'Spir Medical',
    description: 'منصة طبية رقمية متكاملة في العراق',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4EFE2',
    theme_color: '#0E5C4D',
    lang: 'ar-IQ',
    dir: 'rtl',
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
        purpose: 'maskable',
      },
    ],
    categories: ['health', 'medical', 'lifestyle'],
  };
}
