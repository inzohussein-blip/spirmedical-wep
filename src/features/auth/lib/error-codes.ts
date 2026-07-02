/**
 * ═══════════════════════════════════════════════════════════════
 * 🔑 OTP Error Codes Registry
 * ═══════════════════════════════════════════════════════════════
 *
 * ترجمة رموز الأخطاء التقنية لرسائل مفهومة للمستخدم
 * مع hints للمشرف التقني.
 */

import type { OtpErrorCode } from '../types';

export const OTP_ERROR_CODES: Readonly<Record<string, OtpErrorCode>> = {
  DB_42501: {
    code: 'DB_42501',
    message: 'خطأ في صلاحيات النظام',
    hint: 'صلاحيات قاعدة البيانات (RLS) — يحتاج service_role',
  },
  DB_42P01: {
    code: 'DB_42P01',
    message: 'خطأ في قاعدة البيانات',
    hint: 'جدول الرموز غير موجود — شغّل migration',
  },
  DB_23502: {
    code: 'DB_23502',
    message: 'بيانات ناقصة',
    hint: 'حقل مطلوب فارغ في قاعدة البيانات',
  },
  DB_23514: {
    code: 'DB_23514',
    message: 'قيمة مرفوضة',
    hint: 'قيمة مرفوضة (CHECK constraint)',
  },
  DB_22P02: {
    code: 'DB_22P02',
    message: 'صيغة بيانات خاطئة',
    hint: 'صيغة بيانات خاطئة (مثل IP/تاريخ)',
  },
  DB_INSERT: {
    code: 'DB_INSERT',
    message: 'فشل حفظ الرمز',
    hint: 'فشل حفظ الرمز في قاعدة البيانات',
  },
  PHONE_INVALID: {
    code: 'PHONE_INVALID',
    message: 'رقم الهاتف غير صالح',
  },
  RATE_LIMIT: {
    code: 'RATE_LIMIT',
    message: 'تجاوز عدد المحاولات، حاول لاحقاً',
  },
  CHANNEL_UNSUPPORTED: {
    code: 'CHANNEL_UNSUPPORTED',
    message: 'قناة الإرسال غير مدعومة',
  },
  SEND_FAILED: {
    code: 'SEND_FAILED',
    message: 'فشل إرسال الرمز',
    hint: 'فشل الإرسال عبر واتساب',
  },
  META_131030: {
    code: 'META_131030',
    message: 'الرقم غير مضاف كمستلم مسموح',
    hint: 'الرقم غير مضاف كمستلم مسموح في Meta',
  },
  META_132000: {
    code: 'META_132000',
    message: 'قالب الرسالة غير معتمد',
  },
  META_132001: {
    code: 'META_132001',
    message: 'قالب الرسالة غير موجود',
    hint: 'قالب الرسالة (spir_otp) غير موجود',
  },
  META_100: {
    code: 'META_100',
    message: 'إعدادات Meta غير صحيحة',
    hint: 'إعدادات Meta غير صحيحة (توكن/معرّف)',
  },
  META_190: {
    code: 'META_190',
    message: 'توكن Meta منتهي',
    hint: 'توكن Meta منتهي أو غير صالح',
  },
  EXCEPTION: {
    code: 'EXCEPTION',
    message: 'حدث خطأ غير متوقّع',
  },
  SMS_FAILED: {
    code: 'SMS_FAILED',
    message: 'فشل إرسال SMS',
    hint: 'فشل قناة SMS الاحتياطية',
  },
};

/**
 * الحصول على رسالة خطأ من رمز
 */
export function getOtpError(code: string | null | undefined): OtpErrorCode | null {
  if (!code) return null;
  return OTP_ERROR_CODES[code] ?? {
    code,
    message: 'حدث خطأ',
    hint: 'خطأ غير معروف',
  };
}
