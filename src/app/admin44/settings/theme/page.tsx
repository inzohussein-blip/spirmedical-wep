import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/admin-types';
import { getActiveTheme } from '@/lib/theme/get-theme';
import ThemeForm from './ThemeForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'تخصيص الألوان · إدارة',
};

export default async function ThemeSettingsPage() {
  // 1. التحقق من المستخدم
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. التحقق من super_admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isSuperAdmin(profile?.role)) {
    return (
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 14,
          padding: 64,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>
          غير مصرّح
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          تخصيص الألوان للمدير العام فقط
        </p>
      </div>
    );
  }

  // 3. جلب الـ theme الحالي
  const theme = await getActiveTheme();

  return <ThemeForm initialTheme={theme} />;
}
