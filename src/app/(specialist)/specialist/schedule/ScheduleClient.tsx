'use client';

import { useState, useTransition } from 'react';
import { saveSchedule, saveAutoReply } from './actions';
import { Calendar, MessageCircle, Save, CheckCircle2 } from 'lucide-react';

interface ScheduleSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS = [
  { num: 0, name: 'الأحد' },
  { num: 1, name: 'الإثنين' },
  { num: 2, name: 'الثلاثاء' },
  { num: 3, name: 'الأربعاء' },
  { num: 4, name: 'الخميس' },
  { num: 5, name: 'الجمعة' },
  { num: 6, name: 'السبت' },
];

interface Props {
  initialSchedules: ScheduleSlot[];
  initialAutoReply: string;
}

export default function ScheduleClient({ initialSchedules, initialAutoReply }: Props) {
  // ابني slots لكل يوم
  const [slots, setSlots] = useState<ScheduleSlot[]>(() => {
    return DAYS.map((d) => {
      const existing = initialSchedules.find((s) => s.day_of_week === d.num);
      return existing ?? {
        day_of_week: d.num,
        start_time: '09:00',
        end_time: '17:00',
        is_active: false,
      };
    });
  });

  const [autoReply, setAutoReply] = useState(initialAutoReply);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState('');

  function updateSlot(i: number, field: keyof ScheduleSlot, value: string | boolean | number) {
    const next = [...slots];
    next[i] = { ...next[i], [field]: value };
    setSlots(next);
  }

  function handleSaveSchedule() {
    startTransition(async () => {
      const activeSlots = slots.filter((s) => s.is_active);
      const result = await saveSchedule(activeSlots);
      if (result.ok) {
        setSuccess('تم حفظ جدولك');
        setTimeout(() => setSuccess(''), 2500);
      }
    });
  }

  function handleSaveAutoReply() {
    startTransition(async () => {
      const result = await saveAutoReply(autoReply.trim());
      if (result.ok) {
        setSuccess('تم حفظ الرد التلقائي');
        setTimeout(() => setSuccess(''), 2500);
      }
    });
  }

  return (
    <>
      {/* جدول الدوام */}
      <div className="scr-section-head" style={{ marginTop: 14 }}>
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={16} strokeWidth={2.2} />
          أيام وساعات العمل
        </div>
      </div>

      <div className="scr-list-stack">
        {slots.map((s, i) => {
          const day = DAYS[i];
          return (
            <div key={day.num} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: s.is_active ? 10 : 0 }}>
                <label className="scr-toggle">
                  <input type="checkbox" checked={s.is_active} onChange={(e) => updateSlot(i, 'is_active', e.target.checked)} />
                  <span className="scr-toggle-slider"></span>
                </label>
                <div style={{ fontSize: 14, fontWeight: 800, flex: 1 }}>{day.name}</div>
                {!s.is_active && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>مغلق</span>}
              </div>
              {s.is_active && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, display: 'block', marginBottom: 2 }}>من</label>
                    <input
                      type="time"
                      value={s.start_time}
                      onChange={(e) => updateSlot(i, 'start_time', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, display: 'block', marginBottom: 2 }}>إلى</label>
                    <input
                      type="time"
                      value={s.end_time}
                      onChange={(e) => updateSlot(i, 'end_time', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSaveSchedule}
        disabled={isPending}
        className="scr-empty-cta"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 14 }}
      >
        <Save size={16} strokeWidth={2.2} />
        {isPending ? 'جارٍ الحفظ...' : 'حفظ الجدول'}
      </button>

      {/* الرد التلقائي */}
      <div className="scr-section-head" style={{ marginTop: 24 }}>
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageCircle size={16} strokeWidth={2.2} />
          الرد التلقائي للعميل
        </div>
      </div>
      <p className="scr-page-subtitle" style={{ marginBottom: 10 }}>
        رسالة تصل العميل تلقائياً عند حجزه طلب جديد
      </p>

      <textarea
        value={autoReply}
        onChange={(e) => setAutoReply(e.target.value)}
        placeholder="مثال: مرحباً! استلمت طلبك وسأرد عليك خلال ساعة. شكراً لاختياركم Spir Medical."
        rows={4}
        style={{
          width: '100%',
          padding: '12px',
          border: '1px solid var(--line)',
          borderRadius: 12,
          fontSize: 13,
          fontFamily: 'inherit',
          resize: 'vertical',
          background: 'var(--white)',
        }}
      />

      <button
        type="button"
        onClick={handleSaveAutoReply}
        disabled={isPending}
        className="scr-empty-cta"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 10 }}
      >
        <Save size={16} strokeWidth={2.2} />
        {isPending ? 'جارٍ الحفظ...' : 'حفظ الرسالة'}
      </button>

      {success && (
        <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginTop: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <CheckCircle2 size={14} strokeWidth={2.4} />
          {success}
        </div>
      )}

      <div style={{ height: 80 }} />
    </>
  );
}
