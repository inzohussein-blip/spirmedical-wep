'use client';

import Link from 'next/link';
import {
  Users, Calendar, MessageCircle, Stethoscope, Sparkles,
  TrendingUp, Activity, BarChart3,
} from 'lucide-react';

interface EventStat {
  event_name: string;
  total: number;
  unique_users: number;
}

interface DailyStat {
  event_date: string;
  total: number;
  unique_users: number;
}

interface Props {
  stats: EventStat[];
  daily: DailyStat[];
  totals: {
    users: number;
    appointments: number;
    consultations: number;
    doctors: number;
    subscriptions: number;
    events: number;
  };
}

const EVENT_META: Record<string, { label: string; emoji: string; color: string }> = {
  auth_signup_started:        { label: 'بدء تسجيل', emoji: '📝', color: 'var(--amber)' },
  auth_signup_completed:      { label: 'تسجيل مكتمل', emoji: '✅', color: 'var(--emerald)' },
  auth_login:                 { label: 'دخول', emoji: '🔐', color: 'var(--ink-2)' },
  booking_started:            { label: 'بدء حجز', emoji: '📅', color: 'var(--amber)' },
  booking_completed:          { label: 'حجز مكتمل', emoji: '✓', color: 'var(--emerald)' },
  doctor_viewed:              { label: 'فتح طبيب', emoji: '👨‍⚕️', color: 'var(--emerald)' },
  hospital_viewed:            { label: 'فتح مستشفى', emoji: '🏥', color: 'var(--amber)' },
  pharmacy_searched:          { label: 'بحث صيدلية', emoji: '💊', color: 'var(--emerald)' },
  subscription_started:       { label: 'اشتراك جديد', emoji: '⭐', color: 'var(--amber)' },
  consultation_started:       { label: 'استشارة جديدة', emoji: '💬', color: 'var(--emerald)' },
  consultation_message_sent:  { label: 'رسالة في استشارة', emoji: '💌', color: 'var(--ink-2)' },
  consultation_image_shared:  { label: 'صورة مُشاركة', emoji: '📷', color: 'var(--ink-2)' },
  consultation_record_shared: { label: 'سجل مُحوّل', emoji: '📋', color: 'var(--ink-2)' },
  family_member_added:        { label: 'فرد عائلة جديد', emoji: '👨‍👩‍👧‍👦', color: 'var(--emerald)' },
  family_booking_made:        { label: 'حجز لعائلة', emoji: '👪', color: 'var(--amber)' },
  page_viewed:                { label: 'عرض صفحة', emoji: '👁️', color: 'var(--ink-3)' },
};

export default function AnalyticsClient({ stats, daily, totals }: Props) {
  const maxDaily = Math.max(...daily.map(d => d.total), 1);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/admin44" style={{
          padding: '8px 12px',
          background: 'var(--paper-3)',
          color: 'var(--ink-2)',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 700,
        }}>← العودة</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>📊 Analytics</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            تحليلات شاملة - آخر 30 يوم
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 10,
        marginBottom: 24,
      }}>
        <KpiCard icon={<Users size={20} />} label="المستخدمون" value={totals.users.toLocaleString('ar-IQ')} color="var(--emerald)" />
        <KpiCard icon={<Calendar size={20} />} label="الحجوزات" value={totals.appointments.toLocaleString('ar-IQ')} color="var(--amber)" />
        <KpiCard icon={<MessageCircle size={20} />} label="الاستشارات" value={totals.consultations.toLocaleString('ar-IQ')} color="var(--ink-2)" />
        <KpiCard icon={<Stethoscope size={20} />} label="الأطباء" value={totals.doctors.toLocaleString('ar-IQ')} color="var(--emerald)" />
        <KpiCard icon={<Sparkles size={20} />} label="الاشتراكات النشطة" value={totals.subscriptions.toLocaleString('ar-IQ')} color="var(--amber)" />
        <KpiCard icon={<Activity size={20} />} label="إجمالي الأحداث (30 يوم)" value={totals.events.toLocaleString('ar-IQ')} color="var(--ink-2)" />
      </div>

      {/* Daily chart */}
      {daily.length > 0 && (
        <div
          style={{
            background: 'var(--white)',
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
            border: '1px solid var(--line)',
          }}
        >
          <h2 style={{
            fontSize: 15,
            fontWeight: 800,
            margin: '0 0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <TrendingUp size={16} color="var(--emerald)" />
            نشاط آخر 7 أيام
          </h2>
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 16px' }}>
            عدد الأحداث + المستخدمين الفريدين
          </p>

          {/* Bar chart */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            height: 200,
            paddingBottom: 24,
            position: 'relative',
            borderBottom: '1px solid var(--line)',
          }}>
            {daily.map((d) => {
              const heightPct = (d.total / maxDaily) * 100;
              const userHeightPct = (d.unique_users / maxDaily) * 100;
              const dateLabel = new Date(d.event_date).toLocaleDateString('ar-IQ', {
                weekday: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={d.event_date}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  {/* Numbers */}
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--emerald)' }}>
                    {d.total}
                  </div>

                  {/* Bar */}
                  <div style={{
                    width: '100%',
                    background: 'var(--paper-3)',
                    borderRadius: 4,
                    position: 'relative',
                    height: `${heightPct}%`,
                    minHeight: 4,
                  }}>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${(userHeightPct / heightPct) * 100}%`,
                        background: 'var(--emerald)',
                        borderRadius: 4,
                      }}
                    />
                  </div>

                  {/* Date */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    fontSize: 9,
                    color: 'var(--ink-3)',
                    fontWeight: 700,
                  }}>
                    {dateLabel}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, background: 'var(--emerald)', borderRadius: 3 }} />
              <span>مستخدمون فريدون</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, background: 'var(--paper-3)', borderRadius: 3 }} />
              <span>إجمالي الأحداث</span>
            </div>
          </div>
        </div>
      )}

      {/* Events table */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 14,
          padding: 20,
          marginBottom: 16,
          border: '1px solid var(--line)',
        }}
      >
        <h2 style={{
          fontSize: 15,
          fontWeight: 800,
          margin: '0 0 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <BarChart3 size={16} color="var(--amber)" />
          الأحداث (Events)
        </h2>
        <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 16px' }}>
          ترتيب حسب الأكثر تكراراً
        </p>

        {stats.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              لا توجد أحداث بعد. سيبدأ التتبع عند استخدام المنصة.
            </p>
          </div>
        ) : (
          <div>
            {stats.map((stat) => {
              const meta = EVENT_META[stat.event_name] || {
                label: stat.event_name,
                emoji: '📊',
                color: 'var(--ink-2)',
              };
              const maxTotal = stats[0]?.total || 1;
              const widthPct = (stat.total / maxTotal) * 100;

              return (
                <div
                  key={stat.event_name}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 18 }}>{meta.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>{meta.label}</div>
                      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'monospace' }}>
                        {stat.event_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: meta.color }}>
                        {stat.total.toLocaleString('ar-IQ')}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>
                        {stat.unique_users} مستخدم
                      </div>
                    </div>
                  </div>
                  <div style={{
                    height: 4,
                    background: 'var(--paper-3)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${widthPct}%`,
                      background: meta.color,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        background: 'var(--emerald-soft)',
        borderRadius: 10,
        padding: 14,
        fontSize: 12,
        color: 'var(--ink-2)',
      }}>
        💡 <strong>ملاحظة:</strong> هذه البيانات من نظام Analytics الداخلي. لتحليل أعمق،
        فعّل PostHog عبر إضافة <code>NEXT_PUBLIC_POSTHOG_KEY</code> في Vercel.
      </div>
    </>
  );
}

function KpiCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 16,
        borderInlineStartWidth: 4,
        borderInlineStartStyle: 'solid',
        borderInlineStartColor: color,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          color,
        }}
      >
        {icon}
        <span style={{ fontSize: 11, fontWeight: 800 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
