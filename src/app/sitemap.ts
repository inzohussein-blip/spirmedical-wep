import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spirmedical-wep.vercel.app';

  const routes = [
    { url: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { url: '/login', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/guest', priority: 0.9, changeFrequency: 'weekly' as const },
    {
      url: '/legal/terms',
      priority: 0.5,
      changeFrequency: 'yearly' as const,
    },
    {
      url: '/legal/privacy',
      priority: 0.5,
      changeFrequency: 'yearly' as const,
    },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
