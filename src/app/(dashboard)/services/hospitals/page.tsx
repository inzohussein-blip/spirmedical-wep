// ═══════════════════════════════════════════════════════════════
// 🏥 صفحة المستشفيات (V25.9) - Real DB + Map
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import HospitalsClient from './HospitalsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'المستشفيات - Spir Medical' };

export default async function HospitalsPage() {
  const supabase = createClient();

  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('*')
    .eq('is_active', true)
    .order('type')
    .order('name')
    .limit(200);

  return <HospitalsClient hospitals={hospitals || []} />;
}
