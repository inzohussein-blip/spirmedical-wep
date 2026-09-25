'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { IconBellRinging, IconArrowRight, IconCheck } from '@tabler/icons-react';
import { joinServiceWaitlist } from '@/app/(dashboard)/appointments/new/waitlist-actions';

/**
 * «الخدمة غير متاحة حالياً» — تحلّ محلّ نموذج الطلب حين لا يوجد مختصٌّ يستلمه.
 *
 * بدلاً من قبول طلبٍ يبقى معلّقاً حتى يُلغيه الرفضُ التلقائيّ بعد ٤٨ ساعة،
 * يُقال للمريض الحقيقة ويُعرض عليه أن يُعلَم حين تتوفّر الخدمة.
 */
export default function ServiceUnavailable({
  title,
  specialistType,
  serviceId,
  alreadyJoined = false,
}: {
  title: string;
  specialistType: string;
  serviceId?: string;
  alreadyJoined?: boolean;
}) {
  const [joined, setJoined] = useState(alreadyJoined);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const join = () => {
    setError(null);
    startTransition(async () => {
      const res = await joinServiceWaitlist(specialistType, serviceId);
      if (res.ok) setJoined(true);
      else setError(res.error ?? 'تعذّر التسجيل');
    });
  };

  return (
    <main className="app-screen" style={{ display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <div
          aria-hidden="true"
          style={{
            width: 84, height: 84, borderRadius: '50%', margin: '0 auto 18px',
            display: 'grid', placeItems: 'center', background: 'var(--amber-soft, #FEF7E0)',
          }}
        >
          <IconBellRinging size={40} stroke={1.5} color="var(--amber, #B06000)" />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 10px', color: 'var(--ink, #202124)' }}>
          {title} غير متاحة حالياً
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3, #5F6368)', lineHeight: 1.8, margin: '0 0 24px' }}>
          لا يوجد مختصّ متاح لهذه الخدمة بعد، فلن نأخذ طلبك الآن كي لا يبقى معلّقاً.
          اضغط الزرّ وسنُعلمك فور توفّرها.
        </p>

        {joined ? (
          <div
            role="status"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48,
              padding: '0 20px', borderRadius: 12, background: 'var(--emerald-soft, #E6F3EF)',
              color: 'var(--emerald-deep, #056559)', fontSize: 14, fontWeight: 800,
            }}
          >
            <IconCheck size={18} stroke={2.4} aria-hidden />
            سنُعلمك حين تتوفّر الخدمة
          </div>
        ) : (
          <button
            type="button"
            onClick={join}
            disabled={pending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48,
              padding: '0 22px', borderRadius: 12, border: 0, cursor: pending ? 'wait' : 'pointer',
              background: 'var(--emerald, #01875F)', color: '#fff', fontFamily: 'inherit',
              fontSize: 15, fontWeight: 800, opacity: pending ? 0.7 : 1,
            }}
          >
            <IconBellRinging size={18} stroke={2} aria-hidden />
            {pending ? 'جارٍ التسجيل…' : 'أعلِمني حين تتوفّر'}
          </button>
        )}

        {error && (
          <p role="alert" style={{ color: 'var(--rose, #C71C56)', fontSize: 13, fontWeight: 700, marginTop: 12 }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: 20 }}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44,
              color: 'var(--ink-2, #3C4043)', fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}
          >
            <IconArrowRight size={18} stroke={2} aria-hidden />
            العودة إلى الخدمات
          </Link>
        </div>
      </div>
    </main>
  );
}
