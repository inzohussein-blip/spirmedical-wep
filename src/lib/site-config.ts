/**
 * ════════════════════════════════════════════════════════════════════
 * 🌐 Site Type Configuration (V25.35)
 * ════════════════════════════════════════════════════════════════════
 *
 * يحدّد نوع الموقع الحالي:
 *   - 'app':       التطبيق فقط (spir-medical.com)
 *   - 'marketing': الموقع التسويقي فقط (spir-medical.com)
 *   - 'all':       كل شيء (للـ development و legacy deployment)
 *
 * Usage:
 *   - في Vercel: اضبط NEXT_PUBLIC_SITE_TYPE = 'app' أو 'marketing'
 *   - في الكود: استورد SITE_TYPE واستخدم الـ helpers
 * ════════════════════════════════════════════════════════════════════
 */

export type SiteType = 'app' | 'marketing' | 'all';

/**
 * نوع الموقع الحالي
 *
 * Default: 'all' (يعرض كل شيء)
 * في production: حسب ENV variable
 */
export const SITE_TYPE: SiteType =
  (process.env.NEXT_PUBLIC_SITE_TYPE as SiteType) || 'all';

/**
 * هل هذا deployment للتطبيق؟
 */
export const IS_APP_SITE = SITE_TYPE === 'app' || SITE_TYPE === 'all';

/**
 * هل هذا deployment للموقع التسويقي؟
 */
export const IS_MARKETING_SITE = SITE_TYPE === 'marketing' || SITE_TYPE === 'all';

/**
 * المسارات الـ public (للموقع التسويقي فقط)
 */
export const MARKETING_PATHS = [
  '/about',
  '/blog',
  '/faq',
  '/contact',
  '/help',
  '/legal',
  '/changelog',
  '/feedback',
  '/status',
];

/**
 * المسارات الـ private (للتطبيق فقط)
 */
export const APP_PATHS = [
  '/dashboard',
  '/appointments',
  '/messages',
  '/services',
  '/account',
  '/consultations',
  '/favorites',
  '/sos',
  '/tools',
  '/specialist',
  '/guest',
  '/onboarding',
  '/share-target',
];

/**
 * المسارات المشتركة (Auth - تعمل في الاثنين)
 */
export const SHARED_PATHS = [
  '/login',
  '/register',
  '/otp',
  '/forgot',
  '/gate',
  '/admin44',
];

/**
 * يفحص هل المسار marketing
 */
export function isMarketingPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return MARKETING_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * يفحص هل المسار app
 */
export function isAppPath(pathname: string): boolean {
  return APP_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * يفحص هل المسار مشترك (auth)
 */
export function isSharedPath(pathname: string): boolean {
  return SHARED_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * يحدّد المسار الافتراضي للـ deployment
 *
 * - app site: → /dashboard (أو /login لو غير مسجّل)
 * - marketing site: → /
 */
export function getDefaultPath(siteType: SiteType = SITE_TYPE): string {
  if (siteType === 'app') return '/dashboard';
  return '/';
}

/**
 * Domain configuration (للروابط الخارجية)
 *
 * أمثلة:
 *   - أثناء التطوير: localhost
 *   - بدون domain: vercel.app
 *   - مع domain: spirmedical.com
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://spir-medical.com';

export const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL || 'https://spir-medical.com';

/**
 * يبني رابط للموقع الآخر
 *
 * استخدامه في الموقع التسويقي:
 *   <a href={getAppUrl('/dashboard')}>افتح التطبيق</a>
 *
 * استخدامه في التطبيق:
 *   <a href={getMarketingUrl('/about')}>عن سباير</a>
 */
export function getAppUrl(path: string = '/dashboard'): string {
  if (SITE_TYPE === 'all') return path;
  return `${APP_URL}${path}`;
}

export function getMarketingUrl(path: string = '/'): string {
  if (SITE_TYPE === 'all') return path;
  return `${MARKETING_URL}${path}`;
}
