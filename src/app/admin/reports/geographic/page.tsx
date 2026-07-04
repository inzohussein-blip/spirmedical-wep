import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/admin-types';
import { Card, EmptyState } from '@/components/ui';
import { IRAQ_GOVERNORATES } from '@/types/location';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'التقارير الجغرافية · إدارة',
};

/**
 * يحدّد المحافظة بناءً على الإحداثيات (تقريبي)
 * نستخدم closest distance لمراكز المحافظات
 */
function findClosestGovernorate(lat: number, lng: number): string {
  let closestName = 'غير معروف';
  let minDist = Infinity;

  for (const [name, center] of Object.entries(IRAQ_GOVERNORATES)) {
    const dist = Math.sqrt(
      Math.pow(center.lat - lat, 2) + Math.pow(center.lng - lng, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closestName = name;
    }
  }

  return closestName;
}

export default async function GeographicReportsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isAdminRole(profile?.role)) redirect('/dashboard');

  // جلب الطلبات بـ GPS
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, location_lat, location_lng, status, created_at, service_type')
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null);

  // تجميع حسب المحافظة
  const byGovernorate: Record<
    string,
    {
      total: number;
      completed: number;
      cancelled: number;
      pending: number;
      services: Record<string, number>;
    }
  > = {};

  (appointments ?? []).forEach((apt) => {
    if (apt.location_lat === null || apt.location_lng === null) return;

    const gov = findClosestGovernorate(Number(apt.location_lat), Number(apt.location_lng));

    if (!byGovernorate[gov]) {
      byGovernorate[gov] = {
        total: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
        services: {},
      };
    }

    byGovernorate[gov].total++;
    if (apt.status === 'completed') byGovernorate[gov].completed++;
    if (apt.status === 'cancelled') byGovernorate[gov].cancelled++;
    if (apt.status === 'pending') byGovernorate[gov].pending++;

    const svc = apt.service_type ?? 'غير محدد';
    byGovernorate[gov].services[svc] = (byGovernorate[gov].services[svc] ?? 0) + 1;
  });

  // ترتيب حسب الـ total تنازلياً
  const sorted = Object.entries(byGovernorate).sort(([, a], [, b]) => b.total - a.total);

  const grandTotal = sorted.reduce((sum, [, s]) => sum + s.total, 0);

  return (
    <main style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/admin/reports"
          style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}
        >
          ← العودة للتقارير
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 4px' }}>
          📊 التقارير الجغرافية
        </h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>
          توزيع الطلبات حسب المحافظات والمدن
        </p>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <EmptyState
            icon="🗺️"
            title="لا توجد بيانات جغرافية"
            description="ستظهر التقارير عند تجميع طلبات بإحداثيات GPS"
            size="lg"
          />
        </Card>
      ) : (
        <>
          {/* إجمالي */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
              📍 إجمالي الطلبات المغطّاة بـ GPS
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: 'var(--emerald)',
                marginTop: 4,
              }}
            >
              {grandTotal.toLocaleString('ar-IQ')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              عبر {sorted.length} محافظة
            </div>
          </Card>

          {/* جدول المحافظات */}
          <Card>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px' }}>
              🏛️ التوزيع حسب المحافظة
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sorted.map(([gov, stats]) => {
                const percent = grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0;
                const completionRate = stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0;

                return (
                  <div
                    key={gov}
                    style={{
                      padding: 16,
                      background: 'var(--paper-3)',
                      borderRadius: 12,
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                          📍 {gov}
                        </h3>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                          {percent.toFixed(1)}% من الإجمالي
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 900,
                          color: 'var(--emerald)',
                        }}
                      >
                        {stats.total}
                      </div>
                    </div>

                    {/* progress bar */}
                    <div
                      style={{
                        background: 'var(--white)',
                        height: 8,
                        borderRadius: 100,
                        overflow: 'hidden',
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          background: 'var(--emerald)',
                          height: '100%',
                          width: `${percent}%`,
                          borderRadius: 100,
                        }}
                      />
                    </div>

                    {/* sub-stats */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700 }}>
                          ⏳ معلّق
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--amber)' }}>
                          {stats.pending}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700 }}>
                          ✅ مكتمل
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--emerald)' }}>
                          {stats.completed}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700 }}>
                          ❌ ملغى
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--rose)' }}>
                          {stats.cancelled}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700 }}>
                          🎯 الإنجاز
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: completionRate >= 70 ? 'var(--emerald)' : 'var(--amber)',
                          }}
                        >
                          {completionRate}%
                        </div>
                      </div>
                    </div>

                    {/* الخدمات الأكثر طلباً */}
                    {Object.keys(stats.services).length > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: '1px dashed var(--line)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--ink-3)',
                            fontWeight: 700,
                            marginBottom: 8,
                          }}
                        >
                          🏥 الخدمات الأكثر طلباً:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {Object.entries(stats.services)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 4)
                            .map(([svc, count]) => (
                              <span
                                key={svc}
                                style={{
                                  fontSize: 10,
                                  padding: '3px 8px',
                                  background: 'var(--emerald-soft)',
                                  color: 'var(--emerald-deep)',
                                  borderRadius: 100,
                                  fontWeight: 700,
                                }}
                              >
                                {svc} · {count}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </main>
  );
}
