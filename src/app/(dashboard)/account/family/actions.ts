'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface FamilyMemberInput {
  full_name: string;
  relation: string;
  gender: 'male' | 'female' | null;
  date_of_birth: string | null;
  phone: string | null;
  blood_type: string | null;
  chronic_conditions: string[];
  allergies: string[];
  current_medications: string | null;
  notes: string | null;
  avatar_emoji: string;
}

export async function addFamilyMember(input: FamilyMemberInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مصرّح' };

  if (!input.full_name.trim()) {
    return { success: false, error: 'الاسم مطلوب' };
  }

  const { error } = await supabase
    .from('family_members')
    .insert({
      owner_user_id: user.id,
      full_name: input.full_name,
      relation: input.relation,
      gender: input.gender,
      date_of_birth: input.date_of_birth,
      phone: input.phone,
      blood_type: input.blood_type,
      chronic_conditions: input.chronic_conditions.length > 0 ? input.chronic_conditions : null,
      allergies: input.allergies.length > 0 ? input.allergies : null,
      current_medications: input.current_medications,
      notes: input.notes,
      avatar_emoji: input.avatar_emoji,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/account/family');
  return { success: true };
}

export async function updateFamilyMember(id: string, input: FamilyMemberInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مصرّح' };

  const { error } = await supabase
    .from('family_members')
    .update({
      full_name: input.full_name,
      relation: input.relation,
      gender: input.gender,
      date_of_birth: input.date_of_birth,
      phone: input.phone,
      blood_type: input.blood_type,
      chronic_conditions: input.chronic_conditions.length > 0 ? input.chronic_conditions : null,
      allergies: input.allergies.length > 0 ? input.allergies : null,
      current_medications: input.current_medications,
      notes: input.notes,
      avatar_emoji: input.avatar_emoji,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/account/family');
  return { success: true };
}

export async function deleteFamilyMember(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مصرّح' };

  // Soft delete (set is_active = false)
  // هذا أفضل لأنّه يحافظ على ربط الطلبات السابقة
  const { error } = await supabase
    .from('family_members')
    .update({ is_active: false })
    .eq('id', id)
    .eq('owner_user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/account/family');
  return { success: true };
}
