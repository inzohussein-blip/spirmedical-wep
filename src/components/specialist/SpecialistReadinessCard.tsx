'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { subscribeToPush } from '@/lib/push-client';
import type { ReadinessStep } from '@/lib/specialist-readiness';

/**
 * بطاقةُ «جهّز حسابك» أعلى لوحة المختصّ. تختفي حين تكتمل الخطوات كلُّها.
 * خطوةُ الإشعارات تُنفَّذ هنا مباشرةً (زرّ)، والبقيّة روابطُ إلى تعديل الملفّ.
 */
export default function SpecialistReadinessCard({ steps }: { steps: ReadinessStep[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;

  const enablePush = () => {
    setError(null);
    startTransition(async () => {
      const res = await subscribeToPush().catch(() => ({ success: false, error: 'تعذّر تفعيل الإشعارات' }));
      if (res.success) router.refresh();
      else setError(res.error ?? 'تعذّر تفعيل الإشعارات');
    });
  };

  return (
    <section
      aria-labelledby="readiness-title"
      data-testid="specialist-readiness"
      style={{
        background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 16,
        padding: 16, marginBottom: 16,
      }}
    >
      <h2 id="readiness-title" style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
        جهّز حسابك لاستلام الطلبات
      </h2>
      <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 12px' }}>
        {steps.length - remaining.length} من {steps.length} مكتملة
      </p>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {steps.map((s) => (
          <li key={s.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              aria-hidden="true"
              style={{
                flexShrink: 0, width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
                fontSize: 13, fontWeight: 800,
                background: s.done ? 'var(--emerald, #01875F)' : 'var(--paper-2, #F1F3F4)',
                color: s.done ? '#fff' : 'var(--ink-3)',
              }}
            >
              {s.done ? '✓' : '•'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 800, color: s.done ? 'var(--ink-3)' : 'var(--ink)',
                textDecoration: s.done ? 'line-through' : 'none',
              }}>
                {s.title}
                <span className="sr-only">{s.done ? ' (مكتملة)' : ' (غير مكتملة)'}</span>
              </div>
              {!s.done && (
                <>
                  <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 8px', lineHeight: 1.7 }}>{s.desc}</p>
                  {s.key === 'push' ? (
                    <button
                      type="button"
                      onClick={enablePush}
                      disabled={pending}
                      style={{
                        minHeight: 44, padding: '0 16px', borderRadius: 10, border: 0,
                        background: 'var(--emerald, #01875F)', color: '#fff', fontFamily: 'inherit',
                        fontSize: 13, fontWeight: 800, cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.7 : 1,
                      }}
                    >
                      {pending ? 'جارٍ التفعيل…' : 'تفعيل الإشعارات'}
                    </button>
                  ) : s.href ? (
                    <Link
                      href={s.href}
                      style={{
                        display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 14px',
                        borderRadius: 10, background: 'var(--paper-2, #F1F3F4)', color: 'var(--ink)',
                        fontSize: 13, fontWeight: 700, textDecoration: 'none',
                      }}
                    >
                      تعديل الملفّ
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </li>
        ))}
      </ol>

      {error && (
        <p role="alert" style={{ color: 'var(--rose, #C71C56)', fontSize: 12, fontWeight: 700, margin: '10px 0 0' }}>
          {error}
        </p>
      )}
    </section>
  );
}
