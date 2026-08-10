// ═══════════════════════════════════════════════════════════════
// 🏥 صفحة المستشفيات (V25.9) - Real DB + Map
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { oneOfOr } from '@/lib/format/vocabulary';
import HospitalsClient from './HospitalsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'المستشفيات - Spir Medical' };

const HOSPITAL_TYPES = ['government', 'private', 'health_center', 'specialized'] as const;

export default async function HospitalsPage() {
  const supabase = createClient();

  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('*')
    .eq('is_active', true)
    .order('type')
    .order('name')
    .limit(200);

  // `type` محروس بقيد CHECK في القاعدة، لكنّ مولّد الأنواع لا يقرأ CHECK
  return (
    <HospitalsClient
      hospitals={(hospitals ?? []).map((h) => ({
        ...h,
        type: oneOfOr(HOSPITAL_TYPES, h.type, 'private'),
      }))}
    />
  );
}
