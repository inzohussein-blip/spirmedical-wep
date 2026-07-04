/**
 * ════════════════════════════════════════════════════════════════════
 * 🔐 Auth Layout (V25.24)
 * ════════════════════════════════════════════════════════════════════
 *
 * صفحات: /gate, /register, /login, /login/phone, /forgot
 *
 * 🎯 الحماية: إذا المستخدم مُسجّل بالفعل → يُوجَّه حسب role
 *
 * استثناء: /login و /forgot يحتاجون فحصاً خاصاً عبر searchParams
 * (لو في error= فلا نُحوّل لكي يرى الخطأ)
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// 📱 App-specific CSS (V25.40)
// Auth pages تستخدم scr-* و gate-* + auth-* (auth-* في shared.css)
import '@/app/styles/app.css';

export const dynamic = 'force-dynamic';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 🎯 V25.24: المُسجّل دخوله → redirect حسب role
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'specialist') {
      redirect('/specialist');
    } else if (['admin', 'super_admin', 'manager', 'support'].includes(profile?.role || '')) {
      redirect('/admin');
    } else {
      redirect('/dashboard');
    }
  }

  return (
    <div className="auth-viewport">
      <div className="auth-shell">{children}</div>
    </div>
  );
}
