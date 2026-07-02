/**
 * ═══════════════════════════════════════════════════════════════
 * 📱 Phone Validation & Formatting
 * ═══════════════════════════════════════════════════════════════
 *
 * Pure functions — قابلة للاختبار بدون React.
 *
 * يدعم:
 *   - التحقّق العراقي الصارم (07[3-7]XXXXXXX)
 *   - تنسيق جميل (07XX XXX XXXX)
 *   - تحويل لصيغة E.164 (+9647XXXXXXXXX)
 */

import type { PhoneValidationResult } from '../types';

/**
 * تحقق عراقي صارم:
 *   - يبدأ بـ 07
 *   - ثالث رقم من 3-7 (Zain, Asiacell, Korek)
 *   - 10 أرقام بالضبط
 */
export function validateIraqiPhone(local: string): PhoneValidationResult {
  const digits = local.replace(/\D/g, '');

  if (!digits) {
    return { valid: false, formatted: '', reason: 'رقم الهاتف إلزامي' };
  }
  if (digits.length < 11) {
    return { valid: false, formatted: digits, reason: 'الرقم قصير جداً' };
  }
  if (digits.length > 11) {
    return { valid: false, formatted: digits, reason: 'الرقم طويل جداً' };
  }
  if (!digits.startsWith('07')) {
    return { valid: false, formatted: digits, reason: 'رقم عراقي يجب أن يبدأ بـ 07' };
  }
  // 07[3-9]XXXXXXXX — يشمل: Zain(078), Asiacell(077), Korek(075), Asia(073/074/076)
  if (!/^07[3-9]\d{8}$/.test(digits)) {
    return { valid: false, formatted: digits, reason: 'رقم عراقي غير صحيح' };
  }

  // تنسيق: 07XX XXX XXXX (11 رقم)
  const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return { valid: true, formatted };
}

/**
 * Generic validation لأي دولة (يستخدم iraqiPhoneRegex كافتراضي)
 */
export function validatePhone(input: string, maxLen: number = 11): PhoneValidationResult {
  const digits = input.replace(/\D/g, '');
  if (!digits) {
    return { valid: false, formatted: '', reason: 'رقم الهاتف إلزامي' };
  }
  if (digits.length < maxLen) {
    return { valid: false, formatted: digits, reason: 'الرقم قصير جداً' };
  }
  if (digits.length > maxLen) {
    return { valid: false, formatted: digits, reason: 'الرقم طويل جداً' };
  }
  return validateIraqiPhone(digits);
}

/**
 * تنسيق للعرض فقط (بدون تحقق)
 *  7XXXXXXXXX → 07XX XXX XXXX
 */
export function formatDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11); // 11 رقم (07 + 9 أرقام)
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}

/**
 * تحويل للصيغة الدولية E.164
 *   07XXXXXXXXX → +9647XXXXXXXXX
 *   +9647XXX...  → +9647XXX...
 */
export function toE164(local: string, countryCode: string): string {
  const digits = local.replace(/\D/g, '');
  const cc = countryCode.replace(/\D/g, '');

  if (digits.startsWith(cc)) return `+${digits}`;
  if (digits.startsWith('0')) return `+${cc}${digits.slice(1)}`;
  return `+${cc}${digits}`;
}

/**
 * استخراج الجزء المحلي من E.164
 *   +9647XXXXXXXXX → 7XXXXXXXXX
 */
export function fromE164(full: string, countryCode: string): string {
  const cc = countryCode.replace(/\D/g, '');
  const digits = full.replace(/\D/g, '');
  if (digits.startsWith(cc)) return digits.slice(cc.length);
  return digits;
}
