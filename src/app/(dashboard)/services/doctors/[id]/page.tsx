// ═══════════════════════════════════════════════════════════════
// 👨‍⚕️ صفحة تفاصيل الطبيب (V25.9)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import DoctorDetailClient from './DoctorDetailClient';

export const dynamic = 'force-dynamic';

export default async function DoctorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!doctor) notFound();

  // تحقّق من الاشتراك الحالي
  const { data: { user } } = await supabase.auth.getUser();
  let activeSubscription = null;
  if (user) {
    const { data } = await supabase
      .from('doctor_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('doctor_id', params.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();
    activeSubscription = data;
  }

  return (
    <DoctorDetailClient
      doctor={doctor}
      activeSubscription={activeSubscription}
    />
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: d } = await supabase
    .from('doctors')
    .select('full_name, specialty, title')
    .eq('id', params.id)
    .single();
  return { title: d ? `${d.title} ${d.full_name} - Spir Medical` : 'طبيب' };
}
