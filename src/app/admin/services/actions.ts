'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { allSwitchableServices, NON_SWITCHABLE } from '@/lib/service-switches';

async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'غير مصرّح' };

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { ok: false as const, error: 'غير مصرّح' };
  }
  return { ok: true as const, supabase, userId: user.id };
}

/** معرّفاتٌ يعرفها الكود — فلا يُكتب في الجدول معرّفٌ لا خدمةَ له */
const KNOWN = new Set(allSwitchableServices().map((s) => s.id));

export async function setServiceEnabled(
  serviceId: string,
  isEnabled: boolean,
  noteAr?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (NON_SWITCHABLE.has(serviceId)) {
    return { ok: false, error: 'هذه الخدمة لا تُطفأ' };
  }
  if (!KNOWN.has(serviceId)) {
    return { ok: false, error: 'خدمة غير معروفة' };
  }

  const note = (noteAr ?? '').trim();
  if (note.length > 120) return { ok: false, error: 'النص طويل (١٢٠ حرفاً كحدٍّ أقصى)' };

  const { error } = await (auth.supabase as any)
    .from('service_switches')
    .upsert(
      {
        service_id: serviceId,
        is_enabled: isEnabled,
        note_ar: note || null,
        updated_by: auth.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'service_id' }
    );

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    action: isEnabled ? 'service.enable' : 'service.disable',
    user_id: auth.userId,
    entity_type: 'service',
    entity_id: serviceId,
    metadata: { note_ar: note || null },
  });

  // الشبكة والتخطيط والبحث كلّها تقرأ الجدول — نُبطل الجذر كي يشملها جميعاً
  revalidatePath('/', 'layout');
  return { ok: true };
}
