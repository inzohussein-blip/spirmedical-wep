'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { registerProviderForm } from '../actions';
import { readOtpMode } from '@/lib/auth/otp-mode';
import { Icon } from '@/components/admin-ui';
import { PROVIDER_META, PROVIDER_TYPES, isProviderType, type ProviderType } from '@/lib/providers';

/**
 * 🏥 تسجيلُ «خدمة» (0060): المنشأةُ تختار نوعَها — مختبر، صيدلية، عيادة، مستشفى — ثمّ اسمَها ومدينتَها
 * ورقمَ المسؤول ورمزَ الدخول. يبدأ الحسابُ قيدَ المراجعة. أخطاءُ الخادم تعود قيمةً فلا يُمحى النموذج.
 */
export default function ProviderRegisterClient({ initialError, initialType }: { initialError?: string; initialType?: string }) {
  const otpRequired = readOtpMode() === 'required';
  const [type, setType] = useState<ProviderType | ''>(isProviderType(initialType) ? initialType : '');
  const [v, setV] = useState({ facilityName: '', fullName: '', city: '', governorate: '', phone: '', password: '' });
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, start] = useTransition();
  const meta = type ? PROVIDER_META[type] : null;

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV({ ...v, [k]: k === 'phone' || k === 'password' ? e.target.value.replace(/\D/g, '') : e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return setError('اختر نوعَ الخدمة');
    if (v.facilityName.trim().length < 2) return setError(`اكتب ${meta?.nameLabel ?? 'اسمَ المنشأة'}`);
    if (v.fullName.trim().length < 2) return setError('اكتب اسمَ المسؤول');
    if (!v.city.trim() && !v.governorate.trim()) return setError('حدّد المدينة أو المحافظة');
    // الفحصُ الكامل (المكرَّر والمتتالي) على الخادم — `loginPinProblem` في `guardPinRegistration`
    if (!otpRequired && !/^\d{6}$/.test(v.password)) return setError('رمز الدخول 6 أرقام');
    if (!terms) return setError('يجب الموافقة على الشروط والأحكام');
    setError(null);
    const fd = new FormData();
    fd.set('providerType', type);
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    fd.set('acceptTerms', 'on');
    fd.set('action', otpRequired ? 'otp' : 'skip');
    start(async () => {
      const r = await registerProviderForm(fd);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <main className="auth-screen">
      <Link href="/register" className="auth-back">
        <span>←</span>
        <span>العودة</span>
      </Link>

      <div className="auth-title-section">
        <h1 className="auth-title">سجّل منشأتك</h1>
        <p className="auth-subtitle">اختر ما تقدّمه. يُراجَع الحسابُ من الإدارة قبل أن يظهر للمرضى.</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="auth-form" noValidate aria-busy={pending}>
        <fieldset className="spreg-section" disabled={pending}>
          <legend className="spreg-section-head">
            <span className="spreg-step" aria-hidden="true">1</span>
            <span>نوعُ الخدمة</span>
          </legend>
          <div className="pr-types" role="radiogroup" aria-label="نوع الخدمة">
            {PROVIDER_TYPES.map((t) => (
              <label key={t} className={`pr-type ${type === t ? 'pr-type-on' : ''}`}>
                <input type="radio" name="providerType" value={t} checked={type === t} onChange={() => setType(t)} />
                <span className="pr-type-icon" aria-hidden="true"><Icon name={PROVIDER_META[t].icon} size={22} /></span>
                <span className="pr-type-text">
                  <span className="pr-type-title">{PROVIDER_META[t].label}</span>
                  <span className="pr-type-desc">{PROVIDER_META[t].description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="spreg-section" disabled={pending}>
          <legend className="spreg-section-head">
            <span className="spreg-step" aria-hidden="true">2</span>
            <span>المنشأة</span>
          </legend>
          <div className="auth-field">
            <label htmlFor="facilityName" className="auth-field-label">{meta?.nameLabel ?? 'اسمُ المنشأة'}<span className="auth-required">*</span></label>
            <input id="facilityName" className="auth-input" value={v.facilityName} onChange={set('facilityName')} maxLength={80} />
          </div>
          <div className="auth-field">
            <label htmlFor="city" className="auth-field-label">المدينة</label>
            <input id="city" className="auth-input" value={v.city} onChange={set('city')} maxLength={40} placeholder="مثال: النجف" />
          </div>
          <div className="auth-field">
            <label htmlFor="governorate" className="auth-field-label">المحافظة</label>
            <input id="governorate" className="auth-input" value={v.governorate} onChange={set('governorate')} maxLength={40} />
          </div>
        </fieldset>

        <fieldset className="spreg-section" disabled={pending}>
          <legend className="spreg-section-head">
            <span className="spreg-step" aria-hidden="true">3</span>
            <span>المسؤول والدخول</span>
          </legend>
          <div className="auth-field">
            <label htmlFor="fullName" className="auth-field-label">اسمُ المسؤول<span className="auth-required">*</span></label>
            <input id="fullName" className="auth-input" value={v.fullName} onChange={set('fullName')} maxLength={80} autoComplete="name" />
          </div>
          <div className="auth-field">
            <label htmlFor="phone" className="auth-field-label">رقم الهاتف<span className="auth-required">*</span></label>
            <div className="auth-phone-wrap">
              <div className="auth-phone-prefix"><span>+964</span></div>
              <input id="phone" type="tel" inputMode="numeric" value={v.phone} onChange={set('phone')} placeholder="7XX XXX XXXX" autoComplete="tel" maxLength={11} />
            </div>
          </div>
          {!otpRequired && (
            <div className="auth-field">
              <label htmlFor="password" className="auth-field-label">رمز الدخول (6 أرقام)<span className="auth-required">*</span></label>
              <input id="password" type="password" inputMode="numeric" className="auth-input" value={v.password} onChange={set('password')} maxLength={6} autoComplete="new-password" />
              <div className="auth-field-hint">تدخل به مع رقمك. لا تستعمل 123456 أو رقماً مكرّراً.</div>
            </div>
          )}
          <label className="pr-terms">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>أوافق على <Link href="/legal/terms" className="auth-inline-link">الشروط والأحكام</Link></span>
          </label>
        </fieldset>

        <button type="submit" className="auth-cta auth-cta-primary" disabled={pending}>
          {pending ? 'جارٍ إنشاء الحساب…' : 'إنشاء حساب الخدمة'}
        </button>
      </form>

      <div className="auth-helper">
        فردٌ يسحب الدم أو ممرّض؟ <Link href="/register/specialist" className="auth-inline-link">سجّل كمختصّ</Link>
      </div>
    </main>
  );
}
