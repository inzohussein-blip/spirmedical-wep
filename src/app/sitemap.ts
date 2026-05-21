import { MetadataRoute } from 'next';
import { ARTICLES, getAllCategorySlugs } from '@/lib/data/blog-articles';

// ============================================================
// 🗺️ Sitemap - خريطة الموقع الكاملة
// ============================================================
// يحتوي على الصفحات العامة + المدونة الطبية
// لا يشمل التطبيق الداخلي (Dashboard, Specialist, Auth)
// ============================================================

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spirmedical-wep.vercel.app';

  const now = new Date();

  type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

  interface RouteConfig {
    url: string;
    priority: number;
    lastModified?: Date;
    changeFrequency: ChangeFreq;
  }

  const routes: RouteConfig[] = [
    // ─────────────────────────────────────────
    // الصفحة الرئيسية
    // ─────────────────────────────────────────
    {
      url: '',
      priority: 1.0,
      changeFrequency: 'weekly',
    },

    // ─────────────────────────────────────────
    // الصفحات الإعلامية
    // ─────────────────────────────────────────
    {
      url: '/about',
      priority: 0.9,
      changeFrequency: 'monthly',
    },
    {
      url: '/contact',
      priority: 0.8,
      changeFrequency: 'monthly',
    },
    {
      url: '/faq',
      priority: 0.8,
      changeFrequency: 'weekly',
    },

    // ─────────────────────────────────────────
    // 📝 المدونة الطبية
    // ─────────────────────────────────────────
    {
      url: '/blog',
      priority: 0.9,
      changeFrequency: 'weekly',
    },

    // ─────────────────────────────────────────
    // الصفحات القانونية
    // ─────────────────────────────────────────
    {
      url: '/legal/terms',
      priority: 0.7,
      changeFrequency: 'yearly',
    },
    {
      url: '/legal/privacy',
      priority: 0.7,
      changeFrequency: 'yearly',
    },
    {
      url: '/legal/cookies',
      priority: 0.6,
      changeFrequency: 'yearly',
    },
    {
      url: '/legal/disclaimer',
      priority: 0.6,
      changeFrequency: 'yearly',
    },
    {
      url: '/legal/refund',
      priority: 0.6,
      changeFrequency: 'yearly',
    },
    // ─────────────────────────────────────────
    // 🏥 صفحات الخدمات (V25.21)
    // ─────────────────────────────────────────
    {
      url: '/services/dental',
      priority: 0.9,
      changeFrequency: 'weekly',
    },
    {
      url: '/services/optical',
      priority: 0.9,
      changeFrequency: 'weekly',
    },
    {
      url: '/services/mental-health',
      priority: 0.9,
      changeFrequency: 'weekly',
    },
    {
      url: '/services/nutrition',
      priority: 0.9,
      changeFrequency: 'weekly',
    },
    {
      url: '/services/physio',
      priority: 0.9,
      changeFrequency: 'weekly',
    },
  ];

  // ─────────────────────────────────────────
  // 📝 المقالات الفردية
  // ─────────────────────────────────────────
  const articleRoutes: RouteConfig[] = ARTICLES.map((article) => ({
    url: `/blog/${article.slug}`,
    priority: 0.8,
    lastModified: new Date(article.updatedAt || article.publishedAt),
    changeFrequency: 'monthly' as const,
  }));

  // ─────────────────────────────────────────
  // 🏷️ صفحات التصنيفات
  // ─────────────────────────────────────────
  const categoryRoutes: RouteConfig[] = getAllCategorySlugs().map((cat) => ({
    url: `/blog/category/${cat}`,
    priority: 0.7,
    changeFrequency: 'weekly' as const,
  }));

  return [...routes, ...articleRoutes, ...categoryRoutes].map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: route.lastModified || now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
