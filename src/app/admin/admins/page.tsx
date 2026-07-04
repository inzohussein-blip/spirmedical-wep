import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ADMIN_ROLES, isSuperAdmin, type AdminRole } from '@/lib/admin-types';
import AdminsClient from './AdminsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'إدارة المديرين · إدارة',
};

export default async function AdminsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!isSuperAdmin(profile?.role)) {
    return (
      <div style={{ background: 'var(--white)', borderRadius: 14, padding: 64, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>غير مصرّح</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>هذه الصفحة للمدير العام فقط</p>
      </div>
    );
  }

  const { data: admins } = await supabase
    .from('users')
    .select('id, full_name, phone, email, role, created_at')
    .in('role', ['super_admin', 'admin', 'manager', 'support'])
    .order('role')
    .order('created_at', { ascending: false });

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>👥 إدارة المديرين</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
        {admins?.length ?? 0} مدير في النظام
      </p>

      <AdminsClient
        admins={(admins ?? []).map((a) => ({
          id: a.id,
          name: a.full_name ?? 'بدون اسم',
          phone: a.phone,
          email: a.email,
          role: a.role as AdminRole,
          createdAt: a.created_at,
          isMe: a.id === user.id,
        }))}
      />

      {/* Role descriptions */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {(['super_admin', 'manager', 'support'] as AdminRole[]).map((role) => {
          const meta = ADMIN_ROLES[role];
          return (
            <div key={role} style={{
              background: 'var(--white)', borderRadius: 12, padding: 16,
              borderRight: `4px solid ${meta.color}`,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{meta.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: meta.color, marginBottom: 4 }}>
                {meta.label}
              </div>
              <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0, lineHeight: 1.5 }}>
                {meta.description}
              </p>
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--ink-3)' }}>
                {meta.permissions.length} صلاحية
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
