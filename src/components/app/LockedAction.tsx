'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';

interface LockedActionProps {
  children: ReactNode;
  isLocked: boolean;
  message?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export function LockedAction({
  children,
  isLocked,
  message = 'سجّل الآن للوصول لهذه الميزة',
  onClick,
  className = '',
  ariaLabel,
}: LockedActionProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={className}
        aria-label={ariaLabel || message}
        aria-disabled={isLocked}
        type="button"
      >
        {children}
      </button>

      {showModal && (
        <div
          className="upgrade-modal-overlay"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-title"
        >
          <div
            className="upgrade-modal"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <button
              onClick={() => setShowModal(false)}
              className="upgrade-modal-close"
              aria-label="إغلاق"
              type="button"
            >×</button>
            <div className="upgrade-modal-icon" aria-hidden="true">🔒</div>
            <h2 id="upgrade-title" className="upgrade-modal-title">هذه الميزة تحتاج حساب</h2>
            <p className="upgrade-modal-text">{message}</p>
            <div className="upgrade-modal-actions">
              <Link href="/register" className="upgrade-modal-cta" onClick={() => setShowModal(false)}>
                إنشاء حساب جديد ←
              </Link>
              <Link href="/login" className="upgrade-modal-secondary" onClick={() => setShowModal(false)}>
                لدي حساب · تسجيل الدخول
              </Link>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="upgrade-modal-skip"
              type="button"
            >متابعة كضيف</button>
          </div>
        </div>
      )}
    </>
  );
}
