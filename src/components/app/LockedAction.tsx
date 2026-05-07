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

  if (isLocked) {
    return (
      <>
        <button
          onClick={handleClick}
          className={`locked-action ${className}`}
          aria-label={ariaLabel || `${message} (مقفل للضيف)`}
          aria-disabled="true"
          type="button"
        >
          {children}
          <span className="locked-action-icon" aria-hidden="true">🔒</span>
        </button>

        {showModal && <UpgradeModal message={message} onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <button onClick={onClick} className={className} aria-label={ariaLabel} type="button">
      {children}
    </button>
  );
}

function UpgradeModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      className="upgrade-modal-overlay"
      onClick={onClose}
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
          onClick={onClose}
          className="upgrade-modal-close"
          aria-label="إغلاق"
          type="button"
        >×</button>

        <div className="upgrade-modal-icon" aria-hidden="true">🔒</div>

        <h2 id="upgrade-title" className="upgrade-modal-title">
          هذه الميزة تحتاج حساب
        </h2>

        <p className="upgrade-modal-text">{message}</p>

        <div className="upgrade-modal-benefits">
          <div className="upgrade-benefit"><span aria-hidden="true">✓</span><span>مجاني تماماً</span></div>
          <div className="upgrade-benefit"><span aria-hidden="true">✓</span><span>تسجيل بدقيقتين</span></div>
          <div className="upgrade-benefit"><span aria-hidden="true">✓</span><span>وصول كامل للخدمات</span></div>
        </div>

        <div className="upgrade-modal-actions">
          <Link href="/register" className="upgrade-modal-cta" onClick={onClose}>
            إنشاء حساب جديد ←
          </Link>
          <Link href="/login" className="upgrade-modal-secondary" onClick={onClose}>
            لدي حساب · تسجيل الدخول
          </Link>
        </div>

        <button onClick={onClose} className="upgrade-modal-skip" type="button">
          متابعة كضيف
        </button>
      </div>
    </div>
  );
}
