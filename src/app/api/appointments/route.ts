import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appointmentSchema } from '@/lib/validations/appointment';
import { getServiceById } from '@/lib/services/services-data';
import { logger } from '@/lib/logger';

/**
 * GET /api/appointments
 * يُرجع كل حجوزات المستخدم الحالي
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'غير مصرّح' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: false });

  if (status) {
    query = query.eq('status', status as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled');
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/appointments
 * إنشاء حجز جديد
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'غير مصرّح' },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'صيغة JSON غير صحيحة' },
      { status: 400 }
    );
  }

  const validation = appointmentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'بيانات غير صحيحة', details: validation.error.errors },
      { status: 400 }
    );
  }

  // 🔑 ظهور الطلب لدى المختصّين: طابور المختصّ يفلتر على
  // `required_specialist_type`. هذا المسار كان لا يضبطه **ولا يضبط
  // `service_id`**، فحتى المشغّل `trg_auto_required_specialist` لا يعمل
  // (شرطه `service_id IS NOT NULL`) — فيبقى العمود فارغاً والطلب **لا يراه
  // أيّ مختصّ إطلاقاً**. نشتقّه من الكتالوج تماماً كـ`createAppointmentV2`.
  const { service_id: serviceId, ...appointmentFields } = validation.data;
  const specialistType = serviceId
    ? getServiceById(serviceId)?.specialistType
    : undefined;

  if (!serviceId) {
    logger.info('Appointment created without service_id', {
      service_type: appointmentFields.service_type,
    });
  } else if (!specialistType) {
    // خدمة تُنفَّذ في منشأة — نُسجّلها كي لا يكون الغياب صامتاً
    logger.info('Appointment created without required_specialist_type', {
      service_id: serviceId,
    });
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...appointmentFields,
      user_id: user.id,
      status: 'pending' as const,
      ...(serviceId ? { service_id: serviceId } : {}),
      ...(specialistType ? { required_specialist_type: specialistType } : {}),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
