import { MetadataRoute } from 'next';
import { ARTICLES, getAllCategorySlugs } from '@/lib/data/blog-articles';
import { SITE_ORIGIN } from '@/lib/seo/origin';

// ============================================================
// 🗺️ Sitemap - خريطة الموقع الكاملة
// ============================================================
// يحتوي على الصفحات العامة + المدونة الطبية
// لا يشمل التطبيق الداخلي (Dashboard, Specialist, Auth)
// ============================================================

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_ORIGIN;

  // ⚠️ لا `new Date()` للصفحات الثابتة: كان كلُّ بناءٍ يعلن «عُدّلت الآن» لكلّ صفحة، فيتعلّم
  // Google أنّ `lastmod` هنا لا يُصدَّق ويُهمله حتى للمقالات. التاريخُ حيث يُعرف وحده.
  const articleDate = (a: (typeof ARTICLES)[number]) => new Date(a.updatedAt || a.publishedAt);
  const latestArticle = ARTICLES.length
    ? new Date(Math.max(...ARTICLES.map((a) => articleDate(a).getTime())))
    : undefined;

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
      lastModified: latestArticle,
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
    // 🩸 صفحةُ الخدمة العامّة — ما يبحث عنه الناس فعلاً
    // ─────────────────────────────────────────
    {
      url: '/home-blood-draw',
      priority: 0.95,
      changeFrequency: 'weekly',
    },
    {
      url: '/help/install',
      priority: 0.6,
      changeFrequency: 'monthly',
    },

    // ⚠️ لا `/services/*` هنا. كانت الخريطة تُقدّم خمساً منها
    // (dental/optical/mental-health/nutrition/physio) وهي صفحاتُ التطبيق
    // المحجوبة في robots.ts بـ`/services/` — فيُبلّغ Search Console
    // «Submitted URL blocked by robots.txt» ولا تُفهرس. يحرسه
    // tests/seo-canonical.test.ts.
  ];

  // ─────────────────────────────────────────
  // 📝 المقالات الفردية
  // ─────────────────────────────────────────
  const articleRoutes: RouteConfig[] = ARTICLES.map((article) => ({
    url: `/blog/${article.slug}`,
    priority: 0.8,
    lastModified: articleDate(article),
    changeFrequency: 'monthly' as const,
  }));

  // ─────────────────────────────────────────
  // 🏷️ صفحات التصنيفات
  // ─────────────────────────────────────────
  // تصنيفٌ بلا مقالات صفحةٌ فارغة — لا تُقدَّم للفهرسة.
  const categoryRoutes: RouteConfig[] = getAllCategorySlugs().flatMap((cat) => {
    const inCat = ARTICLES.filter((a) => a.category === cat);
    if (!inCat.length) return [];
    return [{
      url: `/blog/category/${cat}`,
      priority: 0.7,
      lastModified: new Date(Math.max(...inCat.map((a) => articleDate(a).getTime()))),
      changeFrequency: 'weekly' as const,
    }];
  });

  return [...routes, ...articleRoutes, ...categoryRoutes].map((route) => ({
    url: `${baseUrl}${route.url}`,
    ...(route.lastModified ? { lastModified: route.lastModified } : {}),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
