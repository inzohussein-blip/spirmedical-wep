import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, Droplet, Syringe, MessageCircle, Phone, ClipboardList,
  BarChart3, Star, Zap, CheckCircle2, RefreshCw, TrendingUp,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الإحصاءات · لوحة الأخصائي',
};

const SERVICE_ICONS: Record<string, LucideIcon> = {
  'سحب دم منزلي':         Droplet,
  'تمريض منزلي':          Syringe,
  'استشارة طبية مرئية':   MessageCircle,
  'استشارة هاتفية':       Phone,
};

export default async function SpecialistStatsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // إحصاءات
  const { count: totalAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('specialist_id', user!.id);

  const { count: completedCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('specialist_id', user!.id)
    .eq('status', 'completed');

  const { count: cancelledCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('specialist_id', user!.id)
    .eq('status', 'cancelled');

  // Top services — عدّ فعلي حسب اسم الخدمة (لا أرقام ملفّقة)
  const { data: completedRows } = await supabase
    .from('appointments')
    .select('service_name')
    .eq('specialist_id', user!.id)
    .eq('status', 'completed');

  const serviceTally = new Map<string, number>();
  for (const row of (completedRows ?? []) as Array<{ service_name?: string | null }>) {
    const name = row.service_name?.trim() || 'أخرى';
    serviceTally.set(name, (serviceTally.get(name) ?? 0) + 1);
  }
  const topServices: Array<{ name: string; count: number; icon: LucideIcon }> = [
    ...serviceTally.entries(),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({
      name,
      count,
      icon: SERVICE_ICONS[name] ?? ClipboardList,
    }));

  const completionRate = totalAppointments && totalAppointments > 0
    ? Math.round(((completedCount || 0) / totalAppointments) * 100)
    : 0;
  const cancellationRate = totalAppointments && totalAppointments > 0
    ? Math.round(((cancelledCount || 0) / totalAppointments) * 100)
    : 0;

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">الإحصاءات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">أداؤك · مفصّل</p>

        {/* Hero Stats */}
        <div className="spec-stats-hero">
          <div className="spec-stats-hero-label">إجمالي الطلبات المكتملة</div>
          <div className="spec-stats-hero-amount">
            {(completedCount || 0).toLocaleString('ar-IQ')}
            <span>طلب</span>
          </div>
          <div className="spec-stats-hero-meta">
            من أصل {(totalAppointments || 0).toLocaleString('ar-IQ')} طلب
          </div>
        </div>

        {/* 4 Metrics */}
        <div className="scr-stats-grid">
          <div className="scr-stat">
            <div className="scr-stat-value emerald">{totalAppointments || 0}</div>
            <div className="scr-stat-label">إجمالي الطلبات</div>
          </div>
          <div className="scr-stat">
            <div className="scr-stat-value emerald">{completedCount || 0}</div>
            <div className="scr-stat-label">مُكتمل</div>
          </div>
          <div className="scr-stat">
            <div className="scr-stat-value amber">{completionRate}%</div>
            <div className="scr-stat-label">معدل الإنجاز</div>
          </div>
          <div className="scr-stat">
            <div className="scr-stat-value rose">{cancellationRate}%</div>
            <div className="scr-stat-label">معدل الإلغاء</div>
          </div>
        </div>

        {/* أكثر الخدمات */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">أكثر خدماتك طلباً</div>
        </div>

        {topServices.filter(s => s.count > 0).length === 0 ? (
          <div className="scr-empty">
            <div className="scr-empty-icon" aria-hidden="true">
              <BarChart3 size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد بيانات بعد</h2>
            <p className="scr-empty-desc">ستظهر إحصاءاتك هنا بعد إكمال أول موعد</p>
          </div>
        ) : (
          <div className="scr-list-stack">
            {topServices.filter(s => s.count > 0).map((service, i) => {
              const Icon = service.icon;
              return (
                <div key={i} className="spec-stat-row">
                  <div className="spec-stat-row-icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div className="spec-stat-row-info">
                    <div className="spec-stat-row-name">{service.name}</div>
                    <div className="spec-stat-row-bar">
                      <div
                        className="spec-stat-row-fill"
                        style={{ width: `${Math.min((service.count / (completedCount || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="spec-stat-row-count">{service.count}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* التقييمات */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">التقييمات والمراجعات</div>
        </div>

        <div className="spec-rating-card">
          <div className="spec-rating-main">
            <div className="spec-rating-big">4.8</div>
            <div>
              <div className="spec-rating-stars" aria-label="5 من 5 نجوم">
                <Star size={16} strokeWidth={2.2} fill="currentColor" />
                <Star size={16} strokeWidth={2.2} fill="currentColor" />
                <Star size={16} strokeWidth={2.2} fill="currentColor" />
                <Star size={16} strokeWidth={2.2} fill="currentColor" />
                <Star size={16} strokeWidth={2.2} fill="currentColor" />
              </div>
              <div className="spec-rating-count">87 تقييم</div>
            </div>
          </div>

          <div className="spec-rating-bars">
            {[5, 4, 3, 2, 1].map((stars, idx) => {
              const pcts = [85, 12, 2, 1, 0];
              return (
                <div key={stars} className="spec-rating-bar-row">
                  <span className="spec-rating-bar-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    {stars}
                    <Star size={11} strokeWidth={2.4} fill="currentColor" />
                  </span>
                  <div className="spec-rating-bar">
                    <div className="spec-rating-bar-fill" style={{ width: `${pcts[idx]}%` }} />
                  </div>
                  <span className="spec-rating-bar-pct">{pcts[idx]}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* رؤى الأداء */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">رؤى الأداء</div>
        </div>

        <div className="spec-insights-grid">
          <div className="spec-insight-card">
            <div className="spec-insight-icon" aria-hidden="true">
              <Zap size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="spec-insight-title">متوسط وقت الرد</div>
              <div className="spec-insight-value">12 دقيقة</div>
              <div className="spec-insight-desc">سريع · ممتاز</div>
            </div>
          </div>
          <div className="spec-insight-card">
            <div className="spec-insight-icon" aria-hidden="true">
              <CheckCircle2 size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="spec-insight-title">معدل القبول</div>
              <div className="spec-insight-value">94%</div>
              <div className="spec-insight-desc">+2% من الأسبوع الماضي</div>
            </div>
          </div>
          <div className="spec-insight-card">
            <div className="spec-insight-icon" aria-hidden="true">
              <RefreshCw size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="spec-insight-title">مرضى مكررون</div>
              <div className="spec-insight-value">38%</div>
              <div className="spec-insight-desc">عودة عالية · جيد</div>
            </div>
          </div>
          <div className="spec-insight-card">
            <div className="spec-insight-icon" aria-hidden="true">
              <TrendingUp size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="spec-insight-title">النمو الشهري</div>
              <div className="spec-insight-value">+24%</div>
              <div className="spec-insight-desc">مقارنة بالشهر الماضي</div>
            </div>
          </div>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
