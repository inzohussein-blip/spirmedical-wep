// تعطيل pre-rendering
export const dynamic = 'force-dynamic';

import Link from 'next/link';

export const metadata = {
  title: 'وضع الضيف · سباير ميديكال',
  description: 'تصفّح خدمات سباير ميديكال بدون تسجيل',
};

export default function GuestPage() {
  return (
    <main className="full-screen-page">
      <div className="phone">
        <div className="phone-screen">
          {/* Phone status bar */}
          <div className="phone-status">
            <span>9:41</span>
            <span>📶 🔋</span>
          </div>

          {/* Greeting */}
          <div className="scr-greet">
            <div>
              <div className="scr-h1">مرحباً بك زائراً 👋</div>
              <div className="scr-h2">سباير ميديكال</div>
              <div className="scr-loc">
                <span>📍</span>
                <span>العراق · جميع المحافظات</span>
              </div>
            </div>
            <div className="scr-avatar">ز</div>
          </div>

          {/* Search bar */}
          <div className="scr-search">
            <div className="scr-search-icon">🔍</div>
            <span>ابحث عن خدمة طبية…</span>
          </div>

          {/* Guest banner - أعلى شيء يدعو للتسجيل */}
          <div className="scr-guest-banner" style={{ marginTop: '14px' }}>
            <div className="scr-guest-banner-content">
              <div className="scr-guest-banner-tag">⚡ وضع الضيف</div>
              <div className="scr-guest-banner-title">سجّل لتفتح كل المزايا</div>
              <div className="scr-guest-banner-desc">
                احجز · تابع طلباتك · سجّل طبي · والمزيد
              </div>
            </div>
            <Link href="/login" className="scr-guest-banner-btn">
              التسجيل ←
            </Link>
          </div>

          {/* Stories */}
          <div className="scr-stories">
            <div className="story">
              <div className="story-circle">
                <div className="story-inner">💉</div>
              </div>
              <div className="story-label">لقاحات</div>
            </div>
            <div className="story">
              <div className="story-circle">
                <div className="story-inner">🩺</div>
              </div>
              <div className="story-label">فحص</div>
            </div>
            <div className="story">
              <div className="story-circle">
                <div className="story-inner">💊</div>
              </div>
              <div className="story-label">أدوية</div>
            </div>
            <div className="story">
              <div className="story-circle">
                <div className="story-inner">👨‍⚕️</div>
              </div>
              <div className="story-label">أطباء</div>
            </div>
            <div className="story">
              <div className="story-circle">
                <div className="story-inner">🏥</div>
              </div>
              <div className="story-label">مستشفى</div>
            </div>
          </div>

          {/* Services section */}
          <div className="scr-section-title">
            <h3>الخدمات</h3>
            <span style={{ fontSize: '9px', color: 'var(--ink-3)' }}>
              🔒 محتاج تسجيل للحجز
            </span>
          </div>

          <div className="scr-services">
            {/* خدمات متاحة للتصفح */}
            <div className="service-cell">
              <div className="service-icon">🩸</div>
              <div className="service-arrow">›</div>
              <div className="service-name">سحب دم منزلي</div>
              <div className="service-sub">من 25,000 د.ع</div>
            </div>

            <div className="service-cell amber">
              <div className="service-icon">🧪</div>
              <div className="service-arrow">›</div>
              <div className="service-name">فحوصات مختبرية</div>
              <div className="service-sub">+200 فحص</div>
            </div>

            <div className="service-cell">
              <div className="service-icon">📞</div>
              <div className="service-arrow">›</div>
              <div className="service-name">استشارة طبيب</div>
              <div className="service-sub">+20 تخصص</div>
            </div>

            <div className="service-cell rose">
              <div className="service-icon">💊</div>
              <div className="service-arrow">›</div>
              <div className="service-name">صيدلية وأدوية</div>
              <div className="service-sub">توصيل سريع</div>
            </div>

            {/* خدمات مقفلة - تحتاج تسجيل */}
            <div className="service-cell locked">
              <div className="service-icon">🚨</div>
              <div className="service-arrow">🔒</div>
              <div className="service-name">طوارئ SOS</div>
              <div className="service-sub">للمسجّلين فقط</div>
            </div>

            <div className="service-cell locked">
              <div className="service-icon">📋</div>
              <div className="service-arrow">🔒</div>
              <div className="service-name">السجل الطبي</div>
              <div className="service-sub">للمسجّلين فقط</div>
            </div>

            <div className="service-cell locked">
              <div className="service-icon">⏰</div>
              <div className="service-arrow">🔒</div>
              <div className="service-name">تذكير الأدوية</div>
              <div className="service-sub">للمسجّلين فقط</div>
            </div>

            <div className="service-cell locked">
              <div className="service-icon">👨‍👩‍👧</div>
              <div className="service-arrow">🔒</div>
              <div className="service-name">إدارة العائلة</div>
              <div className="service-sub">للمسجّلين فقط</div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{ padding: '0 18px 20px' }}>
            <Link
              href="/login"
              className="cta-btn"
              style={{ marginTop: '8px', display: 'block' }}
            >
              إنشاء حساب — مجاناً ←
            </Link>
            <div
              style={{
                textAlign: 'center',
                fontSize: '10px',
                color: 'var(--ink-3)',
                marginTop: '10px',
              }}
            >
              <Link
                href="/"
                style={{
                  color: 'var(--ink-3)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                ← العودة للرئيسية
              </Link>
            </div>
          </div>

          <div className="phone-home-bar"></div>
        </div>
      </div>

      {/* Back link */}
      <Link href="/login" className="back-link">
        <span>←</span>
        <span>تغيير الدخول</span>
      </Link>
    </main>
  );
}
