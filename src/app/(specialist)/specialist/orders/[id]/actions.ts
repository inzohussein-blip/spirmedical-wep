'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * قبول طلب: تعيين الاختصاصي للطلب
 */
export async function acceptOrder(orderId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  // تحقق أن الاختصاصي معتمد ونوعه يطابق
  const { data: profile } = await supabase
    .from('users')
    .select('specialist_type, approval_status, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'specialist' || profile?.approval_status !== 'approved') {
    return { ok: false, error: 'غير مصرّح' };
  }

  if (!profile.specialist_type) {
    return { ok: false, error: 'نوع الاختصاص غير محدّد' };
  }

  // تحديث الطلب
  const { error } = await supabase
    .from('appointments')
    .update({
      assigned_specialist_id: user.id,
      status: 'confirmed',
    } as never)
    .eq('id', orderId)
    .eq('required_specialist_type', profile.specialist_type)
    .is('assigned_specialist_id', null);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/specialist/orders/${orderId}`);
  revalidatePath('/specialist/orders');
  revalidatePath('/specialist');
  return { ok: true };
}

/**
 * بدء التنفيذ
 */
export async function startOrder(orderId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'in_progress' } as never)
    .eq('id', orderId)
    .eq('assigned_specialist_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/specialist/orders/${orderId}`);
  return { ok: true };
}

/**
 * إكمال الطلب
 */
export async function completeOrder(orderId: string, specialistNotes?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'completed',
      specialist_notes: specialistNotes ?? null,
    } as never)
    .eq('id', orderId)
    .eq('assigned_specialist_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/specialist/orders/${orderId}`);
  revalidatePath('/specialist/orders');
  return { ok: true };
}

/**
 * تحديث بيانات خاصة بالاختصاص (lab_results, prescription, nursing_actions, etc)
 */
export async function updateOrderRoleData(
  orderId: string,
  field: 'lab_results_data' | 'nursing_actions' | 'prescription_data' | 'session_plan',
  data: object
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const updateData: Record<string, unknown> = {};
  updateData[field] = data;

  const { error } = await supabase
    .from('appointments')
    .update(updateData as never)
    .eq('id', orderId)
    .eq('assigned_specialist_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/specialist/orders/${orderId}`);
  return { ok: true };
}
