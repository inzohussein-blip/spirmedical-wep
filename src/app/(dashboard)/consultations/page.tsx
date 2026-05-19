// ═══════════════════════════════════════════════════════════════
// 💬 صفحة الاستشارات (V25.9) - نصّية + صور + تحويل سجلات
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, MessageCircle, Plus, Clock, CheckCircle2,
  AlertCircle, ChevronLeft,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'استشاراتي - Spir Medical' };

const STATUS_META: Record<string, { label: string; color: string; emoji: string }> = {
  open: { label: 'مفتوحة', color: 'var(--emerald)', emoji: '🟢' },
  awaiting_doctor: { label: 'بانتظار الطبيب', color: 'var(--amber)', emoji: '⏳' },
  awaiting_patient: { label: 'الطبيب رد', color: 'var(--rose)', emoji: '💬' },
  closed: { label: 'مغلقة', color: 'var(--ink-3)', emoji: '✓' },
};

export default async function ConsultationsPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // جلب الاستشارات
  const { data: consultations } = await supabase
    .from('consultations')
    .select('*')
    .eq('patient_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // جلب الأطباء
  const doctorIds = [...new Set((consultations || []).map(c => c.doctor_id).filter(Boolean))];
  const { data: doctors } = doctorIds.length > 0
    ? await supabase
        .from('doctors')
        .select('id, full_name, title, specialty, avatar_url, gender')
        .in('id', doctorIds as string[])
    : { data: [] };

  const doctorsMap = Object.fromEntries((doctors || []).map(d => [d.id, d]));

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">استشاراتي</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          استشارات نصّية مع أطبائك · {consultations?.length ?? 0} استشارة
        </p>

        {/* New consultation button */}
        <Link
          href="/services/doctors"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            background: 'linear-gradient(135deg, var(--emerald), var(--emerald-deep))',
            color: 'var(--paper-3)',
            borderRadius: 14,
            textDecoration: 'none',
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(15, 107, 88, 0.2)',
          }}
        >
          <Plus size={22} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>استشارة جديدة</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              اختر طبيباً وابدأ المحادثة
            </div>
          </div>
          <ChevronLeft size={20} />
        </Link>

        {/* List */}
        {!consultations || consultations.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon">
              <MessageCircle size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد استشارات بعد</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              ابدأ استشارتك الأولى مع أحد الأطباء
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {consultations.map((c) => {
              const doctor = c.doctor_id ? doctorsMap[c.doctor_id] : null;
              const statusMeta = STATUS_META[c.status] || STATUS_META.open;
              const date = new Date(c.created_at);

              return (
                <Link
                  key={c.id}
                  href={`/consultations/${c.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <article
                    style={{
                      background: 'var(--white)',
                      border: '1px solid var(--line)',
                      borderRadius: 14,
                      padding: 14,
                      cursor: 'pointer',
                      borderInlineStartWidth: 4,
                      borderInlineStartStyle: 'solid',
                      borderInlineStartColor: statusMeta.color,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: doctor?.gender === 'female' ? '#FDE7E9' : 'var(--emerald-soft)',
                          fontSize: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {doctor?.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>
                          {doctor ? `${doctor.title} ${doctor.full_name}` : 'طبيب'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                          {c.title}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 4,
                            fontSize: 10,
                          }}
                        >
                          <Clock size={10} color="var(--ink-3)" />
                          <span style={{ color: 'var(--ink-3)' }}>
                            {date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' })}
                          </span>
                          <span
                            style={{
                              padding: '2px 6px',
                              background: `${statusMeta.color}15`,
                              color: statusMeta.color,
                              borderRadius: 4,
                              fontWeight: 800,
                            }}
                          >
                            {statusMeta.emoji} {statusMeta.label}
                          </span>
                        </div>
                      </div>

                      <ChevronLeft size={16} color="var(--ink-3)" />
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
