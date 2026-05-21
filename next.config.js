/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'spirmedical.iq', 'app.spirmedical.iq'],
      bodySizeLimit: '2mb',
    },
    // ✨ V25.4: Optimize package imports (يقلّل حجم الـ bundle)
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
    ],
  },

  async headers() {
    return [
      // Security headers لكل المسارات
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
          // 🛡️ V25.27: Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-insights.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://*.vercel-insights.com https://api.openrouteservice.org",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "worker-src 'self'",
              "manifest-src 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      // ✨ V25.4: Cache headers للأصول الثابتة (1 year)
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
      // ✨ V25.4: Service Worker لا يجب أن يُكاش
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // ✨ V25.4: Manifest cache قصير
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
      // ✨ V25.4: Tile providers للخرائط
      { protocol: 'https', hostname: '*.tile.openstreetmap.org' },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 31536000, // 1 year
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

  // ✨ V25.4: Compress للـ output
  compress: true,

  // ✨ V25.4: PoweredByHeader off (أمان)
  poweredByHeader: false,
};

module.exports = nextConfig;
