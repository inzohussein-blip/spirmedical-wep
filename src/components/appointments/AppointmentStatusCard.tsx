'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Clock, CheckCircle2, Car, PartyPopper, XCircle, Zap,
  Timer,
} from 'lucide-react';

type Status = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface Props {
  status: Status;
  scheduledAt: string;
  serviceName: string;
  serviceIcon?: string;
}

const STATUS_CONFIG: Record<Status, {
  label: string;
  icon: LucideIcon;
  bg: string;
  color: string;
  pulse: boolean;
  description: string;
}> = {
  pending: {
    label: 'بانتظار التأكيد',
    icon: Clock,
    bg: '#F0DBC2',
    color: '#B8540C',
    pulse: true,
    description: 'سنُؤكّد حجزك خلال دقائق',
  },
  confirmed: {
    label: 'مؤكّد',
    icon: CheckCircle2,
    bg: '#D9E5DF',
    color: '#073B30',
    pulse: false,
    description: 'تم تأكيد حجزك بنجاح',
  },
  in_progress: {
    label: 'الفني في الطريق',
    icon: Car,
    bg: '#D9E5DF',
    color: '#073B30',
    pulse: true,
    description: 'الفني في طريقه إليك',
  },
  completed: {
    label: 'مُكتمل',
    icon: PartyPopper,
    bg: '#EDE6D3',
    color: '#1F2A2C',
    pulse: false,
    description: 'تم إنجاز الخدمة بنجاح',
  },
  cancelled: {
    label: 'مُلغى',
    icon: XCircle,
    bg: '#F0D7D8',
    color: '#A82E3D',
    pulse: false,
    description: 'تم إلغاء هذا الحجز',
  },
};

export default function AppointmentStatusCard({ status, scheduledAt, serviceName, serviceIcon }: Props) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (status === 'completed' || status === 'cancelled') return;

    function updateCountdown() {
      const now = new Date().getTime();
      const target = new Date(scheduledAt).getTime();
      const diff = target - now;

      if (diff < 0) {
        setCountdown('حان موعد الحجز');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days} يوم و ${hours} ساعة`);
      } else if (hours > 0) {
        setCountdown(`${hours} ساعة و ${minutes} دقيقة`);
      } else {
        setCountdown(`${minutes} دقيقة`);
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [scheduledAt, status]);

  const CountdownIcon = status === 'in_progress' ? Zap : Timer;

  return (
    <div className="status-card" style={{ background: config.bg }}>
      {config.pulse && <div className="pulse-dot" style={{ background: config.color }} />}

      <div className="status-icon-wrap">
        <StatusIcon size={28} strokeWidth={2.2} style={{ color: config.color }} />
      </div>

      <div className="status-content">
        <h2 style={{ color: config.color }}>{config.label}</h2>
        <p style={{ color: config.color }}>{config.description}</p>

        {countdown && status !== 'completed' && status !== 'cancelled' && (
          <div className="countdown-wrap" style={{ borderColor: config.color }}>
            <span className="countdown-label" style={{ color: config.color }}>
              <CountdownIcon size={12} strokeWidth={2.4} aria-hidden />
              <span>{status === 'in_progress' ? 'الوصول المتوقّع:' : 'يبدأ خلال:'}</span>
            </span>
            <span className="countdown-value" style={{ color: config.color }}>{countdown}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .status-card {
          border-radius: 18px;
          padding: 24px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }
        .pulse-dot {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        .status-icon-wrap {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .status-content { flex: 1; }
        .status-content h2 {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
        }
        .status-content p {
          font-size: 13px;
          margin: 0 0 12px;
          opacity: 0.85;
        }
        .countdown-wrap {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.6);
          padding: 8px 14px;
          border-radius: 100px;
          border: 1.5px solid;
          margin-top: 4px;
        }
        .countdown-label {
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .countdown-value {
          font-size: 13px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </div>
  );
}
