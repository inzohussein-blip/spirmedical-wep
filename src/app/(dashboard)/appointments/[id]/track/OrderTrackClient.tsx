'use client';

import Link from 'next/link';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelAppointment } from '../actions';
import { toast } from '@/components/ui/Toaster';
import { createClient } from '@/lib/supabase/client';
import { SHOW_PRICES } from '@/lib/config/pricing';
import type { LucideIcon } from 'lucide-react';
import { useConfirm } from '@/components/ui';
import {
  ClipboardList, CheckCircle2, RefreshCw, BadgeCheck,
  MessageCircle, Phone, AlertTriangle, X, Loader2, Banknote, Star, Ban,
} from 'lucide-react';

// الحالات الحقيقية من enum appointment_status: pending → confirmed → in_progress → completed (+ cancelled)
const STATUS_FLOW: Array<{ id: string; label: string; icon: LucideIcon; desc: string }> = [
  { id: 'pending',     label: 'قيد المراجعة', icon: ClipboardList, desc: 'سيراجع فريقنا طلبك' },
  { id: 'confirmed',   label: 'مؤكّد',         icon: CheckCircle2,  desc: 'تم قبول الطلب' },
  { id: 'in_progress', label: 'قيد التنفيذ',   icon: RefreshCw,     desc: 'جاري تقديم الخدمة' },
  { id: 'completed',   label: 'مُكتمل',        icon: BadgeCheck,    desc: 'تم إنجاز الخدمة بنجاح' },
];

const STEP_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, in_progress: 2, completed: 3,
};

interface Props {
  id: string;
  initialStatus: string;
  estimatedPrice: number | null;
  createdAt: string;
}

export default function OrderTrackClient({ id, initialStatus, estimatedPrice }: Props) {
  const { confirm, ConfirmDialog } = useConfirm();
  const router = useRouter();

  const [status, setStatus] = useState(initialStatus);
  const [isLive, setIsLive] = useState(false);
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelError, setCancelError] = useState('');

  // اشتراك realtime على صف الموعد — تحديث الحالة مباشرةً عند تغيّرها.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`appointment:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `id=eq.${id}` },
        (payload) => {
          const next = (payload.new as { status?: string }).status;
          if (next) setStatus(next);
        },
      )
      .subscribe((st) => {
        setIsLive(st === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const isCancelled = status === 'cancelled';
  const currentStep = STEP_INDEX[status] ?? 0;
  const isCompleted = status === 'completed';

  async function handleCancel() {
    const reason = prompt('لماذا تريد إلغاء الطلب؟ (اختياري)')?.trim() || 'لم يحدد المستخدم سبباً';

    const ok = await confirm({
      title: 'إلغاء الطلب',
      message: 'هذا الإجراء لا يمكن التراجع عنه.',
      variant: 'danger',
      confirmText: 'إلغاء',
    });
    if (!ok) return;

    setCancelError('');
    startCancelTransition(async () => {
      const result = await cancelAppointment(id, reason);
      if (!result.success) {
        setCancelError(result.error || 'تعذّر إلغاء الطلب');
        return;
      }
      router.push('/appointments');
    });
  }

  const headerTitle = isCancelled
    ? 'أُلغي الطلب'
    : isCompleted
      ? 'اكتمل طلبك!'
      : status === 'pending'
        ? 'تم استلام طلبك'
        : 'تم تأكيد طلبك!';
  const headerDesc = isCancelled
    ? 'تم إلغاء هذا الطلب'
    : isCompleted
      ? 'شكراً لاستخدامك سباير ميديكال'
      : 'سنتواصل معك خلال دقائق لتأكيد التفاصيل';

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/appointments" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">تتبع طلبك</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* بطاقة الحالة */}
        <div className="order-success-card">
          <div className="order-success-icon">
            <div className="order-success-check" style={isCancelled ? { background: 'var(--rose)' } : undefined}>
              {isCancelled ? <Ban size={26} strokeWidth={2.4} /> : '✓'}
            </div>
            <div className="order-success-rings"></div>
          </div>
          <h2 className="order-success-title">{headerTitle}</h2>
          <p className="order-success-desc">{headerDesc}</p>

          <div className="order-success-id">
            رقم الطلب: <strong>#{id.slice(0, 8).toUpperCase()}</strong>
          </div>
        </div>

        {/* حالة الطلب — تُخفى عند الإلغاء */}
        {!isCancelled && (
          <div className="order-track-section">
            <div className="order-track-head">
              <h3>حالة الطلب</h3>
              {isLive && (
                <span className="order-live-badge">
                  <span className="order-live-dot"></span>
                  مباشر
                </span>
              )}
            </div>

            <div className="order-steps">
              {STATUS_FLOW.map((step, idx) => {
                const isActive = idx === currentStep;
                const isDone = idx < currentStep;
                const isPendingStep = idx > currentStep;
                const Icon = step.icon;

                return (
                  <div key={step.id} className={`order-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isPendingStep ? 'pending' : ''}`}>
                    <div className="order-step-icon-wrap">
                      <div className="order-step-icon">
                        {isDone ? <CheckCircle2 size={20} strokeWidth={2.2} /> : <Icon size={20} strokeWidth={2.2} />}
                      </div>
                      {idx < STATUS_FLOW.length - 1 && (
                        <div className="order-step-line" />
                      )}
                    </div>
                    <div className="order-step-content">
                      <div className="order-step-label">{step.label}</div>
                      <div className="order-step-desc">{step.desc}</div>
                      {isActive && !isCompleted && (
                        <div className="order-step-time">
                          <span className="order-step-pulse"></span>
                          <span>الحالة الآن</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* معلومات الدفع */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">معلومات الدفع</div>
        </div>

        <div className="scr-list-stack">
          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">
              <Banknote size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">طريقة الدفع</div>
              <div className="scr-list-item-subtitle">الدفع عند الاستلام · يُتفق عليه مع الاختصاصي</div>
            </div>
            {SHOW_PRICES && estimatedPrice != null && (
              <span className="scr-tag scr-tag-amber">{estimatedPrice.toLocaleString('ar-IQ')} د.ع</span>
            )}
          </div>
        </div>

        {/* الإجراءات */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">الإجراءات</div>
        </div>

        <div className="order-actions">
          <Link href={`/messages`} className="order-action-btn primary">
            <MessageCircle size={18} strokeWidth={2.2} aria-hidden />
            <span>محادثة الأخصائي</span>
          </Link>

          <a href="tel:122" className="order-action-btn">
            <Phone size={18} strokeWidth={2.2} aria-hidden />
            <span>الاتصال بالدعم</span>
          </a>

          {cancelError && (
            <div style={{
              background: 'var(--rose-soft)',
              color: 'var(--rose)',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              marginTop: 8,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <AlertTriangle size={14} strokeWidth={2.4} />
              <span>{cancelError}</span>
            </div>
          )}

          {/* الإلغاء متاح فقط قبل التنفيذ */}
          {(status === 'pending' || status === 'confirmed') && (
            <button
              type="button"
              className="order-action-btn danger"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <Loader2 size={18} strokeWidth={2.2} style={{ animation: 'spin-smooth 1s linear infinite' }} />
              ) : (
                <X size={18} strokeWidth={2.4} />
              )}
              <span>{isCancelling ? 'جارٍ الإلغاء...' : 'إلغاء الطلب'}</span>
            </button>
          )}
        </div>

        {/* بطاقة الترقية */}
        <div className="order-promo-card">
          <div className="order-promo-icon" aria-hidden="true">
            <Star size={22} strokeWidth={2.2} fill="currentColor" />
          </div>
          <div className="order-promo-content">
            <div className="order-promo-title">جرّب باقة العائلة الذهبية</div>
            <div className="order-promo-desc">خصم 25% على جميع الخدمات + طبيب أسرة مخصص</div>
          </div>
          <Link href="/account/subscription" className="order-promo-link">
            اعرف ←
          </Link>
        </div>

        <div style={{ height: 80 }} />
      </div>
      <ConfirmDialog />
    </main>
  );
}
