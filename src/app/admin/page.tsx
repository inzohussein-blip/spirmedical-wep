import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/admin-types';
import { EmptyState, Avatar } from '@/components/ui';
import { StatCard, StatGrid, Panel, ListRow, StatusPill, ActionTile, ActionGrid, Callout } from '@/components/admin-ui';
import { baghdadDayWindow } from '@/lib/time/baghdad-day';
import { getOpsHealth } from '@/lib/admin/ops-health';
import OpsHealthCards from './_components/OpsHealthCards';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'لوحة التحكم · إدارة Spir Medical',
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isAdminRole(profile?.role)) redirect('/dashboard');

  // === جمع الإحصائيات ===
  // «اليوم» بتوقيت بغداد لا بتوقيت الخادم (UTC على Vercel) — وإلّا بدأ اليوم
  // الساعة 03:00 بغداد وسقطت طلبات ما بعد منتصف الليل في حصيلة الأمس.
  const todayStartDate = baghdadDayWindow().start;
  const todayStart = todayStartDate.toISOString();
  const yesterdayStart = new Date(todayStartDate.getTime() - 86400000).toISOString();
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

  // صحّةُ التشغيل: أنواعٌ بلا مختصّ + رسائلُ فاشلة (بعد التحقّق من الدور أعلاه)
  const opsHealth = await getOpsHealth();

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

  const n = (v: number | null) => (v ?? 0).toLocaleString('ar-IQ-u-nu-latn');

  return (
    <>
      <header className="aui-page-head">
        <h1 className="aui-page-title">لوحة التحكم</h1>
        <p className="aui-page-sub">نظرة عامة على نشاط المنصة</p>
      </header>

      <OpsHealthCards health={opsHealth} />

      {pendingSpecialists !== null && pendingSpecialists > 0 && (
        <Callout
          href="/admin/specialists/pending"
          icon="pending"
          title={`${pendingSpecialists} اختصاصي/ة بانتظار الموافقة`}
          subtitle="راجِع طلبات التسجيل الجديدة"
        />
      )}

      <StatGrid>
        <StatCard icon="inbox" label="طلبات اليوم" value={n(todayOrders)} href="/admin/orders?filter=today"
          hint={todayVsYesterday >= 0 ? `↑ ${todayVsYesterday} عن الأمس` : `↓ ${Math.abs(todayVsYesterday)} عن الأمس`} />
        <StatCard icon="done" label="مكتمل اليوم" value={n(todayCompleted)} />
        <StatCard icon="patients" label="إجمالي المرضى" value={n(totalPatients)} tone="violet" href="/admin/patients" />
        <StatCard icon="specialists" label="اختصاصيون نشطون" value={n(totalSpecialists)} tone="amber" href="/admin/specialists" />
        <StatCard icon="rate" label="معدل الإنجاز" value={`${completionRate}%`} hint={`من ${n(totalOrdersThisMonth)} طلب هذا الشهر`} />
        <StatCard icon="cancelled" label="ملغاة (شهر)" value={n(cancelledThisMonth)} tone="rose" />
      </StatGrid>

      <ActionGrid>
        <ActionTile href="/admin/users/create" icon="createUser" title="إنشاء حساب جديد" subtitle="مختصّ · مراجع · مدير" />
        <ActionTile href="/admin/locations" icon="map" title="إدارة المواقع الموحّدة" subtitle="كلُّ مقدّمي الخدمات على خريطة واحدة" />
        <ActionTile href="/admin/seed-data" icon="seedData" title="البيانات الأولية" subtitle="مستشفيات وصيدليات وأطباء" tone="neutral" />
      </ActionGrid>

      <h2 className="aui-section-title">الخدمات الجديدة</h2>
      <StatGrid min={150}>
        <StatCard icon="dental" label="عيادات أسنان" value={n(dentalCount)} href="/admin/dental" />
        <StatCard icon="optical" label="متاجر نظارات" value={n(opticalCount)} tone="amber" href="/admin/optical" />
        <StatCard icon="mentalHealth" label="أخصائيو نفس" value={n(mentalCount)} tone="violet" href="/admin/mental-health" />
        <StatCard icon="nutrition" label="أخصائيو تغذية" value={n(nutritionCount)} href="/admin/nutrition" />
      </StatGrid>

      <div className="aui-two-col">
        <Panel title="أحدث الطلبات" icon="orders" action={{ href: '/admin/orders', label: 'عرض الكل' }}>
          {(recentOrders ?? []).length === 0 ? (
            <EmptyState size="sm" icon="📦" title="لا توجد طلبات" description="ستظهر الطلبات الجديدة هنا" variant="plain" />
          ) : (
            (recentOrders ?? []).map((o) => (
              <ListRow key={o.id} href={`/admin/orders/${o.id}`}
                title={patientMap.get(o.user_id) ?? 'مريض'} subtitle={o.service_type}
                trailing={<StatusPill status={o.status ?? undefined} />} />
            ))
          )}
        </Panel>

        <Panel title="أحدث المسجّلين" icon="patients" action={{ href: '/admin/patients', label: 'عرض الكل' }}>
          {(recentSignups ?? []).length === 0 ? (
            <EmptyState size="sm" icon="👤" title="لا توجد تسجيلات" description="ستظهر التسجيلات الجديدة هنا" variant="plain" />
          ) : (
            (recentSignups ?? []).map((u) => (
              <ListRow key={u.id}
                href={u.role === 'specialist' ? `/admin/specialists/${u.id}` : `/admin/patients/${u.id}`}
                leading={<Avatar name={u.full_name ?? 'مستخدم'} variant={u.role === 'specialist' ? 'specialist' : 'patient'} size="sm" />}
                title={u.full_name ?? 'بدون اسم'} subtitle={<span dir="ltr">{u.phone}</span>}
                trailing={<StatusPill label={u.role === 'specialist' ? 'اختصاصي' : 'مريض'} tone={u.role === 'specialist' ? 'amber' : 'neutral'} />} />
            ))
          )}
        </Panel>
      </div>
    </>
  );
}
