// ═══════════════════════════════════════════════════════════════
// 📜 سجل الزيارات التمريضية للمريض (V25.6)
// ═══════════════════════════════════════════════════════════════
// عرض كل الزيارات السابقة مع تفاصيلها الكاملة
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NursingHistoryClient from './NursingHistoryClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'سجل التمريض - Spir Medical' };

export default async function NursingHistoryPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ─── جلب السجل ───
  const { data: visits } = await supabase
    .from('nursing_visit_history')
    .select('*')
    .eq('user_id', user.id)
    .order('performed_at', { ascending: false })
    .limit(50);

  // ─── جلب الممرضين ───
  const specialistIds = [...new Set((visits || []).map(v => v.specialist_id).filter(Boolean))];
  const { data: specialists } = specialistIds.length > 0
    ? await supabase
        .from('users')
        .select('id, full_name')
        .in('id', specialistIds as string[])
    : { data: [] };

  const specialistsMap = Object.fromEntries(
    (specialists || []).map(s => [s.id, s])
  );

  return (
    <NursingHistoryClient
      visits={visits || []}
      specialistsMap={specialistsMap}
    />
  );
}
