'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendOtp } from './actions';

type Role = 'guest' | 'patient' | 'specialist';

const REMEMBER_KEY = 'spir_remember_phone';

const roleHints: Record<Role, { icon: string; label: string; hint: string }> = {
  guest: {
    icon: '👁',
    label: 'وضع الضيف',
    hint: 'تصفح بدون تسجيل · بعض الميزات مقفلة',
  },
  patient: {
    icon: '⊕',
    label: 'تسجيل دخول كمراجع',
    hint: 'الوصول لجميع الخدمات الطبية',
  },
  specialist: {
    icon: '⌬',
    label: 'تسجيل دخول كأخصائي',
    hint: 'لوحة تقديم الخدمات الطبية',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role: Role = (searchParams.get('role') as Role) || 'patient';
  const errorParam = searchParams.get('error');

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [rememberMe, setRememberMe] = useState(false);

  // اقرأ الـ phone المحفوظ عند الـ mount + امسح PIN unlock state
  useEffect(() => {
    try {
      // امسح unlock القديم (لمستخدم سابق محتمل)
      sessionStorage.removeItem('spir_unlocked');

      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setPhone(saved);
        setRememberMe(true);
      }
    } catch {
      // localStorage غير متاح
    }
  }, []);

  // عند تغيير "تذكرني" أو الـ phone: احفظ/احذف
  useEffect(() => {
    try {
      if (rememberMe && phone.trim()) {
        localStorage.setItem(REMEMBER_KEY, phone);
      } else if (!rememberMe) {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      // ignore
    }
  }, [rememberMe, phone]);

  function validatePhone(value: string): boolean {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      setPhoneError('رقم الهاتف إلزامي');
      return false;
    }
    if (cleaned.length < 10 || cleaned.length > 13) {
      setPhoneError('رقم الهاتف غير صحيح');
      return false;
    }
    setPhoneError(undefined);
    return true;
  }

  const roleInfo = roleHints[role];

  // ⭐ OTP Mode (3 أوضاع): 'disabled' | 'optional' | 'required'
  const otpMode = (process.env.NEXT_PUBLIC_OTP_MODE ?? 'disabled') as
    | 'disabled'
    | 'optional'
    | 'required';

  const isOtpRequired = otpMode === 'required';
  const isOtpOptional = otpMode === 'optional';
  const isOtpDisabled = otpMode === 'disabled';

  return (
    <main className="auth-screen">
      <Link href="/gate" className="auth-back">
        <span>←</span>
        <span>العودة</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className={`auth-role-badge ${role === 'specialist' ? 'specialist' : ''}`}>
        <span aria-hidden="true">{roleInfo.icon}</span>
        <span>{roleInfo.label}</span>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">تسجيل الدخول</h2>
        <p className="auth-subtitle">{roleInfo.hint}</p>
      </div>

      <div className="role-tabs" role="tablist" aria-label="نوع الحساب">
        {(['patient', 'specialist'] as Role[]).map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            onClick={() => router.push(`/login?role=${r}`)}
            className={`role-tab ${role === r ? 'active' : ''}`}
            type="button"
          >
            <span aria-hidden="true">{roleHints[r].icon}</span>
            <span>{r === 'patient' ? 'مراجع' : 'أخصائي'}</span>
          </button>
        ))}
      </div>

      <form
        action={sendOtp}
        className="auth-form"
        noValidate
        onSubmit={(e) => {
          if (!validatePhone(phone)) {
            e.preventDefault();
          }
        }}
      >
        {errorParam && (
          <div className="auth-error" role="alert">
            <div className="auth-error-icon">!</div>
            <span>{errorParam}</span>
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="phone" className="auth-field-label">
            رقم الهاتف
            <span className="auth-required" aria-label="إلزامي">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneError(undefined);
            }}
            placeholder="07XXXXXXXXX"
            autoComplete="tel"
            autoFocus
            required
            maxLength={15}
            className={`auth-input ${phoneError ? 'error' : ''}`}
            aria-invalid={!!phoneError}
            aria-describedby={phoneError ? 'phone-error' : undefined}
            dir="ltr"
          />
          {phoneError && (
            <span id="phone-error" className="auth-field-error" role="alert">
              {phoneError}
            </span>
          )}
        </div>

        {/* تذكرني */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            background: 'var(--paper-3)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{
              width: 18,
              height: 18,
              accentColor: 'var(--emerald)',
              cursor: 'pointer',
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>تذكّر رقمي</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              سيُحفظ رقمك في هذا الجهاز فقط
            </div>
          </div>
          <span aria-hidden="true" style={{ fontSize: 18 }}>{rememberMe ? '✅' : '⚪'}</span>
        </label>

        {/* ─── الأزرار حسب OTP Mode ─── */}

        {isOtpRequired && (
          <>
            <input type="hidden" name="action" value="otp" />
            <button type="submit" className="auth-cta">
              إرسال رمز التحقق ←
            </button>
          </>
        )}

        {isOtpDisabled && (
          <>
            <input type="hidden" name="action" value="skip" />
            <button type="submit" className="auth-cta">
              تسجيل الدخول ←
            </button>
          </>
        )}

        {isOtpOptional && (
          <div className="auth-cta-group">
            <button
              type="submit"
              className="auth-cta auth-cta-primary"
              name="action"
              value="otp"
            >
              <span aria-hidden="true">🔐</span>
              <span>إرسال رمز تحقق</span>
            </button>
            <button
              type="submit"
              className="auth-cta auth-cta-secondary"
              name="action"
              value="skip"
            >
              <span aria-hidden="true">⚡</span>
              <span>دخول سريع (بدون رمز)</span>
            </button>
          </div>
        )}
      </form>

      <div className="auth-helper">
        <p style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginTop: 16 }}>
          {isOtpRequired && 'سيُرسل لك رمز ٦ أرقام للتحقق'}
          {isOtpOptional && 'اختر الطريقة المناسبة لك'}
          {isOtpDisabled && 'تسجيل دخول مباشر · لا حاجة لرمز تحقق حالياً'}
        </p>
      </div>

      <div className="auth-helper" style={{ marginTop: '12px' }}>
        ليس لديك حساب؟ <Link href="/register">إنشاء حساب جديد</Link>
      </div>
    </main>
  );
}
