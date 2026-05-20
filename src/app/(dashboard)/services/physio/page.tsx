// ═══════════════════════════════════════════════════════════════
// 🦾 خدمة العلاج الفيزيائي (V25.14)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import PhysioClient from './PhysioClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'العلاج الفيزيائي - Spir Medical' };

export default async function PhysioPage() {
  const supabase = createClient();

  const [{ data: serviceTypes }, { data: specialists }] = await Promise.all([
    supabase
      .from('physio_service_types')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    supabase
      .from('physio_specialists')
      .select('*')
      .eq('is_active', true)
      .order('rating_avg', { ascending: false })
      .limit(50),
  ]);

  return (
    <PhysioClient
      serviceTypes={serviceTypes || []}
      specialists={specialists || []}
    />
  );
}
