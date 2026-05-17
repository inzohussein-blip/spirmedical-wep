'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveSchedule(slots: Array<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean }>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  // امسح الجدول الحالي
  await supabase.from('specialist_schedules').delete().eq('specialist_id', user.id);

  // أدخل الجديد
  if (slots.length > 0) {
    const { error } = await supabase.from('specialist_schedules').insert(
      slots.map((s) => ({
        specialist_id: user.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active,
      }))
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath('/specialist/schedule');
  return { ok: true };
}

export async function saveAutoReply(message: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('users')
    .update({ auto_reply_message: message } as never)
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/specialist/schedule');
  return { ok: true };
}
