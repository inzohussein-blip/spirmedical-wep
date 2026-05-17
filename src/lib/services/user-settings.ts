'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserSettings } from './user-settings-types';

export async function updateUserSettings(settings: UserSettings) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { data: profile } = await supabase
    .from('users')
    .select('user_settings')
    .eq('id', user.id)
    .single();

  const current = (profile?.user_settings ?? {}) as UserSettings;
  const merged: UserSettings = {
    ...current,
    ...settings,
    notifications: {
      ...(current.notifications ?? {}),
      ...(settings.notifications ?? {}),
    },
  };

  const { error } = await supabase
    .from('users')
    .update({ user_settings: merged as never })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/account/notifications');
  revalidatePath('/account/settings');
  return { ok: true };
}
