'use client';

import Link from 'next/link';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🎯 LiveStatusCard (V25.34)
 * ════════════════════════════════════════════════════════════════════
 *
 * بطاقة تتبّع حية للطلب الجاري
 *
 * Features:
 *   - شريط progress متحرّك
 *   - Pulse animation على status نشط
 *   - 4 خطوات (تأكيد → في الطريق → السحب → النتائج)
 *   - زرّي اتصال + رسالة سريعين
 *   - وقت الوصول المتوقّع
 * ════════════════════════════════════════════════════════════════════
 */

export type LiveStatus = 'pending' | 'confirmed' | 'on_the_way' | 'in_service' | 'completed';

interface Props {
  status: LiveStatus;
  specialistName: string;
  specialistAvatar?: string;
  specialistTitle?: string;
  specialistPhone?: string | null;
  eta?: string;
  etaDistance?: string;
  appointmentId: string;
}

const STATUS_LABELS: Record<LiveStatus, string> = {
  pending: 'في انتظار التأكيد',
  confirmed: 'تأكّد الطلب',
  on_the_way: 'المختص في الطريق',
  in_service: 'الخدمة جارية',
  completed: 'مُكتمل',
};

const STATUS_INDEX: Record<LiveStatus, number> = {
  pending: 0,
  confirmed: 0,
  on_the_way: 1,
  in_service: 2,
  completed: 3,
};

const STEPS = [
  { label: 'تأكيد', icon: '✓' },
  { label: 'في الطريق', icon: '✓' },
  { label: 'السحب', icon: '✓' },
  { label: 'النتائج', icon: '✓' },
];

export default function LiveStatusCard({
  status,
  specialistName,
  specialistAvatar = '👨‍⚕️',
  specialistTitle,
  specialistPhone,
  eta,
  etaDistance,
  appointmentId,
}: Props) {
  const currentIndex = STATUS_INDEX[status];
  const statusLabel = STATUS_LABELS[status];

  return (
    <div className="live-status-card">
      <div className="live-status-progress-bar" aria-hidden="true">
        <div className="live-status-progress-bar-inner" />
      </div>

      <div className="live-status-header">
        <div className="live-status-pulse-dot" aria-hidden="true">
          <span className="live-status-pulse-ring" />
        </div>
        <span className="live-status-label">{statusLabel}</span>
        <span className="live-status-time">
          {new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="live-status-specialist-row">
        <div className="live-status-avatar" aria-hidden="true">
          {specialistAvatar}
        </div>
        <div className="live-status-specialist-info">
          <div className="live-status-specialist-name">{specialistName}</div>
          {specialistTitle && (
            <div className="live-status-specialist-title">{specialistTitle}</div>
          )}
        </div>
        <div className="live-status-actions">
          {specialistPhone && (
            <a
              href={`tel:${specialistPhone}`}
              className="live-status-action-btn"
              aria-label="اتصال"
            >
              <span aria-hidden="true">📞</span>
            </a>
          )}
          <Link
            href={`/messages?appointment=${appointmentId}`}
            className="live-status-action-btn"
            aria-label="رسالة"
          >
            <span aria-hidden="true">💬</span>
          </Link>
        </div>
      </div>

      <div className="live-status-steps">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex;
          const isActive = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div key={step.label} style={{ display: 'contents' }}>
              <div className="live-status-step">
                <div
                  className={`live-status-step-circle ${
                    isComplete ? 'complete' : isActive ? 'active' : 'pending'
                  }`}
                  aria-hidden="true"
                >
                  {!isPending && step.icon}
                  {isActive && <span className="live-status-step-ring" />}
                </div>
                <div
                  className={`live-status-step-label ${
                    isComplete || isActive ? 'highlighted' : ''
                  }`}
                >
                  {step.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`live-status-step-line ${
                    i < currentIndex ? 'complete' : ''
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {eta && status !== 'completed' && (
        <div className="live-status-eta">
          <span className="live-status-eta-icon" aria-hidden="true">⏱</span>
          <div className="live-status-eta-content">
            <div className="live-status-eta-label">الوصول المتوقّع</div>
            <div className="live-status-eta-value">{eta}</div>
          </div>
          {etaDistance && (
            <div className="live-status-eta-distance">
              <div>~ {etaDistance}</div>
              <div className="live-status-eta-moving">يتحرّك ✓</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
