'use client';

import { useState, useTransition } from 'react';
import { updateOrderRoleData } from '../actions';
import { Trash2, Save, CheckCircle2, Stethoscope } from 'lucide-react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

interface PrescriptionData {
  diagnosis?: string;
  medications?: Medication[];
  instructions?: string;
  follow_up?: string;
}

interface Props {
  orderId: string;
  initialData: PrescriptionData | null;
  patientId: string;
}

export default function PrescriptionForm({ orderId, initialData }: Props) {
  const [data, setData] = useState<PrescriptionData>(initialData ?? { medications: [] });
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
  };

  function addMed() {
    setData({
      ...data,
      medications: [...(data.medications ?? []), { name: '', dosage: '', frequency: '', duration: '', notes: '' }],
    });
  }

  function updateMed(i: number, field: keyof Medication, value: string) {
    const meds = [...(data.medications ?? [])];
    meds[i] = { ...meds[i], [field]: value };
    setData({ ...data, medications: meds });
  }

  function removeMed(i: number) {
    setData({ ...data, medications: (data.medications ?? []).filter((_, idx) => idx !== i) });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderRoleData(orderId, 'prescription_data', data);
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    });
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="scr-section-head">
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stethoscope size={16} strokeWidth={2.2} />
          التشخيص والوصفة
        </div>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>التشخيص</label>
          <textarea
            value={data.diagnosis ?? ''}
            onChange={(e) => setData({ ...data, diagnosis: e.target.value })}
            placeholder="مثال: التهاب فيروسي حاد..."
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="scr-section-title" style={{ fontSize: 12 }}>الأدوية ({(data.medications ?? []).length})</div>
          <button type="button" onClick={addMed} style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', border: 0, padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+ دواء</button>
        </div>

        {(data.medications ?? []).length === 0 ? (
          <div style={{ background: 'var(--paper-3)', padding: 14, borderRadius: 10, textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
            لا توجد أدوية. اضغط <strong>+ دواء</strong> لإضافة
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
            {(data.medications ?? []).map((m, i) => (
              <div key={i} style={{ background: 'var(--paper-3)', borderRadius: 10, padding: 10 }}>
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => updateMed(i, 'name', e.target.value)}
                  placeholder="اسم الدواء"
                  style={{ ...inputStyle, marginBottom: 6, fontWeight: 800 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <input
                    type="text"
                    value={m.dosage}
                    onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                    placeholder="الجرعة (مثل 500mg)"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={m.frequency}
                    onChange={(e) => updateMed(i, 'frequency', e.target.value)}
                    placeholder="عدد المرات"
                    style={inputStyle}
                  />
                </div>
                <input
                  type="text"
                  value={m.duration}
                  onChange={(e) => updateMed(i, 'duration', e.target.value)}
                  placeholder="المدة (مثل 7 أيام)"
                  style={{ ...inputStyle, marginBottom: 6 }}
                />
                <input
                  type="text"
                  value={m.notes}
                  onChange={(e) => updateMed(i, 'notes', e.target.value)}
                  placeholder="ملاحظات (بعد الأكل، إلخ)"
                  style={inputStyle}
                />
                <button type="button" onClick={() => removeMed(i)} style={{ marginTop: 6, background: 'var(--rose-soft)', color: 'var(--rose)', border: 0, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Trash2 size={12} strokeWidth={2.2} />
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>تعليمات إضافية</label>
          <textarea
            value={data.instructions ?? ''}
            onChange={(e) => setData({ ...data, instructions: e.target.value })}
            placeholder="مثال: راحة تامة، شرب سوائل بكميات كافية..."
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>المراجعة (Follow-up)</label>
          <input
            type="text"
            value={data.follow_up ?? ''}
            onChange={(e) => setData({ ...data, follow_up: e.target.value })}
            placeholder="مثال: مراجعة بعد أسبوع"
            style={inputStyle}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="scr-empty-cta"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
        >
          <Save size={16} strokeWidth={2.2} />
          {isPending ? 'جارٍ الحفظ...' : 'حفظ الوصفة'}
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
