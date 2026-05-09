'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cancelAppointment } from '@/app/(dashboard)/appointments/[id]/actions';

interface Props {
  appointmentId: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  specialistPhone?: string | null;
  address?: string | null;
  serviceName: string;
}

export default function AppointmentActions({
  appointmentId,
  status,
  specialistPhone,
  address,
  serviceName,
}: Props) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCancel = ['pending', 'confirmed'].includes(status);
  const canCall = status === 'in_progress' && specialistPhone;
  const canRebook = ['completed', 'cancelled'].includes(status);

  const cancelReasons = [
    'تغيّرت ظروفي',
    'وجدت بديلاً',
    'الموعد غير مناسب',
    'لا أحتاج الخدمة الآن',
    'سبب آخر',
  ];

  async function handleCancel() {
    if (!cancelReason) {
      setError('يرجى اختيار سبب الإلغاء');
      return;
    }

    setCancelling(true);
    setError(null);

    try {
      const result = await cancelAppointment(appointmentId, cancelReason);
      if (result.success) {
        setShowCancelModal(false);
        router.refresh();
      } else {
        setError(result.error || 'فشل الإلغاء');
      }
    } catch (e) {
      setError('حدث خطأ. حاول مرة أخرى');
    } finally {
      setCancelling(false);
    }
  }

  function handleWhatsApp() {
    if (!specialistPhone) return;
    const cleanPhone = specialistPhone.replace(/\D/g, '');
    const message = encodeURIComponent(`السلام عليكم، أتواصل معك بخصوص حجزي لخدمة "${serviceName}"`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  }

  function handleCall() {
    if (!specialistPhone) return;
    window.location.href = `tel:${specialistPhone}`;
  }

  function handleOpenMaps() {
    if (!address) return;
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }

  function handleRebook() {
    router.push('/appointments/new');
  }

  return (
    <>
      <div className="actions-grid">
        {canCall && (
          <button onClick={handleCall} className="action-btn primary">
            <span className="action-icon">📞</span>
            <span>اتصال بالفني</span>
          </button>
        )}

        {canCall && (
          <button onClick={handleWhatsApp} className="action-btn whatsapp">
            <span className="action-icon">💬</span>
            <span>واتساب</span>
          </button>
        )}

        {address && (
          <button onClick={handleOpenMaps} className="action-btn">
            <span className="action-icon">📍</span>
            <span>افتح الخريطة</span>
          </button>
        )}

        {canCancel && (
          <button onClick={() => setShowCancelModal(true)} className="action-btn danger">
            <span className="action-icon">❌</span>
            <span>إلغاء الحجز</span>
          </button>
        )}

        {canRebook && (
          <button onClick={handleRebook} className="action-btn primary">
            <span className="action-icon">🔄</span>
            <span>إعادة الحجز</span>
          </button>
        )}
      </div>

      {showCancelModal && (
        <div className="modal-backdrop" onClick={() => !cancelling && setShowCancelModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">❌</div>
            <h3>إلغاء الحجز؟</h3>
            <p>سيتم إلغاء حجزك نهائياً ولا يمكن التراجع.</p>

            <div className="reasons-list">
              <div className="reasons-title">ما السبب؟</div>
              {cancelReasons.map((reason) => (
                <label key={reason} className={`reason-option ${cancelReason === reason ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={(e) => {
                      setCancelReason(e.target.value);
                      setError(null);
                    }}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {error && <div className="modal-error">{error}</div>}

            <div className="modal-actions">
              <button onClick={() => setShowCancelModal(false)} disabled={cancelling} className="modal-btn secondary">
                التراجع
              </button>
              <button onClick={handleCancel} disabled={cancelling || !cancelReason} className="modal-btn danger">
                {cancelling ? 'جارٍ الإلغاء...' : 'تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .action-btn {
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 14px;
          padding: 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s;
          color: var(--ink, #0F1A1C);
        }
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.1);
        }
        .action-btn.primary {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          border-color: var(--emerald, #0E5C4D);
        }
        .action-btn.whatsapp {
          background: #25D366;
          color: white;
          border-color: #25D366;
        }
        .action-btn.danger {
          background: var(--white, #FFFFFF);
          color: var(--rose, #A82E3D);
          border-color: var(--rose, #A82E3D);
        }
        .action-btn.danger:hover {
          background: var(--rose-soft, #F0D7D8);
        }
        .action-icon { font-size: 18px; }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 26, 28, 0.5);
          z-index: 100;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(4px);
        }
        .modal-card {
          background: var(--white, #FFFFFF);
          border-radius: 20px;
          padding: 24px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-icon {
          width: 64px;
          height: 64px;
          background: var(--rose-soft, #F0D7D8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto 14px;
        }
        .modal-card h3 {
          font-size: 18px;
          font-weight: 800;
          margin: 0 0 6px;
          text-align: center;
        }
        .modal-card p {
          font-size: 13px;
          color: var(--ink-3, #6E7878);
          margin: 0 0 16px;
          text-align: center;
        }
        .reasons-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .reasons-title {
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .reason-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: var(--paper-3, #FAF6EB);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 11px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.15s;
        }
        .reason-option:hover {
          background: var(--paper-2, #EDE6D3);
        }
        .reason-option.selected {
          background: var(--rose-soft, #F0D7D8);
          border-color: var(--rose, #A82E3D);
          color: var(--rose, #A82E3D);
        }
        .reason-option input { accent-color: var(--rose, #A82E3D); }

        .modal-error {
          background: var(--rose-soft, #F0D7D8);
          color: var(--rose, #A82E3D);
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 12px;
          text-align: center;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
        }
        .modal-btn {
          flex: 1;
          padding: 13px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          border: 0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-btn.secondary {
          background: var(--paper-2, #EDE6D3);
          color: var(--ink, #0F1A1C);
        }
        .modal-btn.danger {
          background: var(--rose, #A82E3D);
          color: var(--paper-3, #FAF6EB);
        }
        .modal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
