'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📊 StepIndicator
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  otpDisabled: boolean;
}

export function StepIndicator({ otpDisabled }: Props) {
  return (
    <ol className="auth-steps" aria-label="خطوات تسجيل الدخول">
      <li className="auth-step is-active">
        <span className="auth-step-num">١</span>
        <span className="auth-step-label">الهاتف</span>
      </li>
      <li className="auth-step-divider" aria-hidden="true" />
      <li className={`auth-step ${otpDisabled ? 'is-disabled' : ''}`}>
        <span className="auth-step-num">٢</span>
        <span className="auth-step-label">التحقّق</span>
      </li>
      <li className="auth-step-divider" aria-hidden="true" />
      <li className="auth-step">
        <span className="auth-step-num">٣</span>
        <span className="auth-step-label">تم</span>
      </li>
    </ol>
  );
}
