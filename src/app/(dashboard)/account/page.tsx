import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '../../(auth)/login/actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'حسابي · سباير ميديكال',
};

// ============================================================
// أقسام الحساب (مطابقة لـ الفكرة الأصلية)
// ============================================================

const SECTION_RECORDS = [
  {
    id: 'history',
    icon: '📜',
    title: 'الطلبات السابقة',
    desc: 'سجل تحاليلك واستشاراتك',
    href: '/appointments?status=completed',
  },
  {
    id: 'lab-history',
    icon: '🧪',
    title: 'سجل التحاليل',
    desc: 'كل فحوصاتك المختبرية',
    href: '/account/lab-history',
  },
  {
    id: 'nursing-history',
    icon: '💉',
    title: 'سجل التمريض',
    desc: 'زياراتك التمريضية المنزلية',
    href: '/account/nursing-history',
  },
  {
    id: 'prescriptions',
    icon: '📋',
    title: 'الوصفات',
    desc: 'وصفاتك الطبية مؤرشفة',
    href: '/account/prescriptions',
  },
  {
    id: 'medical-record',
    icon: '📊',
    title: 'سجلي الطبي',
    desc: 'تاريخك الصحي ومؤشراتك',
    href: '/account/medical-record',
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧‍👦',
    title: 'أفراد العائلة',
    desc: 'سجّل خدمات لعائلتك بسهولة',
    href: '/account/family',
  },
];

const SECTION_FAMILY = [
{
    id: 'subscription',
    icon: '💎',
    title: 'العضوية والاشتراكات',
    desc: 'باقات مميزة وطبيب العائلة',
    href: '/account/subscription',
  },
];

const SECTION_SETTINGS = [
  {
    id: 'settings',
    icon: '⚙',
    title: 'الإعدادات',
    desc: 'اللغة · الإشعارات · المظهر',
    href: '/account/settings',
  },
  {
    id: 'locations',
    icon: '📍',
    title: 'مواقعي المحفوظة',
    desc: 'البيت · العمل · مواقع متكررة',
    href: '/account/locations',
  },
  {
    id: 'language',
    icon: '🌐',
    title: 'اللغة',
    desc: 'عربي · English · کوردی',
    href: '/account/settings#language',
  },
  {
    id: 'notifications',
    icon: '🔔',
    title: 'الإشعارات',
    desc: 'إدارة التنبيهات',
    href: '/account/notifications',
  },
  {
    id: 'push-notifications',
    icon: '📲',
    title: 'إشعارات التطبيق',
    desc: 'فعّل إشعارات Push للمواعيد والنتائج',
    href: '/account/notifications/settings',
  },
];

const SECTION_HELP = [
  {
    id: 'help',
    icon: '💬',
    title: 'مساعدة والدعم',
    desc: 'تواصل معنا · أسئلة شائعة',
    href: '/account/help',
  },
  {
    id: 'about',
    icon: 'ℹ',
    title: 'حول التطبيق',
    desc: 'الإصدار · الفريق',
    href: '/about',
  },
  {
    id: 'legal',
    icon: '📜',
    title: 'الشروط والخصوصية',
    desc: 'الاتفاقية وإخلاء المسؤولية',
    href: '/legal/terms',
  },
];

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone, role, governorate, created_at')
    .eq('id', user.id)
    .single();

  const fullName = profile?.full_name || 'مستخدم';
  const initial = fullName.charAt(0);
  const phone = profile?.phone || '';
  const phoneDisplay = phone.startsWith('+964')
    ? `0${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}`
    : phone;
  const roleLabel = profile?.role === 'specialist' ? 'أخصائي' : 'مراجع';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <main className="app-screen">
      <div className="scr-content">

        {/* Header */}
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">حسابي</h1>
          <Link
            href="/account/settings"
            className="scr-back-btn"
            aria-label="الإعدادات"
            style={{ background: 'transparent' }}
          >
            <span aria-hidden="true">⚙</span>
          </Link>
        </div>

        {/* Profile Card الكبيرة */}
        <div className="account-profile-card">
          <div className="account-profile-top">
            <div className="account-avatar">{initial}</div>
            <div className="account-info">
              <h2>{fullName}</h2>
              <div className="account-role-badge">{roleLabel}</div>
              {phoneDisplay && (
                <div className="account-phone">📱 {phoneDisplay}</div>
              )}
              {memberSince && (
                <div className="account-member">📅 عضو منذ {memberSince}</div>
              )}
            </div>
          </div>
          <Link href="/account/edit" className="account-edit-btn">
            <span aria-hidden="true">✎</span>
            <span>تعديل المعلومات</span>
          </Link>
        </div>

        {/* إحصاءات سريعة */}
        <div className="account-stats">
          <Link href="/appointments" className="account-stat">
            <div className="account-stat-icon">📋</div>
            <div className="account-stat-value">0</div>
            <div className="account-stat-label">طلب</div>
          </Link>
          <Link href="/favorites" className="account-stat">
            <div className="account-stat-icon">⭐</div>
            <div className="account-stat-value">0</div>
            <div className="account-stat-label">مفضّل</div>
          </Link>
        </div>

        {/* قسم: السجلات والتاريخ */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">السجلات والتاريخ</div>
        </div>
        <div className="account-sections">
          {SECTION_RECORDS.map((item) => (
            <AccountLink key={item.id} item={item} />
          ))}
        </div>

        {/* قسم: العائلة والعضوية — مخفي حالياً (الاشتراكات قيد التطوير) */}
        {/*
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">العائلة والعضوية</div>
        </div>
        <div className="account-sections">
          {SECTION_FAMILY.map((item) => (
            <AccountLink key={item.id} item={item} />
          ))}
        </div>
        */}

        {/* قسم: الإعدادات */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">الإعدادات</div>
        </div>
        <div className="account-sections">
          {SECTION_SETTINGS.map((item) => (
            <AccountLink key={item.id} item={item} />
          ))}
        </div>

        {/* قسم: المساعدة والمعلومات */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">مساعدة ومعلومات</div>
        </div>
        <div className="account-sections">
          {SECTION_HELP.map((item) => (
            <AccountLink key={item.id} item={item} />
          ))}
        </div>

        {/* تسجيل الخروج + تغيير الحساب */}
        <div style={{ marginTop: 24 }}>
          <Link href="/login" className="account-switch-btn">
            <span aria-hidden="true">🔄</span>
            <span>تحويل لحساب آخر</span>
          </Link>

          <form action={signOut}>
            <button type="submit" className="account-logout-btn">
              <span aria-hidden="true">🚪</span>
              <span>تسجيل الخروج</span>
            </button>
          </form>
        </div>

        {/* معلومات التطبيق في الأسفل */}
        <div className="account-footer">
          <div>Spir Medical · سباير ميديكال</div>
          <div>الإصدار 1.0.0 · صنع بعناية في بغداد 🇮🇶</div>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

// ============================================================
// مكوّن رابط حساب
// ============================================================
function AccountLink({
  item,
}: {
  item: { id: string; icon: string; title: string; desc: string; href: string };
}) {
  return (
    <Link href={item.href} className="account-section-link">
      <div className="account-section-icon" aria-hidden="true">{item.icon}</div>
      <div className="account-section-content">
        <div className="account-section-title">{item.title}</div>
        <div className="account-section-desc">{item.desc}</div>
      </div>
      <div className="account-section-arrow" aria-hidden="true">←</div>
    </Link>
  );
}
