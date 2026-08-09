'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw, Ban } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { retryNotification, cancelNotification } from './actions';

/**
 * 🔁 إجراءات صفّ الإشعار
 *
 * `retryNotification` و`cancelNotification` كانتا مبنيّتين بالكامل بلا أي
 * واجهة: الجدول يعرض الحالة «فشل» ورسالة الخطأ وعدّاد المحاولات، ثمّ يقف
 * الأدمن عاجزاً — لا إعادة إرسال ولا إلغاء.
 *
 * الإتاحة تتبع الحالة كما تفرضه الإجراءات نفسها:
 *   • إعادة المحاولة تُصفّر `attempts` وتُعيد الحالة إلى `pending` → للفاشلة.
 *   • الإلغاء مقيَّد بـ`.eq('status','pending')` في الإجراء → للمعلّقة فقط.
 */
export default function NotificationRowActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const canRetry = status === 'failed';
  const canCancel = status === 'pending';

  if (!canRetry && !canCancel) {
    return <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>—</span>;
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    startTransition(async () => {
      try {
        const res = await action();
        if (res.ok) {
          toast.success(okMsg);
          router.refresh();
        } else {
          toast.error(res.error || 'تعذّر تنفيذ الإجراء');
        }
      } catch {
        // إجراءات الخادم ترمي عند انقطاع الشبكة ولا تُرجع { ok:false }
        toast.error('تعذّر الاتصال. حاول مرة أخرى.');
      }
    });
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {canRetry && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => retryNotification(id), 'أُعيدت الرسالة إلى الطابور')}
          title="إعادة المحاولة"
          aria-label="إعادة المحاولة"
          style={actionBtn('var(--emerald-deep, #085041)', pending)}
        >
          <RotateCw size={14} aria-hidden />
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => cancelNotification(id), 'أُلغيت الرسالة')}
          title="إلغاء الإرسال"
          aria-label="إلغاء الإرسال"
          style={actionBtn('var(--rose, #C71C56)', pending)}
        >
          <Ban size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}

function actionBtn(color: string, disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 8,
    border: '1px solid var(--line, #E8E6DE)',
    background: 'var(--white, #fff)',
    color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    flexShrink: 0,
  };
}
