import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/admin-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الإعدادات · إدارة',
};

export default async function SettingsPage() {
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

  // إحصائيات عامة
  const [
    { count: totalUsers },
    { count: totalAdmins },
    { count: totalAppointments },
    { count: totalCoupons },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['super_admin', 'admin', 'manager', 'support']),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('coupons').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>⚙️ الإعدادات</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
        إعدادات النظام والصلاحيات
      </p>

      {/* النظام */}
      <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>📊 إحصائيات النظام</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatBox label="إجمالي المستخدمين" value={(totalUsers ?? 0).toLocaleString('ar-IQ')} />
          <StatBox label="المديرون" value={(totalAdmins ?? 0).toLocaleString('ar-IQ')} />
          <StatBox label="الطلبات" value={(totalAppointments ?? 0).toLocaleString('ar-IQ')} />
          <StatBox label="الكوبونات" value={(totalCoupons ?? 0).toLocaleString('ar-IQ')} />
        </div>
      </div>

      {/* روابط سريعة */}
      <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>🔗 روابط الإدارة</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <SettingsLink href="/admin/settings/theme" icon="🎨" title="تخصيص الألوان" desc="غيّر ألوان المنصة كاملة" />
          <SettingsLink href="/admin/admins" icon="👥" title="إدارة المديرين" desc="إضافة وتعيين الأدوار" />
          <SettingsLink href="/admin/audit-log" icon="📜" title="سجل العمليات" desc="مراجعة كل النشاط الإداري" />
          <SettingsLink href="/admin/coupons" icon="🎁" title="الكوبونات" desc="إنشاء وإدارة الخصومات" />
          <SettingsLink href="/admin/campaigns" icon="📧" title="الحملات" desc="WhatsApp / SMS / Push" />
        </div>
      </div>

      {/* معلومات تقنية */}
      <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>🔧 معلومات النظام</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, fontSize: 13 }}>
          <Info label="نسخة النظام" value="Spir Medical v22 · Admin" />
          <Info label="قاعدة البيانات" value="Supabase PostgreSQL" />
          <Info label="نظام الأدوار" value="Multi-role (4 levels)" />
          <Info label="التشفير" value="AES-256-GCM للملاحظات" />
        </div>

        <div style={{
          marginTop: 16, padding: 16, background: 'var(--paper-3)',
          borderRadius: 10, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.7,
        }}>
          <strong>ملاحظة:</strong> لتعديل قائمة المحافظات، الخدمات، أو أوقات العمل، حالياً يتم ذلك مباشرة من قاعدة البيانات.
          ميزة الإعدادات المتقدمة قيد التطوير.
        </div>
      </div>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--paper-3)', padding: 16, borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--emerald-deep)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function SettingsLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <a href={href} style={{
      display: 'flex', gap: 12, padding: 16, background: 'var(--paper-3)',
      borderRadius: 10, textDecoration: 'none', color: 'var(--ink)',
    }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{desc}</div>
      </div>
    </a>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
    </div>
  );
}
