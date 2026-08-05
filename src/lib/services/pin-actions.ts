'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createHash, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import type { UserSettings } from '@/lib/services/user-settings-types';

/**
 * 🔒 تجزئة الـ PIN
 *
 * كان الاعتماد على SHA-256 (سريعة جداً): PIN من ٤ أرقام = 10٬000 احتمال فقط،
 * فمن يصل إلى الجدول يستخرجه فوراً بالقوة الغاشمة. نستعمل bcrypt (موجودة أصلاً
 * كاعتمادية) — بطيئة عمداً — مع الإبقاء على `user_id` في المدخل كتمييز إضافي.
 */
async function hashPin(pin: string, userId: string): Promise<string> {
  return bcrypt.hash(`${userId}:${pin}`, 10);
}

/** الصيغة القديمة (SHA-256) — للتحقّق من الـ PINs المخزّنة قبل الترقية */
function legacyHashPin(pin: string, userId: string): string {
  return createHash('sha256').update(`${userId}:${pin}`).digest('hex');
}

function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$/.test(hash);
}

/** يقارن الـ PIN مع الصيغتين (bcrypt للجديد، SHA-256 مقارنةً ثابتة الزمن للقديم) */
async function matchesPin(pin: string, userId: string, stored: string): Promise<boolean> {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(`${userId}:${pin}`, stored);
  }
  const incoming = Buffer.from(legacyHashPin(pin, userId));
  const expected = Buffer.from(stored);
  if (incoming.length !== expected.length) return false;
  return timingSafeEqual(incoming, expected);
}

export async function setPin(pin: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: 'الـ PIN يجب أن يكون ٤ أرقام' };
  }

  const hash = await hashPin(pin, user.id);

  // اجلب الإعدادات الحالية للدمج
  const { data: profile } = await supabase
    .from('users')
    .select('user_settings')
    .eq('id', user.id)
    .single();

  const current = (profile?.user_settings ?? {}) as UserSettings;
  const merged: UserSettings = {
    ...current,
    pin_hash: hash,
    pin_enabled: true,
  };

  const { error } = await supabase
    .from('users')
    .update({ user_settings: merged as never })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/account/settings');
  return { ok: true };
}

export async function verifyPin(pin: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: 'PIN غير صالح' };
  }

  // 🔒 حدّ المحاولات: PIN من ٤ أرقام = 10٬000 احتمال فقط، وبلا حدٍّ كان قفل
  // التطبيق يُكسر بالقوة الغاشمة في ثوانٍ. الحدّ لكل مستخدم (لا لكل IP) كي لا
  // يُتجاوَز بتبديل الشبكة.
  const limit = await checkRateLimit(`pin:verify:${user.id}`, {
    max: 5,
    windowSeconds: 900,
  });
  if (!limit.allowed) {
    return {
      ok: false,
      error: `محاولات كثيرة · حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`,
    };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('user_settings')
    .eq('id', user.id)
    .single();

  const settings = (profile?.user_settings ?? {}) as UserSettings;
  const expected = settings.pin_hash;

  if (!expected) {
    return { ok: false, error: 'لم يتم تعيين PIN' };
  }

  const match = await matchesPin(pin, user.id, expected);

  if (!match) {
    const remaining = Math.max(0, limit.remaining ?? 0);
    return {
      ok: false,
      error: remaining > 0
        ? `PIN غير صحيح · ${remaining} محاولة متبقّية`
        : 'PIN غير صحيح',
    };
  }

  // ترقية شفّافة: PIN قديم مخزّن بـ SHA-256 → يُعاد تخزينه بـ bcrypt عند أوّل
  // تحقّق ناجح، فلا يحتاج المستخدم إعادة تعيينه.
  if (!isBcryptHash(expected)) {
    const upgraded = await hashPin(pin, user.id);
    const { error: upgradeError } = await supabase
      .from('users')
      .update({ user_settings: { ...settings, pin_hash: upgraded } } as never)
      .eq('id', user.id);

    // الفتح نجح ولا نُفشله بسبب الترقية، لكن الصمت هنا يعني بقاء التجزئة
    // الضعيفة إلى الأبد بلا أن يعلم أحد.
    if (upgradeError) {
      logger.warn('PIN hash upgrade to bcrypt failed', {
        user_id: user.id,
        error: upgradeError.message,
      });
    }
  }

  return { ok: true };
}

export async function disablePin(currentPin: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  // تأكد من PIN الحالي قبل التعطيل
  const verify = await verifyPin(currentPin);
  if (!verify.ok) return verify;

  const { data: profile } = await supabase
    .from('users')
    .select('user_settings')
    .eq('id', user.id)
    .single();

  const current = (profile?.user_settings ?? {}) as UserSettings;
  const merged: UserSettings = {
    ...current,
    pin_hash: null,
    pin_enabled: false,
  };

  const { error } = await supabase
    .from('users')
    .update({ user_settings: merged as never })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/account/settings');
  return { ok: true };
}

export async function changePin(oldPin: string, newPin: string) {
  const verify = await verifyPin(oldPin);
  if (!verify.ok) return verify;

  return setPin(newPin);
}
