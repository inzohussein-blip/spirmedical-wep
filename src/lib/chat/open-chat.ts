import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * ════════════════════════════════════════════════════════════════════
 * 💬 فتح محادثة المريض مع مختصّ موعده (إيجاد أو إنشاء)
 * ════════════════════════════════════════════════════════════════════
 *
 * الخلفية: لم يكن في المشروع **أيّ** مسارٍ يُنشئ صفّاً في `chats` — لا في
 * TypeScript ولا عبر دالة/مشغّل في SQL. الدالة الوحيدة التي تفعل ذلك
 * (`createChat` في صندوق المختصّ) لم تكن مستدعاة من أي مكان، وكانت تفترض
 * أنّ المستخدم الحالي هو المريض دائماً (`patient_id: user.id`) رغم موقعها
 * في مسار المختصّ. فالنتيجة أنّ **لا محادثة يمكن أن توجد**: صندوق الوارد
 * و`ChatList` وإرسال الرسائل كلّها تقرأ من جدولٍ يستحيل امتلاؤه، ورابطا
 * `LiveStatusCard` و`OrderTrackClient` يفضيان إلى قائمةٍ فارغة أبداً.
 *
 * المدخل الطبيعي هو الموعد: المريض يراسل المختصّ المُسنَد إليه.
 */

export type OpenChatResult =
  | { chatId: string }
  | { error: string };

export async function openChatForAppointment(
  appointmentId: string
): Promise<OpenChatResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'يجب تسجيل الدخول' };

  // الموعد يخصّ هذا المريض؟ (الفلترة على user_id تمنع فتح محادثة عن موعد غيره)
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select('id, user_id, specialist_id, assigned_specialist_id')
    .eq('id', appointmentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (apptError) {
    logger.warn('openChatForAppointment: appointment lookup failed', {
      error: apptError.message,
    });
    return { error: 'تعذّر فتح المحادثة' };
  }

  if (!appointment) return { error: 'الطلب غير موجود' };

  const specialistId =
    appointment.assigned_specialist_id ?? appointment.specialist_id;

  if (!specialistId) {
    return { error: 'لم يُعيَّن مختصّ لهذا الطلب بعد' };
  }

  // محادثة قائمة مع المختصّ نفسه؟ نُعيد استعمالها بدل فتح واحدة لكل موعد
  const { data: existing } = await supabase
    .from('chats')
    .select('id')
    .eq('patient_id', user.id)
    .eq('specialist_id', specialistId)
    .maybeSingle();

  if (existing) return { chatId: existing.id };

  const { data: created, error: insertError } = await supabase
    .from('chats')
    .insert({
      patient_id: user.id,
      specialist_id: specialistId,
      appointment_id: appointment.id,
      status: 'open',
      priority: 'normal',
      tags: [],
    })
    .select('id')
    .single();

  if (insertError || !created) {
    logger.error('openChatForAppointment: chat insert failed', {
      error: insertError?.message,
    });
    return { error: 'تعذّر إنشاء المحادثة' };
  }

  return { chatId: created.id };
}
