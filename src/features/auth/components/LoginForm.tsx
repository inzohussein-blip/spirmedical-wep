'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 LoginForm Component
 * ═══════════════════════════════════════════════════════════════
 *
 * Form مُبسَّط — يستخدم hooks من features/auth/hooks
 * ويستدعي Server Actions من features/auth/actions.
 *
 * مميزات:
 *   - تقسيم المسؤوليات (UI / state / logic)
 *   - سهل الاختبار
 *   - قابل لإعادة الاستخدام في /login, /login/phone, إلخ
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Zap,
  Loader2,
  ArrowRight,
  Lock,
  Sparkles,
} from 'lucide-react';
import { haptic } from '@/lib/haptic';
import BiometricLoginButton from '@/components/pwa/BiometricLoginButton';
import { useAuthForm } from '../hooks/useAuthForm';
import { useOtpModeHelpers } from '../hooks/useOtpModeHelpers';
import { useFormStatus, useFormState } from 'react-dom';
import { ROLE_INFO, PUBLIC_ROLES } from '../lib/role-info';
import { getOtpError } from '../lib/error-codes';
import { sendOtp } from '../actions/login';
import { PhoneInput } from './PhoneInput';
import { SubmitButton } from './SubmitButton';
import { OtpSkipDialog } from './OtpSkipDialog';
import { RoleSelector } from './RoleSelector';
import { StepIndicator } from './StepIndicator';
import { ErrorBanner } from './ErrorBanner';

export function LoginForm() {
  const router = useRouter();
  const skipFormRef = useRef<HTMLFormElement>(null);

  const {
    role,
    redirectTo,
    errorParam,
    errorCode,
    otpMode,
    phone,
    remember,
    skipDialogOpen,
    openSkipDialog,
    closeSkipDialog,
  } = useAuthForm('patient');

  const { requiresOtp, allowsOtp, allowsSkip } = useOtpModeHelpers(otpMode);

  const roleMeta = ROLE_INFO[role];
  const errorInfo = getOtpError(errorCode);

  return (
    <main className="auth-screen auth-screen--v2">
      <Link href="/gate" className="auth-back">
        <ArrowRight size={16} />
        <span>العودة</span>
      </Link>

      <header className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </header>

      <StepIndicator otpDisabled={otpMode === 'disabled'} />

      <div className={`auth-role-badge ${role === 'specialist' ? 'specialist' : ''}`}>
        <span aria-hidden="true">{roleMeta.label}</span>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">تسجيل الدخول</h2>
        <p className="auth-subtitle">{roleMeta.hint}</p>
      </div>

      <RoleSelector currentRole={role} publicRoles={PUBLIC_ROLES} />

      <form
        action={sendOtp}
        className="auth-form"
        noValidate
        onSubmit={(e) => {
          if (!phone.validateManually()) {
            e.preventDefault();
            haptic.error();
            return;
          }
          // حقن الرقم كاملاً
          const input = e.currentTarget.elements.namedItem('phone') as HTMLInputElement | null;
          if (input) input.value = phone.fullPhoneE164;
          haptic.medium();
        }}
      >
        {redirectTo && (
          <input type="hidden" name="redirect" value={redirectTo} />
        )}

        {errorParam && <ErrorBanner message={errorParam} code={errorInfo?.code} hint={errorInfo?.hint} />}

        <fieldset className="auth-fieldset">
          <PhoneInput
            value={phone.phone}
            country={phone.country}
            onCountryChange={phone.setCountry}
            onChange={phone.setPhone}
            error={phone.phoneError}
            valid={phone.phoneValid}
            autoFocus
          />

          <label className={`auth-checkbox ${remember.rememberMe ? 'is-checked' : ''}`}>
            <input
              type="checkbox"
              checked={remember.rememberMe}
              onChange={(e) => remember.setRememberMe(e.target.checked)}
              className="auth-checkbox-input"
            />
            <span className="auth-checkbox-box" aria-hidden="true">
              {remember.rememberMe && <CheckIcon />}
            </span>
            <div className="auth-checkbox-body">
              <div className="auth-checkbox-title">تذكّر رقمي</div>
              <div className="auth-checkbox-sub">سيُحفظ رقمك على هذا الجهاز فقط</div>
            </div>
          </label>
        </fieldset>

        {/* ─── Submit Buttons حسب OTP Mode ─── */}
        {requiresOtp && (
          <>
            <input type="hidden" name="action" value="otp" />
            <SubmitButton loadingText="جارٍ إرسال الرمز...">
              <ShieldCheck size={18} />
              <span>إرسال رمز التحقق</span>
            </SubmitButton>
          </>
        )}

        {!otpMode || otpMode === 'disabled' ? (
          <>
            <input type="hidden" name="action" value="skip" />
            <SubmitButton loadingText="جارٍ تسجيل الدخول...">
              <span>تسجيل الدخول</span>
              <ArrowRight size={18} />
            </SubmitButton>
          </>
        ) : null}

        {allowsOtp && allowsSkip && (
          <div className="auth-cta-group">
            <SubmitButton
              loadingText="جارٍ الإرسال..."
              variant="primary"
              name="action"
              value="otp"
            >
              <ShieldCheck size={18} />
              <span>إرسال رمز تحقق</span>
            </SubmitButton>

            <button
              type="button"
              className="auth-cta auth-cta-secondary"
              onClick={() => {
                if (!phone.validateManually()) {
                  haptic.error();
                  return;
                }
                openSkipDialog();
              }}
            >
              <Zap size={18} />
              <span>دخول سريع</span>
            </button>
          </div>
        )}
      </form>

      {/* Skip OTP Dialog */}
      <OtpSkipDialog
        open={skipDialogOpen}
        onCancel={closeSkipDialog}
        onConfirm={() => {
          closeSkipDialog();
          haptic.medium();
          // تمرير الرقم في الـ hidden form
          if (skipFormRef.current) {
            const input = skipFormRef.current.elements.namedItem('phone') as HTMLInputElement;
            input.value = phone.fullPhoneE164;
            skipFormRef.current.requestSubmit();
          }
        }}
      />

      {/* Hidden form للـ skip flow */}
      {allowsSkip && (
        <form
          ref={skipFormRef}
          action={sendOtp}
          style={{ display: 'none' }}
        >
          <input type="hidden" name="phone" value="" />
          <input type="hidden" name="action" value="skip" />
          {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
        </form>
      )}

      {/* Trust signals */}
      <div className="auth-trust" aria-label="مؤشرات الثقة">
        <div className="auth-trust-item">
          <Lock size={12} />
          <span>تشفير AES-256</span>
        </div>
        <span className="auth-trust-sep" aria-hidden="true">·</span>
        <div className="auth-trust-item">
          <ShieldCheck size={12} />
          <span>موثوق +1,000 مستخدم</span>
        </div>
        <span className="auth-trust-sep" aria-hidden="true">·</span>
        <div className="auth-trust-item">
          <Sparkles size={12} />
          <span>HIPAA-grade</span>
        </div>
      </div>

      <div className="auth-helper">
        <p className="auth-helper-text">
          {requiresOtp && 'سيُرسل رمز ٦ أرقام عبر واتساب أو SMS'}
          {allowsOtp && allowsSkip && 'اختر الطريقة المناسبة لك'}
          {otpMode === 'disabled' && 'تسجيل دخول مباشر · لا حاجة لرمز تحقق'}
        </p>
      </div>

      <div className="auth-helper">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="auth-link">إنشاء حساب جديد</Link>
      </div>

      <div className="auth-helper auth-helper--center">
        <Link href="/login/email" className="auth-link auth-link--muted">
          الدخول بالبريد الإلكتروني بدلاً من ذلك
        </Link>
      </div>

      <div className="auth-biometric">
        <BiometricLoginButton
          mode="login"
          onSuccess={() => {
            haptic.success();
            router.push(redirectTo || '/dashboard');
          }}
        />
      </div>
    </main>
  );
}

// Helper component لاستيراد Check من lucide
function CheckIcon() {
  // نتجنّب الاستيراد المتكرر في الأعلى
  const { Check } = require('lucide-react');
  return <Check size={12} />;
}
