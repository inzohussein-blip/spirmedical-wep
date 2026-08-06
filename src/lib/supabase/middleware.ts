import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { isAdminRole } from '@/lib/admin-types';

/** مسارات تتطلّب جلسة */
const PROTECTED_PATHS = [
  '/dashboard',
  '/appointments',
  '/specialist',
  '/account',
  '/favorites',
  '/services',
  '/consultations',
  '/messages',
  '/sos',
  '/tools',
];

/** سقف زمني لكل نداء شبكي داخل الوسيط (بالمللي ثانية) */
const AUTH_TIMEOUT_MS = 3000;
const ROLE_TIMEOUT_MS = 2500;

/**
 * يمنع نداءً بطيئاً من تعليق الوسيط كلّه.
 *
 * مهلة Vercel للوسيط تُنهي الطلب بـ504 `MIDDLEWARE_INVOCATION_TIMEOUT`،
 * وحينها **لا تُخدَم أي صفحة** — لا العامّة ولا المحميّة. سقفٌ قصيرٌ هنا
 * يحوّل تباطؤ Supabase من انقطاعٍ شاملٍ للموقع إلى تدهورٍ محدود.
 */
async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * هل يحمل الطلب كوكي جلسة أصلاً؟
 *
 * الزائر المجهول لا يملك ما يُحدَّث، ومع ذلك كان الوسيط ينادي `getUser()`
 * عبر الشبكة في **كل** طلبٍ له — بما فيه الصفحة الرئيسية. هذا هو الحمل
 * الذي أسقط `spir-medical.com` بـ504: زيارةٌ عاديةٌ بلا تسجيل دخول كانت
 * تنتظر ردّ Supabase قبل أن تُخدَم أي بايت.
 */
function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));
}

/**
 * يُحدّث الـ session في كل طلب — مهم للـ App Router مع Supabase Auth.
 *
 * يحمي أيضاً على مستوى الحافة: مسارات المستخدم (dashboard/appointments…)،
 * واجهة الأخصائي (/specialist)، ولوحة الأدمن (/admin) بفحص الدور.
 *
 * سياسة الفشل: عند انتهاء المهلة نفشل **بأمان** على المسارات المحميّة
 * (تحويل إلى تسجيل الدخول)، و**بانفتاح** على المسارات العامّة — فطبقات
 * الحماية في التخطيطات والـRLS ما زالت قائمة خلفنا.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // eslint-disable-next-line no-console
    console.error(
      '[middleware] Supabase environment variables not configured. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
    );
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');

  // ⚡ مسار الزائر المجهول: لا كوكي جلسة ⇒ لا شيء يُحدَّث ولا دور يُفحص.
  // نردّ فوراً بلا أي نداء شبكي — وهذا يشمل الصفحة الرئيسية وكل الصفحات
  // العامّة، أي الغالبية العظمى من الزيارات.
  if (!hasAuthCookie(request)) {
    if (isProtected || isAdminPath) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminPath ? '/admin-login' : '/login';
      if (!isAdminPath) url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          // 🔑 V25.23: cookies تدوم 400 يوم (الحد الأقصى للـ Chrome)
          cookiesToSet.forEach(({ name, value, options }) => {
            const persistentOptions = {
              ...options,
              maxAge: 60 * 60 * 24 * 400,  // 400 days (Chrome max)
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
              httpOnly: name.includes('auth-token') ? true : options?.httpOnly,
            };
            supabaseResponse.cookies.set(name, value, persistentOptions);
          });
        },
      },
    });

    // مهم: لا تضع كود بين createServerClient و auth.getUser()
    const authResult = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);

    if (authResult === null) {
      // تعذّر التحقّق ضمن المهلة — لا نُعلّق الطلب حتى يقتلَه Vercel بـ504.
      if (isProtected || isAdminPath) {
        const url = request.nextUrl.clone();
        url.pathname = isAdminPath ? '/admin-login' : '/login';
        return NextResponse.redirect(url);
      }
      return NextResponse.next({ request });
    }

    const user = authResult.data.user;

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // 🔒 فحص الدور — نداءٌ **واحد** يخدم الفروع الثلاثة.
    // كان كل فرع يستعلم عن الدور بنفسه، فمسار مثل /dashboard يدفع ثمن
    // رحلتين شبكيتين متتاليتين في الوسيط قبل أن تُخدَم الصفحة.
    const needsRole =
      isAdminPath ||
      pathname.startsWith('/specialist') ||
      pathname.startsWith('/dashboard');

    if (!user || !needsRole) return supabaseResponse;

    const roleResult = await withTimeout(
      supabase.from('users').select('role').eq('id', user.id).single(),
      ROLE_TIMEOUT_MS
    );
    const role = roleResult?.data?.role;

    // تعذّر معرفة الدور ضمن المهلة → نفشل بأمان على لوحة الأدمن فقط،
    // وندع بقيّة المسارات للتخطيطات وسياسات RLS خلفنا.
    if (roleResult === null) {
      if (isAdminPath) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin-login';
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (isAdminPath && !isAdminRole(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/specialist') && role !== 'specialist') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // الأخصائي يحاول الدخول لـ /dashboard → وجّهه لواجهته
    if (pathname.startsWith('/dashboard') && role === 'specialist') {
      const url = request.nextUrl.clone();
      url.pathname = '/specialist';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[middleware] Unexpected error:', err);
    return NextResponse.next({ request });
  }
}
