// ═══════════════════════════════════════════════════════════════
// 🩸 V25.43: Lab Trends Page - رسوم بيانية للنتائج عبر الزمن
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowRight, TrendingUp, Activity, Calendar, BarChart3 } from 'lucide-react';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';
import LabTrendsClient from './LabTrendsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تطوّر نتائج التحاليل · سباير ميديكال' };

export default async function LabTrendsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown }>;
        };
      };
    };
  };

  // جلب كل النتائج للمستخدم مرتّبة زمنياً
  const result = await supabaseAny
    .from('lab_results')
    .select('test_id, test_name, result_value, result_numeric, unit, normal_range_min, normal_range_max, normal_range_text, status, results_at')
    .eq('user_id', user.id)
    .order('results_at', { ascending: true });

  const allResults = (result.data as Array<{
    test_id: string;
    test_name: string;
    result_value: string;
    result_numeric: number | null;
    unit: string | null;
    normal_range_min: number | null;
    normal_range_max: number | null;
    normal_range_text: string | null;
    status: string;
    results_at: string;
  }>) ?? [];

  // تجميع حسب test_id
  const resultsByTest = new Map<string, typeof allResults>();
  allResults.forEach((r) => {
    if (!resultsByTest.has(r.test_id)) {
      resultsByTest.set(r.test_id, []);
    }
    resultsByTest.get(r.test_id)!.push(r);
  });

  // فقط التحاليل التي لديها 2+ نتائج (للـ chart)
  const trendableTests = Array.from(resultsByTest.entries())
    .filter(([_, results]) => results.length >= 1)
    .map(([testId, results]) => ({
      testId,
      testName: results[0].test_name,
      unit: results[0].unit,
      normalRangeText: results[0].normal_range_text,
      normalMin: results[0].normal_range_min,
      normalMax: results[0].normal_range_max,
      results: results.map((r) => ({
        value: r.result_numeric ?? parseFloat(r.result_value),
        valueText: r.result_value,
        status: r.status,
        date: r.results_at,
      })).filter((r) => !isNaN(r.value)),
    }))
    .filter((t) => t.results.length >= 1);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account/lab-history" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">تطوّر النتائج</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">شاهد كيف تتطوّر نتائجك عبر الزمن</p>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 8, 
          marginTop: 8 
        }}>
          <div className="service-card service-emerald">
            <div className="service-icon" aria-hidden="true">
              <Activity size={22} strokeWidth={2} />
            </div>
            <div className="service-title">{allResults.length}</div>
            <div className="service-desc">نتيجة محفوظة</div>
          </div>
          <div className="service-card service-amber">
            <div className="service-icon" aria-hidden="true">
              <TrendingUp size={22} strokeWidth={2} />
            </div>
            <div className="service-title">{trendableTests.length}</div>
            <div className="service-desc">نوع تحليل</div>
          </div>
        </div>

        {trendableTests.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 40 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <BarChart3 size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد نتائج كافية</h2>
            <p className="scr-empty-desc">
              احتاج إلى نتيجتين أو أكثر من نفس الفحص لعرض الرسم البياني.
            </p>
            <Link href="/appointments/new?service=blood-draw" className="scr-empty-cta">
              احجز فحص دم ←
            </Link>
          </div>
        ) : (
          <LabTrendsClient trendableTests={trendableTests} />
        )}
      </div>
    </main>
  );
}
