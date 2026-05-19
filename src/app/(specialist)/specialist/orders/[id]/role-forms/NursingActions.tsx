'use client';

import { useState, useTransition } from 'react';
import { updateOrderRoleData } from '../actions';
import type { LucideIcon } from 'lucide-react';
import {
  Syringe, Droplet, Bandage, Stethoscope, Save, CheckCircle2,
  Activity, Footprints,
} from 'lucide-react';

interface NursingData {
  action_type?: string;
  description?: string;
  vitals?: { bp?: string; pulse?: string; temp?: string; spo2?: string };
  notes?: string;
}

interface Props {
  orderId: string;
  initialData: NursingData | null;
}

// ═══════════════════════════════════════════════════════════════
// ✨ V25.5: نطاق الخدمات التمريضية الكامل (من وثيقة المواصفات)
// ═══════════════════════════════════════════════════════════════
const ACTION_TYPES: Array<{ id: string; label: string; icon: LucideIcon; desc?: string }> = [
  { id: 'injection',     label: 'زرق إبر',         icon: Syringe,    desc: 'عضلية، وريدية، تحت الجلد' },
  { id: 'iv',            label: 'مغذٍ وريدي',       icon: Droplet,    desc: 'تركيب وإشراف' },
  { id: 'cannula',       label: 'تركيب كانيولا',   icon: Activity,   desc: 'تأمين المجرى الوريدي' },
  { id: 'wound_care',    label: 'تضميد جروح',      icon: Bandage,    desc: 'غيار جراحي معقّم' },
  { id: 'diabetic_foot', label: 'قدم السكري',      icon: Footprints, desc: 'تنظيف وغيار - معقّم' },
  { id: 'catheter',      label: 'قسطرة بولية',     icon: Stethoscope, desc: 'سحب القسطرة البولية' },
  { id: 'vaccination',   label: 'لقاح',            icon: Syringe,    desc: 'تطعيمات' },
];

export default function NursingActions({ orderId, initialData }: Props) {
  const [data, setData] = useState<NursingData>(initialData ?? { vitals: {} });
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderRoleData(orderId, 'nursing_actions', data);
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div className="scr-section-head">
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Syringe size={16} strokeWidth={2.2} />
          الإجراء التمريضي
        </div>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>نوع الإجراء</label>
          <div className="scr-pills">
            {ACTION_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setData({ ...data, action_type: t.id })}
                  className={`scr-pill ${data.action_type === t.id ? 'active' : ''}`}
                >
                  <Icon size={13} strokeWidth={2.2} aria-hidden />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>الوصف التفصيلي</label>
          <textarea
            value={data.description ?? ''}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="مثال: تم تركيب مغذي 500 مل سالين..."
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div className="scr-section-title" style={{ fontSize: 12, marginBottom: 8 }}>
          المؤشرات الحيوية <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>(يُنصح بإكمالها)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 2 }}>الضغط</label>
            <input
              type="text"
              value={data.vitals?.bp ?? ''}
              onChange={(e) => setData({ ...data, vitals: { ...data.vitals, bp: e.target.value } })}
              placeholder="120/80"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 2 }}>النبض</label>
            <input
              type="text"
              value={data.vitals?.pulse ?? ''}
              onChange={(e) => setData({ ...data, vitals: { ...data.vitals, pulse: e.target.value } })}
              placeholder="72"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 2 }}>الحرارة (°C)</label>
            <input
              type="text"
              value={data.vitals?.temp ?? ''}
              onChange={(e) => setData({ ...data, vitals: { ...data.vitals, temp: e.target.value } })}
              placeholder="36.8"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 2 }}>الأوكسجين SpO₂ (%)</label>
            <input
              type="text"
              value={data.vitals?.spo2 ?? ''}
              onChange={(e) => setData({ ...data, vitals: { ...data.vitals, spo2: e.target.value } })}
              placeholder="98"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>ملاحظات</label>
          <textarea
            value={data.notes ?? ''}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            placeholder="ملاحظات للطبيب أو السجل..."
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="scr-empty-cta"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}
        >
          <Save size={16} strokeWidth={2.2} />
          {isPending ? 'جارٍ الحفظ...' : 'حفظ الإجراء'}
        </button>

        {success && (
          <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginTop: 8, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle2 size={14} strokeWidth={2.4} />
            تم الحفظ
          </div>
        )}
      </div>
    </div>
  );
}
