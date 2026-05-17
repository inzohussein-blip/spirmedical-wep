'use client';

import { useState, useTransition } from 'react';
import { updateOrderRoleData } from '../actions';
import type { LucideIcon } from 'lucide-react';
import {
  Apple, Sunrise, Salad, Moon, Cookie, FileText, Save, CheckCircle2,
} from 'lucide-react';

interface MealData {
  current_weight?: string;
  target_weight?: string;
  daily_calories?: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
  notes?: string;
}

export default function MealPlan({ orderId, initialData }: { orderId: string; initialData: MealData | null }) {
  const [data, setData] = useState<MealData>(initialData ?? {});
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
  };

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderRoleData(orderId, 'session_plan', data);
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    });
  }

  const meals: Array<{ key: keyof MealData; label: string; icon: LucideIcon }> = [
    { key: 'breakfast', icon: Sunrise,  label: 'الفطور' },
    { key: 'lunch',     icon: Salad,    label: 'الغداء' },
    { key: 'dinner',    icon: Moon,     label: 'العشاء' },
    { key: 'snacks',    icon: Cookie,   label: 'وجبات خفيفة' },
    { key: 'notes',     icon: FileText, label: 'ملاحظات' },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div className="scr-section-head">
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Apple size={16} strokeWidth={2.2} />
          الخطة الغذائية
        </div>
      </div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 2 }}>الوزن الحالي (كغ)</label>
            <input type="text" value={data.current_weight ?? ''} onChange={(e) => setData({ ...data, current_weight: e.target.value })} placeholder="80" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 2 }}>الوزن المستهدف</label>
            <input type="text" value={data.target_weight ?? ''} onChange={(e) => setData({ ...data, target_weight: e.target.value })} placeholder="72" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 2 }}>سعرات يومية</label>
            <input type="text" value={data.daily_calories ?? ''} onChange={(e) => setData({ ...data, daily_calories: e.target.value })} placeholder="1800" style={inputStyle} />
          </div>
        </div>

        {meals.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Icon size={12} strokeWidth={2.2} aria-hidden />
                {f.label}
              </label>
              <textarea
                value={data[f.key] ?? ''}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                rows={2}
                style={inputStyle}
              />
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="scr-empty-cta"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
        >
          <Save size={16} strokeWidth={2.2} />
          {isPending ? 'جارٍ الحفظ...' : 'حفظ الخطة'}
        </button>
        {success && (
          <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginTop: 8, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <CheckCircle2 size={14} strokeWidth={2.4} />
            تم الحفظ
          </div>
        )}
      </div>
    </div>
  );
}
