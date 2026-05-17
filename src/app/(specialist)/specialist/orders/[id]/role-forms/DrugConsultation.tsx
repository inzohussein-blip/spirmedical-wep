'use client';

import { useState, useTransition } from 'react';
import { updateOrderRoleData } from '../actions';
import type { LucideIcon } from 'lucide-react';
import {
  HelpCircle, Pill, AlertTriangle, CheckCircle2, RefreshCw, Save,
} from 'lucide-react';

interface DrugData {
  patient_concerns?: string;
  drugs_reviewed?: string;
  interactions_found?: string;
  recommendations?: string;
  alternatives?: string;
}

export default function DrugConsultation({ orderId, initialData }: { orderId: string; initialData: DrugData | null }) {
  const [data, setData] = useState<DrugData>(initialData ?? {});
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
  };

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderRoleData(orderId, 'prescription_data', data);
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    });
  }

  const fields: Array<{ key: keyof DrugData; label: string; icon: LucideIcon; placeholder: string }> = [
    { key: 'patient_concerns',   icon: HelpCircle,    label: 'استفسارات المريض',      placeholder: 'ما هي الاستفسارات؟' },
    { key: 'drugs_reviewed',     icon: Pill,          label: 'الأدوية المراجَعة',       placeholder: 'قائمة الأدوية...' },
    { key: 'interactions_found', icon: AlertTriangle, label: 'التفاعلات المكتشفة',     placeholder: 'إن وُجدت...' },
    { key: 'recommendations',    icon: CheckCircle2,  label: 'التوصيات',                placeholder: 'النصائح للمريض...' },
    { key: 'alternatives',       icon: RefreshCw,     label: 'البدائل المقترحة',        placeholder: 'بدائل أرخص أو أنسب...' },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div className="scr-section-head">
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pill size={16} strokeWidth={2.2} />
          الاستشارة الدوائية
        </div>
      </div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
        {fields.map((f) => {
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
                placeholder={f.placeholder}
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
          {isPending ? 'جارٍ الحفظ...' : 'حفظ الاستشارة'}
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
