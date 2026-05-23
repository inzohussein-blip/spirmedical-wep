import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ArrowRight, BarChart3, CheckCircle2, Clock, TestTube, Calendar,
  Lock, FileText, AlertCircle, TrendingUp, Building2,
} from 'lucide-react';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'سجل التحاليل · سباير ميديكال',
};

/**
 * ════════════════════════════════════════════════════════════════════
 * 🩸 V25.43: Lab History Page (مُحسّن)
 * ════════════════════════════════════════════════════════════════════
 * 
 * يعرض:
 *   • lab_orders للمستخدم (طلبات التحاليل)
 *   • lab_results المرتبطة بكل طلب
 *   • إحصاءات + status badges
 *   • CTA للحجز الجديد
 * ════════════════════════════════════════════════════════════════════
 */

// مَناطر الحالة
const STATUS_META: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'قيد الانتظار', color: 'scr-tag-amber', icon: Clock },
  sample_collected: { label: 'تمّ السحب', color: 'scr-tag-amber', icon: TestTube },
  sent_to_lab: { label: 'في المختبر', color: 'scr-tag-amber', icon: Building2 },
  processing: { label: 'قيد التحليل', color: 'scr-tag-amber', icon: TestTube },
  results_ready: { label: 'النتائج جاهزة', color: 'scr-tag-success', icon: CheckCircle2 },
  delivered: { label: 'مكتمل', color: 'scr-tag-success', icon: CheckCircle2 },
  cancelled: { label: 'ملغى', color: 'scr-tag-emergency', icon: AlertCircle },
};

// Types
interface LabOrderWithDetails {
  id: string;
  user_id: string;
  appointment_id: string | null;
  test_ids: string[];
  bundle_id: string | null;
  partner_lab_id: string | null;
  lab_name_snapshot: string | null;
  total_price: number;
  status: string;
  expected_result_at: string | null;
  created_at: string;
  appointments?: {
    id: string;
    scheduled_at: string;
    status: string;
  } | null;
  lab_results?: Array<{
    id: string;
    test_id: string;
    test_name: string;
    status: string;
    results_at: string;
    viewed_by_patient: boolean;
  }>;
}

export default async function LabHistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ─── جلب lab_orders مع التفاصيل ───
    const supabaseAny = supabase as any;
  
  const { data: labOrders } = await supabaseAny
    .from('lab_orders')
    .select(`
      *,
      appointments (
        id,
        scheduled_at,
        status
      ),
      lab_results (
        id,
        test_id,
        test_name,
        status,
        results_at,
        viewed_by_patient
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // ─── fallback: لو ما في lab_orders، استخدم appointments القديمة ───
  let fallbackAppointments: Array<{
    id: string;
    scheduled_at: string;
    status: string;
  }> = [];
  
  if (!labOrders || labOrders.length === 0) {
    const { data: oldAppointments } = await supabase
      .from('appointments')
      .select('id, scheduled_at, status, service_id, service_type')
      .eq('user_id', user.id)
      .or('service_id.eq.blood-draw,service_type.eq.blood-draw')
      .order('scheduled_at', { ascending: false });
    
    fallbackAppointments = (oldAppointments ?? []) as typeof fallbackAppointments;
  }

  const orders = (labOrders ?? []) as LabOrderWithDetails[];
  
  // ─── إحصاءات ───
  const totalOrders = orders.length + fallbackAppointments.length;
  const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'results_ready').length;
  const pendingOrders = orders.filter((o) => 
    o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;
  
  // عد كل النتائج
  const totalResults = orders.reduce((sum, o) => sum + (o.lab_results?.length || 0), 0);
  const unreadResults = orders.reduce((sum, o) => 
    sum + (o.lab_results?.filter((r) => !r.viewed_by_patient).length || 0), 0
  );

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">سجل التحاليل</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">كل فحوصاتك المختبرية مؤرشفة</p>

        {/* ─── Stats - 4 بطاقات ─── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 8, 
          marginTop: 8 
        }}>
          <div className="service-card service-default">
            <div className="service-icon" aria-hidden="true">
              <BarChart3 size={22} strokeWidth={2} />
            </div>
            <div className="service-title">{totalOrders}</div>
            <div className="service-desc">إجمالي الفحوصات</div>
          </div>
          <div className="service-card service-amber">
            <div className="service-icon" aria-hidden="true">
              <CheckCircle2 size={22} strokeWidth={2} />
            </div>
            <div className="service-title">{completedOrders}</div>
            <div className="service-desc">مكتملة</div>
          </div>
          <div className="service-card service-emerald">
            <div className="service-icon" aria-hidden="true">
              <TestTube size={22} strokeWidth={2} />
            </div>
            <div className="service-title">{totalResults}</div>
            <div className="service-desc">نتيجة محفوظة</div>
          </div>
          <div className="service-card service-amber">
            <div className="service-icon" aria-hidden="true">
              <TrendingUp size={22} strokeWidth={2} />
            </div>
            <div className="service-title">{unreadResults}</div>
            <div className="service-desc">نتيجة جديدة</div>
          </div>
        </div>

        {/* Pending banner */}
        {pendingOrders > 0 && (
          <div className="scr-info-banner" style={{ marginTop: 12 }}>
            <Clock size={14} strokeWidth={2.2} aria-hidden />
            <span>عندك {pendingOrders} طلب قيد التنفيذ. النتائج راح تظهر هنا عند جاهزيتها.</span>
          </div>
        )}

        {/* Unread results banner */}
        {unreadResults > 0 && (
          <div className="scr-info-banner scr-info-banner-success" style={{ marginTop: 12 }}>
            <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden />
            <span>{unreadResults} نتيجة جديدة جاهزة للعرض!</span>
          </div>
        )}

        {/* ─── List - الطلبات الجديدة (lab_orders) ─── */}
        {orders.length === 0 && fallbackAppointments.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 40 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <TestTube size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد تحاليل بعد</h2>
            <p className="scr-empty-desc">
              احجز أول فحص دم منزلي وستظهر نتائجه هنا.
            </p>
            <Link href="/appointments/new?service=blood-draw" className="scr-empty-cta">
              احجز فحص دم ←
            </Link>
          </div>
        ) : (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">
                سجلك ({orders.length + fallbackAppointments.length})
              </div>
            </div>

            <div className="scr-list-stack">
              {/* الطلبات الجديدة من lab_orders */}
              {orders.map((order) => {
                const status = STATUS_META[order.status] ?? STATUS_META.pending;
                const StatusIcon = status.icon;
                
                const date = new Date(
                  order.appointments?.scheduled_at || order.created_at
                ).toLocaleDateString('ar-IQ', {
                  day: 'numeric', month: 'long', year: 'numeric',
                });
                
                const testNames = order.test_ids
                  .slice(0, 3)
                  .map((id) => {
                    const t = BLOOD_TESTS.find((bt) => bt.id === id);
                    return t?.nameAr || id;
                  });
                
                const extraCount = Math.max(0, order.test_ids.length - 3);
                const resultsCount = order.lab_results?.length || 0;
                
                return (
                  <Link
                    key={order.id}
                    href={`/account/lab-history/${order.id}`}
                    className="scr-list-item scr-list-item-clickable"
                  >
                    <div className="scr-list-item-icon" aria-hidden="true">
                      <TestTube size={22} strokeWidth={2} />
                    </div>
                    <div className="scr-list-item-content">
                      <div className="scr-list-item-title">
                        {order.test_ids.length} فحص · {order.total_price.toLocaleString('ar-IQ')} د.ع
                      </div>
                      <div className="scr-list-item-subtitle" style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                        {testNames.join('، ')}
                        {extraCount > 0 && ` +${extraCount}`}
                      </div>
                      <div className="scr-list-item-meta">
                        <Calendar size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                        {date}
                        {order.lab_name_snapshot && (
                          <>
                            {' · '}
                            <Building2 size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                            {order.lab_name_snapshot}
                          </>
                        )}
                      </div>
                      <div className="scr-list-item-tags" style={{ marginTop: 8 }}>
                        <span className={`scr-tag ${status.color}`}>
                          <StatusIcon size={11} strokeWidth={2.5} style={{ verticalAlign: '-1px', marginLeft: 4 }} aria-hidden />
                          {status.label}
                        </span>
                        {resultsCount > 0 && (
                          <span className="scr-tag scr-tag-emerald">
                            <FileText size={11} strokeWidth={2.5} style={{ verticalAlign: '-1px', marginLeft: 4 }} aria-hidden />
                            {resultsCount} نتيجة
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
                  </Link>
                );
              })}
              
              {/* الطلبات القديمة من appointments (fallback) */}
              {fallbackAppointments.map((lab) => {
                const status = STATUS_META[lab.status] ?? STATUS_META.pending;
                const StatusIcon = status.icon;
                const date = new Date(lab.scheduled_at).toLocaleDateString('ar-IQ', {
                  day: 'numeric', month: 'long', year: 'numeric',
                });
                return (
                  <Link
                    key={lab.id}
                    href={`/appointments/${lab.id}`}
                    className="scr-list-item scr-list-item-clickable"
                  >
                    <div className="scr-list-item-icon" aria-hidden="true">
                      <TestTube size={22} strokeWidth={2} />
                    </div>
                    <div className="scr-list-item-content">
                      <div className="scr-list-item-title">سحب دم وتحاليل</div>
                      <div className="scr-list-item-meta">
                        <Calendar size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                        {date}
                      </div>
                      <div className="scr-list-item-tags" style={{ marginTop: 8 }}>
                        <span className={`scr-tag ${status.color}`}>
                          <StatusIcon size={11} strokeWidth={2.5} style={{ verticalAlign: '-1px', marginLeft: 4 }} aria-hidden />
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Footer info */}
        <div className="scr-info-banner" style={{ marginTop: 16 }}>
          <Lock size={14} strokeWidth={2.2} aria-hidden />
          <span>نتائج التحاليل مُشفّرة وآمنة. ستُحفظ تلقائياً بعد إصدارها.</span>
        </div>

        {/* CTA للحجز الجديد */}
        {(orders.length > 0 || fallbackAppointments.length > 0) && (
          <Link
            href="/appointments/new?service=blood-draw"
            className="scr-empty-cta"
            style={{ marginTop: 16, display: 'block', textAlign: 'center' }}
          >
            احجز فحص جديد ←
          </Link>
        )}
      </div>
    </main>
  );
}
