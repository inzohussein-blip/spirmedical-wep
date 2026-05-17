'use server';

import { createClient } from '@/lib/supabase/server';

export async function exportUserData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  // اجمع كل بيانات المستخدم من كل الجداول
  const [
    { data: profile },
    { data: appointments },
    { data: reminders },
    { data: prescriptions },
    { data: vitals },
    { data: ratings },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('appointments').select('*').eq('user_id', user.id),
    supabase.from('reminders').select('*').eq('user_id', user.id),
    supabase.from('prescriptions').select('*').eq('user_id', user.id),
    supabase.from('health_vitals').select('*').eq('user_id', user.id),
    supabase.from('ratings').select('*').eq('user_id', user.id),
  ]);

  const exportPayload = {
    exported_at: new Date().toISOString(),
    app: 'Spir Medical',
    user_profile: profile,
    appointments: appointments ?? [],
    reminders: reminders ?? [],
    prescriptions: prescriptions ?? [],
    health_vitals: vitals ?? [],
    ratings: ratings ?? [],
  };

  return { ok: true, data: exportPayload };
}
