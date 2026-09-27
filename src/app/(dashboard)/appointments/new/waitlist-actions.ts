'use server';

import { createClient } from '@/lib/supabase/server';
import { toSpecialistType } from '@/lib/specialist-types';

/**
 * «أعلِمني حين تتوفّر» — يُضيف المريضَ إلى قائمة انتظار نوع المختصّ (0048).
 * يُخطَر حين يُعتمد أوّلُ مختصٍّ من هذا النوع (admin/specialists).
 * الإدراجُ بعميل المستخدم: RLS يفرض أن يكون الصفُّ صفَّه.
 */
export async function joinServiceWaitlist(
  specialistType: string,
  serviceId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const type = toSpecialistType(specialistType);
  if (!type) return { ok: false, error: 'نوع خدمة غير معروف' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول أولاً' };

  const { error } = await supabase
    .from('service_waitlist')
    .insert({ user_id: user.id, specialist_type: type, service_id: serviceId ?? null });

  // مسجَّلٌ من قبل (فريدٌ لكلّ مستخدمٍ ونوع) — النتيجة المطلوبة حاصلة
  if (error && error.code !== '23505') {
    return { ok: false, error: 'تعذّر التسجيل. حاول مرة أخرى.' };
  }
  return { ok: true };
}
