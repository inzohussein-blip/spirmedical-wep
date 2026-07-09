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

  // التقييمات الفعلية من جدول ratings (لا أرقام ملفّقة)
  const { data: ratingRows } = await supabase
    .from('ratings')
    .select('overall_rating')
    .eq('specialist_id', user!.id);
  const ratings = (ratingRows ?? []) as Array<{ overall_rating: number | null }>;
  const ratingCount = ratings.length;
  const ratingAvg = ratingCount > 0
    ? Math.round((ratings.reduce((s, r) => s + (r.overall_rating || 0), 0) / ratingCount) * 10) / 10
    : 0;
  const filledStars = Math.round(ratingAvg);
  const starPcts = [5, 4, 3, 2, 1].map((s) => {
    const c = ratings.filter((r) => Math.round(r.overall_rating || 0) === s).length;
    return ratingCount > 0 ? Math.round((c / ratingCount) * 100) : 0;
  });

  // رؤى الأداء الحقيقية (مرضى فريدون/مكررون + النمو الشهري) — لا أرقام ملفّقة
  const { data: apptRows } = await supabase
    .from('appointments')
    .select('user_id, created_at')
    .eq('specialist_id', user!.id);
  const appts = (apptRows ?? []) as Array<{ user_id: string | null; created_at: string }>;
  const perPatient = new Map<string, number>();
  for (const a of appts) {
    if (a.user_id) perPatient.set(a.user_id, (perPatient.get(a.user_id) ?? 0) + 1);
  }
  const distinctPatients = perPatient.size;
  const repeatPatients = [...perPatient.values()].filter((n) => n > 1).length;
  const repeatRate = distinctPatients > 0 ? Math.round((repeatPatients / distinctPatients) * 100) : 0;
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let thisMonthCount = 0;
  let lastMonthCount = 0;
  for (const a of appts) {
    const d = new Date(a.created_at);
    if (d >= thisMonthStart) thisMonthCount++;
    else if (d >= lastMonthStart) lastMonthCount++;
  }
  const monthlyGrowth = lastMonthCount > 0
    ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
    : (thisMonthCount > 0 ? 100 : 0);

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
          {ratingCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--ink-3)', fontSize: 13 }}>
              لا توجد تقييمات بعد
            </div>
          ) : (
            <>
              <div className="spec-rating-main">
                <div className="spec-rating-big">{ratingAvg.toFixed(1)}</div>
                <div>
                  <div className="spec-rating-stars" aria-label={`${ratingAvg} من 5 نجوم`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={16}
                        strokeWidth={2.2}
                        fill={n <= filledStars ? 'currentColor' : 'none'}
                        style={n <= filledStars ? undefined : { opacity: 0.35 }}
                      />
                    ))}
                  </div>
                  <div className="spec-rating-count">{ratingCount} تقييم</div>
                </div>
              </div>

              <div className="spec-rating-bars">
                {[5, 4, 3, 2, 1].map((stars, idx) => (
                  <div key={stars} className="spec-rating-bar-row">
                    <span className="spec-rating-bar-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      {stars}
                      <Star size={11} strokeWidth={2.4} fill="currentColor" />
                    </span>
                    <div className="spec-rating-bar">
                      <div className="spec-rating-bar-fill" style={{ width: `${starPcts[idx]}%` }} />
                    </div>
                    <span className="spec-rating-bar-pct">{starPcts[idx]}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
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
              <div className="spec-insight-title">إجمالي المرضى</div>
              <div className="spec-insight-value">{distinctPatients}</div>
              <div className="spec-insight-desc">مرضى فريدون</div>
            </div>
          </div>
          <div className="spec-insight-card">
            <div className="spec-insight-icon" aria-hidden="true">
              <CheckCircle2 size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="spec-insight-title">معدل الإكمال</div>
              <div className="spec-insight-value">{completionRate}%</div>
              <div className="spec-insight-desc">من إجمالي الطلبات</div>
            </div>
          </div>
          <div className="spec-insight-card">
            <div className="spec-insight-icon" aria-hidden="true">
              <RefreshCw size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="spec-insight-title">مرضى مكررون</div>
              <div className="spec-insight-value">{repeatRate}%</div>
              <div className="spec-insight-desc">عادوا لخدمة أخرى</div>
            </div>
          </div>
          <div className="spec-insight-card">
            <div className="spec-insight-icon" aria-hidden="true">
              <TrendingUp size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="spec-insight-title">النمو الشهري</div>
              <div className="spec-insight-value">{monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth}%</div>
              <div className="spec-insight-desc">مقارنة بالشهر الماضي</div>
            </div>
          </div>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
