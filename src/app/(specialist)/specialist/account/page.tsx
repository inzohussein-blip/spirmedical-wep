import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '../../../(auth)/login/actions';
import { SPECIALIST_META, type SpecialistType } from '@/lib/specialist-types';

export const metadata = {
  title: 'حسابي · لوحة الاختصاصي',
};

export const dynamic = 'force-dynamic';

export default async function SpecialistAccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone, governorate, specialist_type, specialist_bio, specialist_years_exp, approval_status')
    .eq('id', user.id)
    .single();

  const specialistType = (profile?.specialist_type ?? 'doctor') as SpecialistType;
  const meta = SPECIALIST_META[specialistType] ?? SPECIALIST_META.doctor;

  // إحصائيات
  const [{ count: totalOrders }, { data: ratings }] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('assigned_specialist_id', user.id),
    supabase.from('ratings').select('overall_rating').eq('specialist_id', user.id),
  ]);

  const avgRating = ratings && ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length).toFixed(1)
    : '—';

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn"><span aria-hidden="true">→</span></Link>
          <h1 className="scr-page-title">حسابي</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* بطاقة الملف */}
        <div style={{
          background: meta.gradient,
          color: 'var(--white)',
          padding: '20px',
          borderRadius: 16,
          marginTop: 12,
          marginBottom: 16,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{meta.icon}</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{profile?.full_name ?? '—'}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{meta.label}</div>
          {profile?.governorate && (
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 8 }}>📍 {profile.governorate}</div>
          )}
        </div>

        {/* إحصائيات سريعة */}
        <div className="services-grid">
          <div className="service-card service-default">
            <div className="service-icon">📊</div>
            <div className="service-title">{totalOrders ?? 0}</div>
            <div className="service-desc">طلبات إجمالية</div>
          </div>
          <div className="service-card service-amber">
            <div className="service-icon">⭐</div>
            <div className="service-title">{avgRating}</div>
            <div className="service-desc">تقييمي</div>
          </div>
        </div>

        {/* الملف الشخصي */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">الملف الشخصي</div>
        </div>
        <div className="scr-list-stack">
          <Link href="/specialist/account/edit" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon">✏️</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">تعديل المعلومات</div>
              <div className="scr-list-item-subtitle">السيرة الذاتية والخبرة</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
          </Link>
          <Link href="/specialist/schedule" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon">📅</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">جدول الدوام</div>
              <div className="scr-list-item-subtitle">ساعاتك المتاحة</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
          </Link>
          <Link href="/specialist/inbox/templates" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon">⚡</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">قوالب الردود</div>
              <div className="scr-list-item-subtitle">ردود سريعة للمحادثات</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
          </Link>
        </div>

        {/* الإعدادات */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">الإعدادات</div>
        </div>
        <div className="scr-list-stack">
          <Link href="/account/settings" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon">⚙️</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">الإعدادات العامة</div>
              <div className="scr-list-item-subtitle">PIN، الإشعارات، البيانات</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
          </Link>
          <a
            href={`https://wa.me/9647803993585?text=${encodeURIComponent(`السلام عليكم، أحتاج مساعدة بخصوص حسابي كاختصاصي في Spir Medical.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="scr-list-item scr-list-item-clickable"
          >
            <div className="scr-list-item-icon">💬</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">الدعم الفني</div>
              <div className="scr-list-item-subtitle">تواصل عبر WhatsApp</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
          </a>
        </div>

        {/* تسجيل الخروج */}
        <form action={signOut}>
          <button
            type="submit"
            className="scr-list-item scr-list-item-clickable"
            style={{
              width: '100%',
              textAlign: 'right',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--rose-soft)',
              color: 'var(--rose)',
              marginTop: 24,
            }}
          >
            <div className="scr-list-item-icon">🚪</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title" style={{ color: 'var(--rose)' }}>تسجيل الخروج</div>
              <div className="scr-list-item-subtitle" style={{ color: 'var(--rose)' }}>الخروج من حسابك</div>
            </div>
          </button>
        </form>
      </div>
    </main>
  );
}
