import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import {
  SITE_TYPE,
  isMarketingPath,
  isAppPath,
  APP_URL,
  MARKETING_URL,
} from '@/lib/site-config';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🌐 Middleware (V25.35)
 * ════════════════════════════════════════════════════════════════════
 *
 * يقوم بـ:
 *   1. حماية الجلسة (auth) - من Supabase
 *   2. توجيه حسب نوع الموقع:
 *      - app site:       يمنع الصفحات الـ marketing → يحوّل لـ marketing url
 *      - marketing site: يمنع صفحات الـ app → يحوّل لـ app url
 *      - all (default):  يسمح بكل شيء
 *
 * ENV variables المطلوبة:
 *   - NEXT_PUBLIC_SITE_TYPE = 'app' | 'marketing' | 'all'
 *   - NEXT_PUBLIC_APP_URL = 'https://spirmedical-app.vercel.app'
 *   - NEXT_PUBLIC_MARKETING_URL = 'https://spirmedical-web.vercel.app'
 * ════════════════════════════════════════════════════════════════════
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SITE_TYPE !== 'all') {
    // 🌐 على Marketing site - منع صفحات التطبيق
    if (SITE_TYPE === 'marketing' && isAppPath(pathname)) {
      const appUrl = new URL(pathname, APP_URL);
      appUrl.search = request.nextUrl.search;
      return NextResponse.redirect(appUrl, 308);
    }

    // 📱 على App site - الصفحة الرئيسية (/) → /dashboard
    if (SITE_TYPE === 'app' && pathname === '/') {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // 📱 على App site - منع صفحات الموقع التسويقي
    if (SITE_TYPE === 'app' && isMarketingPath(pathname) && pathname !== '/') {
      const marketingUrl = new URL(pathname, MARKETING_URL);
      marketingUrl.search = request.nextUrl.search;
      return NextResponse.redirect(marketingUrl, 308);
    }
  }

  // ✓ بعد التوجيه، نمرّر للـ session update العادي
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|apple-touch-icon|api/og|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml)$).*)',
  ],
};
