import { normalizePhone } from '@/lib/validations/auth';
import { phoneToEmail } from '@/lib/auth/phone-credentials';

/**
 * حقلُ «البريد» في صفحة الدخول يقبل رقمَ هاتفٍ عراقيّاً أيضاً.
 * الإدارةُ تُسلِّم المختصَّ «الرقم + كلمة سرّ مؤقّتة»، وحسابُه في Supabase Auth
 * ببريدٍ اصطناعيّ (`phoneToEmail`) لا يعرفه. ما فيه `@` يمرّ كما هو.
 */
export function loginIdentifierToEmail(input: string): string {
  const v = input.trim();
  if (v.includes('@')) return v;
  const phone = normalizePhone(v.replace(/[^\d+]/g, ''));
  return /^\+9647\d{9}$/.test(phone) ? phoneToEmail(phone) : v;
}

/** الرقمُ بصيغة E.164 إن كان المُدخَل رقمَ هاتفٍ عراقيّاً، وإلّا null. */
export function loginIdentifierToPhone(input: string): string | null {
  const v = input.trim();
  if (v.includes('@')) return null;
  const phone = normalizePhone(v.replace(/[^\d+]/g, ''));
  return /^\+9647\d{9}$/.test(phone) ? phone : null;
}
