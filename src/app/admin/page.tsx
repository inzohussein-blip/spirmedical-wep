import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/admin-types';
import { EmptyState, Avatar, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'لوحة التحكم · إدارة Spir Medical',
};

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
  href?: string;
}

function StatCard({ icon, label, value, sublabel, color, href }: StatCardProps) {
  const inner = (
    <div style={{
      background: 'var(--white)',
      borderRadius: 14,
      padding: 20,
      borderRight: `4px solid ${color}`,
      transition: 'transform 0.15s',
      cursor: href ? 'pointer' : 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 24 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sublabel && (
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 8 }}>{sublabel}</div>
      )}
    </div>
  );

  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>;
  return inner;
}

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isAdminRole(profile?.role)) redirect('/dashboard');

  // === جمع الإحصائيات ===
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const yesterdayStart = new Date(new Date().setHours(0, 0, 0, 0) - 86400000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    { count: pendingSpecialists },
    { count: totalPatients },
    { count: totalSpecialists },
    { count: todayOrders },
    { count: yesterdayOrders },
    { count: todayCompleted },
    { count: totalOrdersThisMonth },
    { count: cancelledThisMonth },
    { data: recentOrders },
    { data: recentSignups },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true })
      .eq('role', 'specialist').eq('approval_status', 'pending'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .eq('role', 'specialist').eq('approval_status', 'approved'),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayStart).lt('created_at', todayStart),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('status', 'completed').gte('updated_at', todayStart),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled').gte('created_at', monthAgo),
    supabase.from('appointments')
      .select('id, service_type, status, scheduled_at, user_id, required_specialist_type')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('users')
      .select('id, full_name, phone, role, created_at')
      .order('created_at', { ascending: false }).limit(5),
  ]);

  // ─── V25.21: stats للخدمات الجديدة ───
  const [
    { count: dentalCount },
    { count: opticalCount },
    { count: mentalCount },
    { count: nutritionCount },
  ] = await Promise.all([
    supabase.from('dental_clinics').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('optical_stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('mental_health_specialists').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('nutritionists').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  // مقارنة اليوم بالأمس
  const todayVsYesterday = (todayOrders ?? 0) - (yesterdayOrders ?? 0);
  const completionRate = totalOrdersThisMonth && totalOrdersThisMonth > 0
    ? Math.round(((totalOrdersThisMonth - (cancelledThisMonth ?? 0)) / totalOrdersThisMonth) * 100)
    : 0;

  // أسماء المرضى للـ recent orders
  const userIds = Array.from(new Set((recentOrders ?? []).map((o) => o.user_id)));
  const { data: patientsData } = userIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', userIds)
    : { data: [] };
  const patientMap = new Map((patientsData ?? []).map((p) => [p.id, p.full_name]));

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
        لوحة التحكم
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px' }}>
        نظرة عامة على نشاط المنصة
      </p>

      {/* ✨ Quick Action: Create User */}
      <Link
        href="/admin/users/create"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #01875F 0%, #073B30 100%)',
          color: 'var(--white)',
          padding: '14px 20px',
          borderRadius: 14,
          marginBottom: 12,
          textDecoration: 'none',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>
            ➕ إنشاء حساب جديد (مختصّ / مراجع / أدمن)
          </div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            أنشئ حسابات للموظّفين والمختصّين بسرعة
          </div>
        </div>
        <div style={{ fontSize: 20 }}>←</div>
      </Link>

      {/* ✨ Quick Action: Seed Data */}
      <Link
        href="/admin/seed-data"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1A73E8 0%, #0E5C9E 100%)',
          color: 'var(--white)',
          padding: '14px 20px',
          borderRadius: 14,
          marginBottom: 16,
          textDecoration: 'none',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>
            📦 البيانات الأولية (Seed Data)
          </div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            أضف مستشفيات وصيدليات وأطباء حقيقيين بضغطة
          </div>
        </div>
        <div style={{ fontSize: 20 }}>←</div>
      </Link>

      {/* Alert: pending specialists */}
      {pendingSpecialists !== null && pendingSpecialists > 0 && (
        <Link
          href="/admin/specialists/pending"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #B8540C 0%, #6B3A08 100%)',
            color: 'var(--white)',
            padding: '14px 20px',
            borderRadius: 14,
            marginBottom: 20,
            textDecoration: 'none',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>
              ⏳ {pendingSpecialists} اختصاصي/ة بانتظار الموافقة
            </div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>اضغط لمراجعة طلبات التسجيل الجديدة</div>
          </div>
          <div style={{ fontSize: 20 }}>←</div>
        </Link>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <StatCard
          icon="📥"
          label="طلبات اليوم"
          value={(todayOrders ?? 0).toLocaleString('ar-IQ')}
          sublabel={todayVsYesterday >= 0 ? `↑ ${todayVsYesterday} من الأمس` : `↓ ${Math.abs(todayVsYesterday)} من الأمس`}
          color="#0E5C4D"
          href="/admin/orders?filter=today"
        />
        <StatCard
          icon="✅"
          label="مكتمل اليوم"
          value={(todayCompleted ?? 0).toLocaleString('ar-IQ')}
          color="#0E5C4D"
        />
        <StatCard
          icon="👤"
          label="إجمالي المرضى"
          value={(totalPatients ?? 0).toLocaleString('ar-IQ')}
          color="#534AB7"
          href="/admin/patients"
        />
        <StatCard
          icon="👨‍⚕️"
          label="اختصاصيون نشطون"
          value={(totalSpecialists ?? 0).toLocaleString('ar-IQ')}
          color="#B8540C"
          href="/admin/specialists"
        />
        <StatCard
          icon="📊"
          label="معدل الإنجاز"
          value={`${completionRate}%`}
          sublabel={`من ${(totalOrdersThisMonth ?? 0).toLocaleString('ar-IQ')} طلب هذا الشهر`}
          color="#0E5C4D"
        />
        <StatCard
          icon="🚫"
          label="ملغاة (شهر)"
          value={(cancelledThisMonth ?? 0).toLocaleString('ar-IQ')}
          color="#A82E3D"
        />
      </div>

      {/* ─── V31: لوحة إدارة المواقع الموحّدة ─── */}
      <Link
        href="/admin/locations"
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '18px 20px', marginBottom: 24,
          background: 'linear-gradient(135deg, #01875F, #073B30)',
          borderRadius: 16, textDecoration: 'none', color: '#fff',
          boxShadow: '0 4px 16px rgba(1,135,95,0.2)',
        }}
      >
        <span style={{ fontSize: 36, flexShrink: 0 }}>🗺️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 2 }}>
            إدارة المواقع الموحّدة
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            كل مقدّمي الخدمات على خريطة واحدة — أضف، أظهر، أخفِ، أو احذف أي موقع
          </div>
        </div>
        <span style={{ fontSize: 20, opacity: 0.8 }}>←</span>
      </Link>

      {/* ─── V25.21: Stats الخدمات الجديدة ─── */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', margin: '24px 0 12px' }}>
        🆕 الخدمات الجديدة
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard
          icon="🦷"
          label="عيادات أسنان"
          value={(dentalCount ?? 0).toLocaleString('ar-IQ')}
          color="#0F6B58"
          href="/admin/dental"
        />
        <StatCard
          icon="👓"
          label="متاجر نظارات"
          value={(opticalCount ?? 0).toLocaleString('ar-IQ')}
          color="#C97916"
          href="/admin/optical"
        />
        <StatCard
          icon="🧠"
          label="أخصائيو نفس"
          value={(mentalCount ?? 0).toLocaleString('ar-IQ')}
          color="#0F6B58"
          href="/admin/mental-health"
        />
        <StatCard
          icon="🥗"
          label="أخصائيو تغذية"
          value={(nutritionCount ?? 0).toLocaleString('ar-IQ')}
          color="#C97916"
          href="/admin/nutrition"
        />
      </div>

      {/* Two-column layout: Recent Orders + Recent Signups */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Recent Orders */}
        <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>أحدث الطلبات</h2>
            <Link href="/admin/orders" style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 700, textDecoration: 'none' }}>
              عرض الكل ←
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(recentOrders ?? []).length === 0 ? (
              <EmptyState
                size="sm"
                icon="📦"
                title="لا توجد طلبات"
                description="ستظهر الطلبات الجديدة هنا"
                variant="plain"
              />
            ) : (
              (recentOrders ?? []).map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 10px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: 'var(--ink)',
                    background: 'var(--paper-3)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>
                      {patientMap.get(o.user_id) ?? 'مريض'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{o.service_type}</div>
                  </div>
                  <div style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 100,
                    background: o.status === 'completed' ? 'var(--emerald-soft)' :
                                o.status === 'cancelled' ? 'var(--rose-soft)' :
                                'var(--amber-soft, #F8E5C7)',
                    color: o.status === 'completed' ? 'var(--emerald-deep)' :
                           o.status === 'cancelled' ? 'var(--rose)' :
                           'var(--amber-deep, #6B3A08)',
                    fontWeight: 800,
                  }}>
                    {o.status === 'pending' ? 'جديد' :
                     o.status === 'confirmed' ? 'مؤكّد' :
                     o.status === 'in_progress' ? 'جارٍ' :
                     o.status === 'completed' ? 'مكتمل' : 'ملغى'}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Signups */}
        <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>أحدث المسجّلين</h2>
            <Link href="/admin/patients" style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 700, textDecoration: 'none' }}>
              عرض الكل ←
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(recentSignups ?? []).length === 0 ? (
              <EmptyState
                size="sm"
                icon="👤"
                title="لا توجد تسجيلات"
                description="ستظهر التسجيلات الجديدة هنا"
                variant="plain"
              />
            ) : (
              (recentSignups ?? []).map((u) => (
                <Link
                  key={u.id}
                  href={u.role === 'specialist' ? `/admin/specialists/${u.id}` : `/admin/patients/${u.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: 'var(--ink)',
                    background: 'var(--paper-3)',
                  }}
                >
                  <Avatar
                    name={u.full_name ?? 'مستخدم'}
                    variant={u.role === 'specialist' ? 'specialist' : 'patient'}
                    size="sm"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{u.full_name ?? 'بدون اسم'}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }} dir="ltr">{u.phone}</div>
                  </div>
                  <div style={{
                    fontSize: 10,
                    padding: '4px 8px',
                    borderRadius: 100,
                    background: u.role === 'specialist' ? 'var(--amber-soft)' : 'var(--paper)',
                    color: u.role === 'specialist' ? 'var(--amber)' : 'var(--ink-3)',
                    fontWeight: 800,
                  }}>
                    {u.role === 'specialist' ? '⚕️ اختصاصي' : '👤 مريض'}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </>
  );
}
