import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SPECIALIST_META } from '@/lib/specialist-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'موافقات الاختصاصيين · إدارة',
};

export default async function PendingSpecialistsPage() {
  const supabase = createClient();

  const { data: pending } = await supabase
    .from('users')
    .select('id, full_name, phone, governorate, email, specialist_type, specialist_bio, specialist_years_exp, created_at')
    .eq('role', 'specialist')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
        ⏳ موافقات الاختصاصيين
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px' }}>
        طلبات تسجيل بانتظار المراجعة ({pending?.length ?? 0})
      </p>

      {!pending || pending.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 14,
          padding: 60,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>لا توجد طلبات معلّقة</h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>كل الاختصاصيين تمت مراجعة طلباتهم</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pending.map((s) => {
            const meta = s.specialist_type ? SPECIALIST_META[s.specialist_type] : null;
            const daysAgo = Math.floor((Date.now() - new Date(s.created_at).getTime()) / 86400000);

            return (
              <div key={s.id} style={{
                background: '#fff',
                borderRadius: 14,
                padding: 18,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: meta?.gradient ?? 'var(--paper-3)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}>
                  {meta?.icon ?? '⚕️'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>
                        {s.full_name ?? 'بدون اسم'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }} dir="ltr">
                        {s.phone}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10,
                      padding: '4px 10px',
                      borderRadius: 100,
                      background: 'var(--amber-soft, #F8E5C7)',
                      color: 'var(--amber-deep, #6B3A08)',
                      fontWeight: 800,
                    }}>
                      منذ {daysAgo === 0 ? 'اليوم' : `${daysAgo} ${daysAgo === 1 ? 'يوم' : 'أيام'}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
                    {s.governorate && <span>📍 {s.governorate}</span>}
                    {s.specialist_type && meta && <span>{meta.icon} {meta.label}</span>}
                    {s.specialist_years_exp && <span>📅 {s.specialist_years_exp} سنوات</span>}
                    {s.email && <span>✉️ {s.email}</span>}
                  </div>

                  {s.specialist_bio && (
                    <p style={{ fontSize: 12, color: 'var(--ink-2, #2A3540)', margin: '0 0 12px', lineHeight: 1.7 }}>
                      {s.specialist_bio}
                    </p>
                  )}

                  <Link
                    href={`/admin44/specialists/${s.id}`}
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: 'var(--emerald-deep, #073B30)',
                      color: '#fff',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    مراجعة الطلب ←
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
