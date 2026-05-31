'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

/**
 * 🔄 AutoRefresh (V31)
 *
 * يُعيد جلب بيانات الـ Server Component دورياً عبر router.refresh()
 * — بدون إعادة تحميل الصفحة كاملة (يحافظ على scroll + state).
 *
 * يُستخدم في صفحات الأدمن الحيّة:
 *   - /admin44/reports/live-ops (تتبّع الطلبات الحيّة)
 *   - أيّ لوحة تحتاج تحديثاً دورياً
 *
 * يعرض شريطاً صغيراً مع عدّاد + زر تحديث يدوي + إيقاف/تشغيل.
 */
interface Props {
  /** الفاصل بين كل تحديث (ثانية). الافتراضي 30. */
  intervalSeconds?: number;
  /** نصّ يُعرض بجانب المؤشّر */
  label?: string;
}

export default function AutoRefresh({
  intervalSeconds = 30,
  label = 'تحديث تلقائي',
}: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [countdown, setCountdown] = useState(intervalSeconds);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRefreshing(true);
          router.refresh();
          // نُخفي مؤشّر التحديث بعد لحظة
          setTimeout(() => setRefreshing(false), 800);
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [enabled, intervalSeconds, router]);

  function handleManualRefresh() {
    setRefreshing(true);
    router.refresh();
    setCountdown(intervalSeconds);
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        background: enabled ? '#E6F3EF' : '#F1F3F4',
        border: `1px solid ${enabled ? '#9BD9C0' : '#E8EAED'}`,
        borderRadius: 12,
        fontSize: 13,
        color: enabled ? '#085041' : '#5F6368',
      }}
    >
      <RefreshCw
        size={15}
        aria-hidden
        style={{
          animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
          flexShrink: 0,
        }}
      />
      <span style={{ fontWeight: 600 }}>{label}</span>
      {enabled && (
        <span style={{ opacity: 0.7, minWidth: 56 }}>
          خلال {countdown} ث
        </span>
      )}
      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={handleManualRefresh}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          textDecoration: 'underline',
          padding: '2px 6px',
        }}
      >
        تحديث الآن
      </button>
      <button
        type="button"
        onClick={() => setEnabled((e) => !e)}
        aria-pressed={enabled}
        style={{
          border: 'none',
          background: enabled ? '#01875F' : '#9AA0A6',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 8,
          padding: '4px 10px',
        }}
      >
        {enabled ? 'إيقاف' : 'تشغيل'}
      </button>
    </div>
  );
}
