import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appointmentUpdateSchema } from '@/lib/validations/appointment';
import { sendRatingRequestEmail } from '@/lib/email/actions';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/appointments/:id
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id) // RLS يحمي أيضاً، هذا تأكيد إضافي
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'الحجز غير موجود' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

/**
 * PATCH /api/appointments/:id
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'صيغة JSON غير صحيحة' }, { status: 400 });
  }

  const validation = appointmentUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'بيانات غير صحيحة', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(validation.data)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'فشل التحديث أو الحجز غير موجود' },
      { status: 404 }
    );
  }

  // 📧 إرسال إيميل طلب تقييم إذا اكتمل الموعد (fire-and-forget)
  if (data.status === 'completed') {
    sendRatingRequestEmail(data.id).catch(() => null);
  }

  return NextResponse.json({ data });
}

/**
 * DELETE /api/appointments/:id
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 401 });
  }

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      { error: 'فشل الحذف' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
