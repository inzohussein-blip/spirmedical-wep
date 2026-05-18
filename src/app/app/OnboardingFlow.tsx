'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Droplets,
  Calendar,
  MessageCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * OnboardingFlow — شاشة الترحيب (أول مرة فقط)
 * ═══════════════════════════════════════════════════════════════
 *
 * 4 شرائح تشرح المنصة بشكل بصري
 * يدعم RTL + swipe (touch gestures)
 * يعمل بنفسه - يضع flag في localStorage عند الانتهاء
 * ═══════════════════════════════════════════════════════════════
 */

interface Slide {
  icon: typeof Droplets;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  badge?: string;
}

const SLIDES: Slide[] = [
  {
    icon: Droplets,
    iconBg: 'var(--rose-soft)',
    iconColor: 'var(--rose)',
    title: 'سحب الدم في بيتك',
    description:
      'احجز موعد سحب دم منزلي بكل سهولة. فنّي مختص يأتي إليك في الوقت المناسب لك.',
    badge: '🏠 خدمة منزلية',
  },
  {
    icon: Calendar,
    iconBg: 'var(--emerald-soft)',
    iconColor: 'var(--emerald)',
    title: 'كل التحاليل في مكان واحد',
    description:
      'احجز التحاليل من أفضل المختبرات العراقية. اعرف الأسعار قبل الحجز ولا توجد رسوم خفية.',
    badge: '🧪 +30 تحليل',
  },
  {
    icon: MessageCircle,
    iconBg: 'var(--amber-soft)',
    iconColor: 'var(--amber)',
    title: 'استشر طبيبك على مدار الساعة',
    description:
      'استشارات طبية مع أخصائيين معتمدين. تحدّث معهم مباشرة من تطبيقك في أي وقت.',
    badge: '💬 استشارات فورية',
  },
  {
    icon: ShieldCheck,
    iconBg: 'var(--paper-3)',
    iconColor: 'var(--emerald-deep)',
    title: 'خصوصيتك مضمونة',
    description:
      'كل بياناتك الطبية مشفّرة ومحمية. لا نشاركها مع أي طرف ثالث، أبداً.',
    badge: '🔒 آمن ومشفّر',
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: Props) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const isLastSlide = currentSlide === SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;

  const goNext = () => {
    if (!isLastSlide) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const goPrev = () => {
    if (!isFirstSlide) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleRegister = () => {
    try {
      localStorage.setItem('spir_onboarding_completed', 'true');
    } catch {
      /* ignore */
    }
    router.replace('/login?mode=register');
  };

  // Touch handlers (للـ swipe على الجوال)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // RTL: swipe to right = next, swipe to left = prev
    // (بسبب الـ direction، نعكس المنطق)
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // swipe لليسار (في RTL = للأمام)
        goPrev();
      } else {
        // swipe لليمين (في RTL = للخلف)
        goNext();
      }
    }
    setTouchStart(null);
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="ob-wrap">
      {/* Skip button */}
      <button
        type="button"
        onClick={handleSkip}
        className="ob-skip"
        aria-label="تخطي الترحيب"
      >
        تخطي
      </button>

      {/* Logo */}
      <div className="ob-logo">
        <Image
          src="/icon.svg"
          alt="Spir Medical"
          width={48}
          height={48}
          priority
        />
        <h1>سباير ميديكال</h1>
      </div>

      {/* Slide content */}
      <div
        className="ob-content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="ob-slide" key={currentSlide}>
          {/* Icon */}
          <div
            className="ob-icon-wrap"
            style={{ background: slide.iconBg, color: slide.iconColor }}
          >
            <Icon size={56} strokeWidth={1.8} />
          </div>

          {/* Badge */}
          {slide.badge && <div className="ob-badge">{slide.badge}</div>}

          {/* Title */}
          <h2 className="ob-title">{slide.title}</h2>

          {/* Description */}
          <p className="ob-description">{slide.description}</p>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="ob-dots" role="tablist">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className={`ob-dot ${idx === currentSlide ? 'ob-dot-active' : ''}`}
            aria-label={`الشريحة ${idx + 1}`}
            role="tab"
            aria-selected={idx === currentSlide}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="ob-nav">
        {isLastSlide ? (
          // الشريحة الأخيرة: أزرار "ابدأ"
          <>
            <button
              type="button"
              onClick={handleRegister}
              className="ob-btn ob-btn-primary"
            >
              إنشاء حساب جديد
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="ob-btn ob-btn-secondary"
            >
              لدي حساب · تسجيل الدخول
            </button>
          </>
        ) : (
          // الشرائح العادية: زر التالي
          <div className="ob-nav-row">
            {!isFirstSlide && (
              <button
                type="button"
                onClick={goPrev}
                className="ob-btn-icon"
                aria-label="السابق"
              >
                <ChevronRight size={20} strokeWidth={2.4} />
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="ob-btn ob-btn-primary ob-btn-next"
            >
              <span>التالي</span>
              <ChevronLeft size={18} strokeWidth={2.4} />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .ob-wrap {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--paper);
          display: flex;
          flex-direction: column;
          padding: env(safe-area-inset-top, 16px) 20px env(safe-area-inset-bottom, 20px);
          position: relative;
        }
        .ob-skip {
          position: absolute;
          top: calc(env(safe-area-inset-top, 0px) + 16px);
          inset-inline-end: 20px;
          background: transparent;
          border: none;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          color: var(--ink-3);
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.15s;
          z-index: 2;
        }
        .ob-skip:hover {
          background: var(--paper-2);
          color: var(--ink);
        }

        .ob-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 0 8px;
        }
        .ob-logo h1 {
          font-size: 16px;
          font-weight: 800;
          color: var(--emerald-deep);
          margin: 0;
        }

        .ob-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 8px;
          min-height: 0;
        }

        .ob-slide {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          max-width: 400px;
          width: 100%;
          animation: ob-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ob-icon-wrap {
          width: 120px;
          height: 120px;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          box-shadow: 0 8px 24px -8px rgba(14, 92, 77, 0.15);
        }

        .ob-badge {
          display: inline-block;
          padding: 6px 14px;
          background: var(--white);
          color: var(--ink-2);
          border-radius: 100px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid var(--line);
        }

        .ob-title {
          font-size: 24px;
          font-weight: 900;
          color: var(--ink);
          margin: 0;
          line-height: 1.3;
          padding: 0 8px;
        }

        .ob-description {
          font-size: 14px;
          font-weight: 500;
          color: var(--ink-3);
          margin: 0;
          line-height: 1.7;
          padding: 0 8px;
          max-width: 360px;
        }

        .ob-dots {
          display: flex;
          gap: 6px;
          justify-content: center;
          padding: 8px 0 20px;
        }
        .ob-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--ink-4);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.25s;
          opacity: 0.4;
        }
        .ob-dot-active {
          opacity: 1;
          background: var(--emerald);
          width: 28px;
          border-radius: 100px;
        }

        .ob-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0;
        }
        .ob-nav-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .ob-btn {
          padding: 14px 20px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
        }
        .ob-btn-primary {
          background: var(--emerald);
          color: var(--paper-3);
        }
        .ob-btn-primary:hover {
          background: var(--emerald-deep);
          transform: translateY(-1px);
        }
        .ob-btn-primary:active {
          transform: scale(0.98);
        }
        .ob-btn-secondary {
          background: transparent;
          color: var(--emerald-deep);
          border: 1.5px solid var(--emerald);
        }
        .ob-btn-secondary:hover {
          background: var(--emerald-soft);
        }
        .ob-btn-next {
          flex: 1;
        }
        .ob-btn-icon {
          width: 48px;
          height: 48px;
          padding: 0;
          border-radius: 14px;
          background: var(--paper-3);
          color: var(--ink-2);
          border: 1px solid var(--line);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: inherit;
          transition: all 0.15s;
        }
        .ob-btn-icon:hover {
          background: var(--paper-2);
        }

        @keyframes ob-slide-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* تجاهل الـ animations لو فضّل المستخدم */
        @media (prefers-reduced-motion: reduce) {
          .ob-slide {
            animation: none;
          }
        }

        /* Desktop */
        @media (min-width: 768px) {
          .ob-wrap {
            max-width: 480px;
            margin: 0 auto;
            min-height: auto;
            border-radius: 24px;
            box-shadow: 0 24px 64px -16px rgba(0, 0, 0, 0.15);
            padding: 32px 32px 24px;
            margin-top: 5vh;
          }
          .ob-icon-wrap {
            width: 140px;
            height: 140px;
          }
        }
      `}</style>
    </div>
  );
}
