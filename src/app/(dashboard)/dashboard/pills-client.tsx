'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Pill {
  id: 'blood-lab' | 'consultation' | 'pharmacy' | 'sos';
  icon: string;
  label: string;
  href: string;
}

const PILLS: Pill[] = [
  {
    id: 'blood-lab',
    icon: '🩸',
    label: 'سحب دم + تحاليل',
    href: '/appointments/new?service=blood-draw',
  },
  {
    id: 'consultation',
    icon: '💬',
    label: 'استشارة',
    href: '/services/consultation',
  },
  {
    id: 'pharmacy',
    icon: '💊',
    label: 'صيدلية',
    href: '/services/pharmacies',
  },
  {
    id: 'sos',
    icon: '🚨',
    label: 'طوارئ',
    href: '/sos',
  },
];

export default function DashboardPills() {
  const router = useRouter();
  const [activePill, setActivePill] = useState<string | null>(null);

  const handleClick = (pill: Pill) => {
    setActivePill(pill.id);
    setTimeout(() => {
      router.push(pill.href);
    }, 100);
  };

  return (
    <div className="scr-pills" role="toolbar" aria-label="إجراءات سريعة">
      {PILLS.map((pill, idx) => (
        <button
          key={pill.id}
          type="button"
          className={`scr-pill ${activePill === pill.id ? 'active' : ''}`}
          onClick={() => handleClick(pill)}
          aria-label={pill.label}
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <span className="scr-pill-icon" aria-hidden="true">
            {pill.icon}
          </span>
          <span className="scr-pill-label">{pill.label}</span>
        </button>
      ))}
    </div>
  );
}
