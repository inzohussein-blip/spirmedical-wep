import Link from 'next/link';

import EmojiIcon from '@/components/ui/EmojiIcon';
// ═══════════════════════════════════════════════════════════
// 🎯 اختيار نوع الحساب
// ═══════════════════════════════════════════════════════════
// أُصلح: الروابط المكسورة (/auth/register/* → /register/*)
// أُوحّد: التصميم مع بقية صفحات auth (auth-* classes)
// ═══════════════════════════════════════════════════════════

export const metadata = {
  title: 'اختر نوع حسابك · سباير ميديكال',
  description: 'مريض، أو مختصّ (سحب دم وتمريض منزليّ)، أو خدمة (مختبر، صيدلية، عيادة، مستشفى)',
};

export default function RegisterPage() {
  return (
    <main className="auth-screen auth-screen--v">
      <Link href="/gate" className="auth-back">
        <span>←</span>
        <span>رجوع</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">اختر نوع حسابك</h2>
        <p className="auth-subtitle">انضم إلينا اليوم وابدأ رحلتك الصحية</p>
      </div>

      <div className="auth-role-cards">
        {/* حساب مريض */}
        <Link
          href="/register/patient"
          className="auth-role-card"
          aria-label="إنشاء حساب مريض"
        >
          <div className="auth-role-icon"><EmojiIcon e="🏥" /></div>
          <div className="auth-role-info">
            <div className="auth-role-title">حساب مريض</div>
            <div className="auth-role-desc">
              احجز مواعيد، اطلب سحب دم منزلي، وتواصل مع الأخصائيين
            </div>
          </div>
          <div className="auth-role-arrow">←</div>
        </Link>

        {/* حساب مختصّ — فردٌ يذهب إلى المريض (0060) */}
        <Link
          href="/register/specialist"
          className="auth-role-card"
          aria-label="إنشاء حساب مختصّ"
        >
          <div className="auth-role-icon" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
            <EmojiIcon e="💉" />
          </div>
          <div className="auth-role-info">
            <div className="auth-role-title">حساب مختصّ</div>
            <div className="auth-role-desc">
              محلّلٌ يسحب الدم في المنزل، أو ممرّضٌ منزليّ
            </div>
          </div>
          <div className="auth-role-arrow">←</div>
        </Link>

        {/* حساب خدمة — منشأة (0060) */}
        <Link
          href="/register/provider"
          className="auth-role-card"
          aria-label="إنشاء حساب خدمة"
        >
          <div className="auth-role-icon" style={{ background: 'var(--spir-blue-soft)', color: 'var(--spir-blue)' }}>
            <EmojiIcon e="🔬" />
          </div>
          <div className="auth-role-info">
            <div className="auth-role-title">حساب خدمة</div>
            <div className="auth-role-desc">
              مختبرُ تحاليل، أو صيدلية، أو عيادة وطبيب، أو مستشفى ومركزٌ طبّيّ
            </div>
          </div>
          <div className="auth-role-arrow">←</div>
        </Link>
      </div>

      <div className="auth-helper auth-helper--center">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="auth-link">
          سجّل الدخول
        </Link>
      </div>

      <div className="auth-trust" aria-label="مؤشرات الثقة">
        <span className="auth-trust-item"><EmojiIcon e="🔐" /> آمن وموثوق</span>
        <span className="auth-trust-sep">·</span>
        <span className="auth-trust-item"><EmojiIcon e="⚡" /> سريع وسهل</span>
        <span className="auth-trust-sep">·</span>
        <span className="auth-trust-item">🌟 دعم 24/7</span>
      </div>
    </main>
  );
}
