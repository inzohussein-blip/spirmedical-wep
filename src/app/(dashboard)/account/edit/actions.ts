'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateProfileInput {
  full_name: string;
  governorate: string;
  email?: string;
}

const VALID_GOVERNORATES = [
  'بغداد', 'البصرة', 'أربيل', 'الموصل', 'النجف', 'كربلاء',
  'السليمانية', 'كركوك', 'دهوك', 'ديالى', 'الأنبار', 'صلاح الدين',
  'بابل', 'القادسية', 'واسط', 'المثنى', 'ميسان', 'ذي قار',
];

export async function updateProfile(input: UpdateProfileInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  // Validation
  const fullName = input.full_name.trim();
  if (fullName.length < 2) {
    return { ok: false, error: 'الاسم يجب أن يحتوي على حرفين على الأقل' };
  }
  if (!VALID_GOVERNORATES.includes(input.governorate)) {
    return { ok: false, error: 'محافظة غير صالحة' };
  }
  if (input.email && input.email.trim() && !/^\S+@\S+\.\S+$/.test(input.email)) {
    return { ok: false, error: 'بريد إلكتروني غير صالح' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      governorate: input.governorate,
      email: input.email?.trim() || null,
    })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/account');
  revalidatePath('/account/edit');
  revalidatePath('/dashboard');
  return { ok: true };
}
