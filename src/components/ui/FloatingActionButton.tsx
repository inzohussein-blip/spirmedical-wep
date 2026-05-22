'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🎯 FloatingActionButton (V25.34)
 * ════════════════════════════════════════════════════════════════════
 *
 * FAB ديناميكي يظهر في صفحات معيّنة مع quick actions
 *
 * يظهر في:
 *   - /dashboard → حجز جديد + طوارئ + استشارة
 *   - /appointments → موعد جديد + إعد طلب سابق
 *   - /messages → استشارة جديدة
 *
 * Animation:
 *   - Stagger entry (كل action بعد الآخر)
 *   - Backdrop blur عند الفتح
 *   - Rotate 45° للـ + → x
 * ════════════════════════════════════════════════════════════════════
 */

interface QuickAction {
  href: string;
  label: string;
  icon: string;
  variant?: 'default' | 'danger';
}

const ACTIONS_BY_PAGE: Record<string, QuickAction[]> = {
  '/dashboard': [
    { href: '/appointments/new?service=blood-draw', label: 'سحب دم', icon: '🩸' },
    { href: '/appointments/new?service=home-nursing', label: 'تمريض', icon: '💉' },
    { href: '/sos', label: 'طوارئ', icon: '🚨', variant: 'danger' },
  ],
  '/appointments': [
    { href: '/appointments/new', label: 'موعد جديد', icon: '➕' },
    { href: '/appointments?status=completed', label: 'سابقة', icon: '🔄' },
  ],
  '/messages': [
    { href: '/consultations/new', label: 'استشارة', icon: '💬' },
  ],
};

export default function FloatingActionButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  const actions = ACTIONS_BY_PAGE[pathname];
  if (!actions || actions.length === 0) return null;

  const handleToggle = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fab-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fab-container">
        {actions.map((action, i) => (
          <div
            key={action.href}
            className={`fab-action ${isOpen ? 'open' : ''}`}
            style={{
              transitionDelay: isOpen ? `${i * 50}ms` : `${(actions.length - 1 - i) * 30}ms`,
              bottom: `${72 + i * 56}px`,
            }}
          >
            <span className={`fab-action-label ${action.variant === 'danger' ? 'danger' : ''}`}>
              {action.label}
            </span>
            <Link
              href={action.href}
              onClick={() => setIsOpen(false)}
              className={`fab-action-btn ${action.variant === 'danger' ? 'danger' : ''}`}
              aria-label={action.label}
            >
              <span aria-hidden="true">{action.icon}</span>
            </Link>
          </div>
        ))}

        <button
          type="button"
          onClick={handleToggle}
          className={`fab-main ${isOpen ? 'open' : ''}`}
          aria-label={isOpen ? 'إغلاق' : 'إجراءات سريعة'}
          aria-expanded={isOpen}
        >
          <span className="fab-main-icon" aria-hidden="true">+</span>
        </button>
      </div>
    </>
  );
}
