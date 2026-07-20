import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getRoleHomePath } from '@/lib/auth/home-path';
import AppRouter from './AppRouter';

export const metadata = {
  title: 'سباير ميديكال · Spir Medical',
};

export const dynamic = 'force-dynamic';

/**
 * ═══════════════════════════════════════════════════════════════
 * /app — Smart Router (V25.3)
 * ═══════════════════════════════════════════════════════════════
 *
 * هذا هو الـ start_url للـ PWA. يعمل كالتالي:
 *
 *   1️⃣ المستخدم مسجّل دخول؟
 *      → نعم: redirect مباشر إلى /dashboard
 *      → لا: ننتقل للخطوة 2
 *
 *   2️⃣ شاهد الـ onboarding من قبل؟ (localStorage)
 *      → نعم: redirect إلى /login
 *      → لا: نُظهر شاشة الترحيب (Onboarding)
 *
 *   3️⃣ بعد إنهاء Onboarding:
 *      → نحفظ flag في localStorage
 *      → نوجّه إلى /login أو /register
 *
 * ═══════════════════════════════════════════════════════════════
 */

export default async function AppPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ✅ مسجّل دخول → واجهة التطبيق حسب الدور
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    redirect(getRoleHomePath(profile?.role));
  }

  // ❌ غير مسجّل → نُظهر AppRouter (client-side للتحقق من localStorage)
  return <AppRouter />;
}
