'use client';

import { User, UserCircle, Users } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * NurseGenderPicker (V25.5)
 * ═══════════════════════════════════════════════════════════════
 *
 * يتيح للمريض اختيار جنس الممرض/الممرضة:
 *   - ذكر فقط
 *   - أنثى فقط
 *   - لا فرق (أيهما متاح)
 *
 * مهم للخصوصية الشرعية والشخصية.
 * ═══════════════════════════════════════════════════════════════
 */

export type NurseGender = 'male' | 'female' | 'any';

interface Props {
  value: NurseGender;
  onChange: (gender: NurseGender) => void;
  patientGender?: 'male' | 'female' | null;
}

export default function NurseGenderPicker({ value, onChange, patientGender }: Props) {
  const options: Array<{
    id: NurseGender;
    label: string;
    icon: React.ReactNode;
    recommended?: boolean;
  }> = [
    {
      id: 'female',
      label: 'ممرضة (أنثى)',
      icon: <UserCircle size={20} />,
      recommended: patientGender === 'female',
    },
    {
      id: 'male',
      label: 'ممرض (ذكر)',
      icon: <User size={20} />,
      recommended: patientGender === 'male',
    },
    {
      id: 'any',
      label: 'لا فرق',
      icon: <Users size={20} />,
    },
  ];

  return (
    <div>
      <label
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: 'var(--ink-2)',
          display: 'block',
          marginBottom: 8,
        }}
      >
        تفضيل جنس الكادر التمريضي
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
        }}
      >
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '12px 8px',
              background: value === opt.id ? 'var(--emerald)' : 'var(--paper-3)',
              color: value === opt.id ? 'var(--paper-3)' : 'var(--ink-2)',
              border: '1px solid',
              borderColor: value === opt.id ? 'var(--emerald)' : 'var(--line)',
              borderRadius: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 700,
              transition: 'all 0.15s',
            }}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.recommended && (
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: 'var(--amber)',
                  color: 'var(--paper-3)',
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 6,
                }}
              >
                موصى
              </span>
            )}
          </button>
        ))}
      </div>

      <p
        style={{
          fontSize: 10,
          color: 'var(--ink-3)',
          marginTop: 6,
          lineHeight: 1.5,
        }}
      >
        🛡️ لضمان الراحة والخصوصية - يُحترم اختيارك دائماً
      </p>
    </div>
  );
}
