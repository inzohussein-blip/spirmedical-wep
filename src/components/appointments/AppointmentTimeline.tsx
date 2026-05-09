'use client';

interface TimelineEvent {
  status: string;
  label: string;
  emoji: string;
  timestamp: string | null;
  active: boolean;
  current: boolean;
}

interface Props {
  currentStatus: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  confirmedAt: string | null;
  scheduledAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason?: string | null;
}

function formatDateArabic(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AppointmentTimeline({
  currentStatus,
  createdAt,
  confirmedAt,
  scheduledAt,
  completedAt,
  cancelledAt,
  cancellationReason,
}: Props) {
  const cancelled = currentStatus === 'cancelled';

  const events: TimelineEvent[] = cancelled
    ? [
        { status: 'created', label: 'تم إنشاء الحجز', emoji: '📝', timestamp: createdAt, active: true, current: false },
        { status: 'cancelled', label: 'تم الإلغاء', emoji: '❌', timestamp: cancelledAt, active: true, current: true },
      ]
    : [
        { status: 'created', label: 'تم إنشاء الحجز', emoji: '📝', timestamp: createdAt, active: true, current: currentStatus === 'pending' },
        { status: 'confirmed', label: 'تم التأكيد', emoji: '✅', timestamp: confirmedAt, active: ['confirmed', 'in_progress', 'completed'].includes(currentStatus), current: currentStatus === 'confirmed' },
        { status: 'in_progress', label: 'الفني في الطريق', emoji: '🚗', timestamp: null, active: ['in_progress', 'completed'].includes(currentStatus), current: currentStatus === 'in_progress' },
        { status: 'completed', label: 'مُكتمل', emoji: '🎉', timestamp: completedAt, active: currentStatus === 'completed', current: currentStatus === 'completed' },
      ];

  return (
    <div className="timeline">
      <h3 className="timeline-title">📜 سجل الحالات</h3>

      <div className="timeline-events">
        {events.map((event, idx) => (
          <div key={event.status} className={`timeline-event ${event.active ? 'active' : 'inactive'} ${event.current ? 'current' : ''}`}>
            <div className="timeline-marker">
              <div className="timeline-icon">
                {event.active ? <span>{event.emoji}</span> : <span style={{ opacity: 0.3 }}>○</span>}
              </div>
              {idx < events.length - 1 && (
                <div className={`timeline-line ${event.active ? 'active' : ''}`} />
              )}
            </div>

            <div className="timeline-content">
              <div className="timeline-label">{event.label}</div>
              {event.timestamp && (
                <div className="timeline-time">{formatDateArabic(event.timestamp)}</div>
              )}
              {!event.active && (
                <div className="timeline-pending">قيد الانتظار</div>
              )}
              {event.current && cancelled && cancellationReason && (
                <div className="timeline-reason">السبب: {cancellationReason}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .timeline {
          background: var(--white, #FFFFFF);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 16px;
          padding: 20px;
        }
        .timeline-title {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 18px;
          color: var(--ink, #0F1A1C);
        }
        .timeline-events {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .timeline-event {
          display: flex;
          gap: 14px;
          min-height: 60px;
        }
        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .timeline-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--paper-3, #FAF6EB);
          border: 2px solid var(--line, rgba(15, 26, 28, 0.08));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .timeline-event.active .timeline-icon {
          background: var(--emerald-soft, #D9E5DF);
          border-color: var(--emerald, #0E5C4D);
        }
        .timeline-event.current .timeline-icon {
          background: var(--emerald, #0E5C4D);
          border-color: var(--emerald, #0E5C4D);
          box-shadow: 0 0 0 4px rgba(14, 92, 77, 0.15);
          animation: glow 2s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 0 4px rgba(14, 92, 77, 0.15); }
          50% { box-shadow: 0 0 0 8px rgba(14, 92, 77, 0.05); }
        }
        .timeline-line {
          flex: 1;
          width: 2px;
          background: var(--line, rgba(15, 26, 28, 0.08));
          min-height: 20px;
        }
        .timeline-line.active {
          background: var(--emerald, #0E5C4D);
        }
        .timeline-content {
          flex: 1;
          padding-bottom: 14px;
        }
        .timeline-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--ink, #0F1A1C);
        }
        .timeline-event.inactive .timeline-label {
          color: var(--ink-3, #6E7878);
        }
        .timeline-time {
          font-size: 11px;
          color: var(--ink-3, #6E7878);
          margin-top: 3px;
          font-family: 'JetBrains Mono', monospace;
        }
        .timeline-pending {
          font-size: 11px;
          color: var(--ink-4, #A4ACAA);
          margin-top: 3px;
          font-style: italic;
        }
        .timeline-reason {
          font-size: 11px;
          color: var(--rose, #A82E3D);
          margin-top: 5px;
          background: var(--rose-soft, #F0D7D8);
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
