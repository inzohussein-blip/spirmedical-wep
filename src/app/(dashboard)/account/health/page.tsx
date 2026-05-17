import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HealthClient from './HealthClient';
import {
  ArrowRight, ClipboardList, TestTube, Pill, Lock,
} from 'lucide-react';

export const metadata = {
  title: 'لوحة الصحة · سباير ميديكال',
};

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // آخر قياس لكل نوع
  const { data: allVitals } = await supabase
    .from('health_vitals')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false });

  // التاريخ الكامل لعرضه
  const history = (allVitals ?? []).slice(0, 20);

  // آخر قياس لكل نوع
  const latest = new Map<string, typeof history[0]>();
  for (const v of allVitals ?? []) {
    if (!latest.has(v.vital_type)) latest.set(v.vital_type, v);
  }

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">لوحة الصحة</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">مؤشراتك الحيوية في مكان واحد</p>

        <HealthClient
          latestByType={Object.fromEntries(latest.entries())}
          history={history}
        />

        {/* روابط السجل الطبي */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">السجل الطبي</div>
        </div>
        <div className="scr-list-stack">
          <Link href="/account/medical-record" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <ClipboardList size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">السجل الطبي الكامل</div>
              <div className="scr-list-item-subtitle">الأمراض المزمنة والحساسية</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
          <Link href="/account/lab-history" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <TestTube size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">سجل التحاليل</div>
              <div className="scr-list-item-subtitle">كل الفحوصات السابقة</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
          <Link href="/account/prescriptions" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <Pill size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">الوصفات الطبية</div>
              <div className="scr-list-item-subtitle">الأدوية الموصوفة</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
        </div>

        <div className="scr-info-banner" style={{ marginTop: 16 }}>
          <Lock size={14} strokeWidth={2.2} aria-hidden />
          <span>كل بياناتك الصحية مُشفّرة وآمنة. لن نشاركها مع أي طرف ثالث.</span>
        </div>
      </div>
    </main>
  );
}
