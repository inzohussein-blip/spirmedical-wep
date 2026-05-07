import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spirmedical-wep.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/guest', '/legal/terms', '/legal/privacy'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/appointments/',
          '/otp',
          '/login/phone',
          '/forgot',
        ],
      },
      // السماح للـ bots المعروفة بالوصول لـ OG endpoint
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'facebookexternalhit',
          'Twitterbot',
          'LinkedInBot',
          'WhatsApp',
          'Slackbot',
          'TelegramBot',
        ],
        allow: ['/', '/api/og', '/legal/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
