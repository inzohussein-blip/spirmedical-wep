'use client';

/**
 * حدّ أخطاءٍ لمجموعة المسارات هذه.
 *
 * بدونه يصعد أيّ خطأ عرضٍ إلى `app/error.tsx` الجذر، فيفقد المستخدم
 * التخطيط كلّه — الترويسة والتنقّل — ويرى صفحةً عارية لا سبيل منها إلى
 * ما كان يفعله. وهذه مسارات الزائر: من يصلها لم يسجّل دخولاً بعد، وخطأٌ بلا مخرجٍ واضح يفقده قبل أن يبدأ.
 */

import { useEffect } from 'react';

export default function GuestError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[guest/error]', error);
  }, [error]);

  return (
    <div style={{ padding: 24, textAlign: 'center', maxWidth: 420, margin: '48px auto' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">⚠️</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--ink)' }}>
        تعذّر تحميل الصفحة
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 20 }}>
        حدث خلل مؤقّت. جرّب مرّةً أخرى، وإن تكرّر فأعد تحميل الصفحة.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          minHeight: 44, padding: '0 20px', border: 0, borderRadius: 12,
          background: 'var(--btn-primary-bg)', color: 'var(--paper-3)',
          fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
        }}
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
