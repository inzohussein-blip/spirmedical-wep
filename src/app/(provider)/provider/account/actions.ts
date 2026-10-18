'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * ملفُّ حساب الخدمة: اسمُ المنشأة والمدينة والمحافظة واسمُ المسؤول. بعميل RLS — هذه أعمدةٌ يملكها
 * صاحبُ الصفّ (حارسُ 0058/0060 يمنع غيرها: النوعُ والاعتمادُ للإدارة). يُعدّ الصفُّ المكتوب.
 */
export async function saveProviderProfile(input: {
  clinicName: string;
  city: string;
  governorate: string;
  ownerName: string;
}): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'سجّل الدخول أوّلاً' };

  const clinicName = input.clinicName.trim().slice(0, 80);
  const ownerName = input.ownerName.trim().slice(0, 80);
  if (clinicName.length < 2) return { ok: false, message: 'اكتب اسمَ المنشأة' };
  if (ownerName.length < 2) return { ok: false, message: 'اكتب اسمَ المسؤول' };

  const { data, error } = await supabase
    .from('users')
    .update({
      clinic_name: clinicName,
      clinic_city: input.city.trim().slice(0, 40) || null,
      governorate: input.governorate.trim().slice(0, 40) || null,
      full_name: ownerName,
    })
    .eq('id', user.id)
    .eq('role', 'provider')
    .select('id');
  if (error) return { ok: false, message: 'تعذّر الحفظ: ' + error.message };
  if (!data?.length) return { ok: false, message: 'هذا الحساب ليس حسابَ خدمة' };

  revalidatePath('/provider');
  revalidatePath('/provider/account');
  return { ok: true, message: 'حُفظ' };
}
