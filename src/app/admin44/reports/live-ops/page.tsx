import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/admin-types';
import FreeMedicalMapWrapper from '@/components/maps/SpirMapViewWrapper';
import { Card, EmptyState, StatusBadge } from '@/components/ui';
import AutoRefresh from '@/components/admin/AutoRefresh';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'العمليات المباشرة · إدارة',
};

export default async function LiveOpsPage() {
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

  // جلب الطلبات النشطة اليوم (pending + confirmed + in_progress)
  const today = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  const { data: activeOrders } = await supabase
    .from('appointments')
    .select(
      'id, service_type, status, scheduled_at, location_lat, location_lng, address, user_id, specialist_id'
    )
    .in('status', ['pending', 'confirmed', 'in_progress'])
    .gte('scheduled_at', today)
    .lte('scheduled_at', tomorrow)
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null);

  // الأخصائيين النشطين (لديهم work_lat/lng)
  const { data: activeSpecialists } = await supabase
    .from('users')
    .select('id, full_name, work_lat, work_lng, work_address, specialist_type')
    .eq('role', 'specialist')
    .not('work_lat', 'is', null)
    .not('work_lng', 'is', null);

  // بناء المؤشرات للخريطة
  type MapMarker = {
    id: string;
    lat: number;
    lng: number;
    title: string;
    subtitle?: string;
    variant: 'patient' | 'specialist' | 'lab' | 'pharmacy' | 'default';
  };

  const markers: MapMarker[] = [];

  // طلبات
  (activeOrders ?? []).forEach((o) => {
    if (o.location_lat !== null && o.location_lng !== null) {
      markers.push({
        id: `order-${o.id}`,
        lat: Number(o.location_lat),
        lng: Number(o.location_lng),
        title: o.service_type ?? 'طلب',
        subtitle: `حالة: ${o.status} · ${new Date(o.scheduled_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}`,
        variant: 'patient',
      });
    }
  });

  // أخصائيين
  (activeSpecialists ?? []).forEach((s) => {
    if (s.work_lat !== null && s.work_lng !== null) {
      markers.push({
        id: `specialist-${s.id}`,
        lat: Number(s.work_lat),
        lng: Number(s.work_lng),
        title: s.full_name ?? 'اختصاصي',
        subtitle: s.specialist_type ?? undefined,
        variant: 'specialist',
      });
    }
  });

  // إحصاءات
  const stats = {
    activeOrders: activeOrders?.length ?? 0,
    activeSpecialists: activeSpecialists?.length ?? 0,
    pending: activeOrders?.filter((o) => o.status === 'pending').length ?? 0,
    inProgress: activeOrders?.filter((o) => o.status === 'in_progress').length ?? 0,
  };

  return (
    <main style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/admin44/reports"
          style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}
        >
          ← العودة للتقارير
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 4px' }}>
          🎯 العمليات المباشرة
        </h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 12px' }}>
          الطلبات النشطة والأخصائيين على الخريطة
        </p>
        {/* 🆕 V31: تحديث تلقائي حيّ كل 30 ثانية */}
        <AutoRefresh intervalSeconds={30} label="العمليات المباشرة" />
      </div>

      {/* الإحصاءات */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Card size="md">
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            🎯 الطلبات النشطة
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: 'var(--emerald)',
              marginTop: 4,
            }}
          >
            {stats.activeOrders}
          </div>
        </Card>

        <Card size="md">
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            👨‍⚕️ أخصائيون متاحون
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: 'var(--amber)',
              marginTop: 4,
            }}
          >
            {stats.activeSpecialists}
          </div>
        </Card>

        <Card size="md">
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            ⏳ بانتظار التأكيد
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: 'var(--ink-2)',
              marginTop: 4,
            }}
          >
            {stats.pending}
          </div>
        </Card>

        <Card size="md">
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            🚀 جارٍ التنفيذ
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: 'var(--rose)',
              marginTop: 4,
            }}
          >
            {stats.inProgress}
          </div>
        </Card>
      </div>

      {/* الخريطة */}
      {markers.length === 0 ? (
        <Card>
          <EmptyState
            icon="🗺️"
            title="لا توجد عمليات نشطة"
            description="ستظهر الطلبات والأخصائيين النشطين هنا على الخريطة"
            size="lg"
          />
        </Card>
      ) : (
        <Card>
          <FreeMedicalMapWrapper
            markers={markers}
            height={600}
            showDirections={false}
            zoom={7}
          />
        </Card>
      )}

      {/* قائمة الطلبات النشطة */}
      {activeOrders && activeOrders.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>
            📋 الطلبات النشطة ({activeOrders.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin44/orders/${o.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'var(--paper-3)',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: 'var(--ink)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>
                    {o.service_type}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {o.address?.slice(0, 60)}...
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
                  {new Date(o.scheduled_at).toLocaleTimeString('ar-IQ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <StatusBadge status={o.status as 'pending' | 'confirmed' | 'in_progress'} size="sm" />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
