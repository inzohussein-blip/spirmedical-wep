/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'spirmedical.iq',
        'app.spirmedical.iq',
        'spir-medical.com',
        'www.spir-medical.com',
      ],
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), microphone=(), camera=(self), bluetooth=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // ✅ Sentry: يحتاج unsafe-eval + ingest domains
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-insights.com https://va.vercel-scripts.com https://*.sentry.io",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: https://*.supabase.co",
              "font-src 'self' data:",
              // ✅ Sentry: يحتاج الاتصال بـ ingest.sentry.io
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://*.vercel-insights.com https://api.openrouteservice.org https://*.ingest.sentry.io https://graph.facebook.com",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        source: '/icon-:size.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/apple-icon.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '*.tile.openstreetmap.org' },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 31536000,
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }
    return config;
  },

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  compress: true,
  poweredByHeader: false,
};

// ─── Sentry Configuration ───
module.exports = withSentryConfig(nextConfig, {
  // ─── Source Maps ───
  // يدعم env vars بالـ prefix الخاص بـ Vercel (spirmedical_) مع fallback للاسم القياسي
  org: process.env.spirmedical_SENTRY_ORG || process.env.SENTRY_ORG,
  project: process.env.spirmedical_SENTRY_PROJECT || process.env.SENTRY_PROJECT || 'spirmedical',
  authToken: process.env.spirmedical_SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN,

  // ─── Silent mode ───
  silent: !process.env.CI,

  // ─── Source Maps في الإنتاج ───
  widenClientFileUpload: true,
  hideSourceMaps: true,

  // ─── Tree-shaking (v10+: يحلّ محل disableLogger) ───
  treeshake: {
    removeDebugLogging: true,
  },

  // ─── Tunnel Route ───
  tunnelRoute: '/monitoring-tunnel',

  // ─── Webpack options (v10+: يحلّ محل automaticVercelMonitors) ───
  webpack: {
    automaticVercelMonitors: true,
  },
});
