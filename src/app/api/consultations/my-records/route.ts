import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/consultations/my-records
 * إرجاع السجلات الطبية الخاصة بالمستخدم لمشاركتها مع الطبيب
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ records: [] }, { status: 401 });
  }

  const records: Array<{
    id: string;
    type: string;
    title: string;
    date: string;
    summary?: string;
  }> = [];

  // ─── المواعيد المكتملة ───
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, service_type, scheduled_at, status, notes')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })
    .limit(20);

  for (const a of (appointments || [])) {
    records.push({
      id: a.id,
      type: 'appointment',
      title: a.service_type || 'موعد',
      date: a.scheduled_at,
      summary: a.notes ? a.notes.slice(0, 60) : undefined,
    });
  }

  // ─── زيارات التمريض ───
  const { data: nursingVisits } = await supabase
    .from('nursing_visit_history')
    .select('id, procedure_type, performed_at, notes')
    .eq('user_id', user.id)
    .order('performed_at', { ascending: false })
    .limit(20);

  for (const v of (nursingVisits || [])) {
    records.push({
      id: v.id,
      type: 'nursing_visit',
      title: getNursingLabel(v.procedure_type),
      date: v.performed_at,
      summary: v.notes ? v.notes.slice(0, 60) : undefined,
    });
  }

  // ترتيب حسب التاريخ
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ records: records.slice(0, 30) });
}

function getNursingLabel(procedureType: string): string {
  const labels: Record<string, string> = {
    injection: 'زرق إبر',
    iv: 'تركيب مغذٍ وريدي',
    cannula: 'تركيب كانيولا',
    wound_care: 'تضميد جروح',
    diabetic_foot: 'القدم السكري',
    catheter: 'قسطرة بولية',
    vaccination: 'تطعيمات',
  };
  return labels[procedureType] || 'زيارة تمريض';
}
