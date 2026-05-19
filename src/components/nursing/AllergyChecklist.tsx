'use client';

import { AlertTriangle, Pill } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * AllergyChecklist (V25.5)
 * ═══════════════════════════════════════════════════════════════
 *
 * استمارة التحسس الدوائي - إلزامية قبل أي علاج
 *
 * يسأل المريض: "هل يعاني من أي تحسس دوائي؟"
 * مع مقترحات ذكية وسريعة للاختيار.
 * ═══════════════════════════════════════════════════════════════
 */

export interface AllergyData {
  penicillin?: boolean;
  sulfa?: boolean;
  aspirin?: boolean;
  iodine?: boolean;
  latex?: boolean;
  other?: string;
}

interface Props {
  value: AllergyData;
  onChange: (data: AllergyData) => void;
}

const COMMON_ALLERGIES: Array<{
  key: keyof AllergyData;
  label: string;
  emoji: string;
}> = [
  { key: 'penicillin', label: 'حساسية البنسلين', emoji: '💊' },
  { key: 'sulfa', label: 'حساسية السلفا', emoji: '⚠️' },
  { key: 'aspirin', label: 'حساسية الأسبرين', emoji: '🩹' },
  { key: 'iodine', label: 'حساسية اليود', emoji: '🧴' },
  { key: 'latex', label: 'حساسية اللاتكس', emoji: '🧤' },
];

export default function AllergyChecklist({ value, onChange }: Props) {
  const hasAnyAllergy = COMMON_ALLERGIES.some((a) => value[a.key]) || !!value.other;

  return (
    <div
      style={{
        background: hasAnyAllergy ? 'var(--rose-soft)' : 'var(--paper-3)',
        border: '1px solid',
        borderColor: hasAnyAllergy ? 'var(--rose)' : 'var(--line)',
        borderRadius: 14,
        padding: 16,
        transition: 'all 0.2s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: hasAnyAllergy ? 'var(--rose)' : 'var(--emerald-soft)',
            color: hasAnyAllergy ? 'var(--paper-3)' : 'var(--emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {hasAnyAllergy ? <AlertTriangle size={20} /> : <Pill size={20} />}
        </div>
        <div>
          <h4
            style={{
              fontSize: 14,
              fontWeight: 800,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            استمارة التحسس الدوائي
          </h4>
          <p
            style={{
              fontSize: 11,
              color: 'var(--ink-3)',
              margin: '2px 0 0',
            }}
          >
            هل يعاني المريض من أي تحسس؟ (إلزامي)
          </p>
        </div>
      </div>

      {/* Quick selection chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 12,
        }}
      >
        {COMMON_ALLERGIES.map((a) => {
          const isChecked = !!value[a.key];
          return (
            <button
              key={a.key}
              type="button"
              onClick={() =>
                onChange({ ...value, [a.key]: !isChecked })
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: isChecked ? 'var(--rose)' : 'var(--white)',
                color: isChecked ? 'var(--paper-3)' : 'var(--ink-2)',
                border: '1px solid',
                borderColor: isChecked ? 'var(--rose)' : 'var(--line)',
                borderRadius: 100,
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span>{a.emoji}</span>
              <span>{a.label}</span>
              {isChecked && <span style={{ marginInlineStart: 2 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Other allergies */}
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--ink-3)',
          display: 'block',
          marginBottom: 4,
        }}
      >
        تحسسات أخرى (اختياري)
      </label>
      <input
        type="text"
        value={value.other ?? ''}
        onChange={(e) => onChange({ ...value, other: e.target.value })}
        placeholder="مثال: حساسية للمأكولات البحرية، الحليب..."
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

      {hasAnyAllergy && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: 'var(--rose)',
            color: 'var(--paper-3)',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} />
          <span>سيتم تنبيه الممرض/ة بهذه التحسسات قبل العلاج</span>
        </div>
      )}
    </div>
  );
}
