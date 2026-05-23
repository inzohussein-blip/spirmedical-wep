// ═══════════════════════════════════════════════════════════════
// 💉 V25.44: Vitals Trends Page
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowRight, Activity, Heart, Thermometer, Wind } from 'lucide-react';
import VitalsTrendsClient from './VitalsTrendsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تطوّر العلامات الحيوية · سباير ميديكال' };

export default async function VitalsTrendsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // جلب كل الزيارات مع vital_signs
  const { data: visits } = await supabase
    .from('nursing_visit_history')
    .select('*')
    .eq('user_id', user.id)
    .not('vital_signs', 'is', null)
    .order('performed_at', { ascending: true });

  const allVisits = visits ?? [];

  // استخراج كل نقطة بيانات
  interface VitalPoint {
    date: string;
    bp_sys?: number;  // ضغط انقباضي
    bp_dia?: number;  // ضغط انبساطي
    pulse?: number;
    temp?: number;
    spo2?: number;
    sugar?: number;
  }

  const vitalPoints: VitalPoint[] = allVisits.map((visit) => {
    
    const vitals = (visit as { vital_signs?: Record<string, unknown> }).vital_signs || {};
    const bp = vitals.bp as string | undefined;
    const [sys, dia] = bp ? bp.split('/').map((v) => parseInt(v)) : [undefined, undefined];
    
    return {
      date: (visit as { performed_at: string }).performed_at,
      bp_sys: sys,
      bp_dia: dia,
      pulse: typeof vitals.pulse === 'number' ? vitals.pulse : vitals.pulse ? parseInt(vitals.pulse as string) : undefined,
      temp: typeof vitals.temp === 'number' ? vitals.temp : vitals.temp ? parseFloat(vitals.temp as string) : undefined,
      spo2: typeof vitals.spo2 === 'number' ? vitals.spo2 : vitals.spo2 ? parseInt(vitals.spo2 as string) : undefined,
      sugar: typeof vitals.sugar === 'number' ? vitals.sugar : vitals.sugar ? parseInt(vitals.sugar as string) : undefined,
    };
  });

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account/nursing-history" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">العلامات الحيوية</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">تطوّر الضغط، النبض، الحرارة، الأكسجين، السكر</p>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 8, 
          marginTop: 8 
        }}>
          <div className="service-card service-emerald">
            <div className="service-icon"><Heart size={22} strokeWidth={2} /></div>
            <div className="service-title">{allVisits.length}</div>
            <div className="service-desc">زيارة مسجّلة</div>
          </div>
          <div className="service-card service-amber">
            <div className="service-icon"><Activity size={22} strokeWidth={2} /></div>
            <div className="service-title">{vitalPoints.filter(v => v.bp_sys).length}</div>
            <div className="service-desc">قياس ضغط</div>
          </div>
        </div>

        {vitalPoints.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 40 }}>
            <div className="scr-empty-icon">
              <Activity size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد قياسات بعد</h2>
            <p className="scr-empty-desc">
              ستظهر قياساتك الحيوية هنا بعد كل زيارة تمريض.
            </p>
          </div>
        ) : (
          <VitalsTrendsClient vitalPoints={vitalPoints} />
        )}
      </div>
    </main>
  );
}
