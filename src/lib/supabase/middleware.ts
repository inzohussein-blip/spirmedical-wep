import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * يُحدّث الـ session في كل طلب — مهم للـ App Router مع Supabase Auth.
 *
 * ⚠️ ملاحظة: لوحة الإدارة (CRM) مشروع منفصل وليس جزءاً من هذا التطبيق.
 *    لذلك /admin غير مذكور هنا.
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
    const protectedPaths = [
      '/dashboard',
      '/appointments',
      '/specialist',
      '/account',
      '/favorites',
    ];
    const isProtected = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // حماية واجهة الأخصائي
    if (user && request.nextUrl.pathname.startsWith('/specialist')) {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'specialist') {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[middleware] Failed to check specialist role:', err);
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    // إذا الأخصائي حاول الدخول لـ /dashboard → وجّهه لـ /specialist
    if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'specialist') {
          const url = request.nextUrl.clone();
          url.pathname = '/specialist';
          return NextResponse.redirect(url);
        }
      } catch (err) {
        // تجاهل
      }
    }

    return supabaseResponse;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[middleware] Unexpected error:', err);
    return NextResponse.next({ request });
  }
}
