/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ملاحظة: لا نستخدم `output: 'standalone'` على Vercel — Vercel يُعالج هذا تلقائياً

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'spirmedical.iq', 'app.spirmedical.iq'],
      bodySizeLimit: '2mb',
    },
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
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // احتياطات Node 24 - منع تحذيرات الـ deprecation
  webpack: (config, { isServer }) => {
    // معالجة punycode المهجور في Node 24
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }
    return config;
  },

  // تحذيرات قابلة للتجاهل في Node 24
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
