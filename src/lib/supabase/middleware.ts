import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * يُحدّث الـ session في كل طلب — مهم للـ App Router مع Supabase Auth.
 * يُستدعى من middleware.ts الجذر.
 *
 * ⚠️ إذا كانت متغيرات البيئة مفقودة، يمرّر الطلب بدون معالجة (fail-open).
 *    هذا أفضل من 500 INTERNAL_SERVER_ERROR على Vercel.
 */
export async function updateSession(request: NextRequest) {
  // التحقق من وجود متغيرات البيئة قبل أي شيء آخر
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // متغيرات البيئة غير معرّفة — مرّر الطلب بدون معالجة
    // هذا يمنع الـ MIDDLEWARE_INVOCATION_FAILED على Vercel
    console.error(
      '[middleware] Supabase environment variables not configured. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
    );
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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // مهم: لا تضع كود بين createServerClient و auth.getUser()
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // حماية المسارات: إعادة توجيه غير المُصادَقين
    const protectedPaths = ['/dashboard', '/appointments', '/admin'];
    const isProtected = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // حماية مسارات الإدارة: فقط للأدمن
    if (user && request.nextUrl.pathname.startsWith('/admin')) {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      } catch (err) {
        // فشل في القراءة → إعادة توجيه آمنة
        console.error('[middleware] Failed to check admin role:', err);
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  } catch (err) {
    // أي خطأ غير متوقّع — مرّر الطلب بدلاً من 500
    console.error('[middleware] Unexpected error:', err);
    return NextResponse.next({ request });
  }
}
