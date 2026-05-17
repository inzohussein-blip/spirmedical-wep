'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Menu, X, Stethoscope, Settings, MessageCircle, HelpCircle, UserCog,
} from 'lucide-react';

export default function LandingMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="landing-menu-toggle"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu size={22} strokeWidth={2.2} aria-hidden />
      </button>

      {open && (
        <div className="landing-mobile-menu" role="dialog" aria-modal="true">
          <div className="landing-mobile-menu-overlay" onClick={close} aria-hidden="true" />
          <div className="landing-mobile-menu-panel">
            <div className="landing-mobile-menu-header">
              <Link href="/" onClick={close} className="landing-logo">
                <div className="landing-logo-mark">س</div>
                <div className="landing-logo-text">
                  <strong>Spir Medical</strong>
                  <span>سباير ميديكال</span>
                </div>
              </Link>
              <button
                type="button"
                className="landing-mobile-menu-close"
                onClick={close}
                aria-label="إغلاق القائمة"
              >
                <X size={22} strokeWidth={2.4} aria-hidden />
              </button>
            </div>

            <nav className="landing-mobile-menu-links">
              <a href="#services" onClick={close}>
                <Stethoscope size={18} strokeWidth={2.2} aria-hidden />
                <span>الخدمات</span>
              </a>
              <a href="#how-it-works" onClick={close}>
                <Settings size={18} strokeWidth={2.2} aria-hidden />
                <span>كيف يعمل</span>
              </a>
              <a href="#testimonials" onClick={close}>
                <MessageCircle size={18} strokeWidth={2.2} aria-hidden />
                <span>آراء المستخدمين</span>
              </a>
              <a href="#faq" onClick={close}>
                <HelpCircle size={18} strokeWidth={2.2} aria-hidden />
                <span>الأسئلة الشائعة</span>
              </a>
              <a href="#doctors" onClick={close}>
                <UserCog size={18} strokeWidth={2.2} aria-hidden />
                <span>للأطباء</span>
              </a>
            </nav>

            <div className="landing-mobile-menu-cta">
              <Link href="/login" onClick={close} className="landing-cta-secondary">
                تسجيل دخول
              </Link>
              <Link href="/gate" onClick={close} className="landing-cta-primary">
                ابدأ الآن ←
              </Link>
            </div>

            <div className="landing-mobile-menu-langs">
              <span className="landing-mobile-langs-label">اللغة</span>
              <div className="landing-mobile-langs-buttons">
                <button type="button" className="active">
                  <span aria-hidden="true">🇮🇶</span>
                  <span>العربية</span>
                </button>
                <button type="button">
                  <span aria-hidden="true">🇬🇧</span>
                  <span>EN</span>
                </button>
                <button type="button">
                  <span aria-hidden="true">●</span>
                  <span>کوردی</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
