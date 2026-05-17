import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ArrowRight, BarChart3, CheckCircle2, Clock, TestTube, Calendar, Lock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'سجل التحاليل · سباير ميديكال',
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'scr-tag-amber' },
  confirmed: { label: 'مؤكّد', color: 'scr-tag-success' },
  in_progress: { label: 'قيد التنفيذ', color: 'scr-tag-amber' },
  completed: { label: 'مكتمل', color: 'scr-tag-success' },
  cancelled: { label: 'ملغى', color: 'scr-tag-emergency' },
};

export default async function LabHistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // اجلب كل المواعيد من نوع blood-draw أو lab-test
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .or('service_type.eq.blood-draw,service_id.eq.blood-draw,service_id.eq.lab-test')
    .order('scheduled_at', { ascending: false });

  const labs = appointments ?? [];
  const completed = labs.filter((l) => l.status === 'completed').length;
  const pending = labs.filter((l) => l.status !== 'completed' && l.status !== 'cancelled').length;

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

        {/* Stats */}
        <div className="services-grid" style={{ marginTop: 8 }}>
          <div className="service-card service-default">
            <div className="service-icon" aria-hidden="true">
              <BarChart3 size={24} strokeWidth={2} />
            </div>
            <div className="service-title">{labs.length}</div>
            <div className="service-desc">إجمالي الفحوصات</div>
          </div>
          <div className="service-card service-amber">
            <div className="service-icon" aria-hidden="true">
              <CheckCircle2 size={24} strokeWidth={2} />
            </div>
            <div className="service-title">{completed}</div>
            <div className="service-desc">مكتملة</div>
          </div>
        </div>

        {pending > 0 && (
          <div className="scr-info-banner" style={{ marginTop: 12 }}>
            <Clock size={14} strokeWidth={2.2} aria-hidden />
            <span>عندك {pending} فحص قيد التنفيذ. النتائج راح تظهر هنا عند جاهزيتها.</span>
          </div>
        )}

        {/* List */}
        {labs.length === 0 ? (
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
              <div className="scr-section-title">سجلك ({labs.length})</div>
            </div>

            <div className="scr-list-stack">
              {labs.map((lab) => {
                const status = STATUS_META[lab.status] ?? STATUS_META.pending;
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
                      <div className="scr-list-item-tags" style={{ marginTop: 6 }}>
                        <span className={`scr-tag ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        <div className="scr-info-banner" style={{ marginTop: 16 }}>
          <Lock size={14} strokeWidth={2.2} aria-hidden />
          <span>نتائج التحاليل مُشفّرة وآمنة. ستُحفظ تلقائياً بعد إصدارها.</span>
        </div>
      </div>
    </main>
  );
}
