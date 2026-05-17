import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PatientCRMClient from './PatientCRMClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ملف المريض · إدارة CRM',
};

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: patient } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'patient')
    .single();

  if (!patient) notFound();

  // إحصائيات + بيانات إضافية
  const [
    { count: totalOrders },
    { count: completedOrders },
    { count: cancelledOrders },
    { data: appointments },
    { data: tags },
    { data: notes },
  ] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', patient.id),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', patient.id).eq('status', 'completed'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', patient.id).eq('status', 'cancelled'),
    supabase.from('appointments').select('id, service_type, scheduled_at, status').eq('user_id', patient.id).order('scheduled_at', { ascending: false }).limit(10),
    supabase.from('patient_tags').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
    supabase.from('patient_notes').select('*').eq('patient_id', patient.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
  ]);

  // اجلب أسماء المديرين للملاحظات
  const adminIds = Array.from(new Set((notes ?? []).map((n) => n.admin_id).filter(Boolean) as string[]));
  const { data: adminsData } = adminIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', adminIds)
    : { data: [] };
  const adminsMap = new Map((adminsData ?? []).map((a) => [a.id, a.full_name]));

  return (
    <>
      <Link href="/admin44/patients" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>
        ← رجوع
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>

        <div>
          {/* Profile Header */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--emerald-deep)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 900,
              }}>
                {(patient.full_name?.[0] ?? '?').toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{patient.full_name ?? 'بدون اسم'}</h1>
                <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
                  <span dir="ltr">📱 {patient.phone}</span>
                  {patient.email && <span>✉️ {patient.email}</span>}
                  {patient.governorate && <span>📍 {patient.governorate}</span>}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-3)' }}>
                  انضم في {new Date(patient.created_at).toLocaleDateString('ar-IQ')}
                </div>
              </div>

              <a
                href={`https://wa.me/${patient.phone.replace(/^0/, '964')}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  padding: '10px 16px', background: '#25D366', color: '#fff',
                  borderRadius: 10, fontSize: 12, fontWeight: 800, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                💬 WhatsApp
              </a>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            <Stat label="إجمالي الطلبات" value={(totalOrders ?? 0).toString()} color="#0E5C4D" />
            <Stat label="المكتملة" value={(completedOrders ?? 0).toString()} color="#0E5C4D" />
            <Stat label="الملغاة" value={(cancelledOrders ?? 0).toString()} color="#A82E3D" />
          </div>

          {/* Medical Info */}
          {patient.medical_info && Object.keys(patient.medical_info as object).length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>📋 الملف الطبي</h2>
              <pre style={{ fontSize: 12, fontFamily: 'inherit', background: 'var(--paper-3)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>
                {JSON.stringify(patient.medical_info, null, 2)}
              </pre>
            </div>
          )}

          {/* Appointments */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>📅 آخر المواعيد</h2>
            {(appointments ?? []).length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>لا توجد مواعيد</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(appointments ?? []).map((a) => (
                  <Link key={a.id} href={`/admin44/orders/${a.id}`} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: 'var(--paper-3)', borderRadius: 8,
                    textDecoration: 'none', color: 'var(--ink)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{a.service_type}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        {new Date(a.scheduled_at).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 100, fontWeight: 800,
                      background: a.status === 'completed' ? 'var(--emerald-soft)' :
                                  a.status === 'cancelled' ? 'var(--rose-soft)' : 'var(--amber-soft, #F8E5C7)',
                      color: a.status === 'completed' ? 'var(--emerald-deep)' :
                             a.status === 'cancelled' ? 'var(--rose)' : 'var(--amber-deep, #6B3A08)',
                    }}>
                      {a.status === 'pending' ? 'جديد' :
                       a.status === 'confirmed' ? 'مؤكّد' :
                       a.status === 'in_progress' ? 'جارٍ' :
                       a.status === 'completed' ? 'مكتمل' : 'ملغى'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* العمود الأيسر: CRM panel */}
        <div style={{ position: 'sticky', top: 24 }}>
          <PatientCRMClient
            patientId={patient.id}
            tags={(tags ?? []).map((t) => ({ id: t.id, tag: t.tag, color: t.color }))}
            notes={(notes ?? []).map((n) => ({
              id: n.id,
              note: n.note,
              note_type: n.note_type,
              is_pinned: n.is_pinned,
              created_at: n.created_at,
              admin_name: n.admin_id ? (adminsMap.get(n.admin_id) ?? 'مدير') : 'النظام',
            }))}
            isSuspended={patient.is_suspended ?? false}
          />
        </div>

      </div>
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
    </div>
  );
}
