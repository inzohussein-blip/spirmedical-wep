'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import {
  specialistRegisterSchema,
  specializationLabels,
  genderLabels,
  type SpecialistRegisterInput,
} from '@/lib/validations/auth-forms';
import { prepareUpload } from '@/lib/forms/prepare-upload';
import { registerSpecialistForm } from '../actions';
import { readOtpMode } from '@/lib/auth/otp-mode';

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

type FileField = 'idDocument' | 'certificateDocument' | 'profilePhoto';

/** صورةُ الكاميرا الخام قد تبلغ 10MB+؛ تُصغَّر قبل الإرسال، فالسقفُ هنا للمعقول فقط. */
const RAW_FILE_MAX = 25 * 1024 * 1024;

/**
 * 🩺 تسجيلُ المختصّ — أربعةُ أقسامٍ مرقّمة، والهويّةُ وحدها مطلوبة (قرار المالك).
 *
 * كان النموذجُ يطلب ثلاثَ وثائق ثمّ يُهملها (لا رفعَ أصلاً)، ولا يعرض أخطاءَ الخادم:
 * الإجراءُ يعيد التوجيه بـ`?error=` والصفحةُ لا تقرؤه، فيضغط المختصُّ ولا يحدث شيء.
 * والآن شاشةُ تحميلٍ تغطّي التجهيزَ والإرسال، فلا يضغط مرّتين ولا يظنّ أنّ الزرّ معطّل.
 */
export default function SpecialistRegisterClient({ initialError }: { initialError?: string }) {
  // OTP Mode (3 أوضاع) — من المصدر الموحّد لا بقراءة env مباشرةً
  const otpMode = readOtpMode();

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
  const [preparing, setPreparing] = useState(false);
  const busy = preparing || isPending;
  const errorRef = useRef<HTMLDivElement>(null);

  // خطأُ الخادم (رقمٌ مسجّل، رمزٌ ضعيف…) يصل في الرابط — يُعرض أعلى النموذج ويُمرَّر إليه.
  const submitError = busy ? null : errors.submit ?? initialError ?? null;
  useEffect(() => {
    if (submitError) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [submitError]);

  // التحقق من النموذج محلياً قبل الإرسال
  function validate(): boolean {
    const result = specialistRegisterSchema.safeParse(formData);
    const fieldErrors: Record<string, string> = {};

    if (!result.success) {
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
    }

    // الهويّة وحدها مطلوبة؛ الشهادةُ والصورة اختياريّتان
    if (!formData.idDocument) fieldErrors.idDocument = 'إثبات الشخصية مطلوب';
    for (const f of ['idDocument', 'certificateDocument', 'profilePhoto'] as const) {
      const file = formData[f];
      if (file && file.size > RAW_FILE_MAX) fieldErrors[f] = 'الملفّ كبير جداً';
    }

    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      const first = document.getElementById(Object.keys(fieldErrors)[0]);
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  // إرسال للـ Server Action
  async function handleSubmit(action: 'otp' | 'skip') {
    if (busy || !validate()) return;

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

    // تصغيرُ الصور قبل الإرسال: حدُّ جسم الطلب 4.5MB
    setPreparing(true);
    const fileErrors: Record<string, string> = {};
    for (const f of ['idDocument', 'certificateDocument', 'profilePhoto'] as const) {
      const file = formData[f];
      if (!file) continue;
      const prepared = await prepareUpload(file);
      if ('error' in prepared) fileErrors[f] = prepared.error;
      else fd.set(f, prepared.file);
    }
    setPreparing(false);
    if (Object.keys(fileErrors).length > 0) {
      setErrors(fileErrors);
      return;
    }

    startTransition(async () => {
      // النجاحُ يوجّه من الخادم؛ والخطأُ يعود قيمةً فتبقى الحقولُ والوثائق كما هي.
      const result = await registerSpecialistForm(fd);
      if (result?.error) setErrors({ submit: result.error });
    });
  }

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string] || errors.submit) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        delete next.submit;
        return next;
      });
    }
  };

  const showOtherDetails = formData.specialization === 'other';
  const optionalCount = (formData.certificateDocument ? 1 : 0) + (formData.profilePhoto ? 1 : 0);

  return (
    <main className="auth-screen">
      {busy && <SubmittingOverlay preparing={preparing} />}

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
        <h2 className="auth-title">انضمّ إلى سباير</h2>
        <p className="auth-subtitle">
          أربع خطواتٍ قصيرة. لا نطلب الآن إلّا إثباتَ الشخصية، وحسابك يُراجع خلال 24–48 ساعة.
        </p>
      </div>

      {submitError && (
        <div className="auth-error" role="alert" ref={errorRef}>
          <div className="auth-error-icon">!</div>
          <span>{submitError}</span>
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
        aria-busy={busy}
      >
        {/* ─── 1. بياناتك ─── */}
        <fieldset className="spreg-section" disabled={busy}>
          <legend className="spreg-section-head">
            <span className="spreg-step" aria-hidden="true">1</span>
            <span>بياناتك</span>
          </legend>

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
            />
            {errors.fullName && (
              <span className="auth-field-error" role="alert">{errors.fullName}</span>
            )}
          </div>

          <div className="auth-field" id="gender">
            <span className="auth-field-label">
              الجنس
              <span className="auth-required">*</span>
            </span>
            <div className="radio-group" role="radiogroup" aria-label="الجنس">
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
                  />
                  <span>{genderLabels[g]}</span>
                </label>
              ))}
            </div>
            {errors.gender && (
              <span className="auth-field-error" role="alert">{errors.gender}</span>
            )}
          </div>
        </fieldset>

        {/* ─── 2. الدخول ─── */}
        <fieldset className="spreg-section" disabled={busy}>
          <legend className="spreg-section-head">
            <span className="spreg-step" aria-hidden="true">2</span>
            <span>بيانات الدخول</span>
          </legend>

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
              />
            </div>
            <div className="auth-field-hint">مثال: 07712345678</div>
            {errors.phone && (
              <span className="auth-field-error" role="alert">{errors.phone}</span>
            )}
          </div>

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
            />
            <div className="auth-field-hint">6 أرقام تتذكّرها · تدخل بها مع رقمك · لا تشاركها مع أحد</div>
            {errors.password && (
              <span className="auth-field-error" role="alert">{errors.password}</span>
            )}
          </div>
        </fieldset>

        {/* ─── 3. الاختصاص ─── */}
        <fieldset className="spreg-section" disabled={busy}>
          <legend className="spreg-section-head">
            <span className="spreg-step" aria-hidden="true">3</span>
            <span>اختصاصك</span>
          </legend>

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
            >
              <option value="">اختر الاختصاص</option>
              {(Object.keys(specializationLabels) as Array<keyof typeof specializationLabels>).map((key) => (
                <option key={key} value={key}>
                  {specializationLabels[key]}
                </option>
              ))}
            </select>
            {errors.specialization && (
              <span className="auth-field-error" role="alert">{errors.specialization}</span>
            )}
          </div>

          {showOtherDetails && (
            <div className="auth-field">
              <label htmlFor="specializationDetails" className="auth-field-label">
                اكتب اختصاصك
                <span className="auth-required">*</span>
              </label>
              <input
                id="specializationDetails"
                type="text"
                value={formData.specializationDetails}
                onChange={(e) => updateField('specializationDetails', e.target.value)}
                placeholder="مثال: طب الأسرة"
                maxLength={100}
                className={`auth-input ${errors.specializationDetails ? 'error' : ''}`}
              />
              {errors.specializationDetails && (
                <span className="auth-field-error" role="alert">{errors.specializationDetails}</span>
              )}
            </div>
          )}
        </fieldset>

        {/* ─── 4. الوثائق ─── */}
        <fieldset className="spreg-section" disabled={busy}>
          <legend className="spreg-section-head">
            <span className="spreg-step" aria-hidden="true">4</span>
            <span>إثبات الشخصية</span>
          </legend>

          <FileUploadField
            id="idDocument"
            label="الهوية أو جواز السفر"
            hint="صورة واضحة للوجهين أو ملف PDF"
            file={formData.idDocument}
            onChange={(f) => updateField('idDocument', f)}
            error={errors.idDocument}
            icon="🪪"
            required
          />

          <details className="spreg-optional" open={optionalCount > 0 || !!errors.certificateDocument || !!errors.profilePhoto}>
            <summary>
              <span>وثائق إضافية</span>
              <span className="spreg-optional-badge">اختياري</span>
            </summary>
            <p className="spreg-optional-hint">
              تُسرّع المراجعة، ويمكنك إرسالها لاحقاً عند طلبها.
            </p>
            <FileUploadField
              id="certificateDocument"
              label="شهادة الاختصاص"
              hint="شهادة الطب أو الاختصاص أو إجازة المزاولة"
              file={formData.certificateDocument}
              onChange={(f) => updateField('certificateDocument', f)}
              error={errors.certificateDocument}
              icon="📜"
            />
            <FileUploadField
              id="profilePhoto"
              label="الصورة الشخصية"
              hint="صورة واضحة للوجه"
              file={formData.profilePhoto}
              onChange={(f) => updateField('profilePhoto', f)}
              error={errors.profilePhoto}
              icon="📷"
              accept="image/*"
            />
          </details>
        </fieldset>

        {/* الموافقة على الشروط */}
        <div className="auth-field" id="acceptTerms">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => updateField('acceptTerms', e.target.checked)}
              disabled={busy}
            />
            <span className="checkbox-text">
              أوافق على{' '}
              <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="auth-inline-link">
                الشروط والأحكام
              </Link>
              {' '}و{' '}
              <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="auth-inline-link">
                سياسة الخصوصية
              </Link>
              {' '}وأقرّ بصحة المعلومات المُقدّمة
            </span>
          </label>
          {errors.acceptTerms && (
            <span className="auth-field-error" role="alert">{errors.acceptTerms}</span>
          )}
        </div>

        {/* ─── الأزرار حسب OTP Mode ─── */}

        {isOtpRequired && (
          <button type="submit" className="auth-cta" disabled={busy}>
            إنشاء حساب وإرسال رمز ←
          </button>
        )}

        {isOtpDisabled && (
          <button type="submit" className="auth-cta" disabled={busy}>
            إنشاء حساب أخصائي ←
          </button>
        )}

        {isOtpOptional && (
          <div className="auth-cta-group">
            <button
              type="button"
              onClick={() => handleSubmit('otp')}
              className="auth-cta auth-cta-primary"
              disabled={busy}
            >
              <span aria-hidden="true">🔐</span>
              <span>إنشاء + رمز تحقق</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('skip')}
              className="auth-cta auth-cta-secondary"
              disabled={busy}
            >
              <span aria-hidden="true">⚡</span>
              <span>إنشاء سريع (بدون رمز)</span>
            </button>
          </div>
        )}
      </form>

      <div className="auth-footer-note">
        🔒 وثائقك تُحفظ في مساحةٍ خاصّة لا يراها إلّا فريقُ المراجعة.
        <br />
        يظهر حسابك للمرضى بعد اعتماده (24–48 ساعة).
      </div>

      <div className="auth-helper">
        لديك حساب؟ <Link href="/login?role=specialist">تسجيل الدخول</Link>
      </div>
    </main>
  );
}

// ============================================================
// شاشةُ التحميل — تغطّي تجهيزَ الوثائق ثمّ إنشاءَ الحساب
// ============================================================
function SubmittingOverlay({ preparing }: { preparing: boolean }) {
  return (
    <div className="spreg-overlay" role="status" aria-live="polite">
      <div className="spreg-overlay-card">
        <div className="spreg-spinner" aria-hidden="true" />
        <div className="spreg-overlay-title">
          {preparing ? 'نجهّز وثائقك…' : 'ننشئ حسابك…'}
        </div>
        <ol className="spreg-overlay-steps">
          <li className={preparing ? 'active' : 'done'}>تجهيز الوثائق</li>
          <li className={preparing ? '' : 'active'}>رفعُها وإنشاء الحساب</li>
        </ol>
        <div className="spreg-overlay-hint">لا تغلق الصفحة — يستغرق ذلك ثوانيَ قليلة.</div>
      </div>
    </div>
  );
}

// ============================================================
// مكوّن رفع الملفات
// ============================================================
function FileUploadField({
  id,
  label,
  hint,
  file,
  onChange,
  error,
  icon,
  required = false,
  accept = 'image/*,.pdf',
}: {
  id: FileField;
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  icon: string;
  required?: boolean;
  accept?: string;
}) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-field-label">
        {label}
        {required ? <span className="auth-required">*</span> : null}
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
          className="file-upload-input"
          aria-describedby={`${id}-hint ${error ? `${id}-error` : ''}`}
          aria-invalid={!!error}
        />
        <div className="file-upload-icon" aria-hidden="true">{icon}</div>
        <div className="file-upload-content">
          <div className="file-upload-title">
            {file ? file.name : 'اضغط لاختيار ملف أو التقاط صورة'}
          </div>
          <div className="file-upload-meta" id={`${id}-hint`}>
            {file
              ? `${(file.size / 1024 / 1024).toFixed(1)} MB${file.type.startsWith('image/') ? ' · تُصغَّر تلقائياً' : ''}`
              : hint}
          </div>
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onChange(null);
            }}
            className="file-upload-remove"
            aria-label={`حذف ${label}`}
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
