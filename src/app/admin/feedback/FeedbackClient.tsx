'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star, Archive, CheckCircle2, Clock, AlertCircle,
  MessageSquare, ThumbsUp, ThumbsDown, Lightbulb, Loader2,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { updateFeedbackStatus } from './actions';

interface Feedback {
  id: string;
  user_id: string | null;
  type: 'suggestion' | 'complaint' | 'praise' | 'feature_request' | 'other';
  category: string;
  rating: number | null;
  subject: string | null;
  message: string;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'archived';
  admin_notes: string | null;
  page_url: string | null;
  created_at: string;
}

interface Props {
  feedbackList: Feedback[];
  usersMap: Record<string, { id: string; full_name: string | null; phone: string | null }>;
}

const TYPE_META = {
  suggestion:      { label: 'اقتراح',         emoji: '💡', color: 'var(--amber)',   icon: Lightbulb },
  complaint:       { label: 'شكوى',          emoji: '😞', color: 'var(--rose)',    icon: ThumbsDown },
  praise:          { label: 'مدح',           emoji: '😊', color: 'var(--emerald)', icon: ThumbsUp },
  feature_request: { label: 'طلب ميزة',      emoji: '✨', color: 'var(--emerald)', icon: Lightbulb },
  other:           { label: 'أخرى',          emoji: '💬', color: 'var(--ink-2)',   icon: MessageSquare },
};

const STATUS_META = {
  new:         { label: 'جديدة',     color: 'var(--amber)',   bg: 'var(--amber-soft)',   emoji: '🆕' },
  reviewed:    { label: 'مُراجعة',    color: 'var(--ink-2)',   bg: 'var(--paper-3)',      emoji: '👀' },
  in_progress: { label: 'قيد العمل', color: 'var(--emerald)', bg: 'var(--emerald-soft)', emoji: '🔧' },
  resolved:    { label: 'مُحلّولة',    color: 'var(--emerald)', bg: 'var(--emerald-soft)', emoji: '✓' },
  archived:    { label: 'مؤرشفة',    color: 'var(--ink-3)',   bg: 'var(--paper-3)',      emoji: '📦' },
};

const CATEGORY_LABELS: Record<string, string> = {
  booking: 'الحجوزات',
  consultation: 'الاستشارات',
  app_ui: 'الواجهة',
  doctors: 'الأطباء',
  pharmacy: 'الصيدليات',
  pricing: 'الأسعار',
  support: 'الدعم',
  performance: 'الأداء',
  other: 'أخرى',
};

export default function FeedbackClient({ feedbackList, usersMap }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const stats = useMemo(() => ({
    total: feedbackList.length,
    new: feedbackList.filter(f => f.status === 'new').length,
    inProgress: feedbackList.filter(f => f.status === 'in_progress').length,
    avgRating: (() => {
      const rated = feedbackList.filter(f => f.rating !== null);
      if (rated.length === 0) return 0;
      return rated.reduce((sum, f) => sum + (f.rating || 0), 0) / rated.length;
    })(),
  }), [feedbackList]);

  const filtered = useMemo(() => {
    return feedbackList.filter((f) => {
      const sm = filterStatus === 'all' || f.status === filterStatus;
      const tm = filterType === 'all' || f.type === filterType;
      return sm && tm;
    });
  }, [feedbackList, filterStatus, filterType]);

  const handleStatusChange = (f: Feedback, newStatus: Feedback['status']) => {
    startTransition(async () => {
      const r = await updateFeedbackStatus(f.id, newStatus);
      if (r.success) {
        toast.success('تم التحديث');
        router.refresh();
      } else {
        toast.error(r.error || 'فشل');
      }
    });
  };

  return (
    <div>
      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10, marginBottom: 16,
      }}>
        <StatCard label="الإجمالي" value={stats.total} color="var(--ink-2)" />
        <StatCard label="جديدة" value={stats.new} color="var(--amber)" />
        <StatCard label="قيد العمل" value={stats.inProgress} color="var(--emerald)" />
        <StatCard
          label="متوسط التقييم"
          value={stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} ⭐` : '-'}
          color="var(--amber)"
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <FilterPill active={filterStatus === 'all'} onClick={() => setFilterStatus('all')}>كل الحالات</FilterPill>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <FilterPill key={key} active={filterStatus === key} onClick={() => setFilterStatus(key)}>
            {meta.emoji} {meta.label}
          </FilterPill>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        <FilterPill active={filterType === 'all'} onClick={() => setFilterType('all')}>كل الأنواع</FilterPill>
        {Object.entries(TYPE_META).map(([key, meta]) => (
          <FilterPill key={key} active={filterType === key} onClick={() => setFilterType(key)}>
            {meta.emoji} {meta.label}
          </FilterPill>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--white)', borderRadius: 12 }}>
          <MessageSquare size={42} color="var(--ink-4)" style={{ opacity: 0.5, marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {feedbackList.length === 0
              ? 'لا توجد ملاحظات بعد'
              : 'لا توجد ملاحظات تطابق الفلتر'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((f) => {
            const typeMeta = TYPE_META[f.type];
            const statusMeta = STATUS_META[f.status];
            const user = f.user_id ? usersMap[f.user_id] : null;

            return (
              <article
                key={f.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 14,
                  borderInlineStartWidth: 4,
                  borderInlineStartStyle: 'solid',
                  borderInlineStartColor: typeMeta.color,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${typeMeta.color}15`,
                    color: typeMeta.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {typeMeta.emoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: typeMeta.color, fontWeight: 800 }}>
                        {typeMeta.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>·</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        {CATEGORY_LABELS[f.category] || f.category}
                      </span>
                      <span style={{
                        padding: '1px 6px',
                        background: statusMeta.bg,
                        color: statusMeta.color,
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 800,
                      }}>
                        {statusMeta.emoji} {statusMeta.label}
                      </span>
                    </div>

                    {f.subject && (
                      <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 4px' }}>
                        {f.subject}
                      </h4>
                    )}

                    <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
                      {f.message}
                    </p>

                    {f.rating && (
                      <div style={{ display: 'flex', gap: 1, marginTop: 6 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            size={12}
                            fill={n <= f.rating! ? 'var(--amber)' : 'none'}
                            color="var(--amber)"
                          />
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 8, fontSize: 10, color: 'var(--ink-3)' }}>
                      {user ? `👤 ${user.full_name}${user.phone ? ` · ${user.phone}` : ''}` : '👤 مجهول'}
                      {' · '}
                      {new Date(f.created_at).toLocaleString('ar-IQ', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                      {f.page_url && (
                        <>
                          {' · '}
                          <code style={{ fontSize: 9, background: 'var(--paper-3)', padding: '1px 4px', borderRadius: 3 }}>
                            {f.page_url}
                          </code>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status quick actions */}
                <div style={{
                  display: 'flex', gap: 6, paddingTop: 10,
                  borderTop: '1px solid var(--line)', flexWrap: 'wrap',
                }}>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleStatusChange(f, key as Feedback['status'])}
                      disabled={isPending || f.status === key}
                      style={{
                        padding: '4px 10px',
                        background: f.status === key ? meta.color : 'var(--white)',
                        color: f.status === key ? 'var(--paper-3)' : meta.color,
                        border: '1px solid',
                        borderColor: meta.color,
                        borderRadius: 100,
                        cursor: f.status === key ? 'default' : 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 10,
                        fontWeight: 700,
                        opacity: f.status === key ? 0.7 : 1,
                      }}
                    >
                      {meta.emoji} {meta.label}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 12,
      borderInlineStartWidth: 4, borderInlineStartStyle: 'solid', borderInlineStartColor: color,
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, marginTop: 4 }}>
        {typeof value === 'number' ? value.toLocaleString('ar-IQ') : value}
      </div>
    </div>
  );
}

function FilterPill({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        background: active ? 'var(--ink-2)' : 'var(--white)',
        color: active ? 'var(--paper-3)' : 'var(--ink-2)',
        border: '1px solid',
        borderColor: active ? 'var(--ink-2)' : 'var(--line)',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
