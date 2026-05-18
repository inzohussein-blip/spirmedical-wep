'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { assignOrderToSpecialist, adminCancelOrder, rescheduleOrder } from '../actions';
import { useConfirm } from '@/components/ui';

interface Props {
  orderId: string;
  status: string;
  currentSpecialistId: string | null;
  scheduledAt: string;
  availableSpecialists: Array<{ id: string; name: string; phone: string }>;
}

export default function OrderAdminActions({
  orderId, status, currentSpecialistId, scheduledAt, availableSpecialists,
}: Props) {
  const { confirm, ConfirmDialog } = useConfirm();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedSpecialist, setSelectedSpecialist] = useState(currentSpecialistId ?? '');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState(scheduledAt.slice(0, 16));

  async function handleAssign() {
    setError('');
    if (!selectedSpecialist) { setError('اختر اختصاصي'); return; }
    if (selectedSpecialist === currentSpecialistId) return;
    const ok = await confirm({
      title: 'تعيين الاختصاصي',
      message: 'هل تريد تعيين هذا الاختصاصي للطلب؟',
      variant: 'info',
      confirmText: 'تعيين',
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await assignOrderToSpecialist(orderId, selectedSpecialist);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess('✅ تم التعيين');
      router.refresh();
    });
  }

  async function handleCancel() {
    setError('');
    if (!cancelReason.trim()) { setError('اذكر سبب الإلغاء'); return; }
    const ok = await confirm({
      title: 'إلغاء الطلب',
      message: 'سيتم إلغاء الطلب نهائياً.',
      variant: 'danger',
      confirmText: 'إلغاء',
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await adminCancelOrder(orderId, cancelReason);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess('تم الإلغاء');
      setShowCancel(false);
      router.refresh();
    });
  }

  async function handleReschedule() {
    setError('');
    if (!newDate) { setError('اختر تاريخاً'); return; }
    const ok = await confirm({
      title: 'إعادة الجدولة',
      message: 'هل تريد إعادة جدولة هذا الطلب؟',
      variant: 'warning',
      confirmText: 'إعادة',
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await rescheduleOrder(orderId, new Date(newDate).toISOString());
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess('تم تغيير الموعد');
      setShowReschedule(false);
      router.refresh();
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
  };

  const isFinished = status === 'completed' || status === 'cancelled';

  return (
    <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>إجراءات إدارية</h2>

      {error && (
        <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
          {success}
        </div>
      )}

      {!isFinished && (
        <>
          {/* تعيين اختصاصي */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 8 }}>
              🎯 تعيين/تغيير الاختصاصي
            </label>
            <select value={selectedSpecialist} onChange={(e) => setSelectedSpecialist(e.target.value)} style={inputStyle}>
              <option value="">اختر اختصاصي...</option>
              {availableSpecialists.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {s.phone}</option>
              ))}
            </select>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
              {availableSpecialists.length} اختصاصي متاح للنوع المطلوب
            </div>
            {selectedSpecialist && selectedSpecialist !== currentSpecialistId && (
              <button onClick={handleAssign} disabled={isPending} style={{
                width: '100%', marginTop: 8, padding: 12,
                background: 'var(--emerald-deep)', color: 'var(--white)',
                border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                💾 تأكيد التعيين
              </button>
            )}
          </div>

          <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />

          {/* إعادة جدولة */}
          {!showReschedule ? (
            <button onClick={() => setShowReschedule(true)} style={{
              width: '100%', padding: 12, background: 'var(--paper-3)',
              border: 0, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: 8,
            }}>
              📅 إعادة جدولة
            </button>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleReschedule} disabled={isPending} style={{
                  flex: 1, padding: 8, background: 'var(--emerald-deep)', color: 'var(--white)',
                  border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                }}>تأكيد</button>
                <button onClick={() => setShowReschedule(false)} style={{
                  padding: '8px 12px', background: 'transparent', border: '1px solid var(--line)',
                  borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>إلغاء</button>
              </div>
            </div>
          )}

          {/* إلغاء */}
          {!showCancel ? (
            <button onClick={() => setShowCancel(true)} style={{
              width: '100%', padding: 12, background: 'var(--rose-soft)',
              color: 'var(--rose)', border: 0, borderRadius: 8,
              fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              🚫 إلغاء الطلب
            </button>
          ) : (
            <div style={{ background: 'var(--rose-soft)', padding: 12, borderRadius: 10 }}>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                        rows={2} placeholder="سبب الإلغاء..."
                        style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCancel} disabled={isPending} style={{
                  flex: 1, padding: 8, background: 'var(--rose)', color: 'var(--white)',
                  border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                }}>تأكيد الإلغاء</button>
                <button onClick={() => setShowCancel(false)} style={{
                  padding: '8px 12px', background: 'var(--white)', border: '1px solid var(--line)',
                  borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>إلغاء</button>
              </div>
            </div>
          )}
        </>
      )}

      {isFinished && (
        <div style={{ padding: 16, background: 'var(--paper-3)', borderRadius: 10, textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
          الطلب {status === 'completed' ? 'مكتمل' : 'ملغى'} — لا توجد إجراءات
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
}
