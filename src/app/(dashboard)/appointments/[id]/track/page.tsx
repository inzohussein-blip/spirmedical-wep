'use client';

import Link from 'next/link';
import { useState, useEffect, useTransition } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { cancelAppointment } from '../actions';
import { toast } from '@/components/ui/Toaster';
import type { LucideIcon } from 'lucide-react';
import { useConfirm } from '@/components/ui';
import {
  ClipboardList, CheckCircle2, Car, RefreshCw, BadgeCheck,
  MessageCircle, Phone, AlertTriangle, X, Loader2, Banknote, Star,
} from 'lucide-react';

const STATUS_FLOW: Array<{ id: string; label: string; icon: LucideIcon; desc: string }> = [
  { id: 'pending',     label: 'قيد المراجعة', icon: ClipboardList, desc: 'سيراجع فريقنا طلبك' },
  { id: 'confirmed',   label: 'مؤكّد',         icon: CheckCircle2,  desc: 'تم قبول الطلب' },
  { id: 'on_way',      label: 'في الطريق',     icon: Car,           desc: 'الفني في طريقه إليك' },
  { id: 'in_progress', label: 'قيد التنفيذ',   icon: RefreshCw,     desc: 'جاري تقديم الخدمة' },
  { id: 'completed',   label: 'مُكتمل',        icon: BadgeCheck,    desc: 'تم إنجاز الخدمة بنجاح' },
];

export default function OrderTrackPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = (params.id as string) || 'preview';
  const method = searchParams.get('method') || 'cash';
  const total = parseInt(searchParams.get('total') || '15000');

  const [currentStep, setCurrentStep] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelError, setCancelError] = useState('');

  async function handleCancel() {
    if (orderId === 'preview') {
      toast.info('هذه معاينة فقط — لا يمكن إلغاء طلب وهمي');
      return;
    }
    const reason = prompt('لماذا تريد إلغاء الطلب؟ (اختياري)')?.trim() || 'لم يحدد المستخدم سبباً';
    if (reason === null) return; // المستخدم ضغط Cancel

    const ok = await confirm({
      title: 'إلغاء الطلب',
      message: 'هذا الإجراء لا يمكن التراجع عنه.',
      variant: 'danger',
      confirmText: 'إلغاء',
    });
    if (!ok) return;

    setCancelError('');
    startCancelTransition(async () => {
      const result = await cancelAppointment(orderId, reason);
      if (!result.success) {
        setCancelError(result.error || 'تعذّر إلغاء الطلب');
        return;
      }
      router.push('/appointments');
    });
  }


  // محاكاة تقدم الحالة (للعرض فقط)
  useEffect(() => {
    setIsLive(true);
    const timer = setTimeout(() => {
      if (currentStep < 1) setCurrentStep(1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">تتبع طلبك</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* بطاقة النجاح */}
        <div className="order-success-card">
          <div className="order-success-icon">
            <div className="order-success-check">✓</div>
            <div className="order-success-rings"></div>
          </div>
          <h2 className="order-success-title">تم تأكيد طلبك!</h2>
          <p className="order-success-desc">سنتواصل معك خلال دقائق لتأكيد التفاصيل</p>

          <div className="order-success-id">
            رقم الطلب: <strong>#{orderId.slice(0, 8).toUpperCase()}</strong>
          </div>
        </div>

        {/* حالة الطلب المباشرة */}
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
              const isPending = idx > currentStep;
              const Icon = step.icon;

              return (
                <div key={step.id} className={`order-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isPending ? 'pending' : ''}`}>
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
                    {isActive && (
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
              <div className="scr-list-item-subtitle">
                {method === 'cash' ? 'كاش عند الإستلام' : 'الدفع الإلكتروني'}
              </div>
            </div>
            <span className="scr-tag scr-tag-amber">قيد الإنتظار</span>
          </div>

          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">
              <Banknote size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">طريقة الدفع</div>
              <div className="scr-list-item-subtitle">يُتفق عليها مع الاختصاصي عند الإستلام</div>
            </div>
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
