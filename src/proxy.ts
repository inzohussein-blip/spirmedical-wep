import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { SITE_ORIGIN, VERCEL_PRODUCTION_HOST } from '@/lib/seo/origin';
import {
  SITE_TYPE,
  isMarketingPath,
  isAppPath,
  APP_URL,
  MARKETING_URL,
} from '@/lib/site-config';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🌐 Proxy (V25.35 — كان middleware.ts؛ Next 16 سمّاه proxy ويُشغّله على Node)
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
 *   - NEXT_PUBLIC_APP_URL = 'https://spir-medical.com'
 *   - NEXT_PUBLIC_MARKETING_URL = 'https://spir-medical.com'
 * ════════════════════════════════════════════════════════════════════
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔁 spirmedical-wep.vercel.app نسخةٌ مطابقة للموقع بلا تحويل = محتوى مكرَّر عند Google.
  // الصفحاتُ وحدها (GET/HEAD) — لا /api: Webhook Meta وبوّابةُ واتساب والكرون قد تستعمله.
  if (
    request.headers.get('host') === VERCEL_PRODUCTION_HOST &&
    new URL(SITE_ORIGIN).host !== VERCEL_PRODUCTION_HOST &&
    !pathname.startsWith('/api/') &&
    (request.method === 'GET' || request.method === 'HEAD')
  ) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, SITE_ORIGIN), 308);
  }

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
  const response = await updateSession(request);

  // 🔑 المسار الحالي كترويسة: التخطيطات في App Router لا تتلقّى pathname،
  // ويحتاجه تخطيط المختصّ ليستثني صفحتَي «قيد المراجعة/مرفوض» من بوّابة
  // الاعتماد (وإلّا وقع تحويل لا نهائي).
  response.headers.set('x-pathname', pathname);
  // ومعه سلسلة الاستعلام: خدمتان تتقاسمان `/appointments/new` ولا تفترقان
  // إلّا بـ`?service=`، فحارسُ الإطفاء في التخطيط يحتاجها ليعرف أيّهما.
  response.headers.set('x-search', request.nextUrl.search);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|apple-touch-icon|api/og|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml)$).*)',
  ],
};
