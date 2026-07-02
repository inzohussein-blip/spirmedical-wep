/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 OAuth Callback Route
 * ═══════════════════════════════════════════════════════════════
 * يعالج redirect من Google OAuth بعد المصادقة.
 * Supabase يُرسل code + state → نبدلهما بـ session.
 *
 * المسار: /auth/callback
 * ═══════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSbClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code        = searchParams.get('code');
  const next        = searchParams.get('next') ?? '/dashboard';
  const errorParam  = searchParams.get('error');
  const errorDesc   = searchParams.get('error_description');

  // ─── معالجة خطأ OAuth من المزوّد ───────────────────────
  if (errorParam) {
    const msg = encodeURIComponent(errorDesc ?? errorParam);
    return NextResponse.redirect(`${origin}/auth/login?error=${msg}`);
  }

  // ─── تبديل code بـ session ──────────────────────────────
  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const msg = encodeURIComponent(error.message);
      return NextResponse.redirect(`${origin}/auth/login?error=${msg}`);
    }

    const user = data?.user;

    if (user) {
      // ─── إنشاء profile لو مستخدم Google جديد ────────────
      const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const admin        = createSbClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: existing } = await admin
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!existing) {
        // أنشئ profile للمستخدم الجديد من Google
        const name = user.user_metadata?.full_name
          ?? user.user_metadata?.name
          ?? user.email?.split('@')[0]
          ?? 'مستخدم';

        await admin.from('users').insert({
          id:               user.id,
          email:            user.email,
          full_name:        name,
          role:             'patient',
          signup_method:    'google',
          email_verified:   true,
          email_verified_at: new Date().toISOString(),
          approval_status:  'approved',
        }).then(() => null, () => null);

        // توجيه مستخدم جديد لإكمال البيانات
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // ─── توجيه حسب الدور ──────────────────────────────────
      const role = existing.role;
      if (role === 'specialist') {
        return NextResponse.redirect(`${origin}/specialist`);
      }
      if (['admin', 'super_admin', 'manager', 'support'].includes(role)) {
        return NextResponse.redirect(`${origin}/admin44`);
      }

      // التوجيه لـ next أو dashboard
      const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      return NextResponse.redirect(`${origin}${safePath}`);
    }
  }

  // ─── fallback ────────────────────────────────────────────
  return NextResponse.redirect(`${origin}/auth/login?error=invalid_callback`);
}
