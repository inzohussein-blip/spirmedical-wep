import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/admin-types';
import { MapHeatmapWrapper } from '@/components/ui/MapHeatmapWrapper';
import { Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'خريطة حرارة الطلبات · إدارة',
};

export default async function HeatmapPage() {
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

  // جلب الطلبات التي لها GPS coords
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, location_lat, location_lng, status, created_at')
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null)
    .limit(5000);

  // تجميع الإحصاءات
  const validPoints = (appointments ?? []).filter(
    (a) => a.location_lat !== null && a.location_lng !== null
  );

  const points = validPoints.map((a) => ({
    lat: Number(a.location_lat),
    lng: Number(a.location_lng),
    intensity: 0.6,
  }));

  // إحصاءات
  const total = validPoints.length;
  const totalWithoutGps =
    (await supabase.from('appointments').select('id', { count: 'exact', head: true })).count ?? 0;
  const withGpsPercent = totalWithoutGps > 0
    ? Math.round((total / totalWithoutGps) * 100)
    : 0;

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
          🌡️ خريطة حرارة الطلبات
        </h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>
          المناطق الأكثر طلباً للخدمات الطبية في العراق
        </p>
      </div>

      {/* الإحصاءات */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Card size="md">
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            إجمالي الطلبات بـ GPS
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--emerald)', marginTop: 4 }}>
            {total.toLocaleString('ar-IQ')}
          </div>
        </Card>

        <Card size="md">
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            إجمالي الطلبات
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', marginTop: 4 }}>
            {totalWithoutGps.toLocaleString('ar-IQ')}
          </div>
        </Card>

        <Card size="md">
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            نسبة التغطية
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: withGpsPercent >= 50 ? 'var(--emerald)' : 'var(--amber)',
              marginTop: 4,
            }}
          >
            {withGpsPercent}%
          </div>
        </Card>
      </div>

      {/* الخريطة */}
      <Card size="md">
        <MapHeatmapWrapper
          points={points}
          height={600}
          radius={30}
        />
      </Card>

      {/* ملاحظات */}
      <Card size="md" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>💡 كيف تقرأ الخريطة؟</h3>
        <ul style={{ fontSize: 12, color: 'var(--ink-2)', paddingInlineStart: 16, margin: 0, lineHeight: 1.8 }}>
          <li>🔴 المناطق الحمراء = الأكثر طلباً</li>
          <li>🟡 المناطق الصفراء = نشاط متوسط</li>
          <li>🟢 المناطق الخضراء = نشاط بدأ</li>
          <li>🔵 المناطق الزرقاء = نشاط منخفض</li>
        </ul>
      </Card>
    </main>
  );
}
