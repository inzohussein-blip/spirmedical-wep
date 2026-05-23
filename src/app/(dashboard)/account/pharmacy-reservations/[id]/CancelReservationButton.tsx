'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, AlertTriangle } from 'lucide-react';
import { cancelPharmacyReservation } from '@/app/(dashboard)/services/pharmacies/actions';

export default function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelPharmacyReservation(reservationId, reason.trim() || undefined);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{
          width: '100%',
          padding: 12,
          background: '#FCEBEB',
          color: '#A32D2D',
          border: '1px solid #F09595',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 16,
        }}
      >
        <XCircle size={16} strokeWidth={2.2} />
        إلغاء الحجز
      </button>
    );
  }

  return (
    <div style={{
      background: '#FCEBEB',
      border: '1px solid #F09595',
      borderRadius: 10,
      padding: 14,
      marginTop: 16,
    }}>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 700, 
        color: '#791F1F', 
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <AlertTriangle size={14} strokeWidth={2.5} />
        هل أنت متأكّد من الإلغاء؟
      </div>
      
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="سبب الإلغاء (اختياري)"
        rows={2}
        maxLength={200}
        style={{
          width: '100%',
          padding: 8,
          border: '1px solid #F09595',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'inherit',
          resize: 'vertical',
          marginBottom: 10,
          background: 'var(--white)',
        }}
      />
      
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          style={{
            flex: 1,
            padding: 10,
            background: '#A32D2D',
            color: 'white',
            border: 0,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isPending ? 'جارٍ الإلغاء...' : 'نعم، ألغِ الحجز'}
        </button>
        <button
          type="button"
          onClick={() => { setConfirming(false); setReason(''); }}
          disabled={isPending}
          style={{
            padding: '10px 16px',
            background: 'var(--white)',
            color: '#791F1F',
            border: '1px solid #F09595',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          تراجع
        </button>
      </div>
    </div>
  );
}
