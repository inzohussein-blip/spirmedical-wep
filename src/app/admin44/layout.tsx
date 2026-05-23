import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isAdminRole, ADMIN_ROLES } from '@/lib/admin-types';
import { signOut } from '../(auth)/login/actions';
import AdminSidebar from './_components/AdminSidebar';

// 🛡️ Admin-specific CSS (V25.40 — Hybrid Approach)
// Root layout يستورد shared.css (المشترك) — لا تكرار
// admin.css هنا فقط للـ:
//   • Animations خاصّة بالأدمن (urgent pulse)
//   • Print styles للـ reports
//   • Admin utilities (.admin-tabular, .admin-mono)
import '@/app/styles/admin.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'لوحة الإدارة · سباير ميديكال',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin44');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!isAdminRole(profile?.role)) {
    redirect('/dashboard');
  }

  const roleMeta = ADMIN_ROLES[profile!.role as keyof typeof ADMIN_ROLES];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--paper)',
      fontFamily: 'Tajawal, -apple-system, sans-serif',
    }}>
      <AdminSidebar
        userName={profile?.full_name ?? 'مدير'}
        userRole={profile!.role}
        roleLabel={roleMeta.label}
        roleIcon={roleMeta.icon}
      />

      <main style={{
        flex: 1,
        padding: '24px 32px',
        overflowY: 'auto',
        maxWidth: '100%',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '1px solid var(--line)',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>أهلاً</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
              {profile?.full_name ?? 'مدير'} <span style={{ fontSize: 14 }}>{roleMeta.icon}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/dashboard" style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: 'var(--paper-3)',
              color: 'var(--ink)',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}>
              ↗ تطبيق المريض
            </Link>

            <form action={signOut}>
              <button type="submit" style={{
                padding: '8px 14px',
                borderRadius: 10,
                background: 'var(--rose-soft)',
                color: 'var(--rose)',
                fontSize: 12,
                fontWeight: 700,
                border: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                🚪 خروج
              </button>
            </form>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
