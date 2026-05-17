'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createHash } from 'crypto';
import type { UserSettings } from '@/lib/services/user-settings-types';

/**
 * Hash PIN using SHA-256 + salt (user_id).
 * نستخدم user_id كـ salt حتى لو شخصين اختاروا نفس الـ PIN يكون الـ hash مختلف.
 */
function hashPin(pin: string, userId: string): string {
  return createHash('sha256').update(`${userId}:${pin}`).digest('hex');
}

export async function setPin(pin: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: 'الـ PIN يجب أن يكون ٤ أرقام' };
  }

  const hash = hashPin(pin, user.id);

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

  const incoming = hashPin(pin, user.id);

  if (incoming !== expected) {
    return { ok: false, error: 'PIN غير صحيح' };
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
