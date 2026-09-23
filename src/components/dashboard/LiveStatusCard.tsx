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

/**
 * كم خطوةً اكتملت، وأيُّها الجارية الآن.
 *
 * كان هنا فهرسٌ واحد، و`pending` و`confirmed` كلاهما صفر — فالطلب المعلَّق
 * والمؤكَّد يبدوان متطابقين. وكانت الخطوة الجارية تُرسم بـ✓ كالمكتملة،
 * فبطاقةٌ عنوانها «في انتظار التأكيد» تُظهر «تأكيد» مُعلَّمةً بعلامة إتمام.
 * `active = -1`: لا خطوةَ جارية (مؤكَّدٌ ينتظر الانطلاق).
 */
const STEP_STATE: Record<LiveStatus, { done: number; active: number }> = {
  pending: { done: 0, active: 0 },
  confirmed: { done: 1, active: -1 },
  on_the_way: { done: 1, active: 1 },
  in_service: { done: 2, active: 2 },
  completed: { done: 3, active: 3 },
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
  const { done, active } = STEP_STATE[status];
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
          {new Date().toLocaleDateString('ar-IQ', { weekday: 'long' })}{' '}
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
          const isComplete = i < done;
          const isActive = i === active;

          return (
            <div key={step.label} style={{ display: 'contents' }}>
              <div className="live-status-step" aria-current={isActive ? 'step' : undefined}>
                <div
                  className={`live-status-step-circle ${
                    isComplete ? 'complete' : isActive ? 'active' : 'pending'
                  }`}
                  aria-hidden="true"
                >
                  {/* ✓ للمكتملة وحدها — الجاريةُ حلقةٌ نابضة لا علامةُ إتمام */}
                  {isComplete && step.icon}
                  {isActive && <span className="live-status-step-ring" />}
                </div>
                <div
                  className={`live-status-step-label ${
                    isComplete || isActive ? 'highlighted' : ''
                  }`}
                >
                  {step.label}
                  <span className="sr-only">
                    {isComplete ? ' — مكتملة' : isActive ? ' — جارية' : ''}
                  </span>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`live-status-step-line ${
                    // الخطُّ يمتلئ حين تُبلَغ الخطوةُ التي يقود إليها
                    i + 1 < done || i + 1 === active ? 'complete' : ''
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
