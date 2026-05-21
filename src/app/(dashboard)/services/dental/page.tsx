// ═══════════════════════════════════════════════════════════════
// 🦷 خدمة طب الأسنان (V25.19)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import DentalClient from './DentalClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'طب الأسنان - Spir Medical',
  description: 'دليل أفضل عيادات الأسنان في العراق - تقويم، زراعة، تبييض، علاج عصب',
};

export default async function DentalPage() {
  const supabase = createClient();

  const { data: clinics } = await supabase
    .from('dental_clinics')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating_avg', { ascending: false })
    .limit(100);

  return <DentalClient clinics={clinics || []} />;
}
