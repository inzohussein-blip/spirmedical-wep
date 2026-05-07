'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  specialistRegisterSchema,
  specializationLabels,
  genderLabels,
  fileValidation,
  type SpecialistRegisterInput,
} from '@/lib/validations/auth-forms';

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

export default function SpecialistRegisterPage() {
  const router = useRouter();

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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    // التحقق من الملفات (للإنشاء الأول، الكل مطلوب رغم أنه opt)
    const fileErrors: Record<string, string> = {};

    if (!formData.idDocument) {
      fileErrors.idDocument = 'إثبات الشخصية مطلوب عند التسجيل الأول';
    } else {
      const v = fileValidation.validate(formData.idDocument);
      if (!v.valid) fileErrors.idDocument = v.error!;
    }

    if (!formData.certificateDocument) {
      fileErrors.certificateDocument = 'شهادة الاختصاص مطلوبة عند التسجيل الأول';
    } else {
      const v = fileValidation.validate(formData.certificateDocument);
      if (!v.valid) fileErrors.certificateDocument = v.error!;
    }

    if (!formData.profilePhoto) {
      fileErrors.profilePhoto = 'الصورة الشخصية مطلوبة عند التسجيل الأول';
    } else {
      const v = fileValidation.validate(formData.profilePhoto);
      if (!v.valid) fileErrors.profilePhoto = v.error!;
    }

    if (Object.keys(fileErrors).length > 0) {
      setErrors(fileErrors);
      setSubmitting(false);
      return;
    }

    // التحقق من باقي الحقول
    const result = specialistRegisterSchema.safeParse(formData);

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
      // Mock API - استبدل بـ FormData حقيقي للـ Server Action
      await new Promise((resolve) => setTimeout(resolve, 1200));
      router.push(`/otp?phone=${encodeURIComponent(result.data.phone)}`);
    } catch (err) {
      setErrors({ submit: 'فشل إنشاء الحساب. حاول مرة أخرى.' });
      setSubmitting(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="auth-form" noValidate encType="multipart/form-data">
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
            disabled={submitting}
          />
          {errors.fullName && (
            <span className="auth-field-error" role="alert">{errors.fullName}</span>
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
              disabled={submitting}
            />
          </div>
          {errors.phone && (
            <span className="auth-field-error" role="alert">{errors.phone}</span>
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
            disabled={submitting}
          />
          {errors.password && (
            <span className="auth-field-error" role="alert">{errors.password}</span>
          )}
        </div>

        {/* الجنس */}
        <div className="auth-field">
          <label className="auth-field-label">
            الجنس
            <span className="auth-required">*</span>
          </label>
          <div className="radio-group" role="radiogroup">
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
            <span className="auth-field-error" role="alert">{errors.gender}</span>
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
              updateField('specialization', e.target.value as SpecialistRegisterInput['specialization'])
            }
            required
            className={`auth-input ${errors.specialization ? 'error' : ''}`}
            aria-invalid={!!errors.specialization}
            disabled={submitting}
          >
            <option value="">— اختر اختصاصك —</option>
            {Object.entries(specializationLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {errors.specialization && (
            <span className="auth-field-error" role="alert">{errors.specialization}</span>
          )}
        </div>

        {/* تفصيلات الاختصاص (يظهر فقط لـ "other") */}
        {showOtherDetails && (
          <div className="auth-field">
            <label htmlFor="specializationDetails" className="auth-field-label">
              تفصيلات الاختصاص
              <span className="auth-required">*</span>
            </label>
            <input
              id="specializationDetails"
              type="text"
              value={formData.specializationDetails}
              onChange={(e) => updateField('specializationDetails', e.target.value)}
              placeholder="مثال: أخصائي تخدير"
              required
              maxLength={100}
              className={`auth-input ${errors.specializationDetails ? 'error' : ''}`}
              aria-invalid={!!errors.specializationDetails}
              disabled={submitting}
            />
            {errors.specializationDetails && (
              <span className="auth-field-error" role="alert">{errors.specializationDetails}</span>
            )}
          </div>
        )}

        {/* قسم رفع الملفات */}
        <div className="auth-field-section">
          <h3 className="auth-section-title">المستندات المطلوبة</h3>
          <p className="auth-section-hint">
            ✓ مطلوبة عند التسجيل الأول · JPG / PNG / PDF · الحد الأقصى 5 MB لكل ملف
          </p>
        </div>

        {/* إثبات الشخصية */}
        <FileUploadField
          id="idDocument"
          label="إثبات الشخصية"
          hint="هوية الأحوال المدنية أو جواز السفر"
          file={formData.idDocument}
          onChange={(f) => updateField('idDocument', f)}
          error={errors.idDocument}
          disabled={submitting}
          icon="🪪"
        />

        {/* شهادة الاختصاص */}
        <FileUploadField
          id="certificateDocument"
          label="شهادة الاختصاص"
          hint="شهادة من نقابة الأطباء أو ما يعادلها"
          file={formData.certificateDocument}
          onChange={(f) => updateField('certificateDocument', f)}
          error={errors.certificateDocument}
          disabled={submitting}
          icon="📜"
        />

        {/* الصورة الشخصية */}
        <FileUploadField
          id="profilePhoto"
          label="الصورة الشخصية"
          hint="صورة واضحة للوجه (للظهور للمراجعين)"
          file={formData.profilePhoto}
          onChange={(f) => updateField('profilePhoto', f)}
          error={errors.profilePhoto}
          disabled={submitting}
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
              disabled={submitting}
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
              {' '}وأقرّ بصحة المعلومات المُقدّمة
            </span>
          </label>
          {errors.acceptTerms && (
            <span className="auth-field-error" role="alert">{errors.acceptTerms}</span>
          )}
        </div>

        <button type="submit" className="auth-cta" disabled={submitting}>
          {submitting ? 'جاري إنشاء الحساب...' : 'إنشاء حساب أخصائي ←'}
        </button>
      </form>

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

      <label htmlFor={id} className={`file-upload ${error ? 'error' : ''} ${file ? 'has-file' : ''}`}>
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
              {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type.split('/')[1]?.toUpperCase()}
            </div>
          ) : (
            <div className="file-upload-meta" id={`${id}-hint`}>{hint}</div>
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
        <span id={`${id}-error`} className="auth-field-error" role="alert">{error}</span>
      )}
    </div>
  );
}
