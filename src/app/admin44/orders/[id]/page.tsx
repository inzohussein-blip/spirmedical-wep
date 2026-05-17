import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SPECIALIST_META, type SpecialistType } from '@/lib/specialist-types';
import { decrypt } from '@/lib/encryption';
import OrderAdminActions from './OrderAdminActions';
import { FreeMedicalMapWrapper } from '@/components/ui/FreeMedicalMapWrapper';
import { getOrderLocation, getAssignedSpecialistLocation } from './actions';
import type { MapMarker } from '@/types/location';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'تفاصيل الطلب · إدارة',
};

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!order) notFound();

  const [
    { data: patient },
    { data: specialist },
    { data: availableSpecialists },
    orderLocation,
    specialistLocation,
  ] = await Promise.all([
    supabase.from('users').select('id, full_name, phone, governorate, email').eq('id', order.user_id).single(),
    order.assigned_specialist_id
      ? supabase.from('users').select('id, full_name, phone, specialist_type').eq('id', order.assigned_specialist_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('users')
      .select('id, full_name, phone, specialist_type')
      .eq('role', 'specialist')
      .eq('approval_status', 'approved')
      .eq('is_suspended', false)
      .eq('specialist_type', (order as any).required_specialist_type ?? 'doctor'),
    getOrderLocation(params.id),
    getAssignedSpecialistLocation(params.id),
  ]);

  // بناء markers للخريطة
  const mapMarkers: MapMarker[] = [];

  if (orderLocation) {
    mapMarkers.push({
      id: `patient-${orderLocation.appointment_id}`,
      lat: orderLocation.lat,
      lng: orderLocation.lng,
      title: 'موقع المريض',
      subtitle: orderLocation.address,
      variant: 'patient',
      popup: orderLocation.accuracy_m
        ? `دقة الإحداثيات: ±${orderLocation.accuracy_m}م`
        : undefined,
    });
  }

  if (specialistLocation) {
    mapMarkers.push({
      id: `specialist-${order.assigned_specialist_id}`,
      lat: specialistLocation.lat,
      lng: specialistLocation.lng,
      title: specialistLocation.full_name,
      subtitle: specialistLocation.work_address ?? 'موقع العمل',
      variant: 'specialist',
    });
  }

  let notesText: string | null = null;
  if (order.notes_encrypted) {
    try { notesText = decrypt(order.notes_encrypted); } catch { /* ignore */ }
  }

  const orderAny = order as any;
  const meta = orderAny.required_specialist_type ? SPECIALIST_META[orderAny.required_specialist_type as SpecialistType] : null;

  return (
    <>
      <Link href="/admin44/orders" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>
        ← رجوع
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }}>

        <div>
          {/* Header */}
          <div style={{
            background: meta?.gradient ?? 'var(--emerald-deep)',
            color: '#fff',
            padding: 24, borderRadius: 14, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 36 }}>{meta?.icon ?? '📋'}</div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{order.service_type}</h1>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{meta?.label ?? 'خدمة عامة'}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              📅 {new Date(order.scheduled_at).toLocaleString('ar-IQ', { dateStyle: 'full', timeStyle: 'short' })}
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>المعلومات</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, fontSize: 13 }}>
              <InfoRow icon="🆔" label="رقم الطلب" value={order.id.slice(0, 8) + '...'} dir="ltr" />
              <InfoRow icon="📅" label="تاريخ الإنشاء" value={new Date(order.created_at).toLocaleDateString('ar-IQ')} />
              {order.address && <InfoRow icon="📍" label="العنوان" value={order.address} />}
              {(order as any).duration_minutes && <InfoRow icon="⏱" label="المدة" value={`${(order as any).duration_minutes} دقيقة`} />}
            </div>

            {notesText && (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--paper-3)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 4 }}>ملاحظات المريض</div>
                <p style={{ fontSize: 13, margin: 0 }}>{notesText}</p>
              </div>
            )}
          </div>

          {/* 🗺️ Map */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>🗺️ الموقع على الخريطة</h2>
              {mapMarkers.length > 1 && (
                <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
                  {mapMarkers.length} مواقع
                </span>
              )}
            </div>
            <FreeMedicalMapWrapper
              markers={mapMarkers}
              height={340}
              zoom={14}
              showDirections={true}
              showCoords={true}
            />
            {!orderLocation && (
              <div style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'var(--amber-soft, #F0DBC2)',
                color: 'var(--amber, #B8540C)',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
              }}>
                ℹ️ المريض لم يلتقط موقعه عند إنشاء الطلب. يمكن العمل بالعنوان النصي فقط.
              </div>
            )}
          </div>

          {/* Patient Card */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>👤 المريض</h2>
            {patient && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--emerald-deep)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900,
                }}>
                  {(patient.full_name?.[0] ?? '?').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <Link href={`/admin44/patients/${patient.id}`} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', textDecoration: 'none' }}>
                    {patient.full_name ?? 'بدون اسم'}
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }} dir="ltr">{patient.phone}</div>
                  {patient.governorate && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>📍 {patient.governorate}</div>}
                </div>
                <a href={`tel:${patient.phone}`} style={{ padding: '8px 12px', background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 800 }}>📞</a>
              </div>
            )}
          </div>

          {/* Specialist Card */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>👨‍⚕️ الاختصاصي</h2>
            {specialist ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: SPECIALIST_META[specialist.specialist_type as SpecialistType]?.gradient ?? 'var(--paper-3)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {SPECIALIST_META[specialist.specialist_type as SpecialistType]?.icon ?? '⚕️'}
                </div>
                <div style={{ flex: 1 }}>
                  <Link href={`/admin44/specialists/${specialist.id}`} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', textDecoration: 'none' }}>
                    {specialist.full_name ?? 'بدون اسم'}
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }} dir="ltr">{specialist.phone}</div>
                </div>
                <a href={`tel:${specialist.phone}`} style={{ padding: '8px 12px', background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 800 }}>📞</a>
              </div>
            ) : (
              <div style={{ background: 'var(--amber-soft, #F8E5C7)', padding: 14, borderRadius: 10, fontSize: 12, color: 'var(--amber-deep, #6B3A08)', fontWeight: 700, textAlign: 'center' }}>
                ⚠️ لم يُعيَّن اختصاصي بعد
              </div>
            )}
          </div>
        </div>

        {/* Actions panel */}
        <div style={{ position: 'sticky', top: 24 }}>
          <OrderAdminActions
            orderId={order.id}
            status={order.status}
            currentSpecialistId={order.assigned_specialist_id}
            scheduledAt={order.scheduled_at}
            availableSpecialists={(availableSpecialists ?? []).map((s) => ({
              id: s.id,
              name: s.full_name ?? 'بدون اسم',
              phone: s.phone,
            }))}
          />
        </div>

      </div>
    </>
  );
}

function InfoRow({ icon, label, value, dir }: { icon: string; label: string; value: string; dir?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }} dir={dir}>{value}</div>
    </div>
  );
}
