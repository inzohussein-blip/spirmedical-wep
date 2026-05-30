import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SPECIALIST_META, type SpecialistType } from '@/lib/specialist-types';

export const metadata = {
  title: 'الطلبات · لوحة الاختصاصي',
};

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'جديد', color: 'scr-tag-amber' },
  confirmed: { label: 'مؤكّد', color: 'scr-tag-success' },
  in_progress: { label: 'قيد التنفيذ', color: 'scr-tag-amber' },
  completed: { label: 'مكتمل', color: 'scr-tag-success' },
  cancelled: { label: 'ملغى', color: 'scr-tag-emergency' },
};

const FILTERS = [
  { id: 'all', label: 'الكل', icon: '📋' },
  { id: 'new', label: 'جديد', icon: '📥' },
  { id: 'in_progress', label: 'قيد التنفيذ', icon: '🔄' },
  { id: 'completed', label: 'مكتمل', icon: '✅' },
];

export default async function SpecialistOrdersPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('specialist_type, full_name')
    .eq('id', user.id)
    .single();

  // 🔧 V30: تنبيه واضح إذا الحساب غير مكتمل (specialist_type ناقص)
  const profileIncomplete = !profile?.specialist_type;
  const specialistType = (profile?.specialist_type ?? 'doctor') as SpecialistType;
  const meta = SPECIALIST_META[specialistType] ?? SPECIALIST_META.doctor;
  const filter = searchParams.filter ?? 'all';

  // بناء الـ query حسب الـ filter
  let query = supabase
    .from('appointments')
    .select(`
      id, service_type, service_id, scheduled_at, status,
      assigned_specialist_id, required_specialist_type,
      address, user_id, created_at
    `)
    .eq('required_specialist_type', specialistType)
    .order('scheduled_at', { ascending: true });

  if (filter === 'new') {
    query = query.eq('status', 'pending').is('assigned_specialist_id', null);
  } else if (filter === 'in_progress') {
    query = query.eq('assigned_specialist_id', user.id).in('status', ['confirmed', 'in_progress']);
  } else if (filter === 'completed') {
    query = query.eq('assigned_specialist_id', user.id).eq('status', 'completed');
  } else {
    // all: المعيّن لي + الجديد المتاح لنوعي
    query = query.or(`assigned_specialist_id.eq.${user.id},assigned_specialist_id.is.null`);
  }

  const { data: orders } = await query;

  // اجلب أسماء المرضى
  const patientIds = Array.from(new Set((orders ?? []).map((o) => o.user_id)));
  const { data: patients } = patientIds.length > 0
    ? await supabase.from('users').select('id, full_name, phone').in('id', patientIds)
    : { data: [] };

  const patientMap = new Map((patients ?? []).map((p) => [p.id, p]));

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">الطلبات</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">
          {meta.icon} {meta.label}
        </p>

        {/* 🔧 V30: تنبيه إذا الحساب غير مكتمل */}
        {profileIncomplete && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              background: '#FAEEDA',
              border: '1px solid #E8C77A',
              borderRadius: 12,
              fontSize: 13,
              color: '#633806',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                ملفك غير مكتمل
              </div>
              <div>
                لم يُحدَّد اختصاصك في النظام. تواصل مع الدعم لإكمال البيانات حتى تتمكّن من رؤية الطلبات المناسبة لك.
              </div>
            </div>
          </div>
        )}

        {/* فلاتر */}
        <div className="scr-pills" style={{ marginTop: 12 }}>
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={`/specialist/orders?filter=${f.id}`}
              className={`scr-pill ${filter === f.id ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span style={{ marginInlineEnd: 4 }}>{f.icon}</span>{f.label}
            </Link>
          ))}
        </div>

        {(orders ?? []).length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 40 }}>
            <div className="scr-empty-icon">📭</div>
            <h2 className="scr-empty-title">لا توجد طلبات</h2>
            <p className="scr-empty-desc">
              {filter === 'new' ? 'لا توجد طلبات جديدة حالياً.' :
               filter === 'in_progress' ? 'لا توجد طلبات قيد التنفيذ.' :
               filter === 'completed' ? 'لم تكتمل أي طلبات بعد.' :
               'لا توجد طلبات.'}
            </p>
          </div>
        ) : (
          <div className="scr-list-stack" style={{ marginTop: 16 }}>
            {(orders ?? []).map((o) => {
              const status = STATUS_META[o.status] ?? STATUS_META.pending;
              const patient = patientMap.get(o.user_id);
              const date = new Date(o.scheduled_at);
              const dateStr = date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' });
              const timeStr = date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
              const isUnassigned = !o.assigned_specialist_id;

              return (
                <Link
                  key={o.id}
                  href={`/specialist/orders/${o.id}`}
                  className="scr-list-item scr-list-item-clickable"
                >
                  <div className="scr-list-item-icon" aria-hidden="true">{meta.icon}</div>
                  <div className="scr-list-item-content">
                    <div className="scr-list-item-title">
                      {patient?.full_name ?? 'مريض'}
                      {isUnassigned && (
                        <span style={{ marginInlineStart: 8, fontSize: 10, background: 'var(--rose-soft)', color: 'var(--rose)', padding: '2px 8px', borderRadius: 100, fontWeight: 800 }}>
                          جديد
                        </span>
                      )}
                    </div>
                    <div className="scr-list-item-subtitle">{o.service_type}</div>
                    <div className="scr-list-item-meta">📅 {dateStr} · {timeStr}</div>
                    {o.address && <div className="scr-list-item-meta">📍 {o.address}</div>}
                    <div className="scr-list-item-tags" style={{ marginTop: 8 }}>
                      <span className={`scr-tag ${status.color}`}>{status.label}</span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
