'use server';

import { createClient } from '@/lib/supabase/server';
import { appointmentSchema, validateAppointmentV2Server } from '@/lib/validations/appointment';
import { validateBloodDrawServer } from '@/lib/validations/blood-draw';
import { validateNursingServer } from '@/lib/validations/nursing';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { encrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { sendAppointmentConfirmedEmail } from '@/lib/email/actions';
import { notifyOrderConfirmed } from '@/lib/services/push-templates';
import { sendAppointmentConfirmedWA, isWhatsAppEnabled } from '@/lib/services/whatsapp';
import {
  sendOtp as sendOtpService,
  verifyOtp as verifyOtpService,
} from '@/lib/whatsapp/otp-service';

interface CreateAppointmentInput {
  service_id: string;
  service_name: string;
  scheduled_at: string;
  address?: string;
  notes?: string;
  duration: number;
  needs_address: boolean;
  otp_channel: 'whatsapp' | 'telegram';
  otp_verified: boolean;
  // ✨ GPS Location (V25 - Free Medical Map)
  location_lat?: number;
  location_lng?: number;
  location_accuracy_m?: number;
  // ✨ V25.8: Family member (null = self)
  family_member_id?: string | null;
}

export async function createAppointmentV2(input: CreateAppointmentInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: 'يجب تسجيل الدخول أولاً',
      redirect: '/login',
    };
  }

  if (!input.otp_verified) {
    return {
      success: false,
      error: 'يجب تأكيد رقم الهاتف أولاً',
    };
  }

  // Rate limit: ١٠ حجوزات / ساعة
  const limit = await checkRateLimit(`appointment:create:${user.id}`, {
    max: 10,
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    return {
      success: false,
      error: `عدد كبير من الحجوزات. حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`,
    };
  }

  // إذا كانت خدمة عن بُعد: استخدم نص بديل بدلاً من null
  const finalAddress = input.address && input.address.length >= 10
    ? input.address
    : 'خدمة عن بُعد · بدون عنوان';

  // Validation — يُرجع أخطاء الحقول (لتوحيد «رفع الطلبات»)
  const v2Input = {
    service_type: input.service_name,
    scheduled_at: input.scheduled_at,
    address: finalAddress,
    notes: input.notes,
  };
  const v2 = validateAppointmentV2Server(v2Input);
  if (!v2.ok) {
    return {
      success: false,
      error: Object.values(v2.fieldErrors)[0] || 'تحقّق من البيانات',
      fieldErrors: v2.fieldErrors,
    };
  }

  // تشفير الملاحظات الطبية الحساسة
  const notesEncrypted = input.notes ? encrypt(input.notes) : null;

  // إنشاء الحجز
  // الأعمدة الجديدة (service_id/estimated_price/duration_minutes/otp_channel)
  // تُحفظ كـ any لأنها مُضافة عبر migration وليست في types/database.ts بعد
  const insertData: any = {
    user_id: user.id,
    service_type: input.service_name,
    scheduled_at: input.scheduled_at,
    address: finalAddress,
    notes_encrypted: notesEncrypted,
    status: 'pending' as const,
  };

  // إضافة الأعمدة الجديدة فقط إذا تم تشغيل الـ migration
  if (input.service_id) insertData.service_id = input.service_id;
  if (input.duration) insertData.duration_minutes = input.duration;
  if (input.otp_channel) insertData.otp_channel = input.otp_channel;

  // ✨ V25: حفظ إحداثيات GPS لو المريض التقطها
  if (
    typeof input.location_lat === 'number' &&
    typeof input.location_lng === 'number'
  ) {
    insertData.location_lat = input.location_lat;
    insertData.location_lng = input.location_lng;
    if (typeof input.location_accuracy_m === 'number') {
      insertData.location_accuracy_m = input.location_accuracy_m;
    }
    insertData.location_captured_at = new Date().toISOString();
  }

  // ✨ V25.8: Family member
  if (input.family_member_id) {
    // تحقق أن الفرد فعلاً يعود لهذا المستخدم
    const { data: member } = await supabase
      .from('family_members')
      .select('id')
      .eq('id', input.family_member_id)
      .eq('owner_user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (member) {
      insertData.family_member_id = input.family_member_id;
    }
  }

  const { data: created, error } = await supabase
    .from('appointments')
    .insert(insertData)
    .select()
    .single();

  if (error || !created) {
    logger.error('Create appointment failed', {
      user_id: user.id,
      error: error?.message,
    });
    return {
      success: false,
      error: 'فشل إنشاء الحجز. حاول مرة أخرى',
    };
  }

  // Audit log
  const ip = headers().get('x-forwarded-for') ?? 'unknown';
  await logAuditEvent({
    action: 'appointment.create',
    user_id: user.id,
    entity_type: 'appointment',
    entity_id: created.id,
    metadata: {
      ip,
      service_id: input.service_id,
      otp_channel: input.otp_channel,
    },
  });

  // 📧 إرسال إيميل تأكيد (fire-and-forget)
  sendAppointmentConfirmedEmail(created.id).catch(() => null);

  // ✨ V25.3: Push notification (fire-and-forget)
  notifyOrderConfirmed(user.id, {
    orderId: created.id,
    serviceName: input.service_name,
    scheduledAt: input.scheduled_at,
  }).catch(() => null);

  // ✨ V25.10: WhatsApp Business API (fire-and-forget)
  // ملاحظة: هذه هي القناة الحقيقية الوحيدة لإرسال التأكيد (Meta template API)
  let confirmationSent = false;
  if (isWhatsAppEnabled()) {
    const { data: userData } = await supabase
      .from('users')
      .select('phone, full_name')
      .eq('id', user.id)
      .single();

    if (userData?.phone) {
      confirmationSent = true;
      sendAppointmentConfirmedWA({
        phone: userData.phone,
        patientName: userData.full_name || 'عزيزي',
        serviceName: input.service_name,
        scheduledDate: new Date(input.scheduled_at).toLocaleDateString('ar-IQ', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      }).catch((e) => {
        logger.warn('WhatsApp confirmation failed', {
          appointment_id: created.id,
          error: e instanceof Error ? e.message : String(e),
        });
      });
    }
  }

  logger.info('Appointment created', {
    user_id: user.id,
    appointment_id: created.id,
    service: input.service_id,
    confirmation_channel: confirmationSent ? input.otp_channel : 'none',
  });

  revalidatePath('/dashboard');
  revalidatePath('/appointments');

  // رسالة نجاح دقيقة: نَعِد بالإشعار فقط إن كان سيُرسل فعلاً
  const channelLabel = input.otp_channel === 'whatsapp' ? 'WhatsApp' : 'Telegram';
  return {
    success: true,
    appointmentId: created.id,
    message: confirmationSent
      ? `تم تأكيد الحجز · ستصلك التفاصيل عبر ${channelLabel}`
      : 'تم تأكيد الحجز بنجاح',
  };
}

// ════════════════════════════════════════════════════════════════════
// OTP تأكيد رقم الهاتف قبل الحجز — يستخدم الخدمة الحقيقية (Meta) لا محاكاة.
// لا يوجد أي رمز خلفي؛ التوليد/التخزين/التحقق يتم في otp-service (bcrypt + DB).
// ════════════════════════════════════════════════════════════════════

const OTP_PURPOSE = 'verify_phone' as const;

export async function sendOtpAction(
  phone: string,
  channel: 'whatsapp' | 'telegram'
) {
  const hdrs = headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    hdrs.get('x-real-ip') ||
    'unknown';

  // حد إضافي حسب الـ IP (فوق الحد لكل رقم داخل الخدمة)
  const ipLimit = await checkRateLimit(`otp:send:ip:${ip}`, {
    max: 10,
    windowSeconds: 900,
  });
  if (!ipLimit.allowed) {
    return {
      success: false,
      error: `محاولات كثيرة. حاول بعد ${Math.ceil(ipLimit.retryAfterSeconds / 60)} دقيقة`,
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await sendOtpService({
    phone,
    channel,
    userId: user?.id,
    purpose: OTP_PURPOSE,
    ipAddress: ip,
    userAgent: hdrs.get('user-agent') ?? undefined,
  });

  if (!result.success) {
    return { success: false, error: result.error || 'فشل إرسال الرمز' };
  }

  return {
    success: true,
    message: `تم إرسال الرمز إلى ${channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'}`,
    expiresIn: 300,
  };
}

export async function verifyOtpAction(phone: string, code: string) {
  const result = await verifyOtpService({
    phone,
    code,
    purpose: OTP_PURPOSE,
  });

  if (!result.success) {
    return { success: false, error: result.error || 'الرمز غير صحيح' };
  }

  return { success: true };
}

// النسخة القديمة - للتوافق مع الكود القديم إن وُجد
export async function createAppointment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('يجب تسجيل الدخول أولاً'));
  }

  const limit = await checkRateLimit(`appointment:create:${user.id}`, {
    max: 10,
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    redirect(
      '/appointments/new?error=' +
        encodeURIComponent(`حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`)
    );
  }

  const data = {
    service_type: formData.get('service_type') as string,
    scheduled_at: formData.get('scheduled_at') as string,
    address: formData.get('address') as string,
    notes: (formData.get('notes') as string) || undefined,
  };

  const validation = appointmentSchema.safeParse(data);
  if (!validation.success) {
    redirect(
      '/appointments/new?error=' +
        encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const notesEncrypted = validation.data.notes
    ? encrypt(validation.data.notes)
    : null;

  const { data: created, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      service_type: validation.data.service_type,
      scheduled_at: validation.data.scheduled_at,
      address: validation.data.address,
      notes_encrypted: notesEncrypted,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !created) {
    logger.error('Create appointment failed', {
      user_id: user.id,
      error: error?.message,
    });
    redirect(
      '/appointments/new?error=' + encodeURIComponent('فشل إنشاء الحجز')
    );
  }

  const ip = headers().get('x-forwarded-for') ?? 'unknown';
  await logAuditEvent({
    action: 'appointment.create',
    user_id: user.id,
    entity_type: 'appointment',
    entity_id: created.id,
    metadata: { ip, service_type: created.service_type },
  });

  // ✨ V25.3: Push notification (legacy path)
  notifyOrderConfirmed(user.id, {
    orderId: created.id,
    serviceName: validation.data.service_type,
    scheduledAt: validation.data.scheduled_at,
  }).catch(() => null);

  revalidatePath('/dashboard');
  revalidatePath('/appointments');
  redirect('/appointments');
}

// ═══════════════════════════════════════════════════════════════════════════
// 🩸 V25.43: createBloodDrawOrder - حجز سحب دم + تحاليل (structured)
// ═══════════════════════════════════════════════════════════════════════════
// بدل ما نحفظ كل البيانات في notes كنص، نُنشئ:
//   1. lab_order (مع test_ids[], lab_id, patient_info)
//   2. appointment (مرتبط بـ lab_order_id)
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateBloodDrawInput {
  // البيانات الأساسية
  scheduled_at: string;
  address: string;
  otp_channel: 'whatsapp' | 'telegram';
  otp_verified: boolean;
  
  // التحاليل
  test_ids: string[];
  bundle_id: string | null;
  
  // المختبر
  partner_lab_id: string | null;
  lab_name_snapshot: string;
  // 🆕 V31: slug للبحث عن المختبر الحقيقي في DB (إن توفّر)
  lab_slug?: string | null;
  
  // بيانات المريض
  patient_age?: number;
  patient_gender?: 'male' | 'female';
  patient_condition?: string;
  
  // الصيام
  needs_fasting: boolean;
  fasting_hours: number;
  
  // التسعير
  draw_fee: number;
  tests_total: number;
  discount: number;
  total_price: number;
  
  // متوقع النتيجة
  expected_result_at?: string;
  
  // اختياري
  family_member_id?: string | null;
  notes?: string;
  
  // GPS
  location_lat?: number;
  location_lng?: number;
  location_accuracy_m?: number;
  
  // duration للموعد
  duration: number;
}

export async function createBloodDrawOrder(input: CreateBloodDrawInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: 'يجب تسجيل الدخول أولاً',
      redirect: '/login',
    };
  }

  if (!input.otp_verified) {
    return {
      success: false,
      error: 'يجب تأكيد رقم الهاتف أولاً',
    };
  }

  // Rate limit
  const limit = await checkRateLimit(`blood-draw:create:${user.id}`, {
    max: 5,
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    return {
      success: false,
      error: `عدد كبير من الطلبات. حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`,
    };
  }

  // Validation — نفس مخطّط العميل (مصدر واحد) + إرجاع أخطاء الحقول
  const validation = validateBloodDrawServer({
    tests: input.test_ids ?? [],
    address: input.address ?? '',
  });
  if (!validation.ok) {
    return {
      success: false,
      error: Object.values(validation.fieldErrors)[0] || 'تحقّق من البيانات',
      fieldErrors: validation.fieldErrors,
    };
  }

  // 🔧 V32 FIX: تطبيع scheduled_at لصيغة ISO كاملة (UTC مع Z).
  // المشكلة: BloodDrawFlow يبني "2026-06-01T10:00:00" (بلا timezone)،
  // والفلتر في صفحة الطلبات يقارن مع now() بـ UTC → الطلب قد لا يظهر
  // في تبويب "القادمة" بسبب اختلاف التوقيت. نُحوّله لـ ISO صريح.
  let normalizedScheduledAt = input.scheduled_at;
  try {
    const d = new Date(input.scheduled_at);
    if (!isNaN(d.getTime())) {
      normalizedScheduledAt = d.toISOString();
    }
  } catch {
    // إبقاء القيمة الأصلية لو فشل التحويل
  }

  try {
    // ─── 1. أنشئ lab_order أولاً ───
    // ملاحظة: lab_orders, lab_results, partner_labs ستُضاف لـ Database types
    // بعد تشغيل migration 38. حالياً نستخدم `as any` للالتفاف على types.
        const supabaseAny = supabase as any;

    // 🆕 V31: حُلّ partner_lab_id الحقيقي من الـ slug (migration 47)
    // لو الـ UI مرّر slug ('medcare', 'al-hayat'...) نبحث عن الـ UUID في DB.
    let resolvedLabId: string | null = input.partner_lab_id;
    if (!resolvedLabId && input.lab_slug && input.lab_slug !== 'any') {
      const { data: labRow } = await supabaseAny
        .from('partner_labs')
        .select('id')
        .eq('slug', input.lab_slug)
        .maybeSingle();
      if (labRow?.id) resolvedLabId = labRow.id as string;
    }

    const { data: labOrder, error: labOrderError } = await supabaseAny
      .from('lab_orders')
      .insert({
        user_id: user.id,
        family_member_id: input.family_member_id || null,
        test_ids: input.test_ids,
        bundle_id: input.bundle_id,
        partner_lab_id: resolvedLabId,
        lab_name_snapshot: input.lab_name_snapshot,
        patient_age: input.patient_age || null,
        patient_gender: input.patient_gender || null,
        patient_condition: input.patient_condition || null,
        needs_fasting: input.needs_fasting,
        fasting_hours: input.fasting_hours,
        draw_fee: input.draw_fee,
        tests_total: input.tests_total,
        discount: input.discount,
        total_price: input.total_price,
        expected_result_at: input.expected_result_at || null,
        notes: input.notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (labOrderError || !labOrder) {
      logger.error('Failed to create lab_order', { error: labOrderError });
      return { success: false, error: 'فشل إنشاء طلب التحاليل. حاول مرة أخرى.' };
    }

    // ─── 2. أنشئ appointment مرتبط ───
    const encryptedNotes = input.notes ? encrypt(input.notes) : null;

    const appointmentData: Record<string, unknown> = {
      user_id: user.id,
      service_type: 'سحب دم + تحاليل',
      service_id: 'blood-draw',
      scheduled_at: normalizedScheduledAt,
      address: input.address,
      notes_encrypted: encryptedNotes,
      estimated_price: input.total_price,
      duration_minutes: input.duration,
      otp_channel: input.otp_channel,
      status: 'pending',
      required_specialist_type: 'lab_analyst',
      lab_order_id: labOrder.id,  // ← الربط!
    };

    if (input.location_lat !== undefined && input.location_lng !== undefined) {
      appointmentData.location_lat = input.location_lat;
      appointmentData.location_lng = input.location_lng;
      appointmentData.location_accuracy_m = input.location_accuracy_m || null;
    }

    const { data: appointment, error: appointmentError } = await supabaseAny
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError || !appointment) {
      // تراجع: احذف lab_order الذي أنشأناه
      await supabaseAny.from('lab_orders').delete().eq('id', labOrder.id);
      logger.error('Failed to create appointment', { error: appointmentError });
      return { success: false, error: 'فشل إنشاء الموعد. حاول مرة أخرى.' };
    }

    // ─── 3. ربط الموعد بـ lab_order ───
    await supabaseAny
      .from('lab_orders')
      .update({ appointment_id: appointment.id })
      .eq('id', labOrder.id);

    // ─── 4. Audit log ───
    await logAuditEvent({
      user_id: user.id,
      action: 'blood_draw.create',
      entity_type: 'lab_orders',
      entity_id: labOrder.id,
      metadata: {
        test_count: input.test_ids.length,
        total_price: input.total_price,
        partner_lab_id: input.partner_lab_id,
      },
    }).catch(() => null);

    // ─── 5. Notifications (best-effort) ───
    notifyOrderConfirmed(user.id, {
      orderId: appointment.id,
      serviceName: 'سحب دم + تحاليل',
      scheduledAt: input.scheduled_at,
    }).catch(() => null);

    // ملاحظة: WhatsApp notification متروك لـ trigger في DB أو background job
    // (الـ signature يتطلّب phone + patientName اللي مش متاح هنا مباشرة)

    revalidatePath('/dashboard');
    revalidatePath('/appointments');
    revalidatePath('/account/lab-history');

    return {
      success: true,
      appointment_id: appointment.id,
      lab_order_id: labOrder.id,
    };
  } catch (error) {
    logger.error('createBloodDrawOrder unexpected error', { error });
    return { success: false, error: 'حدث خطأ غير متوقّع. حاول مرة أخرى.' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 💉 V25.44: createNursingAppointment - حجز تمريض منزلي (structured)
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateNursingInput {
  // الأساسيات
  scheduled_at: string;
  address: string;
  otp_channel: 'whatsapp' | 'telegram';
  otp_verified: boolean;
  duration: number;
  total_price: number;
  
  // إجراء التمريض (structured)
  procedure_type: string;        // 'injection', 'iv', 'wound_care', etc.
  procedure_label: string;       // 'زرق إبر', 'مغذٍ وريدي', etc.
  
  // الكادر (structured)
  nurse_gender_preference: 'male' | 'female' | 'any';
  
  // التحسس (structured JSONB)
  allergy_form: {
    penicillin?: boolean;
    sulfa?: boolean;
    aspirin?: boolean;
    iodine?: boolean;
    latex?: boolean;
    other?: string;
    filled_at: string;
  };
  
  // الوصفة (structured)
  prescription_image_url?: string;
  prescription_skipped?: boolean;
  
  // الأمراض المعدية (structured JSONB)
  infectious_disease_alert?: {
    hepatitis_b?: boolean;
    hepatitis_c?: boolean;
    hiv?: boolean;
    covid?: boolean;
    tb?: boolean;
    other?: string;
  };
  
  // الجدولة الدورية (structured JSONB)
  recurring_schedule?: {
    enabled: boolean;
    interval_hours: number;
    end_date?: string;
    auto_confirm?: boolean;
  };
  
  // المستلزمات (structured JSONB)
  supplies_request?: {
    items: Array<{ name: string; quantity: number }>;
    total: number;
  };
  
  // إضافي
  notes?: string;
  family_member_id?: string | null;
  
  // GPS
  location_lat?: number;
  location_lng?: number;
  location_accuracy_m?: number;
}

export async function createNursingAppointment(input: CreateNursingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً', redirect: '/login' };
  }

  if (!input.otp_verified) {
    return { success: false, error: 'يجب تأكيد رقم الهاتف أولاً' };
  }

  // Rate limit
  const limit = await checkRateLimit(`nursing:create:${user.id}`, {
    max: 10,
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    return {
      success: false,
      error: `عدد كبير من الطلبات. حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`,
    };
  }

  // Validation — نفس مخطّط العميل + إرجاع أخطاء الحقول
  const nursingValidation = validateNursingServer({
    procedure_type: input.procedure_type,
    address: input.address,
  });
  if (!nursingValidation.ok) {
    return {
      success: false,
      error: Object.values(nursingValidation.fieldErrors)[0] || 'تحقّق من البيانات',
      fieldErrors: nursingValidation.fieldErrors,
    };
  }

  try {
    // ─── حفظ في appointments بـ structured columns ───
    const encryptedNotes = input.notes ? encrypt(input.notes) : null;

    
    const supabaseAny = supabase as unknown as {
      from: (t: string) => {
        insert: (d: object) => { select: () => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
      };
    };

    const appointmentData = {
      user_id: user.id,
      service_type: input.procedure_label,
      service_id: 'home-nursing',
      scheduled_at: input.scheduled_at,
      address: input.address,
      notes_encrypted: encryptedNotes,
      estimated_price: input.total_price,
      duration_minutes: input.duration,
      otp_channel: input.otp_channel,
      status: 'pending',
      required_specialist_type: 'nurse',
      family_member_id: input.family_member_id || null,
      
      // ─── Structured columns (V25.44) ───
      nurse_gender_preference: input.nurse_gender_preference,
      allergy_form: input.allergy_form,
      allergy_form_filled: true,
      prescription_image_url: input.prescription_image_url || null,
      prescription_required: !input.prescription_skipped,
      infectious_disease_alert: input.infectious_disease_alert || null,
      recurring_schedule: input.recurring_schedule || null,
      supplies_request: input.supplies_request || null,
      supplies_total: input.supplies_request?.total || 0,
      
      // GPS
      location_lat: input.location_lat || null,
      location_lng: input.location_lng || null,
      location_accuracy_m: input.location_accuracy_m || null,
    };

    const { data: appointment, error: appointmentError } = await supabaseAny
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError || !appointment) {
      logger.error('Failed to create nursing appointment', { error: appointmentError });
      return { success: false, error: 'فشل إنشاء الموعد. حاول مرة أخرى.' };
    }

    // Audit log
    await logAuditEvent({
      user_id: user.id,
      action: 'nursing.create',
      entity_type: 'appointments',
      entity_id: appointment.id,
      metadata: {
        procedure_type: input.procedure_type,
        nurse_gender: input.nurse_gender_preference,
        total_price: input.total_price,
        has_recurring: !!input.recurring_schedule?.enabled,
        has_infectious: !!input.infectious_disease_alert,
        has_allergies: Object.values(input.allergy_form).some((v) => v === true || (typeof v === 'string' && v.length > 0)),
      },
    }).catch(() => null);

    // Notifications
    notifyOrderConfirmed(user.id, {
      orderId: appointment.id,
      serviceName: input.procedure_label,
      scheduledAt: input.scheduled_at,
    }).catch(() => null);

    revalidatePath('/dashboard');
    revalidatePath('/appointments');
    revalidatePath('/account/nursing-history');

    return {
      success: true,
      appointment_id: appointment.id,
    };
  } catch (error) {
    logger.error('createNursingAppointment unexpected error', { error });
    return { success: false, error: 'حدث خطأ غير متوقّع. حاول مرة أخرى.' };
  }
}
