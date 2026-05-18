'use client';

import { useState, useTransition } from 'react';
import { updateOrderRoleData } from '../actions';
import {
  Droplet, TestTube, AlertTriangle, Trash2, Save, CheckCircle2,
} from 'lucide-react';

interface LabResult {
  test_name: string;
  value: string;
  unit: string;
  normal_range: string;
  is_abnormal: boolean;
}

interface Props {
  orderId: string;
  initialData: { tests?: LabResult[] } | null;
}

const COMMON_TESTS = [
  { name: 'الهيموجلوبين (HB)', unit: 'g/dL', range: '12-16' },
  { name: 'كريات الدم البيضاء (WBC)', unit: 'cells/μL', range: '4000-11000' },
  { name: 'الصفائح (Platelets)', unit: 'cells/μL', range: '150000-400000' },
  { name: 'السكر صائم', unit: 'mg/dL', range: '70-100' },
  { name: 'الكوليسترول', unit: 'mg/dL', range: '<200' },
  { name: 'الكرياتينين', unit: 'mg/dL', range: '0.7-1.3' },
];

export default function LabResultsForm({ orderId, initialData }: Props) {
  const [tests, setTests] = useState<LabResult[]>(initialData?.tests ?? []);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function addTest(preset?: typeof COMMON_TESTS[number]) {
    setTests([...tests, {
      test_name: preset?.name ?? '',
      value: '',
      unit: preset?.unit ?? '',
      normal_range: preset?.range ?? '',
      is_abnormal: false,
    }]);
  }

  function updateTest(i: number, field: keyof LabResult, value: string | boolean) {
    const next = [...tests];
    next[i] = { ...next[i], [field]: value };
    setTests(next);
  }

  function removeTest(i: number) {
    setTests(tests.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderRoleData(orderId, 'lab_results_data', { tests });
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    });
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="scr-section-head">
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Droplet size={16} strokeWidth={2.2} fill="currentColor" />
          نتائج التحاليل
        </div>
      </div>

      {/* أزرار التحاليل الشائعة */}
      <div className="scr-pills" style={{ marginBottom: 12 }}>
        {COMMON_TESTS.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => addTest(t)}
            className="scr-pill"
          >
            + {t.name}
          </button>
        ))}
        <button type="button" onClick={() => addTest()} className="scr-pill active">
          + تحليل مخصّص
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="scr-empty" style={{ padding: 20 }}>
          <div className="scr-empty-icon">
            <TestTube size={42} strokeWidth={1.5} />
          </div>
          <p className="scr-empty-desc">اختر تحليلاً من الأعلى أو أضف تحليلاً مخصّصاً</p>
        </div>
      ) : (
        <div className="scr-list-stack">
          {tests.map((t, i) => (
            <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
              <input
                type="text"
                value={t.test_name}
                onChange={(e) => updateTest(i, 'test_name', e.target.value)}
                placeholder="اسم التحليل"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', marginBottom: 8, fontWeight: 700 }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={t.value}
                  onChange={(e) => updateTest(i, 'value', e.target.value)}
                  placeholder="القيمة"
                  style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                />
                <input
                  type="text"
                  value={t.unit}
                  onChange={(e) => updateTest(i, 'unit', e.target.value)}
                  placeholder="الوحدة"
                  style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                />
                <input
                  type="text"
                  value={t.normal_range}
                  onChange={(e) => updateTest(i, 'normal_range', e.target.value)}
                  placeholder="المعدل الطبيعي"
                  style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: 'var(--rose)' }}>
                  <input
                    type="checkbox"
                    checked={t.is_abnormal}
                    onChange={(e) => updateTest(i, 'is_abnormal', e.target.checked)}
                  />
                  <AlertTriangle size={13} strokeWidth={2.4} />
                  خارج المعدل الطبيعي
                </label>
                <button type="button" onClick={() => removeTest(i)} style={{ background: 'var(--rose-soft)', color: 'var(--rose)', border: 0, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                  <Trash2 size={12} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tests.length > 0 && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="scr-empty-cta"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 12 }}
        >
          <Save size={16} strokeWidth={2.2} />
          {isPending ? 'جارٍ الحفظ...' : 'حفظ النتائج'}
        </button>
      )}

      {success && (
        <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginTop: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CheckCircle2 size={14} strokeWidth={2.4} />
          تم الحفظ
        </div>
      )}
    </div>
  );
}
