'use client';

import { useEffect, useState } from 'react';
import { Users, User } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * FamilyTargetBadge (V25.8)
 * ═══════════════════════════════════════════════════════════════
 *
 * يُعرض في صفحة المختص لكي يعرف:
 *   - هل الطلب لصاحب الحساب نفسه؟
 *   - أم لفرد من عائلته (مع الاسم + العلاقة + العمر)؟
 *
 * بسيط - مجرد بطاقة معلوماتية.
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  familyMemberId: string | null;
  ownerName?: string;
}

interface FamilyTarget {
  full_name: string;
  relation: string;
  gender: 'male' | 'female' | null;
  date_of_birth: string | null;
  blood_type: string | null;
  chronic_conditions: string[] | null;
  allergies: string[] | null;
  avatar_emoji: string;
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

export default function FamilyTargetBadge({ familyMemberId, ownerName }: Props) {
  const [target, setTarget] = useState<FamilyTarget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyMemberId) {
      setLoading(false);
      return;
    }

    fetch(`/api/family/get?id=${familyMemberId}`)
      .then((r) => r.json())
      .then((data) => {
        setTarget(data.member);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [familyMemberId]);

  if (loading) return null;

  // إذا الطلب لصاحب الحساب نفسه - عرض بسيط
  if (!familyMemberId || !target) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 12,
          background: 'var(--paper-3)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--emerald-soft)',
            color: 'var(--emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <User size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>الطلب لـ:</div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>
            {ownerName || 'المريض'}
          </div>
        </div>
      </div>
    );
  }

  // إذا الطلب لفرد عائلة - عرض مفصّل
  const age = target.date_of_birth
    ? Math.floor((Date.now() - new Date(target.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const hasHealthAlerts =
    (target.chronic_conditions && target.chronic_conditions.length > 0) ||
    (target.allergies && target.allergies.length > 0);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--amber-soft), rgba(230, 126, 34, 0.05))',
        border: '1px solid var(--amber)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: 'var(--white)',
            fontSize: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {target.avatar_emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              background: 'var(--amber)',
              color: 'var(--paper-3)',
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            <Users size={10} />
            <span>طلب لفرد عائلة</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>
            {target.full_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
            {RELATION_LABELS[target.relation] || target.relation}
            {age !== null && ` · ${age} سنة`}
            {target.gender && ` · ${target.gender === 'male' ? 'ذكر' : 'أنثى'}`}
            {target.blood_type && ` · فصيلة ${target.blood_type}`}
          </div>
        </div>
      </div>

      {/* Health alerts (important for specialist!) */}
      {hasHealthAlerts && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: 'var(--white)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {target.chronic_conditions && target.chronic_conditions.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>
              <strong style={{ color: 'var(--amber)' }}>⚕️ أمراض مزمنة:</strong>{' '}
              {target.chronic_conditions.join('، ')}
            </div>
          )}
          {target.allergies && target.allergies.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>
              <strong style={{ color: 'var(--rose)' }}>⚠️ حساسيات:</strong>{' '}
              {target.allergies.join('، ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
