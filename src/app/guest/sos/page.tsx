'use client';

import Link from 'next/link';

const EMERGENCY_NUMBERS = [
  { id: '122', icon: '🚑', name: 'الإسعاف الفوري', number: '122', desc: 'الإسعاف الطبي العام' },
  { id: '104', icon: '🚓', name: 'الشرطة', number: '104', desc: 'حالات الجريمة والأمن' },
  { id: '115', icon: '🚒', name: 'الإطفاء', number: '115', desc: 'الحرائق والكوارث' },
  { id: '139', icon: '☎️', name: 'النجدة', number: '139', desc: 'النجدة العامة' },
];

const QUICK_TIPS = [
  { id: 't1', icon: '🫁', title: 'اختناق', href: '/guest/tools/first-aid' },
  { id: 't2', icon: '❤️', title: 'نوبة قلبية', href: '/guest/tools/first-aid' },
  { id: 't3', icon: '🩸', title: 'نزيف', href: '/guest/tools/first-aid' },
  { id: 't4', icon: '🔥', title: 'حروق', href: '/guest/tools/first-aid' },
];

export default function SosPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/guest" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">طوارئ SOS</h1>
          <div className="scr-page-spacer" />
        </div>

        <div style={{ padding: '0 18px' }}>
          {/* زر طوارئ كبير */}
          <a href="tel:122" className="sos-big-button">
            <div className="sos-big-icon" aria-hidden="true">🚨</div>
            <div className="sos-big-content">
              <div className="sos-big-title">اتصل بالإسعاف الآن</div>
              <div className="sos-big-number">١٢٢</div>
            </div>
          </a>

          {/* ميزة موقع GPS - مقفلة للضيف */}
          <button
            type="button"
            onClick={() => window.location.href = '/register'}
            className="sos-gps-card"
          >
            <div className="sos-gps-icon" aria-hidden="true">📍</div>
            <div className="sos-gps-content">
              <div className="sos-gps-title">إرسال موقعي للإسعاف</div>
              <div className="sos-gps-sub">سجّل لتفعيل GPS التلقائي</div>
            </div>
            <div className="sos-gps-lock" aria-hidden="true">🔒</div>
          </button>

          {/* أرقام الطوارئ */}
          <h2 className="scr-section-title" style={{ margin: '20px 0 12px' }}>أرقام الطوارئ</h2>
          <div className="emergency-numbers-grid">
            {EMERGENCY_NUMBERS.map((emergency) => (
              <a
                key={emergency.id}
                href={`tel:${emergency.number}`}
                className="emergency-number-card"
              >
                <div className="emergency-icon" aria-hidden="true">{emergency.icon}</div>
                <div className="emergency-name">{emergency.name}</div>
                <div className="emergency-number">{emergency.number}</div>
                <div className="emergency-desc">{emergency.desc}</div>
              </a>
            ))}
          </div>

          {/* نصائح سريعة */}
          <h2 className="scr-section-title" style={{ margin: '20px 0 12px' }}>إسعافات سريعة</h2>
          <div className="quick-tips-grid">
            {QUICK_TIPS.map((tip) => (
              <Link key={tip.id} href={tip.href} className="quick-tip-card">
                <div className="quick-tip-icon" aria-hidden="true">{tip.icon}</div>
                <div className="quick-tip-title">{tip.title}</div>
              </Link>
            ))}
          </div>

          <div className="tool-disclaimer" style={{ marginTop: 16 }}>
            ⚠ في حالة الخطر، اتصل بـ ١٢٢ أولاً قبل أي إجراء آخر.
          </div>
        </div>
      </div>

    </main>
  );
}
