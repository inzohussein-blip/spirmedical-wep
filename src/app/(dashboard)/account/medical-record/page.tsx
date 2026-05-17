import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MedicalRecordClient from './MedicalRecordClient';
import { EMPTY_MEDICAL_INFO, type MedicalInfo } from './types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'السجل الطبي · سباير ميديكال',
};

export default async function MedicalRecordPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('medical_info')
    .eq('id', user.id)
    .single();

  const rawInfo = (profile?.medical_info ?? {}) as Partial<MedicalInfo>;
  const info: MedicalInfo = {
    ...EMPTY_MEDICAL_INFO,
    ...rawInfo,
    chronic_conditions: rawInfo.chronic_conditions ?? [],
    allergies: rawInfo.allergies ?? [],
    past_surgeries: rawInfo.past_surgeries ?? [],
    family_history: rawInfo.family_history ?? [],
  };

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">السجل الطبي</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">احفظ بياناتك الصحية للوصول السريع</p>

        <MedicalRecordClient initial={info} />
      </div>
    </main>
  );
}
