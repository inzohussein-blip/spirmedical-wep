/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 Auth Feature — Public API
 * ═══════════════════════════════════════════════════════════════
 *
 * الاستيراد الموحّد من خارج الـ feature:
 *
 *   import { LoginForm, useAuthForm } from '@/features/auth';
 *
 * ❌ لا تستورد من ملفات داخل المجلد مباشرة.
 * ═══════════════════════════════════════════════════════════════
 */

// Components
export { LoginForm } from './components/LoginForm';
export { PhoneInput } from './components/PhoneInput';
export { StepIndicator } from './components/StepIndicator';
export { RoleSelector } from './components/RoleSelector';
export { SubmitButton } from './components/SubmitButton';
export { ErrorBanner } from './components/ErrorBanner';
export { OtpSkipDialog } from './components/OtpSkipDialog';

// Hooks
export { useAuthForm } from './hooks/useAuthForm';
export { usePhoneValidation } from './hooks/usePhoneValidation';
export { useRememberPhone } from './hooks/useRememberPhone';
export { useOtpModeHelpers } from './hooks/useOtpModeHelpers';

// Pure libs (testable)
export {
  validateIraqiPhone,
  validatePhone,
  formatDisplay,
  toE164,
  fromE164,
} from './lib/phone-formatter';
export { COUNTRIES, DEFAULT_COUNTRY, findCountryByIso } from './lib/countries';
export { OTP_ERROR_CODES, getOtpError } from './lib/error-codes';
export { readOtpMode, shouldUseOtp, canSkipOtp } from './lib/otp-mode';
export { ROLE_INFO, PUBLIC_ROLES } from './lib/role-info';

// Types
export type {
  Role,
  OtpMode,
  OtpChannel,
  Country,
  PhoneValidationResult,
  OtpErrorCode,
  AuthRedirectParams,
  LoginFormData,
} from './types';

// Server actions
export { sendOtp } from './actions/login';
