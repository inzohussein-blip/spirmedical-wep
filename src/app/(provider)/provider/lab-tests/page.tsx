import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LabTestsEditor from './LabTestsEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تحاليل مختبري · سباير ميديكال' };

/**
 * 🧪 «المختبرُ يختار الفحوصَ التي يُجريها» (قرار المالك، 0055؛ صار حسابَ «خدمة» في 0060). ما يختاره هنا يحدّد
 * ظهورَه للمريض في سحب الدم: يُعرض لمن اختار تحاليلَ يُجريها.
 */
export default async function LabTestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from('users').select('role, provider_type, clinic_name, clinic_city, governorate').eq('id', user.id).single(),
    supabase.from('specialist_lab_tests').select('test_id').eq('specialist_id', user.id),
  ]);

  if (profile?.role !== 'provider' || profile.provider_type !== 'lab') {
    return (
      <main className="app-screen">
        <div className="scr-content" style={{ paddingTop: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>لحسابات المختبرات</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
            هذه الصفحة يختار فيها المختبرُ التحاليلَ التي يُجريها.
          </p>
          <Link href="/provider" style={{ display: 'inline-block', marginTop: 16, fontWeight: 700, color: 'var(--emerald)' }}>
            العودة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <LabTestsEditor
      initialTests={(rows ?? []).map((r) => r.test_id)}
      initialName={profile.clinic_name ?? ''}
      initialCity={profile.clinic_city ?? profile.governorate ?? ''}
    />
  );
}
