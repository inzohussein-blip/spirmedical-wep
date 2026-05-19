'use client';

import { useState } from 'react';
import { Clock, Repeat, Calendar } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * RecurringScheduler (V25.5)
 * ═══════════════════════════════════════════════════════════════
 *
 * الجدولة الزرقية - تنفيذ كورسات العلاج (مثل المضاد الحيوي):
 *   - "كل 8 ساعات"
 *   - "كل 12 ساعة"
 *   - "كل 24 ساعة"
 *
 * يُنشئ الطلبات تلقائياً بناءً على الفترة المحددة.
 * ═══════════════════════════════════════════════════════════════
 */

export interface RecurringData {
  enabled: boolean;
  interval_hours: number;
  end_date?: string;
  auto_confirm?: boolean;
}

interface Props {
  value: RecurringData;
  onChange: (data: RecurringData) => void;
}

const INTERVAL_OPTIONS = [
  { value: 8, label: 'كل 8 ساعات', desc: '3 مرات يومياً', emoji: '⏰' },
  { value: 12, label: 'كل 12 ساعة', desc: 'مرّتان يومياً', emoji: '🕛' },
  { value: 24, label: 'كل 24 ساعة', desc: 'مرّة يومياً', emoji: '📅' },
];

export default function RecurringScheduler({ value, onChange }: Props) {
  const [showDetails, setShowDetails] = useState(value.enabled);

  const handleToggle = () => {
    const newEnabled = !value.enabled;
    onChange({ ...value, enabled: newEnabled });
    setShowDetails(newEnabled);
  };

  return (
    <div
      style={{
        background: value.enabled ? 'var(--emerald-soft)' : 'var(--paper-3)',
        border: '1px solid',
        borderColor: value.enabled ? 'var(--emerald)' : 'var(--line)',
        borderRadius: 14,
        padding: 16,
        transition: 'all 0.2s',
      }}
    >
      {/* Header with toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: showDetails ? 12 : 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: value.enabled ? 'var(--emerald)' : 'var(--white)',
            color: value.enabled ? 'var(--paper-3)' : 'var(--ink-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Repeat size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontSize: 14,
              fontWeight: 800,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            جدولة دورية للعلاج
          </h4>
          <p
            style={{
              fontSize: 11,
              color: 'var(--ink-3)',
              margin: '2px 0 0',
            }}
          >
            لكورسات العلاج (مضادات حيوية، إبر دورية)
          </p>
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={value.enabled ? 'إيقاف' : 'تفعيل'}
          style={{
            width: 44,
            height: 26,
            padding: 2,
            background: value.enabled ? 'var(--emerald)' : 'var(--ink-4)',
            border: 'none',
            borderRadius: 100,
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s',
          }}
        >
          <span
            style={{
              display: 'block',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--paper-3)',
              transition: 'transform 0.2s',
              transform: value.enabled ? 'translateX(18px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {showDetails && (
        <>
          {/* Interval picker */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-2)',
                display: 'block',
                marginBottom: 8,
              }}
            >
              فترة التكرار
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
              }}
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...value, interval_hours: opt.value })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 6px',
                    background:
                      value.interval_hours === opt.value
                        ? 'var(--emerald)'
                        : 'var(--white)',
                    color:
                      value.interval_hours === opt.value
                        ? 'var(--paper-3)'
                        : 'var(--ink-2)',
                    border: '1px solid',
                    borderColor:
                      value.interval_hours === opt.value
                        ? 'var(--emerald)'
                        : 'var(--line)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 800 }}>{opt.label}</span>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* End date */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 6,
              }}
            >
              <Calendar size={12} />
              <span>تاريخ انتهاء الكورس</span>
            </label>
            <input
              type="date"
              value={value.end_date ?? ''}
              onChange={(e) => onChange({ ...value, end_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--white)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Auto-confirm */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={value.auto_confirm ?? false}
              onChange={(e) =>
                onChange({ ...value, auto_confirm: e.target.checked })
              }
              style={{ width: 16, height: 16, accentColor: 'var(--emerald)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                تأكيد تلقائي للمواعيد القادمة
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                ستُنشأ الطلبات تلقائياً بدون الحاجة لإعادة الطلب
              </div>
            </div>
          </label>

          {value.interval_hours && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: 'var(--white)',
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--ink-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Clock size={14} color="var(--emerald)" />
              <span>
                <strong>{Math.floor(24 / value.interval_hours)} زيارات</strong> يومياً ·
                ستصلك تذكيرات بكل موعد
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
