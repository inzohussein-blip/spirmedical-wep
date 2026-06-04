'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  specialistRegisterSchema,
  specializationLabels,
  genderLabels,
  fileValidation,
  type SpecialistRegisterInput,
} from '@/lib/validations/auth-forms';
import { registerSpecialist } from '../actions';

type FormState = {
  fullName: string;
  gender: SpecialistRegisterInput['gender'] | '';
  phone: string;
  password: string;
  specialization: SpecialistRegisterInput['specialization'] | '';
  specializationDetails: string;
  idDocument: File | null;
  certificateDocument: File | null;
  profilePhoto: File | null;
  acceptTerms: boolean;
};

export default function SpecialistRegisterClient() {
  // OTP Mode (3 أوضاع)
  const otpMode = (process.env.NEXT_PUBLIC_OTP_MODE ?? 'disabled') as
    | 'disabled'
    | 'optional'
    | 'required';

  const isOtpRequired = otpMode === 'required';
  const isOtpOptional = otpMode === 'optional';
  const isOtpDisabled = otpMode === 'disabled';

  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    gender: '',
    phone: '',
    password: '',
    specialization: '',
    specializationDetails: '',
    idDocument: null,
    certificateDocument: null,
    profilePhoto: null,
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // التحقق من النموذج محلياً قبل الإرسال
  function validate(): boolean {
    setErrors({});

    const result = specialistRegisterSchema.safeParse(formData);
    const fieldErrors: Record<string, string> = {};

    if (!result.success) {
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
    }

    // التحقق من الملفات (للتسجيل الأول، الكل مطلوب)
    if (!formData.idDocument) {
      fieldErrors.idDocument = 'إثبات الشخصية مطلوب';
    } else {
      const v = fileValidation.validate(formData.idDocument);
      if (!v.valid) fieldErrors.idDocument = v.error!;
    }

    if (!formData.certificateDocument) {
      fieldErrors.certificateDocument = 'شهادة الاختصاص مطلوبة';
    } else {
      const v = fileValidation.validate(formData.certificateDocument);
      if (!v.valid) fieldErrors.certificateDocument = v.error!;
    }

    if (!formData.profilePhoto) {
      fieldErrors.profilePhoto = 'الصورة الشخصية مطلوبة';
    } else {
      const v = fileValidation.validate(formData.profilePhoto);
      if (!v.valid) fieldErrors.profilePhoto = v.error!;
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return false;
    }

    return true;
  }

  // إرسال للـ Server Action
  function handleSubmit(action: 'otp' | 'skip') {
    if (!validate()) return;

    const fd = new FormData();
    fd.set('fullName', formData.fullName);
    fd.set('gender', formData.gender);
    fd.set('phone', formData.phone);
    fd.set('password', formData.password);
    fd.set('specialization', formData.specialization);
    if (formData.specializationDetails) {
      fd.set('specializationDetails', formData.specializationDetails);
    }
    if (formData.acceptTerms) fd.set('acceptTerms', 'on');
    fd.set('action', action);

    // ملاحظة: الملفات لا تُرسل لـ Supabase Storage حالياً
    // (مرحلة لاحقة - الملفات تُحفظ مؤقتاً ثم تُرفع بعد التحقق من البريد)

    startTransition(() => {
      registerSpecialist(fd);
    });
  }

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const showOtherDetails = formData.specialization === 'other';

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

      <div className="auth-role-badge specialist">
        <span aria-hidden="true">⌬</span>
        <span>تسجيل أخصائي طبي</span>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">معلومات الأخصائي</h2>
        <p className="auth-subtitle">
          نحتاج معلومات إضافية للتحقّق من هويّتك واختصاصك. حسابك سيُراجع خلال 24 ساعة.
        </p>
      </div>

      {errors.submit && (
        <div className="auth-error" role="alert">
          <div className="auth-error-icon">!</div>
          <span>{errors.submit}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          // الافتراضي: دخول سريع (إلا في وضع required)
          handleSubmit(isOtpRequired ? 'otp' : 'skip');
        }}
        className="auth-form"
        noValidate
        encType="multipart/form-data"
      >
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
            placeholder="مثال: د. أحمد محمد"
            autoComplete="name"
            required
            maxLength={50}
            className={`auth-input ${errors.fullName ? 'error' : ''}`}
            aria-invalid={!!errors.fullName}
            disabled={isPending}
          />
          {errors.fullName && (
            <span className="auth-field-error" role="alert">
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
          <div className="radio-group" role="radiogroup">
            {(['male', 'female'] as const).map((g) => (
              <label
                key={g}
                className={`radio-option ${formData.gender === g ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={formData.gender === g}
                  onChange={() => updateField('gender', g)}
                  disabled={isPending}
                />
                <span>{genderLabels[g]}</span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <span className="auth-field-error" role="alert">
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
              onChange={(e) =>
                updateField('phone', e.target.value.replace(/\D/g, ''))
              }
              placeholder="7XX XXX XXXX"
              autoComplete="tel"
              required
              maxLength={11}
              disabled={isPending}
            />
          </div>
          <div className="auth-field-hint">مثال: 07712345678</div>
          {errors.phone && (
            <span className="auth-field-error" role="alert">
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
            onChange={(e) =>
              updateField('password', e.target.value.replace(/\D/g, ''))
            }
            placeholder="6 أرقام"
            autoComplete="new-password"
            required
            maxLength={6}
            className={`auth-input ${errors.password ? 'error' : ''}`}
            disabled={isPending}
          />
          <div className="auth-field-hint">
            6 أرقام تتذكّرها · لا تشاركها مع أحد
          </div>
          {errors.password && (
            <span className="auth-field-error" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        {/* الاختصاص */}
        <div className="auth-field">
          <label htmlFor="specialization" className="auth-field-label">
            الاختصاص
            <span className="auth-required">*</span>
          </label>
          <select
            id="specialization"
            value={formData.specialization}
            onChange={(e) =>
              updateField(
                'specialization',
                e.target.value as SpecialistRegisterInput['specialization']
              )
            }
            required
            className={`auth-input ${errors.specialization ? 'error' : ''}`}
            disabled={isPending}
          >
            <option value="">اختر الاختصاص</option>
            {(Object.keys(specializationLabels) as Array<
              keyof typeof specializationLabels
            >).map((key) => (
              <option key={key} value={key}>
                {specializationLabels[key]}
              </option>
            ))}
          </select>
          {errors.specialization && (
            <span className="auth-field-error" role="alert">
              {errors.specialization}
            </span>
          )}
        </div>

        {/* تفاصيل اختصاص أخرى (شرطي) */}
        {showOtherDetails && (
          <div className="auth-field">
            <label
              htmlFor="specializationDetails"
              className="auth-field-label"
            >
              اكتب اختصاصك
              <span className="auth-required">*</span>
            </label>
            <input
              id="specializationDetails"
              type="text"
              value={formData.specializationDetails}
              onChange={(e) =>
                updateField('specializationDetails', e.target.value)
              }
              placeholder="مثال: طب الأسرة"
              maxLength={100}
              className={`auth-input ${errors.specializationDetails ? 'error' : ''}`}
              disabled={isPending}
            />
            {errors.specializationDetails && (
              <span className="auth-field-error" role="alert">
                {errors.specializationDetails}
              </span>
            )}
          </div>
        )}

        {/* ملفات الإثبات */}
        <FileUploadField
          id="idDocument"
          label="إثبات الشخصية"
          hint="هوية الأحوال أو جواز السفر (PDF أو صورة)"
          file={formData.idDocument}
          onChange={(f) => updateField('idDocument', f)}
          error={errors.idDocument}
          disabled={isPending}
          icon="🪪"
        />

        <FileUploadField
          id="certificateDocument"
          label="شهادة الاختصاص"
          hint="شهادة الطب أو شهادة الاختصاص الطبي"
          file={formData.certificateDocument}
          onChange={(f) => updateField('certificateDocument', f)}
          error={errors.certificateDocument}
          disabled={isPending}
          icon="📜"
        />

        <FileUploadField
          id="profilePhoto"
          label="الصورة الشخصية"
          hint="صورة واضحة للوجه (للظهور للمراجعين)"
          file={formData.profilePhoto}
          onChange={(f) => updateField('profilePhoto', f)}
          error={errors.profilePhoto}
          disabled={isPending}
          icon="📷"
          accept="image/*"
        />

        {/* الموافقة على الشروط */}
        <div className="auth-field">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => updateField('acceptTerms', e.target.checked)}
              disabled={isPending}
            />
            <span className="checkbox-text">
              أوافق على{' '}
              <Link
                href="/legal/terms"
                target="_blank" rel="noopener noreferrer"
                className="auth-inline-link"
              >
                الشروط والأحكام
              </Link>
              {' '}و{' '}
              <Link
                href="/legal/privacy"
                target="_blank" rel="noopener noreferrer"
                className="auth-inline-link"
              >
                سياسة الخصوصية
              </Link>
              {' '}وأقرّ بصحة المعلومات المُقدّمة
            </span>
          </label>
          {errors.acceptTerms && (
            <span className="auth-field-error" role="alert">
              {errors.acceptTerms}
            </span>
          )}
        </div>

        {/* ─── الأزرار حسب OTP Mode ─── */}

        {isOtpRequired && (
          <button type="submit" className="auth-cta" disabled={isPending}>
            {isPending ? 'جاري الإرسال...' : 'إنشاء حساب وإرسال رمز ←'}
          </button>
        )}

        {isOtpDisabled && (
          <button type="submit" className="auth-cta" disabled={isPending}>
            {isPending ? 'جاري إنشاء الحساب...' : 'إنشاء حساب أخصائي ←'}
          </button>
        )}

        {isOtpOptional && (
          <div className="auth-cta-group">
            <button
              type="button"
              onClick={() => handleSubmit('otp')}
              className="auth-cta auth-cta-primary"
              disabled={isPending}
            >
              <span aria-hidden="true">🔐</span>
              <span>{isPending ? 'جاري الإرسال...' : 'إنشاء + رمز تحقق'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('skip')}
              className="auth-cta auth-cta-secondary"
              disabled={isPending}
            >
              <span aria-hidden="true">⚡</span>
              <span>{isPending ? 'جاري الإنشاء...' : 'إنشاء سريع (بدون رمز)'}</span>
            </button>
          </div>
        )}
      </form>

      {/* ملاحظة عن الملفات */}
      <div className="auth-footer-note">
        ℹ️ سيتم رفع ملفات الإثبات بعد إنشاء الحساب.
        <br />
        حسابك سيظهر للمراجعين بعد المراجعة (24-48 ساعة).
      </div>

      <div className="auth-helper">
        لديك حساب؟ <Link href="/login?role=specialist">تسجيل الدخول</Link>
      </div>
    </main>
  );
}

// ============================================================
// مكوّن رفع الملفات (قابل لإعادة الاستخدام)
// ============================================================
function FileUploadField({
  id,
  label,
  hint,
  file,
  onChange,
  error,
  disabled,
  icon,
  accept = 'image/*,.pdf',
}: {
  id: string;
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  icon: string;
  accept?: string;
}) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-field-label">
        {label}
        <span className="auth-required">*</span>
      </label>

      <label
        htmlFor={id}
        className={`file-upload ${error ? 'error' : ''} ${file ? 'has-file' : ''}`}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          disabled={disabled}
          className="file-upload-input"
          aria-describedby={`${id}-hint ${error ? `${id}-error` : ''}`}
        />
        <div className="file-upload-icon">{icon}</div>
        <div className="file-upload-content">
          <div className="file-upload-title">
            {file ? file.name : 'اضغط لاختيار ملف'}
          </div>
          {file ? (
            <div className="file-upload-meta">
              {(file.size / 1024 / 1024).toFixed(2)} MB ·{' '}
              {file.type.split('/')[1]?.toUpperCase()}
            </div>
          ) : (
            <div className="file-upload-meta" id={`${id}-hint`}>
              {hint}
            </div>
          )}
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onChange(null);
            }}
            className="file-upload-remove"
            aria-label="حذف الملف"
            disabled={disabled}
          >
            ×
          </button>
        )}
      </label>

      {error && (
        <span id={`${id}-error`} className="auth-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
