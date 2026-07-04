// ═══════════════════════════════════════════════════════════════
// 👨‍👩‍👧‍👦 صفحة إدارة العائلة (V25.8)
// ═══════════════════════════════════════════════════════════════
// إضافة/تعديل/حذف أفراد العائلة + عرض طلباتهم
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FamilyClient from './FamilyClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'العائلة - Spir Medical' };

export default async function FamilyPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // جلب أفراد العائلة
  const { data: members } = await supabase
    .from('family_members')
    .select('*')
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  // جلب عدد الطلبات لكل فرد
  const memberIds = (members || []).map(m => m.id);
  const { data: appointments } = memberIds.length > 0
    ? await supabase
        .from('appointments')
        .select('family_member_id, status, service_type')
        .in('family_member_id', memberIds)
    : { data: [] };

  // حساب عدد الطلبات لكل فرد
  const appointmentsCounts: Record<string, { total: number; completed: number; pending: number }> = {};
  (appointments || []).forEach(a => {
    if (!a.family_member_id) return;
    if (!appointmentsCounts[a.family_member_id]) {
      appointmentsCounts[a.family_member_id] = { total: 0, completed: 0, pending: 0 };
    }
    appointmentsCounts[a.family_member_id].total++;
    if (a.status === 'completed') {
      appointmentsCounts[a.family_member_id].completed++;
    } else if (['pending', 'confirmed', 'in_progress'].includes(a.status)) {
      appointmentsCounts[a.family_member_id].pending++;
    }
  });

  return (
    <FamilyClient
      members={members || []}
      appointmentsCounts={appointmentsCounts}
    />
  );
}
