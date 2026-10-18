import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { SITE_ORIGIN, VERCEL_PRODUCTION_HOST } from '@/lib/seo/origin';
import { NOINDEX_HEADER, isIndexablePath } from '@/lib/seo/indexable';
import { ADMIN_GATE_COOKIE, ADMIN_GATE_MAX_AGE, adminGateToken, adminNotFound, decideAdminGate, isAdminEntryPath } from '@/lib/auth/admin-gate';
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

  // 🔒 دخولُ الإدارة بالرابط وحده (lib/auth/admin-gate.ts)
  if (isAdminEntryPath(pathname)) {
    const decision = await decideAdminGate({
      key: process.env.ADMIN_LOGIN_KEY,
      queryKey: request.nextUrl.searchParams.get('k'),
      cookie: request.cookies.get(ADMIN_GATE_COOKIE)?.value,
    });
    if (decision === 'deny') return adminNotFound(request);
    if (decision === 'grant') {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete('k');
      const res = NextResponse.redirect(clean);
      res.cookies.set(ADMIN_GATE_COOKIE, await adminGateToken(process.env.ADMIN_LOGIN_KEY!.trim()), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: ADMIN_GATE_MAX_AGE,
      });
      res.headers.set('X-Robots-Tag', NOINDEX_HEADER);
      return res;
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
  // 🔎 صفحاتُ التطبيق تُزحَف ولا تُفهرَس (بدل حجبها في robots.txt — lib/seo/indexable.ts)
  if (!isIndexablePath(pathname)) response.headers.set('X-Robots-Tag', NOINDEX_HEADER);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|apple-touch-icon|api/og|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml)$).*)',
  ],
};
