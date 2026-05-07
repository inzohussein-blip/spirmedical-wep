'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSchema } from '@/lib/validations/auth-forms';

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

  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    accountNumber?: string;
    password?: string;
    submit?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    // Validate
    const result = loginSchema.safeParse({ accountNumber, password });

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      setSubmitting(false);
      return;
    }

    // Mock API call - في الإنتاج، استبدل بـ Server Action حقيقي
    try {
      // محاكاة استجابة API
      await new Promise((resolve) => setTimeout(resolve, 800));

      // النجاح: انتقل للـ dashboard
      router.push('/dashboard');
    } catch (err) {
      setErrors({ submit: 'فشل تسجيل الدخول. حاول مرة أخرى.' });
      setSubmitting(false);
    }
  };

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

      {/* Role hint badge */}
      <div className={`auth-role-badge ${role === 'specialist' ? 'specialist' : ''}`}>
        <span aria-hidden="true">{roleInfo.icon}</span>
        <span>{roleInfo.label}</span>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">تسجيل الدخول</h2>
        <p className="auth-subtitle">{roleInfo.hint}</p>
      </div>

      {/* Role selector tabs */}
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

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Submit error */}
        {errors.submit && (
          <div className="auth-error" role="alert">
            <div className="auth-error-icon">!</div>
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Account Number Field */}
        <div className="auth-field">
          <label htmlFor="account-number" className="auth-field-label">
            رقم الحساب
            <span className="auth-required" aria-label="إلزامي">*</span>
          </label>
          <input
            id="account-number"
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="مثال: 123456789"
            autoComplete="username"
            autoFocus
            required
            maxLength={12}
            className={`auth-input ${errors.accountNumber ? 'error' : ''}`}
            aria-invalid={!!errors.accountNumber}
            aria-describedby={errors.accountNumber ? 'account-error' : undefined}
            disabled={submitting}
          />
          {errors.accountNumber && (
            <span id="account-error" className="auth-field-error" role="alert">
              {errors.accountNumber}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className="auth-field">
          <label htmlFor="password" className="auth-field-label">
            الرمز السري
            <span className="auth-required" aria-label="إلزامي">*</span>
          </label>
          <input
            id="password"
            type="password"
            inputMode="numeric"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
            placeholder="6 أرقام"
            autoComplete="current-password"
            required
            maxLength={6}
            className={`auth-input ${errors.password ? 'error' : ''}`}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            disabled={submitting}
          />
          {errors.password && (
            <span id="password-error" className="auth-field-error" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        <button type="submit" className="auth-cta" disabled={submitting}>
          {submitting ? 'جاري الدخول...' : 'تسجيل الدخول ←'}
        </button>
      </form>

      <div className="auth-helper">
        <Link href="/forgot">نسيت الرمز؟</Link>
      </div>

      <div className="auth-helper" style={{ marginTop: '8px' }}>
        ليس لديك حساب؟ <Link href="/register">إنشاء حساب جديد</Link>
      </div>
    </main>
  );
}
