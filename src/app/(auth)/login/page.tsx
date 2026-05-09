'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendOtp } from './actions';

type Role = 'guest' | 'patient' | 'specialist';

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

        <button type="submit" className="auth-cta">
          إرسال رمز التحقق ←
        </button>
      </form>

      <div className="auth-helper">
        <p style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginTop: 16 }}>
          سيُرسل لك رمز ٦ أرقام للتحقق
        </p>
      </div>

      <div className="auth-helper" style={{ marginTop: '12px' }}>
        ليس لديك حساب؟ <Link href="/register">إنشاء حساب جديد</Link>
      </div>
    </main>
  );
}
