'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptOrder, startOrder, completeOrder } from './actions';
import { AlertTriangle, CheckCircle2, Play, Phone } from 'lucide-react';

interface Props {
  orderId: string;
  status: string;
  isMine: boolean;
  canAccept: boolean;
  patientPhone: string | null;
}

export default function OrderActionsBar({ orderId, status, isMine, canAccept, patientPhone }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [showComplete, setShowComplete] = useState(false);

  function handleAccept() {
    setError('');
    startTransition(async () => {
      const result = await acceptOrder(orderId);
      if (!result.ok) {
        setError(result.error || 'تعذّر قبول الطلب');
        return;
      }
      router.refresh();
    });
  }

  function handleStart() {
    setError('');
    startTransition(async () => {
      const result = await startOrder(orderId);
      if (!result.ok) {
        setError(result.error || 'تعذّر بدء التنفيذ');
        return;
      }
      router.refresh();
    });
  }

  function handleComplete() {
    setError('');
    startTransition(async () => {
      const result = await completeOrder(orderId, notes.trim() || undefined);
      if (!result.ok) {
        setError(result.error || 'تعذّر الإكمال');
        return;
      }
      router.push('/specialist/orders');
    });
  }

  return (
    <div style={{ marginTop: 24, paddingBottom: 80 }}>
      {error && (
        <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} strokeWidth={2.4} />
          {error}
        </div>
      )}

      {canAccept && (
        <button
          type="button"
          onClick={handleAccept}
          disabled={isPending}
          className="scr-empty-cta"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
        >
          {!isPending && <CheckCircle2 size={16} strokeWidth={2.2} />}
          {isPending ? 'جارٍ القبول...' : 'قبول الطلب'}
        </button>
      )}

      {isMine && status === 'confirmed' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <button
            type="button"
            onClick={handleStart}
            disabled={isPending}
            className="scr-empty-cta"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
          >
            {!isPending && <Play size={16} strokeWidth={2.2} />}
            {isPending ? '...' : 'بدء التنفيذ'}
          </button>
          {patientPhone && (
            <a
              href={`tel:${patientPhone}`}
              className="scr-action-btn"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '12px', textDecoration: 'none' }}
            >
              <Phone size={16} strokeWidth={2.2} />
              <span>اتصل بالمريض</span>
            </a>
          )}
        </div>
      )}

      {isMine && status === 'in_progress' && !showComplete && (
        <button
          type="button"
          onClick={() => setShowComplete(true)}
          className="scr-empty-cta"
          style={{ display: 'block', width: '100%' }}
        >
          ✓ إنهاء الخدمة
        </button>
      )}

      {showComplete && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
          <div className="scr-section-title" style={{ marginBottom: 8 }}>ملاحظات إنهاء الخدمة</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات للمريض أو السجل (اختياري)..."
            rows={3}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={handleComplete}
              disabled={isPending}
              className="scr-empty-cta"
              style={{ flex: 1 }}
            >
              {isPending ? 'جارٍ الإنهاء...' : '✓ تأكيد الإنهاء'}
            </button>
            <button
              type="button"
              onClick={() => setShowComplete(false)}
              style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 10, background: 'transparent', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
