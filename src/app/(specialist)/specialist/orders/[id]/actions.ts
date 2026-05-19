'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyTestResultsReady } from '@/lib/services/push-templates';

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

  // ✨ V25.3: Push للمريض - نتائج جاهزة
  try {
    const { data: order } = await supabase
      .from('appointments')
      .select('user_id, service_type')
      .eq('id', orderId)
      .single();

    if (order?.user_id) {
      notifyTestResultsReady(order.user_id, {
        orderId,
        testName: order.service_type || undefined,
      }).catch(() => null);
    }
  } catch {
    // fire-and-forget
  }

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

  // ✨ V25.6: تسجيل تلقائي في nursing_visit_history
  if (field === 'nursing_actions') {
    const nursingData = data as {
      action_type?: string;
      description?: string;
      vitals?: { bp?: string; pulse?: string; temp?: string; spo2?: string };
      notes?: string;
    };

    if (nursingData.action_type) {
      // جلب user_id من الطلب
      const { data: order } = await supabase
        .from('appointments')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (order?.user_id) {
        // تحويل vitals من string لـ numbers
        const vital_signs: Record<string, unknown> = {};
        if (nursingData.vitals?.bp) vital_signs.bp = nursingData.vitals.bp;
        if (nursingData.vitals?.pulse) vital_signs.pulse = parseFloat(nursingData.vitals.pulse);
        if (nursingData.vitals?.temp) vital_signs.temp = parseFloat(nursingData.vitals.temp);
        if (nursingData.vitals?.spo2) vital_signs.spo2 = parseFloat(nursingData.vitals.spo2);

        await supabase.from('nursing_visit_history').insert({
          user_id: order.user_id,
          appointment_id: orderId,
          specialist_id: user.id,
          procedure_type: nursingData.action_type,
          procedure_details: nursingData.description
            ? { description: nursingData.description }
            : null,
          vital_signs: Object.keys(vital_signs).length > 0 ? vital_signs : null,
          notes: nursingData.notes || null,
        });
      }
    }
  }

  revalidatePath(`/specialist/orders/${orderId}`);
  return { ok: true };
}
