import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SPECIALIST_META, type SpecialistType } from '@/lib/specialist-types';

export const metadata = {
  title: 'لوحة الاختصاصي · سباير ميديكال',
};

export const dynamic = 'force-dynamic';

export default async function SpecialistDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, specialist_type, approval_status')
    .eq('id', user.id)
    .single();

  // إذا حساب قيد المراجعة
  if (profile?.approval_status === 'pending') {
    return (
      <main className="app-screen">
        <div className="scr-content">
          <div className="scr-empty" style={{ marginTop: 60 }}>
            <div className="scr-empty-icon">⏳</div>
            <h2 className="scr-empty-title">حسابك قيد المراجعة</h2>
            <p className="scr-empty-desc">
              تم استلام تسجيلك ويُراجع من قبل إدارة Spir Medical. سنتواصل معك خلال 24-48 ساعة.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const specialistType = (profile?.specialist_type ?? 'doctor') as SpecialistType;
  const meta = SPECIALIST_META[specialistType] ?? SPECIALIST_META.doctor;

  // اجلب إحصائيات
  const [
    { count: newOrders },
    { count: inProgressOrders },
    { count: completedToday },
    { data: ratings },
  ] = await Promise.all([
    // طلبات جديدة (لم تُعيَّن أو معيّنة لي وقيد الانتظار)
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('required_specialist_type', specialistType)
      .or(`assigned_specialist_id.is.null,assigned_specialist_id.eq.${user.id}`)
      .eq('status', 'pending'),

    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_specialist_id', user.id)
      .in('status', ['confirmed', 'in_progress']),

    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_specialist_id', user.id)
      .eq('status', 'completed')
      .gte('updated_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    supabase
      .from('ratings')
      .select('overall_rating')
      .eq('specialist_id', user.id),
  ]);

  const avgRating = ratings && ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length).toFixed(1)
    : '—';

  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header مع نوع الاختصاصي */}
        <div
          style={{
            background: meta.gradient,
            color: '#fff',
            padding: '20px 18px',
            borderRadius: 16,
            marginTop: 8,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 38 }}>{meta.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 700 }}>أهلاً</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{profile?.full_name ?? 'أخصائي'}</div>
              <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>{meta.label}</div>
            </div>
          </div>
        </div>

        {/* الإحصائيات */}
        <div className="scr-section-head">
          <div className="scr-section-title">إحصائيات اليوم</div>
        </div>
        <div className="services-grid">
          <Link href="/specialist/orders?filter=new" className="service-card service-rose" style={{ textDecoration: 'none' }}>
            <div className="service-icon" aria-hidden="true">📥</div>
            <div className="service-title">{newOrders ?? 0}</div>
            <div className="service-desc">طلبات جديدة</div>
          </Link>
          <Link href="/specialist/orders?filter=in_progress" className="service-card service-amber" style={{ textDecoration: 'none' }}>
            <div className="service-icon" aria-hidden="true">🔄</div>
            <div className="service-title">{inProgressOrders ?? 0}</div>
            <div className="service-desc">قيد التنفيذ</div>
          </Link>
          <Link href="/specialist/orders?filter=completed" className="service-card service-default" style={{ textDecoration: 'none' }}>
            <div className="service-icon" aria-hidden="true">✅</div>
            <div className="service-title">{completedToday ?? 0}</div>
            <div className="service-desc">مكتمل اليوم</div>
          </Link>
          <div className="service-card service-default">
            <div className="service-icon" aria-hidden="true">⭐</div>
            <div className="service-title">{avgRating}</div>
            <div className="service-desc">تقييمك</div>
          </div>
        </div>

        {/* الإجراءات السريعة */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">الإجراءات السريعة</div>
        </div>
        <div className="scr-list-stack">
          <Link href="/specialist/orders" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon">📋</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">الطلبات</div>
              <div className="scr-list-item-subtitle">إدارة كل طلباتك</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
          </Link>
          <Link href="/specialist/inbox" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon">💬</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">الرسائل</div>
              <div className="scr-list-item-subtitle">المحادثات مع المرضى</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
          </Link>
          <Link href="/specialist/schedule" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon">📅</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">جدول الدوام</div>
              <div className="scr-list-item-subtitle">حدّد ساعاتك المتاحة</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
          </Link>
          <Link href="/specialist/account" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon">👤</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">الملف الشخصي</div>
              <div className="scr-list-item-subtitle">السيرة الذاتية والإعدادات</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
