'use client';

/**
 * حدّ أخطاءٍ لمسارات `auth/` — إعادة تعيين كلمة المرور وتأكيد البريد.
 *
 * مجلّدٌ منفصلٌ عن `(auth)` وله صفحاته، وكان بلا حدٍّ خاصّ فيصعد خطؤه إلى
 * الجذر. وهذه مساراتٌ يصلها المستخدم من رابطٍ في بريده: إن فشلت بلا رسالةٍ
 * ولا زرّ إعادة، فلا طريق أمامه إلّا طلب رابطٍ جديد.
 */

import { useEffect } from 'react';

export default function AuthFlowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[auth/error]', error);
  }, [error]);

  return (
    <div style={{ padding: 24, textAlign: 'center', maxWidth: 420, margin: '48px auto' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">⚠️</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--ink)' }}>
        تعذّر إكمال العملية
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 20 }}>
        حدث خلل مؤقّت. جرّب مرّةً أخرى، وإن تكرّر فاطلب رابطاً جديداً.
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
