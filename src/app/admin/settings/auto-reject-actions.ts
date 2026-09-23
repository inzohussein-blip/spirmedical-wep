'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { AUTO_REJECT_KEY } from '@/lib/app-settings';

/** حدٌّ أعلى معقول: سنةٌ كاملة. أبعدُ من ذلك خطأُ إدخالٍ لا نيّة. */
const MAX_HOURS = 24 * 365;

async function verifySuperAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'غير مصرّح' };

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (profile?.role !== 'super_admin') {
    return { ok: false as const, error: 'هذا الإعداد للمدير العام وحده' };
  }
  return { ok: true as const, supabase, userId: user.id };
}

/**
 * مدّة انتظار الطلب المعلَّق قبل رفضه تلقائياً.
 *
 * صفرٌ يوقف الرفض بالكامل — وهو ما تفعله الدالّة أيضاً حين يغيب الصفّ
 * (الترحيل 0042). فلا مدّةَ مفترَضةً في الكود لا هنا ولا هناك.
 */
export async function setAutoRejectHours(
  hours: number
): Promise<{ ok: boolean; error?: string }> {
  const auth = await verifySuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!Number.isInteger(hours) || hours < 0 || hours > MAX_HOURS) {
    return { ok: false, error: `أدخل عدد ساعاتٍ صحيحاً بين ٠ و${MAX_HOURS}` };
  }

  const { error } = await (auth.supabase as any)
    .from('app_settings')
    .update({
      value: hours,
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('key', AUTO_REJECT_KEY);

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    action: hours === 0 ? 'settings.auto_reject.disable' : 'settings.auto_reject.update',
    user_id: auth.userId,
    entity_type: 'app_setting',
    entity_id: AUTO_REJECT_KEY,
    metadata: { hours },
  });

  revalidatePath('/admin/settings');
  return { ok: true };
}
