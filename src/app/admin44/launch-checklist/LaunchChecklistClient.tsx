'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, AlertTriangle, FileText, Scale, Megaphone,
  Wrench, Shield, CheckCircle2, Circle, Loader2,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { toggleChecklistItem } from './actions';

interface ChecklistItem {
  id: string;
  category: 'technical' | 'content' | 'legal' | 'marketing' | 'operations' | 'security';
  title: string;
  description: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  is_completed: boolean;
  notes: string | null;
  order_index: number;
}

interface Props {
  items: ChecklistItem[];
}

const CATEGORY_META = {
  technical:  { label: 'تقني',     emoji: '🔧', color: 'var(--emerald)', icon: Wrench },
  content:    { label: 'محتوى',    emoji: '📝', color: 'var(--amber)',   icon: FileText },
  legal:      { label: 'قانوني',   emoji: '⚖️', color: 'var(--ink-2)',   icon: Scale },
  marketing:  { label: 'تسويق',    emoji: '📢', color: 'var(--rose)',    icon: Megaphone },
  operations: { label: 'عمليات',   emoji: '⚙️', color: 'var(--ink-2)',   icon: Wrench },
  security:   { label: 'أمان',     emoji: '🛡️', color: 'var(--ink-2)',   icon: Shield },
};

const PRIORITY_META = {
  critical: { label: 'حرج',     color: 'var(--rose)',    bg: 'var(--rose-soft)' },
  high:     { label: 'مهم',     color: 'var(--amber)',   bg: 'var(--amber-soft)' },
  medium:   { label: 'متوسط',   color: 'var(--ink-2)',   bg: 'var(--paper-3)' },
  low:      { label: 'منخفض',   color: 'var(--ink-3)',   bg: 'var(--paper-3)' },
};

export default function LaunchChecklistClient({ items }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter(i => i.is_completed).length;
    const criticalPending = items.filter(i => !i.is_completed && i.priority === 'critical').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, criticalPending, pct };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const catMatch = filterCategory === 'all' || item.category === filterCategory;
      const statusMatch =
        filterStatus === 'all' ||
        (filterStatus === 'pending' && !item.is_completed) ||
        (filterStatus === 'completed' && item.is_completed);
      return catMatch && statusMatch;
    });
  }, [items, filterCategory, filterStatus]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    filtered.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filtered]);

  const handleToggle = (item: ChecklistItem) => {
    startTransition(async () => {
      const result = await toggleChecklistItem(item.id, !item.is_completed);
      if (result.success) {
        toast.success(item.is_completed ? 'تم إعادة الفتح' : 'تم الإكمال ✓');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل');
      }
    });
  };

  // Stats per category
  const categoryStats = useMemo(() => {
    const cats: Record<string, { total: number; completed: number }> = {};
    items.forEach(item => {
      if (!cats[item.category]) cats[item.category] = { total: 0, completed: 0 };
      cats[item.category].total++;
      if (item.is_completed) cats[item.category].completed++;
    });
    return cats;
  }, [items]);

  return (
    <div>
      {/* Overall progress */}
      <div
        style={{
          background: stats.pct === 100 ? 'var(--emerald-soft)' : 'var(--white)',
          border: '2px solid',
          borderColor: stats.pct === 100 ? 'var(--emerald)' : 'var(--line)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: stats.pct === 100 ? 'var(--emerald)' : `conic-gradient(var(--emerald) ${stats.pct}%, var(--paper-3) ${stats.pct}%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                background: stats.pct === 100 ? 'var(--emerald)' : 'var(--white)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 900,
                color: stats.pct === 100 ? 'var(--paper-3)' : 'var(--emerald)',
              }}
            >
              {stats.pct === 100 ? '✓' : `${stats.pct}%`}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>
              {stats.pct === 100 ? '🎉 جاهز للإطلاق!' : 'التقدّم العام'}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              {stats.completed} من {stats.total} مهمة مُكتملة
              {stats.criticalPending > 0 && (
                <span style={{ color: 'var(--rose)', fontWeight: 800, marginInlineStart: 8 }}>
                  ⚠️ {stats.criticalPending} مهمة حرجة معلّقة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Per-category progress */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const cat = categoryStats[key];
            if (!cat) return null;
            const pct = Math.round((cat.completed / cat.total) * 100);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterCategory(filterCategory === key ? 'all' : key)}
                style={{
                  background: filterCategory === key ? meta.color : 'var(--paper-3)',
                  color: filterCategory === key ? 'var(--paper-3)' : 'var(--ink-2)',
                  border: 'none',
                  borderRadius: 10,
                  padding: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'start',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>
                  {meta.emoji} {meta.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2 }}>
                  {cat.completed}/{cat.total}
                </div>
                <div
                  style={{
                    height: 3,
                    background: filterCategory === key ? 'rgba(255,255,255,0.3)' : 'var(--line)',
                    borderRadius: 2,
                    marginTop: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: filterCategory === key ? 'var(--paper-3)' : meta.color,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['all', 'pending', 'completed'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '8px 14px',
              background: filterStatus === status ? 'var(--ink-2)' : 'var(--white)',
              color: filterStatus === status ? 'var(--paper-3)' : 'var(--ink-2)',
              border: '1px solid',
              borderColor: filterStatus === status ? 'var(--ink-2)' : 'var(--line)',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {status === 'all' ? 'الكل' : status === 'pending' ? 'معلّق' : 'مُكتمل'}
          </button>
        ))}
      </div>

      {/* Items */}
      {Object.entries(grouped).map(([category, catItems]) => {
        const meta = CATEGORY_META[category as keyof typeof CATEGORY_META];
        return (
          <section key={category} style={{ marginBottom: 20 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 800,
              margin: '0 0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: meta.color,
            }}>
              {meta.emoji} {meta.label}
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                ({catItems.filter(i => i.is_completed).length}/{catItems.length})
              </span>
            </h3>

            <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
              {catItems.map((item, idx) => {
                const priorityMeta = PRIORITY_META[item.priority];
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: 12,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      borderBottom: idx < catItems.length - 1 ? '1px solid var(--line)' : 'none',
                      opacity: item.is_completed ? 0.6 : 1,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      disabled={isPending}
                      aria-label={item.is_completed ? 'إلغاء الإكمال' : 'إكمال'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: isPending ? 'wait' : 'pointer',
                        padding: 2,
                        flexShrink: 0,
                      }}
                    >
                      {isPending ? (
                        <Loader2 size={22} className="animate-spin" color="var(--ink-3)" />
                      ) : item.is_completed ? (
                        <CheckCircle2 size={22} color="var(--emerald)" />
                      ) : (
                        <Circle size={22} color="var(--ink-3)" />
                      )}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 700,
                          textDecoration: item.is_completed ? 'line-through' : 'none',
                          color: 'var(--ink)',
                        }}>
                          {item.title}
                        </span>
                        <span style={{
                          padding: '1px 6px',
                          background: priorityMeta.bg,
                          color: priorityMeta.color,
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 800,
                        }}>
                          {priorityMeta.label}
                        </span>
                      </div>
                      {item.description && (
                        <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '4px 0 0', lineHeight: 1.5 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--white)', borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>لا توجد مهام مطابقة للفلتر</p>
        </div>
      )}
    </div>
  );
}
