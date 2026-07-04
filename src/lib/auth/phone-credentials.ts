import { createHash } from 'crypto';

/**
 * ════════════════════════════════════════════════════════════════════
 * بيانات اعتماد الحسابات المبنية على الهاتف (مصدر واحد موحّد)
 * ════════════════════════════════════════════════════════════════════
 *
 * حسابات الهاتف في Supabase Auth تُنشأ ببريد اصطناعي + كلمة سر مشتقّة
 * حتمياً من رقم الهاتف. توحيد الاشتقاق هنا يمنع التكرار والانحراف بين
 * ملفّات login/register/admin.
 *
 * ⚠️ أمان: كلمة السر تُشتَقّ من `AUTH_PASSWORD_SECRET` — سرّ **منفصل** عن
 * `ENCRYPTION_KEY` (سرّ تشفير PHI). سابقاً كان الاثنان نفس المفتاح، فكان
 * تسريب أحدهما يكشف الآخر ويسمح بحساب كلمة سر كل مستخدم.
 *
 * توافق رجعي: عند غياب `AUTH_PASSWORD_SECRET` نسقط إلى `ENCRYPTION_KEY`
 * (سلوك ما قبل التغيير) فلا يُقفَل أحد. بمجرد ضبط `AUTH_PASSWORD_SECRET`،
 * تتغيّر كلمة السر المشتقّة؛ المستخدمون الحاليون يُحدَّثون تلقائياً عبر
 * المسار البطيء (updateUserById) عند أول دخول ناجح.
 */

function authPasswordSecret(): string {
  const secret = process.env.AUTH_PASSWORD_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('AUTH_PASSWORD_SECRET أو ENCRYPTION_KEY مطلوب');
  }
  return secret;
}

/** اشتقاق كلمة سر Supabase الحتمية لرقم هاتف. */
export function derivePhonePassword(phone: string): string {
  return createHash('sha256')
    .update(phone + ':' + authPasswordSecret())
    .digest('hex')
    .slice(0, 32);
}

/** البريد الاصطناعي المقابل لرقم الهاتف داخل Supabase Auth. */
export function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@phone.spirmedical.local`;
}
