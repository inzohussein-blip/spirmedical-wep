import { MetadataRoute } from 'next';

// ============================================================
// 🤖 Robots Configuration - مع دعم Vercel Screenshot Bot
// ============================================================

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spirmedical-wep.vercel.app';

  const publicPaths = [
    '/',
    '/about',
    '/legal/terms',
    '/legal/privacy',
    '/legal/cookies',
    '/legal/disclaimer',
    '/api/og',
  ];

  const privatePaths = [
    '/api/',
    '/dashboard/',
    '/specialist/',
    '/admin44',     // ← V22 admin panel (hidden)
    '/admin44/',
    '/appointments/',
    '/account/',
    '/services/',
    '/tools/',
    '/sos/',
    '/notifications/',
    '/favorites/',
    '/otp',
    '/login',
    '/login/phone',
    '/register',
    '/register/patient',
    '/register/specialist',
    '/forgot',
    '/gate',
    '/guest/',
  ];

  const apiAllowed = ['/api/og'];

  return {
    rules: [
      // ─────────────────────────────────────────
      // ⭐ 1. Vercel Screenshot Bot (مهم جداً!)
      // ─────────────────────────────────────────
      // هذه الـ user-agents تستخدمها Vercel لإنشاء preview thumbnails
      // والتي تظهر في dashboard
      {
        userAgent: [
          'vercel-screenshot-bot',
          'Vercelbot',
          'vercel-favicon',
          'vercel-og-image',
          'HeadlessChrome', // ← Vercel screenshot bot يستخدم هذا
        ],
        allow: ['/'],
      },

      // ─────────────────────────────────────────
      // 2. القاعدة الافتراضية - جميع البوتات
      // ─────────────────────────────────────────
      {
        userAgent: '*',
        allow: publicPaths,
        disallow: privatePaths,
      },

      // ─────────────────────────────────────────
      // 3. 🤖 AI Bots & LLM Crawlers
      // ─────────────────────────────────────────
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          'ClaudeBot',
          'Claude-Web',
          'anthropic-ai',
          'Google-Extended',
          'GoogleOther',
          'PerplexityBot',
          'Perplexity-User',
          'FacebookBot',
          'Meta-ExternalAgent',
          'Meta-ExternalFetcher',
          'Bytespider',
          'cohere-ai',
          'CCBot',
          'YouBot',
          'DuckAssistBot',
          'Amazonbot',
          'Applebot-Extended',
          'Applebot',
          'Diffbot',
          'MistralAI-User',
          'xAI',
        ],
        allow: [...publicPaths, ...apiAllowed],
        disallow: privatePaths,
      },

      // ─────────────────────────────────────────
      // 4. 🔍 Search Engines
      // ─────────────────────────────────────────
      {
        userAgent: [
          'Googlebot',
          'Googlebot-Image',
          'Googlebot-News',
          'Bingbot',
          'Slurp',
          'DuckDuckBot',
          'Baiduspider',
          'YandexBot',
          'YandexImages',
          'Sogou',
          'Exabot',
          'facebot',
        ],
        allow: [...publicPaths, ...apiAllowed],
        disallow: privatePaths,
      },

      // ─────────────────────────────────────────
      // 5. 📱 Social Media Bots
      // ─────────────────────────────────────────
      {
        userAgent: [
          'facebookexternalhit',
          'Facebot',
          'Twitterbot',
          'LinkedInBot',
          'WhatsApp',
          'Slackbot',
          'TelegramBot',
          'Discordbot',
          'Pinterestbot',
          'redditbot',
          'Snapchat',
          'TikTokBot',
        ],
        allow: [...publicPaths, ...apiAllowed],
        disallow: privatePaths,
      },

      // ─────────────────────────────────────────
      // 6. 🛡️ منع البوتات الضارة فقط
      // ─────────────────────────────────────────
      // ملاحظة: لا نحجب SemrushBot/AhrefsBot - بدلاً من ذلك نسمح
      // (لأن حجبها يستفز DDoS Mitigation الذي يحجب Vercel نفسه)
      // فقط البوتات الإشكالية فعلاً:
      {
        userAgent: ['MJ12bot', 'DotBot', 'PetalBot'],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
