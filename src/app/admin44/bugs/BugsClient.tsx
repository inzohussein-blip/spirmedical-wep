'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Bug, AlertTriangle, CheckCircle2, X, Copy } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { updateBugStatus } from './actions';

interface BugReport {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  steps_to_reproduce: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'fixed' | 'wont_fix' | 'duplicate';
  page_url: string | null;
  browser: string | null;
  device: string | null;
  admin_notes: string | null;
  fixed_in_version: string | null;
  created_at: string;
}

interface Props {
  bugs: BugReport[];
  usersMap: Record<string, { id: string; full_name: string | null }>;
}

const SEVERITY_META = {
  critical: { label: 'حرج', color: 'var(--rose)',    bg: 'var(--rose-soft)',    emoji: '🔴' },
  high:     { label: 'مهم', color: 'var(--amber)',   bg: 'var(--amber-soft)',   emoji: '🟠' },
  medium:   { label: 'متوسط', color: 'var(--ink-2)', bg: 'var(--paper-3)',      emoji: '🟡' },
  low:      { label: 'منخفض', color: 'var(--ink-3)', bg: 'var(--paper-3)',      emoji: '🔵' },
};

const STATUS_META = {
  open:        { label: 'مفتوح',     color: 'var(--rose)',    bg: 'var(--rose-soft)',    emoji: '🆕' },
  in_progress: { label: 'قيد الإصلاح', color: 'var(--amber)',   bg: 'var(--amber-soft)',   emoji: '🔧' },
  fixed:       { label: 'مُصلَح',     color: 'var(--emerald)', bg: 'var(--emerald-soft)', emoji: '✓' },
  wont_fix:    { label: 'لن يُصلَح',  color: 'var(--ink-3)',   bg: 'var(--paper-3)',      emoji: '🚫' },
  duplicate:   { label: 'مُكرّر',     color: 'var(--ink-3)',   bg: 'var(--paper-3)',      emoji: '📋' },
};

export default function BugsClient({ bugs, usersMap }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterStatus, setFilterStatus] = useState<string>('open');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const stats = useMemo(() => ({
    total: bugs.length,
    open: bugs.filter(b => b.status === 'open').length,
    inProgress: bugs.filter(b => b.status === 'in_progress').length,
    critical: bugs.filter(b => b.severity === 'critical' && b.status !== 'fixed').length,
  }), [bugs]);

  const filtered = useMemo(() => {
    return bugs.filter((b) => {
      const sm = filterStatus === 'all' || b.status === filterStatus;
      const vm = filterSeverity === 'all' || b.severity === filterSeverity;
      return sm && vm;
    });
  }, [bugs, filterStatus, filterSeverity]);

  const handleStatusChange = (b: BugReport, newStatus: BugReport['status']) => {
    startTransition(async () => {
      const r = await updateBugStatus(b.id, newStatus);
      if (r.success) {
        toast.success('تم التحديث');
        router.refresh();
      } else {
        toast.error(r.error || 'فشل');
      }
    });
  };

  const copyDescription = (b: BugReport) => {
    const text = `[${b.severity}] ${b.title}\n\n${b.description}\n\nSteps: ${b.steps_to_reproduce || 'N/A'}\nPage: ${b.page_url || 'N/A'}\nBrowser: ${b.browser || 'N/A'}`;
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  };

  return (
    <div>
      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10, marginBottom: 16,
      }}>
        <StatCard label="الإجمالي" value={stats.total} color="var(--ink-2)" icon={<Bug size={16} />} />
        <StatCard label="مفتوح" value={stats.open} color="var(--rose)" icon={<AlertTriangle size={16} />} />
        <StatCard label="قيد العمل" value={stats.inProgress} color="var(--amber)" icon={<Bug size={16} />} />
        <StatCard label="حرج معلّق" value={stats.critical} color="var(--rose)" icon={<AlertTriangle size={16} />} />
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
        <FilterPill active={filterSeverity === 'all'} onClick={() => setFilterSeverity('all')}>كل المستويات</FilterPill>
        {Object.entries(SEVERITY_META).map(([key, meta]) => (
          <FilterPill key={key} active={filterSeverity === key} onClick={() => setFilterSeverity(key)}>
            {meta.emoji} {meta.label}
          </FilterPill>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--white)', borderRadius: 12 }}>
          <Bug size={42} color="var(--ink-4)" style={{ opacity: 0.5, marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {bugs.length === 0 ? 'لا توجد أعطال 🎉' : 'لا توجد أعطال تطابق الفلتر'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((b) => {
            const sev = SEVERITY_META[b.severity];
            const st = STATUS_META[b.status];
            const user = b.user_id ? usersMap[b.user_id] : null;

            return (
              <article
                key={b.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 14,
                  borderInlineStartWidth: 4,
                  borderInlineStartStyle: 'solid',
                  borderInlineStartColor: sev.color,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{
                        padding: '2px 6px',
                        background: sev.bg,
                        color: sev.color,
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 800,
                      }}>
                        {sev.emoji} {sev.label}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        background: st.bg,
                        color: st.color,
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 800,
                      }}>
                        {st.emoji} {st.label}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 13, fontWeight: 900, margin: '0 0 4px' }}>
                      {b.title}
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
                      {b.description}
                    </p>

                    {b.steps_to_reproduce && (
                      <details style={{ marginTop: 6 }}>
                        <summary style={{ fontSize: 10, color: 'var(--ink-3)', cursor: 'pointer', fontWeight: 700 }}>
                          خطوات الإعادة
                        </summary>
                        <pre style={{
                          fontSize: 10,
                          background: 'var(--paper-3)',
                          padding: 8,
                          borderRadius: 6,
                          marginTop: 4,
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'inherit',
                        }}>
                          {b.steps_to_reproduce}
                        </pre>
                      </details>
                    )}

                    <div style={{ marginTop: 8, fontSize: 10, color: 'var(--ink-3)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span>👤 {user?.full_name || 'مجهول'}</span>
                      {b.browser && <span>🌐 {b.browser}</span>}
                      {b.device && <span>📱 {b.device}</span>}
                      {b.page_url && (
                        <code style={{ fontSize: 9, background: 'var(--paper-3)', padding: '1px 4px', borderRadius: 3 }}>
                          {b.page_url}
                        </code>
                      )}
                      <span>· {new Date(b.created_at).toLocaleDateString('ar-IQ')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyDescription(b)}
                    aria-label="نسخ"
                    style={{
                      width: 32, height: 32, background: 'var(--paper-3)', color: 'var(--ink-2)',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <Copy size={14} />
                  </button>
                </div>

                {/* Status actions */}
                <div style={{
                  display: 'flex', gap: 4, paddingTop: 10,
                  borderTop: '1px solid var(--line)', flexWrap: 'wrap',
                }}>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleStatusChange(b, key as BugReport['status'])}
                      disabled={isPending || b.status === key}
                      style={{
                        padding: '4px 10px',
                        background: b.status === key ? meta.color : 'var(--white)',
                        color: b.status === key ? 'var(--paper-3)' : meta.color,
                        border: '1px solid',
                        borderColor: meta.color,
                        borderRadius: 100,
                        cursor: b.status === key ? 'default' : 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 10,
                        fontWeight: 700,
                        opacity: b.status === key ? 0.7 : 1,
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

function StatCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 12,
      borderInlineStartWidth: 4, borderInlineStartStyle: 'solid', borderInlineStartColor: color,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{value.toLocaleString('ar-IQ')}</div>
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
