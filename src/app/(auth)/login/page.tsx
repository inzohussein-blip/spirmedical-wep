// ═══════════════════════════════════════════════════════════════
// 🔐 صفحة تسجيل الدخول (V25.24)
// ═══════════════════════════════════════════════════════════════
// إذا المستخدم مُسجّل بالفعل → redirect حسب role
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'تسجيل الدخول · سباير ميديكال',
  description: 'سجّل الدخول إلى حسابك في Spir Medical',
};

export default async function LoginPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 🎯 V25.24: إذا مُسجّل دخوله بالفعل، نُحوّله مباشرة
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'specialist') {
      redirect('/specialist');
    } else if (['admin', 'super_admin', 'manager', 'support'].includes(profile?.role || '')) {
      redirect('/admin44');
    } else {
      redirect('/dashboard');
    }
  }

  // غير مُسجّل → اعرض صفحة الدخول
  return <LoginClient />;
}
