'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ReminderType = 'medication' | 'appointment' | 'checkup' | 'vaccine';
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ReminderInput {
  type: ReminderType;
  title: string;
  description?: string;
  scheduled_at: string;          // ISO datetime
  frequency: ReminderFrequency;
}

export async function createReminder(input: ReminderInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase.from('reminders').insert({
    user_id: user.id,
    type: input.type,
    title: input.title,
    description: input.description || null,
    scheduled_at: input.scheduled_at,
    frequency: input.frequency,
    active: true,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/account/reminders');
  return { ok: true };
}

export async function toggleReminder(id: string, active: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('reminders')
    .update({ active })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/account/reminders');
  return { ok: true };
}

export async function deleteReminder(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/account/reminders');
  return { ok: true };
}
