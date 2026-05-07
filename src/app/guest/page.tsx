// تعطيل pre-rendering
export const dynamic = 'force-dynamic';

import Link from 'next/link';

export const metadata = {
  title: 'وضع الضيف · سباير ميديكال',
  description: 'تصفّح خدمات سباير ميديكال بدون تسجيل',
};

export default function GuestPage() {
  return (
    <main className="app-screen">
      {/* App header */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-greeting">مرحباً بك زائراً 👋</div>
          <h1 className="app-brand">سباير ميديكال</h1>
          <div className="app-location">
            <span>📍</span>
            <span>العراق · جميع المحافظات</span>
          </div>
        </div>
        <Link href="/login" className="app-avatar-link" aria-label="تسجيل الدخول">
          <div className="app-avatar-guest">ز</div>
        </Link>
      </header>

      {/* Search */}
      <div className="app-search-wrap">
        <div className="app-search">
          <div className="app-search-icon">🔍</div>
          <span className="app-search-text">ابحث عن خدمة طبية…</span>
        </div>
      </div>

      {/* Guest mode banner */}
      <div className="app-banner-wrap">
        <div className="app-banner">
          <div className="app-banner-content">
            <div className="app-banner-tag">⚡ وضع الضيف</div>
            <h2 className="app-banner-title">سجّل لتفتح كل المزايا</h2>
            <p className="app-banner-desc">احجز · تابع طلباتك · سجّل طبي</p>
          </div>
          <Link href="/login" className="app-banner-btn">
            تسجيل
          </Link>
        </div>
      </div>

      {/* Stories */}
      <div className="app-stories-wrap">
        <div className="app-stories">
          <div className="app-story">
            <div className="app-story-circle">
              <div className="app-story-inner">💉</div>
            </div>
            <div className="app-story-label">لقاحات</div>
          </div>
          <div className="app-story">
            <div className="app-story-circle">
              <div className="app-story-inner">🩺</div>
            </div>
            <div className="app-story-label">فحص</div>
          </div>
          <div className="app-story">
            <div className="app-story-circle">
              <div className="app-story-inner">💊</div>
            </div>
            <div className="app-story-label">أدوية</div>
          </div>
          <div className="app-story">
            <div className="app-story-circle">
              <div className="app-story-inner">👨‍⚕️</div>
            </div>
            <div className="app-story-label">أطباء</div>
          </div>
          <div className="app-story">
            <div className="app-story-circle">
              <div className="app-story-inner">🏥</div>
            </div>
            <div className="app-story-label">مستشفى</div>
          </div>
        </div>
      </div>

      {/* Section title */}
      <div className="app-section-title">
        <h3>الخدمات</h3>
        <span className="app-section-hint">🔒 محتاج تسجيل للحجز</span>
      </div>

      {/* Services grid */}
      <div className="app-services">
        {/* Available services */}
        <div className="app-service">
          <div className="app-service-icon">🩸</div>
          <div className="app-service-arrow">›</div>
          <div className="app-service-name">سحب دم منزلي</div>
          <div className="app-service-sub">من 25,000 د.ع</div>
        </div>

        <div className="app-service amber">
          <div className="app-service-icon">🧪</div>
          <div className="app-service-arrow">›</div>
          <div className="app-service-name">فحوصات مختبرية</div>
          <div className="app-service-sub">+200 فحص</div>
        </div>

        <div className="app-service">
          <div className="app-service-icon">📞</div>
          <div className="app-service-arrow">›</div>
          <div className="app-service-name">استشارة طبيب</div>
          <div className="app-service-sub">+20 تخصص</div>
        </div>

        <div className="app-service rose">
          <div className="app-service-icon">💊</div>
          <div className="app-service-arrow">›</div>
          <div className="app-service-name">صيدلية وأدوية</div>
          <div className="app-service-sub">توصيل سريع</div>
        </div>

        {/* Locked services */}
        <div className="app-service locked">
          <div className="app-service-icon">🚨</div>
          <div className="app-service-arrow">🔒</div>
          <div className="app-service-name">طوارئ SOS</div>
          <div className="app-service-sub">للمسجّلين فقط</div>
        </div>

        <div className="app-service locked">
          <div className="app-service-icon">📋</div>
          <div className="app-service-arrow">🔒</div>
          <div className="app-service-name">السجل الطبي</div>
          <div className="app-service-sub">للمسجّلين فقط</div>
        </div>

        <div className="app-service locked">
          <div className="app-service-icon">⏰</div>
          <div className="app-service-arrow">🔒</div>
          <div className="app-service-name">تذكير الأدوية</div>
          <div className="app-service-sub">للمسجّلين فقط</div>
        </div>

        <div className="app-service locked">
          <div className="app-service-icon">👨‍👩‍👧</div>
          <div className="app-service-arrow">🔒</div>
          <div className="app-service-name">إدارة العائلة</div>
          <div className="app-service-sub">للمسجّلين فقط</div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="app-bottom">
        <Link href="/login" className="app-cta-primary">
          إنشاء حساب — مجاناً ←
        </Link>
        <Link href="/" className="app-cta-secondary">
          ← العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
