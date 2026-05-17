'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { approveSpecialist, rejectSpecialist, toggleSuspendUser, updateSpecialistType } from '../actions';
import { SPECIALIST_META, SPECIALIST_TYPES, type SpecialistType } from '@/lib/specialist-types';

interface Props {
  specialistId: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  currentType: SpecialistType | null;
  isSuspended: boolean;
}

export default function SpecialistActions({ specialistId, approvalStatus, currentType, isSuspended }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Approve form
  const [selectedType, setSelectedType] = useState<SpecialistType>(currentType ?? 'doctor');
  const [approveNotes, setApproveNotes] = useState('');

  // Reject form
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Suspend form
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendForm, setShowSuspendForm] = useState(false);

  function handleApprove() {
    setError('');
    if (!selectedType) {
      setError('يرجى اختيار نوع الاختصاصي');
      return;
    }
    if (!confirm('هل أنت متأكد من الموافقة على هذا الاختصاصي؟')) return;
    startTransition(async () => {
      const result = await approveSpecialist(specialistId, selectedType, approveNotes || undefined);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess('✅ تمت الموافقة بنجاح');
      router.refresh();
    });
  }

  function handleReject() {
    setError('');
    if (!rejectReason.trim()) { setError('يرجى ذكر سبب الرفض'); return; }
    if (!confirm('هل أنت متأكد من رفض هذا الاختصاصي؟')) return;
    startTransition(async () => {
      const result = await rejectSpecialist(specialistId, rejectReason);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess('تم الرفض');
      setShowRejectForm(false);
      router.refresh();
    });
  }

  function handleToggleSuspend() {
    setError('');
    if (!isSuspended && !suspendReason.trim()) { setError('يرجى ذكر سبب التعليق'); return; }
    const action = isSuspended ? 'إلغاء تعليق' : 'تعليق';
    if (!confirm(`هل أنت متأكد من ${action} هذا الاختصاصي؟`)) return;
    startTransition(async () => {
      const result = await toggleSuspendUser(specialistId, !isSuspended, suspendReason || undefined);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess(isSuspended ? 'تم إلغاء التعليق' : 'تم التعليق');
      setShowSuspendForm(false);
      router.refresh();
    });
  }

  function handleChangeType() {
    setError('');
    if (selectedType === currentType) return;
    if (!confirm('تغيير نوع الاختصاصي؟ سيؤثر هذا على الطلبات الجديدة فقط.')) return;
    startTransition(async () => {
      const result = await updateSpecialistType(specialistId, selectedType);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess('تم تحديث النوع');
      router.refresh();
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '12px', background: 'var(--emerald-deep, #073B30)',
    color: '#fff', border: 0, borderRadius: 10, fontSize: 13, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  };
  const btnRose: React.CSSProperties = {
    ...btnPrimary, background: 'var(--rose, #A82E3D)',
  };
  const btnGhost: React.CSSProperties = {
    width: '100%', padding: '10px', background: 'transparent',
    color: 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 10,
    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 18 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>الإجراءات</h2>

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

      {/* ─── حالة Pending: زر موافقة + زر رفض ─── */}
      {approvalStatus === 'pending' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>
              نوع الاختصاصي *
            </label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as SpecialistType)} style={inputStyle}>
              {SPECIALIST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SPECIALIST_META[t].icon} {SPECIALIST_META[t].label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>
              ملاحظات داخلية (اختياري)
            </label>
            <textarea
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              rows={3}
              placeholder="ملاحظات تظهر للمديرين فقط..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <button type="button" onClick={handleApprove} disabled={isPending} style={btnPrimary}>
            {isPending ? '...' : '✅ موافقة'}
          </button>

          <div style={{ height: 8 }} />

          {!showRejectForm ? (
            <button type="button" onClick={() => setShowRejectForm(true)} style={{ ...btnGhost, color: 'var(--rose)', borderColor: 'var(--rose-soft)' }}>
              ❌ رفض
            </button>
          ) : (
            <div style={{ background: 'var(--rose-soft)', padding: 12, borderRadius: 10, marginTop: 10 }}>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="اذكر سبب الرفض..."
                style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={handleReject} disabled={isPending} style={{ ...btnRose, flex: 1 }}>
                  تأكيد الرفض
                </button>
                <button type="button" onClick={() => setShowRejectForm(false)} style={{ ...btnGhost, flex: 1 }}>
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── حالة Approved: تغيير النوع + تعليق ─── */}
      {approvalStatus === 'approved' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>
              نوع الاختصاصي
            </label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as SpecialistType)} style={inputStyle}>
              {SPECIALIST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SPECIALIST_META[t].icon} {SPECIALIST_META[t].label}
                </option>
              ))}
            </select>
          </div>

          {selectedType !== currentType && (
            <button type="button" onClick={handleChangeType} disabled={isPending} style={{ ...btnPrimary, marginBottom: 10 }}>
              💾 حفظ النوع الجديد
            </button>
          )}

          <div style={{ height: 12, borderTop: '1px solid var(--line)', marginTop: 12, marginBottom: 12 }} />

          {!isSuspended ? (
            !showSuspendForm ? (
              <button type="button" onClick={() => setShowSuspendForm(true)} style={{ ...btnGhost, color: 'var(--rose)', borderColor: 'var(--rose-soft)' }}>
                ⛔ تعليق الحساب
              </button>
            ) : (
              <div style={{ background: 'var(--rose-soft)', padding: 12, borderRadius: 10 }}>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={2}
                  placeholder="سبب التعليق..."
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={handleToggleSuspend} disabled={isPending} style={{ ...btnRose, flex: 1 }}>
                    تأكيد
                  </button>
                  <button type="button" onClick={() => setShowSuspendForm(false)} style={{ ...btnGhost, flex: 1 }}>
                    إلغاء
                  </button>
                </div>
              </div>
            )
          ) : (
            <button type="button" onClick={handleToggleSuspend} disabled={isPending} style={btnPrimary}>
              ▶️ إلغاء التعليق
            </button>
          )}
        </>
      )}

      {/* ─── حالة Rejected: زر إعادة فتح ─── */}
      {approvalStatus === 'rejected' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>
              إعادة فتح الطلب — نوع الاختصاصي
            </label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as SpecialistType)} style={inputStyle}>
              {SPECIALIST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SPECIALIST_META[t].icon} {SPECIALIST_META[t].label}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleApprove} disabled={isPending} style={btnPrimary}>
            🔄 إعادة الموافقة
          </button>
        </>
      )}
    </div>
  );
}
