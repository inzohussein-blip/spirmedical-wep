'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Users, Plus, ChevronLeft, Loader2 } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * FamilyMemberPicker (V25.8) - الميزة الموحّدة
 * ═══════════════════════════════════════════════════════════════
 *
 * يُستخدم في كل Flow حجز للسماح للمريض باختيار:
 *   - "هذا الطلب لي" (الافتراضي)
 *   - "هذا الطلب لأحد أفراد عائلتي" + اختيار الفرد
 *
 * بسيط، سلس، واحد لكل الخدمات.
 * ═══════════════════════════════════════════════════════════════
 */

export interface FamilyMember {
  id: string;
  full_name: string;
  relation: string;
  avatar_emoji: string;
  date_of_birth: string | null;
}

const RELATION_LABELS: Record<string, string> = {
  spouse: 'الزوج/الزوجة',
  father: 'الأب',
  mother: 'الأم',
  son: 'الابن',
  daughter: 'الابنة',
  brother: 'الأخ',
  sister: 'الأخت',
  grandfather: 'الجد',
  grandmother: 'الجدة',
  other: 'فرد عائلة',
};

interface Props {
  value: string | null;  // null = "لي" | id = "لفرد عائلة"
  onChange: (familyMemberId: string | null) => void;
  ownerName?: string;     // اسم صاحب الحساب (يعرض في خيار "لي")
}

export default function FamilyMemberPicker({ value, onChange, ownerName }: Props) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب أفراد العائلة
  useEffect(() => {
    fetch('/api/family/list')
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const calculateAge = (dob: string | null): string => {
    if (!dob) return '';
    const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (years < 1) return 'أقل من سنة';
    if (years === 1) return 'سنة';
    if (years === 2) return 'سنتان';
    if (years < 11) return `${years} سنوات`;
    return `${years} سنة`;
  };

  if (isLoading) {
    return (
      <div style={{
        padding: 16,
        background: 'var(--paper-3)',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--white)',
        borderRadius: 14,
        border: '1px solid var(--line)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--paper-3)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Users size={16} color="var(--emerald)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>هذا الطلب لـ</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            اختر المعني بالخدمة
          </div>
        </div>
      </div>

      {/* "لي" option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        style={{
          width: '100%',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: value === null ? 'var(--emerald-soft)' : 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--line)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'start',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: value === null ? 'var(--emerald)' : 'var(--paper-3)',
            color: value === null ? 'var(--paper-3)' : 'var(--ink-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <User size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>
            لي شخصياً
          </div>
          {ownerName && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
              {ownerName}
            </div>
          )}
        </div>
        {value === null && (
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            ✓
          </div>
        )}
      </button>

      {/* Family members */}
      {members.map((m) => {
        const age = calculateAge(m.date_of_birth);
        const isSelected = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            style={{
              width: '100%',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: isSelected ? 'var(--emerald-soft)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--line)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'start',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: isSelected ? 'var(--emerald)' : 'var(--paper-3)',
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {m.avatar_emoji || '👤'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                {m.full_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                {RELATION_LABELS[m.relation] || m.relation}
                {age && ` · ${age}`}
              </div>
            </div>
            {isSelected && (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--emerald)',
                  color: 'var(--paper-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                ✓
              </div>
            )}
          </button>
        );
      })}

      {/* Add new */}
      <Link
        href="/account/family"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px',
          background: 'transparent',
          textDecoration: 'none',
          color: 'var(--emerald)',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--emerald-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Plus size={20} />
        </div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 800 }}>
          إضافة فرد عائلة
        </div>
        <ChevronLeft size={16} />
      </Link>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
