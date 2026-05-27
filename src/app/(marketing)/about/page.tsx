// ⚡ V27 Performance: ISR caching (86400s)
export const revalidate = 86400;

import Link from 'next/link';

export const metadata = {
  title: 'حول التطبيق · سباير ميديكال',
};

const FEATURES = [
  { icon: '🩸', title: 'سحب الدم المنزلي', desc: 'فني مدرّب يأتي إليك' },
  { icon: '🧪', title: 'تحاليل شاملة', desc: '+200 نوع فحص' },
  { icon: '💊', title: 'دليل الصيدليات', desc: 'إرشاد لا بيع' },
  { icon: '⌬', title: 'طبيب العائلة', desc: 'رعاية شاملة' },
  { icon: '💬', title: 'استشارات طبية', desc: 'فورية وآمنة' },
  { icon: '🚨', title: 'طوارئ SOS', desc: 'استجابة سريعة' },
];

const TEAM_VALUES = [
  { icon: '🔒', title: 'الخصوصية أولاً', desc: 'بياناتك مُشفّرة ومحمية' },
  { icon: '⚡', title: 'سريع وموثوق', desc: 'استجابة فورية' },
  { icon: '🇮🇶', title: 'صُنع في العراق', desc: 'للعراقيين وبأيديهم' },
  { icon: '💚', title: 'يهمنا صحتك', desc: 'مهمتنا الأولى' },
];

export default function AboutPage() {
  return (
    <main className="mkt-screen">
      <div className="mkt-content">
        <div className="mkt-page-header">
          <Link href="/account" className="mkt-back-btn" aria-label="العودة"><span aria-hidden="true">→</span></Link>
          <h1 className="mkt-page-title">حول التطبيق</h1>
          <div className="mkt-page-spacer" />
        </div>

        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 24 }}>
          <div className="auth-logo" style={{ margin: '0 auto 12px' }}>س</div>
          <div className="auth-brand">Spir Medical</div>
          <div className="auth-brand-sub">سباير ميديكال</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>الإصدار 1.0.0</div>
        </div>

        {/* الرؤية */}
        <div className="mkt-section-head" style={{ marginTop: 8 }}>
          <div className="mkt-section-title">رؤيتنا</div>
        </div>
        <div className="mkt-info-banner" style={{ background: 'var(--paper-3)', display: 'block', padding: 16 }}>
          <p style={{ margin: 0, lineHeight: 1.7, fontSize: 13 }}>
            <strong>سباير ميديكال</strong> منصة طبية رقمية عراقية تهدف إلى تسهيل الوصول للخدمات الصحية. 
            من سحب الدم المنزلي إلى الاستشارات الطبية والصيدليات، نوفّر كل ما تحتاجه في مكان واحد.
          </p>
        </div>

        {/* خدماتنا */}
        <div className="mkt-section-head" style={{ marginTop: 24 }}>
          <div className="mkt-section-title">ما نقدمه</div>
        </div>
        <div className="services-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="service-card service-default">
              <div className="service-icon" aria-hidden="true">{f.icon}</div>
              <div className="service-title">{f.title}</div>
              <div className="service-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* قيمنا */}
        <div className="mkt-section-head" style={{ marginTop: 24 }}>
          <div className="mkt-section-title">قيمنا</div>
        </div>
        <div className="mkt-list-stack">
          {TEAM_VALUES.map((v) => (
            <div key={v.title} className="mkt-list-item">
              <div className="mkt-list-item-icon" aria-hidden="true">{v.icon}</div>
              <div className="mkt-list-item-content">
                <div className="mkt-list-item-title">{v.title}</div>
                <div className="mkt-list-item-subtitle">{v.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* روابط قانونية */}
        <div className="mkt-section-head" style={{ marginTop: 24 }}>
          <div className="mkt-section-title">معلومات قانونية</div>
        </div>
        <div className="mkt-list-stack">
          <Link href="/legal/terms" className="mkt-list-item mkt-list-item-clickable">
            <div className="mkt-list-item-icon" aria-hidden="true">📜</div>
            <div className="mkt-list-item-content">
              <div className="mkt-list-item-title">الشروط والأحكام</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
          <Link href="/legal/privacy" className="mkt-list-item mkt-list-item-clickable">
            <div className="mkt-list-item-icon" aria-hidden="true">🔒</div>
            <div className="mkt-list-item-content">
              <div className="mkt-list-item-title">سياسة الخصوصية</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
          <Link href="/legal/disclaimer" className="mkt-list-item mkt-list-item-clickable">
            <div className="mkt-list-item-icon" aria-hidden="true">⚠️</div>
            <div className="mkt-list-item-content">
              <div className="mkt-list-item-title">إخلاء المسؤولية الطبية</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
          <Link href="/legal/cookies" className="mkt-list-item mkt-list-item-clickable">
            <div className="mkt-list-item-icon" aria-hidden="true">🍪</div>
            <div className="mkt-list-item-content">
              <div className="mkt-list-item-title">سياسة الكوكيز</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
        </div>

        {/* Footer */}
        <div className="account-footer" style={{ marginTop: 32 }}>
          <div>Spir Medical · سباير ميديكال</div>
          <div>صُنع بعناية في بغداد 🇮🇶</div>
          <div style={{ marginTop: 8 }}>© 2026 جميع الحقوق محفوظة</div>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
