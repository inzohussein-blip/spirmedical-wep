'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendOtp } from './actions';
import { haptic } from '@/lib/haptic';
import BiometricLoginButton from '@/components/pwa/BiometricLoginButton';

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

/**
 * SubmitButton — زر مع loading state تلقائي
 * يستخدم useFormStatus() الذي يقرأ الحالة من الـ form parent
 */
function SubmitButton({
  children,
  loadingText,
  variant = 'primary',
  name,
  value,
}: {
  children: React.ReactNode;
  loadingText: string;
  variant?: 'primary' | 'secondary';
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  const className =
    variant === 'primary'
      ? 'auth-cta'
      : 'auth-cta auth-cta-secondary';

  return (
    <button
      type="submit"
      className={className}
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      style={{
        opacity: pending ? 0.85 : 1,
        cursor: pending ? 'wait' : 'pointer',
        transition: 'opacity 0.15s',
      }}
    >
      {pending ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Spinner />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Spinner — أيقونة دوّارة
 */
function Spinner() {
  return (
    <>
      <span
        className="login-spinner"
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          border: '2.5px solid rgba(255, 255, 255, 0.3)',
          borderTopColor: 'currentColor',
          borderRadius: '50%',
          animation: 'login-spin 0.7s linear infinite',
        }}
      />
      <style jsx global>{`
        @keyframes login-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

/**
 * LoadingOverlay — يظهر فوق الـ form أثناء التسجيل
 * يستخدم useFormStatus من parent form
 */
function LoadingOverlay() {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(244, 239, 226, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        animation: 'login-overlay-in 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          border: '4px solid var(--paper-2, #EDE6D3)',
          borderTopColor: 'var(--emerald, #0E5C4D)',
          borderRadius: '50%',
          animation: 'login-spin 0.7s linear infinite',
        }}
      />
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: 'var(--ink, #0F1A1C)',
          textAlign: 'center',
        }}
      >
        جارٍ تسجيل الدخول...
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--ink-3, #6E7878)',
          textAlign: 'center',
          maxWidth: 280,
        }}
      >
        نقوم بالتحقق من بياناتك وتجهيز حسابك
      </div>
      <style jsx global>{`
        @keyframes login-overlay-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * FieldWrapper — يعطّل inputs أثناء التحميل
 */
function FieldWrapper({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <fieldset
      disabled={pending}
      style={{
        border: 0,
        padding: 0,
        margin: 0,
        opacity: pending ? 0.6 : 1,
        pointerEvents: pending ? 'none' : 'auto',
        transition: 'opacity 0.2s',
      }}
    >
      {children}
    </fieldset>
  );
}

export default function LoginClient() {
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
            haptic.error();
            e.preventDefault();
          } else {
            haptic.medium();
          }
        }}
      >
        <LoadingOverlay />
        {errorParam && (
          <div className="auth-error" role="alert">
            <div className="auth-error-icon">!</div>
            <span>{errorParam}</span>
          </div>
        )}

        <FieldWrapper>

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
            gap: 12,
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
        </FieldWrapper>

        {/* ─── الأزرار حسب OTP Mode ─── */}

        {isOtpRequired && (
          <>
            <input type="hidden" name="action" value="otp" />
            <SubmitButton loadingText="جارٍ إرسال الرمز...">
              إرسال رمز التحقق ←
            </SubmitButton>
          </>
        )}

        {isOtpDisabled && (
          <>
            <input type="hidden" name="action" value="skip" />
            <SubmitButton loadingText="جارٍ تسجيل الدخول...">
              تسجيل الدخول ←
            </SubmitButton>
          </>
        )}

        {isOtpOptional && (
          <div className="auth-cta-group">
            <SubmitButton
              loadingText="جارٍ الإرسال..."
              variant="primary"
              name="action"
              value="otp"
            >
              <span aria-hidden="true">🔐</span>
              <span>إرسال رمز تحقق</span>
            </SubmitButton>
            <SubmitButton
              loadingText="جارٍ الدخول..."
              variant="secondary"
              name="action"
              value="skip"
            >
              <span aria-hidden="true">⚡</span>
              <span>دخول سريع (بدون رمز)</span>
            </SubmitButton>
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

      {/* ✨ V25.18: Biometric Login (يظهر فقط لو مُسجّل) */}
      <div style={{ marginTop: 16 }}>
        <BiometricLoginButton
          mode="login"
          onSuccess={() => {
            haptic.success();
            router.push('/dashboard');
          }}
        />
      </div>
    </main>
  );
}
