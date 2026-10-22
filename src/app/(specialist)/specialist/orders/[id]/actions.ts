'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyTestResultsReady, notifySpecialistAssigned } from '@/lib/services/push-templates';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { isAdminRole } from '@/lib/admin-types';
import { resolveChosenLab } from '@/lib/labs/lab-network';
import { sanitizeLabResults, toLabResultRows, type LabResultInput } from '@/lib/labs/lab-results';
import { notifyInbox } from '@/lib/inbox-notify';

/**
 * قبول طلب: تعيين الاختصاصي للطلب
 */
export async function acceptOrder(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  // تحقق أن الاختصاصي معتمد ونوعه يطابق
  const { data: profile } = await supabase
    .from('users')
    .select('specialist_type, approval_status, role, full_name')
    .eq('id', user.id)
    .single();

  // المديرُ يقبل أيَّ طلبٍ (قرار المالك: دخولٌ كامل لتطبيق المختصّ) — بلا نوع اختصاص ولا اعتماد
  const asAdmin = isAdminRole(profile?.role);
  if (!profile || (!asAdmin && (profile.role !== 'specialist' || profile.approval_status !== 'approved'))) {
    return { ok: false, error: 'غير مصرّح' };
  }

  if (!asAdmin && !profile.specialist_type) {
    return { ok: false, error: 'نوع الاختصاص غير محدّد' };
  }

  // تحديث الطلب + استرجاع بياناته (للإشعار)
  let acceptQuery = supabase
    .from('appointments')
    .update({
      assigned_specialist_id: user.id,
      status: 'confirmed',
    } as never)
    .eq('id', orderId)
    .is('assigned_specialist_id', null);
  if (!asAdmin) acceptQuery = acceptQuery.eq('required_specialist_type', profile.specialist_type!);
  const { data: updated, error } = await acceptQuery
    .select('id, user_id, service_type, scheduled_at')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  // 🆕 V31: لو لم يُحدَّث أي صف، فالطلب مأخوذ مسبقاً أو لا يطابق النوع
  if (!updated) {
    return { ok: false, error: 'الطلب لم يَعُد متاحاً (قد يكون مأخوذاً)' };
  }

  // 🆕 V31: إشعار المراجع بأنّ مختصاً قَبِل طلبه (best-effort)
  const order = updated as { id: string; user_id: string; service_type: string; scheduled_at: string };
  notifySpecialistAssigned(order.user_id, {
    orderId: order.id,
    specialistName: profile.full_name ?? 'المختصّ',
    serviceName: order.service_type,
  }).catch(() => null);

  // 🆕 V31: Audit log
  logAuditEvent({
    user_id: user.id,
    action: 'order.accept',
    entity_type: 'appointments',
    entity_id: order.id,
    metadata: { specialist_type: profile.specialist_type },
  }).catch(() => null);

  revalidatePath(`/specialist/orders/${orderId}`);
  revalidatePath('/specialist/orders');
  revalidatePath('/specialist');
  revalidatePath('/appointments');
  return { ok: true };
}

/**
 * بدء التنفيذ
 */
export async function startOrder(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'in_progress' } as never)
    .eq('id', orderId)
    .eq('assigned_specialist_id', user.id);

  if (error) return { ok: false, error: error.message };

  // 🆕 V31: audit + تحديث صفحة المراجع أيضاً
  logAuditEvent({
    user_id: user.id,
    action: 'order.start',
    entity_type: 'appointments',
    entity_id: orderId,
  }).catch(() => null);

  revalidatePath(`/specialist/orders/${orderId}`);
  revalidatePath('/appointments');
  return { ok: true };
}

/**
 * إكمال الطلب
 */
export async function completeOrder(orderId: string, specialistNotes?: string) {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
        const vital_signs: Record<string, string | number> = {};
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

// ═══════════════════════════════════════════════════════════════════════════
// 🩸 سحبُ الدم: المحلّلُ يسحب ويسلّم المختبر، والمختبرُ يرفع النتائج (الدفعة 2)
// ═══════════════════════════════════════════════════════════════════════════
// قرار المالك (22 تشرين الأول): **المختصُّ يتلقّى الطلبَ من المريض**، والمختبرُ يفتح خدمتَه ولا يتلقّى شيئاً. فالمختصّ:
// «تمّ السحب» ← «سلّمتُ العيّنة» إلى المختبر الذي اختاره المريض (أو يختاره هو إن قال «لا يهم») ← يُدخل النتائجَ بنفسه
// (`saveLabResults`) فيكتمل موعدُه ويُخطَر المريض. وحين لا مختبرَ مسجَّلاً يُدخلها مباشرةً بلا تسليم.

type AnalystOrder = { appointmentId: string; labOrderId: string; patientId: string; userId: string };

/** الموعدُ مُسنَدٌ إلى المستدعي (أو مدير)، وله طلبُ تحاليل */
async function requireAnalystOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  appointmentId: string,
): Promise<AnalystOrder | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'سجّل الدخول أوّلاً' };
  const [{ data: profile }, { data: appointment }] = await Promise.all([
    supabase.from('users').select('specialist_type, role').eq('id', user.id).single(),
    supabase.from('appointments')
      .select('id, user_id, lab_order_id, assigned_specialist_id, specialist_id')
      .eq('id', appointmentId).single(),
  ]);
  const admin = isAdminRole(profile?.role);
  if (!profile || (profile.specialist_type !== 'lab_analyst' && !admin)) return { error: 'لمحلّلي سحب الدم وحدهم' };
  if (!appointment) return { error: 'الطلب غير موجود' };
  if (appointment.assigned_specialist_id !== user.id && appointment.specialist_id !== user.id && !admin) {
    return { error: 'الطلب ليس مُسنَداً إليك' };
  }
  if (!appointment.lab_order_id) return { error: 'لا طلبَ تحاليل لهذا الموعد' };
  return { appointmentId, labOrderId: appointment.lab_order_id, patientId: appointment.user_id, userId: user.id };
}

/** «تمّ السحب»: من الانتظار وحده، ويُعدّ الصفّ */
export async function markSampleCollected(appointmentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const ctx = await requireAnalystOrder(supabase, appointmentId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const { data, error } = await supabase
    .from('lab_orders')
    .update({ status: 'sample_collected', updated_at: new Date().toISOString() })
    .eq('id', ctx.labOrderId)
    .eq('status', 'pending')
    .select('id');
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: 'حالةُ الطلب تغيّرت — حدّث الصفحة' };

  revalidatePath(`/specialist/orders/${appointmentId}`);
  return { ok: true };
}

/**
 * «سلّمتُ العيّنة»: إلى المختبر الذي اختاره المريض، أو — إن قال «لا يهم» — إلى مختبرٍ يختاره المختصّ.
 * المختبرُ يُتحقَّق منه على الخادم (`resolveChosenLab`: خدمةٌ مختبر معتمَدة لها تحاليل)، واسمُه من القاعدة.
 * لا يُخطَر المختبر (لا يتلقّى شيئاً في التطبيق)، ويُخطَر المريضُ أين عيّنتُه. والموعدُ يكتمل بإدخال النتائج.
 */
export async function deliverSampleToLab(
  appointmentId: string,
  pickedLabId?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const ctx = await requireAnalystOrder(supabase, appointmentId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const { data: order } = await supabase
    .from('lab_orders').select('id, status, lab_specialist_id').eq('id', ctx.labOrderId).single();
  if (!order) return { ok: false, error: 'طلبُ التحاليل غير موجود' };
  if (order.status !== 'pending' && order.status !== 'sample_collected') {
    return { ok: false, error: 'العيّنةُ سُلّمت من قبل' };
  }

  const lab = await resolveChosenLab(order.lab_specialist_id ?? pickedLabId ?? null);
  if (!lab) {
    return {
      ok: false,
      error: order.lab_specialist_id
        ? 'المختبرُ الذي اختاره المريض لم يعد متاحاً — تواصل مع الإدارة'
        : 'اختر المختبرَ الذي ستسلّمه العيّنة',
    };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('lab_orders')
    .update({ status: 'sent_to_lab', lab_specialist_id: lab.id, lab_name_snapshot: lab.name, updated_at: now })
    .eq('id', ctx.labOrderId)
    .in('status', ['pending', 'sample_collected'])
    .select('id');
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: 'حالةُ الطلب تغيّرت — حدّث الصفحة' };

  await notifyInbox([
    { user_id: ctx.patientId, title: 'وصلت عيّنتُك إلى المختبر', body: `${lab.name} يُجري تحاليلك، وتصلك النتائج في التطبيق.`, type: 'lab_sample', link: `/account/lab-history/${ctx.labOrderId}` },
  ]);

  revalidatePath(`/specialist/orders/${appointmentId}`);
  revalidatePath('/specialist/orders');
  return { ok: true };
}

/** المختصُّ يُدخل النتائج — بعد تسليم العيّنة للمختبر، أو مباشرةً حين لا مختبرَ مسجَّلاً */
export async function saveLabResults(
  appointmentId: string,
  input: LabResultInput[],
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const ctx = await requireAnalystOrder(supabase, appointmentId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const clean = sanitizeLabResults(input);
  if (!clean.ok) return { ok: false, error: clean.error };

  // لو فشل حذفُ القديم نتوقّف: المتابعةُ تُنتج نتائجَ مكرّرة يراها المريض
  const { error: deleteError } = await supabase.from('lab_results').delete().eq('lab_order_id', ctx.labOrderId);
  if (deleteError) {
    logger.error('Failed to clear previous lab results', { lab_order_id: ctx.labOrderId, error: deleteError.message });
    return { ok: false, error: 'تعذّر استبدال النتائج السابقة. حاول مرة أخرى.' };
  }

  const now = new Date().toISOString();
  const { error: insertError } = await supabase
    .from('lab_results')
    .insert(toLabResultRows(clean.results, { labOrderId: ctx.labOrderId, patientId: ctx.patientId, enteredBy: ctx.userId, at: now }));
  if (insertError) return { ok: false, error: insertError.message };

  // النتائج حُفظت. فشلُ تحديثَي الحالة لا يُلغيها، لكنّه يعني أنّ المريض لا يرى «النتائج جاهزة» — فيُسجَّل
  const { error: labOrderError } = await supabase
    .from('lab_orders').update({ status: 'results_ready', updated_at: now }).eq('id', ctx.labOrderId);
  if (labOrderError) {
    logger.error('Lab results saved but lab_order status update failed', { lab_order_id: ctx.labOrderId, error: labOrderError.message });
  }
  const { error: apptError } = await supabase
    .from('appointments').update({ status: 'completed', completed_at: now }).eq('id', appointmentId);
  if (apptError) {
    logger.error('Lab results saved but appointment status update failed', { appointment_id: appointmentId, error: apptError.message });
  }

  notifyTestResultsReady(ctx.patientId, { orderId: appointmentId }).catch(() => null);
  await notifyInbox([
    { user_id: ctx.patientId, title: 'نتائجُ تحاليلك جاهزة', body: 'أدخلها المختصّ — اضغط للعرض.', type: 'lab_results', link: `/account/lab-history/${ctx.labOrderId}` },
  ]);
  revalidatePath(`/specialist/orders/${appointmentId}`);
  revalidatePath('/account/lab-history');
  return { ok: true };
}
