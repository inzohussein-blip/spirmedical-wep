'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  patientRegisterSchema,
  genderLabels,
  type PatientRegisterInput,
} from '@/lib/validations/auth-forms';

export default function PatientRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '' as PatientRegisterInput['gender'] | '',
    phone: '',
    password: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const result = patientRegisterSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      setSubmitting(false);
      return;
    }

    try {
      // Mock API call - استبدل بـ Server Action حقيقي
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // الانتقال لصفحة OTP للتحقق من الهاتف
      router.push(`/otp?phone=${encodeURIComponent(result.data.phone)}`);
    } catch (err) {
      setErrors({ submit: 'فشل إنشاء الحساب. حاول مرة أخرى.' });
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // مسح الخطأ عند التعديل
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  return (
    <main className="auth-screen">
      <Link href="/register" className="auth-back">
        <span>←</span>
        <span>العودة</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-role-badge">
        <span aria-hidden="true">⊕</span>
        <span>تسجيل كمراجع جديد</span>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">معلوماتك الأساسية</h2>
        <p className="auth-subtitle">
          سنحتاج هذه المعلومات لإنشاء حسابك. كلها إلزامية.
        </p>
      </div>

      {errors.submit && (
        <div className="auth-error" role="alert">
          <div className="auth-error-icon">!</div>
          <span>{errors.submit}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* الاسم الكامل */}
        <div className="auth-field">
          <label htmlFor="fullName" className="auth-field-label">
            الاسم الكامل
            <span className="auth-required">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            placeholder="مثال: أحمد محمد علي"
            autoComplete="name"
            required
            maxLength={50}
            className={`auth-input ${errors.fullName ? 'error' : ''}`}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            disabled={submitting}
          />
          {errors.fullName && (
            <span id="fullName-error" className="auth-field-error" role="alert">
              {errors.fullName}
            </span>
          )}
        </div>

        {/* الجنس */}
        <div className="auth-field">
          <label className="auth-field-label">
            الجنس
            <span className="auth-required">*</span>
          </label>
          <div
            className="radio-group"
            role="radiogroup"
            aria-required="true"
            aria-invalid={!!errors.gender}
            aria-describedby={errors.gender ? 'gender-error' : undefined}
          >
            {(['male', 'female', 'other'] as const).map((g) => (
              <label key={g} className={`radio-option ${formData.gender === g ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={formData.gender === g}
                  onChange={() => updateField('gender', g)}
                  disabled={submitting}
                />
                <span>{genderLabels[g]}</span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <span id="gender-error" className="auth-field-error" role="alert">
              {errors.gender}
            </span>
          )}
        </div>

        {/* رقم الهاتف */}
        <div className="auth-field">
          <label htmlFor="phone" className="auth-field-label">
            رقم الهاتف
            <span className="auth-required">*</span>
          </label>
          <div className={`auth-phone-wrap ${errors.phone ? 'error' : ''}`}>
            <div className="auth-phone-prefix">
              <span aria-hidden="true">🇮🇶</span>
              <span>+964</span>
            </div>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
              placeholder="7XX XXX XXXX"
              autoComplete="tel"
              required
              maxLength={11}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
              disabled={submitting}
            />
          </div>
          <div id="phone-hint" className="auth-field-hint">
            مثال: 07712345678 - سنرسل لك رمز تحقق برسالة نصية
          </div>
          {errors.phone && (
            <span id="phone-error" className="auth-field-error" role="alert">
              {errors.phone}
            </span>
          )}
        </div>

        {/* رمز الدخول */}
        <div className="auth-field">
          <label htmlFor="password" className="auth-field-label">
            رمز الدخول (PIN)
            <span className="auth-required">*</span>
          </label>
          <input
            id="password"
            type="password"
            inputMode="numeric"
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value.replace(/\D/g, ''))}
            placeholder="6 أرقام"
            autoComplete="new-password"
            required
            maxLength={6}
            className={`auth-input ${errors.password ? 'error' : ''}`}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : 'password-hint'}
            disabled={submitting}
          />
          <div id="password-hint" className="auth-field-hint">
            استخدم 6 أرقام تتذكّرها · لا تشاركها مع أحد
          </div>
          {errors.password && (
            <span id="password-error" className="auth-field-error" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        {/* الموافقة على الشروط */}
        <div className="auth-field">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => updateField('acceptTerms', e.target.checked)}
              disabled={submitting}
              aria-invalid={!!errors.acceptTerms}
            />
            <span className="checkbox-text">
              أوافق على{' '}
              <Link href="/legal/terms" target="_blank" className="auth-inline-link">
                الشروط والأحكام
              </Link>
              {' '}و{' '}
              <Link href="/legal/privacy" target="_blank" className="auth-inline-link">
                سياسة الخصوصية
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <span className="auth-field-error" role="alert">
              {errors.acceptTerms}
            </span>
          )}
        </div>

        <button type="submit" className="auth-cta" disabled={submitting}>
          {submitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب ←'}
        </button>
      </form>

      <div className="auth-helper">
        لديك حساب؟ <Link href="/login">تسجيل الدخول</Link>
      </div>
    </main>
  );
}
