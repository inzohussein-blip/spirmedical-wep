import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appointmentSchema } from '@/lib/validations/appointment';

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

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...validation.data,
      user_id: user.id,
      status: 'pending',
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
