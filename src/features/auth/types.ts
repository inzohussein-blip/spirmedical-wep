/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 Auth Types
 * ═══════════════════════════════════════════════════════════════
 */

export type Role = 'guest' | 'patient' | 'specialist' | 'admin' | 'super_admin' | 'manager' | 'support';

export type OtpMode = 'disabled' | 'optional' | 'required';

export type OtpChannel = 'whatsapp' | 'telegram' | 'sms';

export interface Country {
  code: string;        // +964
  iso: string;         // iq
  label: string;       // العراق
  flag: string;        // 🇮🇶
  maxLen: number;      // 10
  prefix: string;      // 7
}

export interface PhoneValidationResult {
  valid: boolean;
  formatted: string;
  reason?: string;
}

export interface OtpErrorCode {
  code: string;
  message: string;        // رسالة للمستخدم
  hint?: string;          // للمشرف التقني
}

export interface AuthRedirectParams {
  redirect?: string | null;
  role?: Role;
}

export interface LoginFormData {
  phone: string;           // E.164 format: +9647XXXXXXXXX
  action?: 'otp' | 'skip' | 'auto';
  channel?: OtpChannel;
  rememberMe?: boolean;
}
