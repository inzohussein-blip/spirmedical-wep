'use client';

import { useState, useTransition } from 'react';
import { recordVital, deleteVital, type VitalType } from './actions';
import type { LucideIcon } from 'lucide-react';
import {
  Heart, Droplet, Candy, Thermometer, Scale, Wind, Ruler,
  AlertTriangle, Calendar, Trash2,
} from 'lucide-react';

interface Vital {
  id: string;
  vital_type: string;
  value: string;
  unit: string | null;
  measured_at: string;
  notes: string | null;
}

const VITAL_META: Record<string, { label: string; icon: LucideIcon; unit: string; color: 'rose' | 'amber' | 'default'; placeholder: string }> = {
  pulse:           { label: 'النبض',     icon: Heart,       unit: 'نبضة/د',   color: 'rose',    placeholder: '72' },
  blood_pressure:  { label: 'الضغط',     icon: Droplet,     unit: 'ملم زئبق', color: 'default', placeholder: '120/80' },
  blood_sugar:     { label: 'السكر',     icon: Candy,       unit: 'mg/dL',    color: 'amber',   placeholder: '95' },
  temperature:     { label: 'الحرارة',   icon: Thermometer, unit: '°C',       color: 'rose',    placeholder: '36.8' },
  weight:          { label: 'الوزن',     icon: Scale,       unit: 'كغم',      color: 'default', placeholder: '70' },
  oxygen:          { label: 'الأوكسجين', icon: Wind,        unit: '%',        color: 'default', placeholder: '98' },
  height:          { label: 'الطول',     icon: Ruler,       unit: 'سم',       color: 'amber',   placeholder: '170' },
};

interface Props {
  latestByType: Record<string, Vital>;
  history: Vital[];
}

export default function HealthClient({ latestByType, history }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [vitalType, setVitalType] = useState<VitalType>('pulse');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const meta = VITAL_META[vitalType];

  function resetForm() {
    setValue(''); setNotes(''); setVitalType('pulse'); setError('');
  }

  function handleSubmit() {
    setError('');
    if (!value.trim()) { setError('أدخل قيمة القياس'); return; }

    startTransition(async () => {
      const result = await recordVital({
        vital_type: vitalType,
        value: value.trim(),
        unit: meta.unit,
        notes: notes.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error || 'تعذّر حفظ القياس');
        return;
      }
      resetForm();
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    if (!confirm('حذف هذا القياس؟')) return;
    startTransition(async () => {
      await deleteVital(id);
    });
  }

  return (
    <>
      {/* Vitals Grid */}
      <div className="scr-section-head" style={{ marginTop: 8 }}>
        <div className="scr-section-title">المؤشرات الحيوية</div>
      </div>

      <div className="services-grid">
        {(Object.keys(VITAL_META) as VitalType[]).map((type) => {
          const m = VITAL_META[type];
          const Icon = m.icon;
          const latest = latestByType[type];
          return (
            <div key={type} className={`service-card service-${m.color === 'rose' ? 'rose' : m.color === 'amber' ? 'amber' : 'default'}`}>
              <div className="service-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={2} />
              </div>
              <div className="service-title">{m.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: latest ? 'var(--ink)' : 'var(--ink-3)', marginTop: 4 }}>
                {latest?.value ?? '--'}
              </div>
              <div className="service-desc" style={{ fontSize: 10 }}>{m.unit}</div>
              {latest && (
                <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 4 }}>
                  {new Date(latest.measured_at).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showForm ? (
        <button
          type="button"
          className="scr-empty-cta"
          style={{ display: 'block', margin: '16px auto', maxWidth: 200, textAlign: 'center' }}
          onClick={() => setShowForm(true)}
        >
          + إدخال قياس جديد
        </button>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 16, marginTop: 16 }}>
          <div className="scr-section-title" style={{ marginBottom: 12 }}>قياس جديد</div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>النوع</label>
            <select
              value={vitalType}
              onChange={(e) => setVitalType(e.target.value as VitalType)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--white)', fontFamily: 'inherit' }}
            >
              {(Object.keys(VITAL_META) as VitalType[]).map((t) => (
                <option key={t} value={t}>{VITAL_META[t].label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
              القيمة ({meta.unit})
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={meta.placeholder}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>ملاحظات</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: بعد الأكل"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>

          {error && (
            <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} strokeWidth={2.4} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSubmit} disabled={isPending} className="scr-empty-cta" style={{ flex: 1 }}>
              {isPending ? 'جارٍ الحفظ...' : 'حفظ القياس'}
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

      {/* History */}
      {history.length > 0 && (
        <>
          <div className="scr-section-head" style={{ marginTop: 24 }}>
            <div className="scr-section-title">آخر {history.length} قياس</div>
          </div>
          <div className="scr-list-stack">
            {history.map((h) => {
              const m = VITAL_META[h.vital_type] ?? VITAL_META.pulse;
              const Icon = m.icon;
              const date = new Date(h.measured_at);
              return (
                <article key={h.id} className="scr-list-item">
                  <div className="scr-list-item-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="scr-list-item-content">
                    <div className="scr-list-item-title">{m.label}: {h.value} {h.unit}</div>
                    <div className="scr-list-item-meta">
                      <Calendar size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                      {date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' })} · {date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {h.notes && <div className="scr-list-item-meta" style={{ marginTop: 4, fontStyle: 'italic' }}>{h.notes}</div>}
                    <div className="scr-list-item-actions">
                      <button
                        type="button"
                        onClick={() => handleDelete(h.id)}
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
