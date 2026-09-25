'use server';

import { createClient } from '@/lib/supabase/server';

/** يُعلِّم إشعاراتِ المستخدم كلَّها مقروءة — RLS يحصر التحديث في صفوفه. */
export async function markInboxRead(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false);
}
