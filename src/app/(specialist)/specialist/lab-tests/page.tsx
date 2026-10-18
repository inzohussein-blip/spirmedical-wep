import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LabTestsEditor from './LabTestsEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تحاليل مختبري · سباير ميديكال' };

/**
 * 🧪 «المختصّ يختار الفحوص الموجودة في مختبره» (قرار المالك، 0055). ما يختاره هنا يحدّد ظهورَ مختبره
 * للمريض في سحب الدم: يُعرض لمن اختار تحاليلَ يُجريها.
 */
export default async function LabTestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from('users').select('role, specialist_type, clinic_name, clinic_city, governorate').eq('id', user.id).single(),
    supabase.from('specialist_lab_tests').select('test_id').eq('specialist_id', user.id),
  ]);

  if (profile?.role !== 'specialist' || profile.specialist_type !== 'lab_analyst') {
    return (
      <main className="app-screen">
        <div className="scr-content" style={{ paddingTop: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>لمختصّي التحاليل</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
            هذه الصفحة يختار فيها مختصُّ التحاليل ما يُجريه مختبرُه.
          </p>
          <Link href="/specialist" style={{ display: 'inline-block', marginTop: 16, fontWeight: 700, color: 'var(--emerald)' }}>
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
