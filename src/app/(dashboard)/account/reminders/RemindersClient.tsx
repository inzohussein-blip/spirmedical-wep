'use client';

import { useState, useTransition } from 'react';
import { createReminder, toggleReminder, deleteReminder, type ReminderType, type ReminderFrequency } from './actions';
import type { LucideIcon } from 'lucide-react';
import {
  Pill, Calendar, TestTube, Syringe, AlertTriangle, Clock,
  Pause, Play, Trash2,
} from 'lucide-react';

interface Reminder {
  id: string;
  type: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  frequency: string;
  active: boolean;
}

const TYPE_META: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  medication:  { label: 'دواء',      icon: Pill,     color: 'default' },
  appointment: { label: 'موعد طبيب', icon: Calendar, color: 'amber' },
  checkup:     { label: 'فحص دوري',   icon: TestTube, color: 'default' },
  vaccine:     { label: 'لقاح',       icon: Syringe,  color: 'rose' },
};

const FREQ_LABEL: Record<string, string> = {
  once: 'مرة واحدة',
  daily: 'يومياً',
  weekly: 'أسبوعياً',
  monthly: 'شهرياً',
  yearly: 'سنوياً',
};

export default function RemindersClient({ reminders }: { reminders: Reminder[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Form state
  const [type, setType] = useState<ReminderType>('medication');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [frequency, setFrequency] = useState<ReminderFrequency>('daily');

  function resetForm() {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setType('medication');
    setFrequency('daily');
    setError('');
  }

  function handleSubmit() {
    setError('');
    if (!title.trim()) { setError('أدخل عنوان التذكير'); return; }
    if (!date || !time) { setError('حدّد تاريخاً ووقتاً'); return; }

    const scheduled_at = new Date(`${date}T${time}:00`).toISOString();

    startTransition(async () => {
      const result = await createReminder({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_at,
        frequency,
      });
      if (!result.ok) {
        setError(result.error || 'تعذّر إضافة التذكير');
        return;
      }
      resetForm();
      setShowForm(false);
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleReminder(id, !active);
    });
  }

  function handleDelete(id: string) {
    if (!confirm('حذف هذا التذكير؟')) return;
    startTransition(async () => {
      await deleteReminder(id);
    });
  }

  return (
    <>
      {/* زر إضافة + Form */}
      {!showForm ? (
        <button
          type="button"
          className="scr-empty-cta"
          style={{ display: 'block', width: '100%', marginTop: 16 }}
          onClick={() => setShowForm(true)}
        >
          + إضافة تذكير جديد
        </button>
      ) : (
        <div className="scr-form-card" style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 16, marginTop: 16 }}>
          <div className="scr-section-title" style={{ marginBottom: 12 }}>تذكير جديد</div>

          {/* Type */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>النوع</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(Object.keys(TYPE_META) as ReminderType[]).map((t) => {
                const Icon = TYPE_META[t].icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`scr-pill ${type === t ? 'active' : ''}`}
                    style={{ flex: '1 1 auto' }}
                  >
                    <Icon size={13} strokeWidth={2.2} aria-hidden /> {TYPE_META[t].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>العنوان</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حبة ضغط الدم"
              className="scr-input"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>

          {/* Date + Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>التاريخ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="scr-input"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>الوقت</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="scr-input"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Frequency */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>التكرار</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ReminderFrequency)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--white)', fontFamily: 'inherit' }}
            >
              {(Object.keys(FREQ_LABEL) as ReminderFrequency[]).map((f) => (
                <option key={f} value={f}>{FREQ_LABEL[f]}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>ملاحظات (اختياري)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: بعد الأكل مباشرة"
              rows={2}
              className="scr-input"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} strokeWidth={2.4} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="scr-empty-cta"
              style={{ flex: 1 }}
            >
              {isPending ? 'جارٍ الحفظ...' : 'حفظ التذكير'}
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--white)', fontSize: 12, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* قائمة التذكيرات */}
      {reminders.length === 0 ? (
        <div className="scr-empty" style={{ marginTop: 32 }}>
          <div className="scr-empty-icon" aria-hidden="true">
            <Clock size={42} strokeWidth={1.5} />
          </div>
          <h2 className="scr-empty-title">لا توجد تذكيرات</h2>
          <p className="scr-empty-desc">أضف تذكيراً لأدويتك أو مواعيدك الطبية وسنُنبّهك في الوقت المحدد.</p>
        </div>
      ) : (
        <>
          <div className="scr-section-head" style={{ marginTop: 24 }}>
            <div className="scr-section-title">تذكيراتك ({reminders.length})</div>
          </div>
          <div className="scr-list-stack">
            {reminders.map((r) => {
              const meta = TYPE_META[r.type] ?? TYPE_META.medication;
              const Icon = meta.icon;
              const date = new Date(r.scheduled_at);
              const dateStr = date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' });
              const timeStr = date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
              return (
                <article key={r.id} className="scr-list-item" style={{ opacity: r.active ? 1 : 0.5 }}>
                  <div className="scr-list-item-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="scr-list-item-content">
                    <div className="scr-list-item-title">{r.title}</div>
                    <div className="scr-list-item-subtitle">{meta.label} · {FREQ_LABEL[r.frequency] ?? r.frequency}</div>
                    <div className="scr-list-item-meta">
                      <Calendar size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                      {dateStr} · {timeStr}
                    </div>
                    {r.description && <div className="scr-list-item-meta" style={{ marginTop: 4 }}>{r.description}</div>}
                    <div className="scr-list-item-actions">
                      <button
                        type="button"
                        onClick={() => handleToggle(r.id, r.active)}
                        disabled={isPending}
                        className="scr-action-btn"
                      >
                        {r.active ? <Pause size={14} strokeWidth={2.2} /> : <Play size={14} strokeWidth={2.2} />}
                        <span>{r.active ? 'إيقاف' : 'تفعيل'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={isPending}
                        className="scr-action-btn"
                        style={{ color: 'var(--rose)' }}
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
