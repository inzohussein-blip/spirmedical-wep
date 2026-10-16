import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🔑 رمزُ الدخول (PIN) للحسابات الهاتفيّة — 0049
 * ════════════════════════════════════════════════════════════════════
 *
 * «التسجيلُ والدخول بلا رمز واتساب» قرارُ المالك (توكن Meta معطّل). لكنّ كلمةَ سرّ
 * الحساب الهاتفيّ مشتقّةٌ من الرقم وسرّ الخادم، فبلا عاملٍ ثانٍ تكفي معرفةُ الرقم
 * لفتح سجلّ مريض. هذا العامل: ستّةُ أرقام يختارها صاحبُ الحساب.
 *
 * • التجزئة bcrypt مملّحةٌ بمعرّف المستخدم، في جدولٍ لا يقرؤه إلّا الخادم.
 * • خمسُ محاولاتٍ خاطئة تقفل الحساب ربع ساعة — مليونُ احتمالٍ لا يُجرَّب عبر الشبكة.
 * • لا يرمي: عطبُ القاعدة يُعدّ «خطأ» لا «نجاحاً» (يفشل مغلقاً، بخلاف إتاحة الخدمة).
 * ════════════════════════════════════════════════════════════════════
 */

export const PIN_LENGTH = 6;
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCK_MINUTES = 15;

/** يعيد سببَ الرفض بالعربية، أو null إن كان الرمز مقبولاً. */
export function loginPinProblem(pin: string): string | null {
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return `رمز الدخول ${PIN_LENGTH} أرقام`;
  if (/^(\d)\1+$/.test(pin)) return 'رمزٌ سهل التخمين — لا تكرّر الرقم نفسه';
  const digits = pin.split('').map(Number);
  const steps = digits.slice(1).map((d, i) => d - digits[i]);
  if (steps.every((s) => s === 1) || steps.every((s) => s === -1)) {
    return 'رمزٌ سهل التخمين — تجنّب الأرقام المتتالية';
  }
  return null;
}

const material = (userId: string, pin: string) => `${userId}:${pin}`;

export async function hashLoginPin(userId: string, pin: string): Promise<string> {
  return bcrypt.hash(material(userId, pin), 10);
}

/** يضبط رمزَ الدخول (إنشاءً أو استبدالاً) ويصفّر القفل. */
export async function setLoginPin(userId: string, pin: string): Promise<boolean> {
  if (loginPinProblem(pin)) return false;
  const { error } = await createAdminClient()
    .from('auth_login_pins')
    .upsert(
      {
        user_id: userId,
        pin_hash: await hashLoginPin(userId, pin),
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  if (error) {
    logger.error('setLoginPin failed', { error: error.message });
    return false;
  }
  return true;
}

export async function hasLoginPin(userId: string): Promise<boolean | null> {
  const { data, error } = await createAdminClient()
    .from('auth_login_pins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return !!data;
}

export type PinCheck =
  | { status: 'ok' }
  | { status: 'none' }
  | { status: 'wrong'; remaining: number }
  | { status: 'locked'; minutes: number }
  | { status: 'error' };

/** يتحقّق من الرمز ويحدّث عدّاد المحاولات والقفل. */
export async function checkLoginPin(userId: string, pin: string, now = new Date()): Promise<PinCheck> {
  const sb = createAdminClient();
  const { data: row, error } = await sb
    .from('auth_login_pins')
    .select('pin_hash, failed_attempts, locked_until')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { status: 'error' };
  if (!row) return { status: 'none' };

  if (row.locked_until && new Date(row.locked_until) > now) {
    return { status: 'locked', minutes: Math.ceil((new Date(row.locked_until).getTime() - now.getTime()) / 60_000) };
  }

  const ok = /^\d+$/.test(pin) && (await bcrypt.compare(material(userId, pin), row.pin_hash));
  if (ok) {
    if (row.failed_attempts > 0 || row.locked_until) {
      await sb.from('auth_login_pins').update({ failed_attempts: 0, locked_until: null }).eq('user_id', userId);
    }
    return { status: 'ok' };
  }

  // انقضى قفلٌ سابق → تبدأ الجولةُ من صفر
  const prior = row.locked_until ? 0 : row.failed_attempts;
  const attempts = prior + 1;
  const lock = attempts >= MAX_PIN_ATTEMPTS;
  await sb
    .from('auth_login_pins')
    .update({
      failed_attempts: lock ? 0 : attempts,
      locked_until: lock ? new Date(now.getTime() + PIN_LOCK_MINUTES * 60_000).toISOString() : null,
    })
    .eq('user_id', userId);

  return lock ? { status: 'locked', minutes: PIN_LOCK_MINUTES } : { status: 'wrong', remaining: MAX_PIN_ATTEMPTS - attempts };
}

/** الحسابُ الهاتفيّ وحده يدخل بالرقم + الرمز؛ حسابُ البريد (ومنه الإدارة) لا. */
export const PHONE_AUTH_DOMAIN = '@phone.spirmedical.local';
export function isPhoneAuthEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(PHONE_AUTH_DOMAIN);
}
