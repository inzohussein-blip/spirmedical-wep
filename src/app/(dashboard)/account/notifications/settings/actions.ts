'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

export interface NotificationPreferences {
  appointment_reminders: boolean;
  test_results: boolean;
  messages: boolean;
  promotions: boolean;
  system_updates: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface ActiveSubscription {
  id: string;
  device_label: string | null;
  last_used_at: string;
  created_at: string;
}

const DEFAULT_PREFS: NotificationPreferences = {
  appointment_reminders: true,
  test_results: true,
  messages: true,
  promotions: false,
  system_updates: true,
  quiet_hours_enabled: true,
  quiet_hours_start: '23:00:00',
  quiet_hours_end: '07:00:00',
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return DEFAULT_PREFS;

  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return DEFAULT_PREFS;

  return {
    appointment_reminders: data.appointment_reminders,
    test_results: data.test_results,
    messages: data.messages,
    promotions: data.promotions,
    system_updates: data.system_updates,
    quiet_hours_enabled: data.quiet_hours_enabled,
    quiet_hours_start: data.quiet_hours_start,
    quiet_hours_end: data.quiet_hours_end,
  };
}

export async function getActiveSubscriptions(): Promise<ActiveSubscription[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, device_label, last_used_at, created_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('last_used_at', { ascending: false });

  if (error) return [];
  return (data ?? []) as ActiveSubscription[];
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'يجب تسجيل الدخول' };

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    logger.error('Update prefs failed', { user_id: user.id, error: error.message });
    return { success: false, error: 'فشل التحديث' };
  }

  revalidatePath('/account/notifications/settings');
  return { success: true };
}

export async function removeSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'يجب تسجيل الدخول' };

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('id', subscriptionId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: 'فشل الحذف' };
  }

  revalidatePath('/account/notifications/settings');
  return { success: true };
}
