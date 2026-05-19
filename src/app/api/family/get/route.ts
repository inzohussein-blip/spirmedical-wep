import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/family/get?id=...
 * إرجاع بيانات فرد عائلة معيّن
 * يستطيع رؤيته:
 *   - صاحب الحساب
 *   - المختص الذي لديه طلب لهذا الفرد (عبر RLS)
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('id, full_name, relation, gender, date_of_birth, blood_type, chronic_conditions, allergies, avatar_emoji')
    .eq('id', id)
    .maybeSingle();

  // RLS سيتولّى التحقق من الصلاحية
  return NextResponse.json({ member });
}
