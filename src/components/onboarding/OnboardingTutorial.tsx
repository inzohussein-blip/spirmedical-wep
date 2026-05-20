'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, X, Check, Sparkles,
  Heart, Calendar, Users, Bell, Lock,
} from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📚 Onboarding Tutorial (V25.13)
 * ═══════════════════════════════════════════════════════════════
 *
 * جولة تعريفية للمستخدم الجديد بـ 5 خطوات:
 *   1. مرحباً + ما هو Spir Medical
 *   2. الخدمات الأساسية (سحب دم، تمريض، أطباء)
 *   3. العائلة والمشاركة
 *   4. الخصوصية والأمان
 *   5. ابدأ الآن
 *
 * يحفظ في localStorage بعد الإنهاء، فلا يظهر مرة أخرى.
 * ═══════════════════════════════════════════════════════════════
 */

const STORAGE_KEY = 'spir_onboarding_completed';

interface Step {
  emoji: string;
  title: string;
  description: string;
  features: { icon: React.ReactNode; label: string }[];
  color: string;
  bgGradient: string;
}

const STEPS: Step[] = [
  {
    emoji: '👋',
    title: 'مرحباً في Spir Medical',
    description: 'منصّتك الطبية الرقمية في العراق - رعاية صحية بين يديك',
    features: [
      { icon: <Sparkles size={16} />, label: '14+ خدمة طبية' },
      { icon: <Heart size={16} />, label: '18 محافظة' },
      { icon: <Bell size={16} />, label: 'دعم ٢٤/٧' },
    ],
    color: 'var(--emerald)',
    bgGradient: 'linear-gradient(135deg, var(--emerald-soft), #FFE4D4)',
  },
  {
    emoji: '💉',
    title: 'احجز الخدمات بسهولة',
    description: 'سحب دم، تمريض، استشارات طبية - كل شيء بضغطة زر من بيتك',
    features: [
      { icon: <Calendar size={16} />, label: 'احجز في دقائق' },
      { icon: <Calendar size={16} />, label: 'تذكير تلقائي' },
      { icon: <Calendar size={16} />, label: 'تتبّع مباشر' },
    ],
    color: 'var(--amber)',
    bgGradient: 'linear-gradient(135deg, var(--amber-soft), #FFE4D4)',
  },
  {
    emoji: '👨‍👩‍👧‍👦',
    title: 'اعتنِ بعائلتك',
    description: 'أضف أبناءك ووالديك. احجز خدمات وأدِر سجلاتهم الطبية كلها من حساب واحد',
    features: [
      { icon: <Users size={16} />, label: 'حتى 10 أفراد' },
      { icon: <Users size={16} />, label: 'سجلات منفصلة' },
      { icon: <Users size={16} />, label: 'تذكيرات لكل فرد' },
    ],
    color: 'var(--emerald)',
    bgGradient: 'linear-gradient(135deg, var(--emerald-soft), #E0F2EE)',
  },
  {
    emoji: '🔒',
    title: 'خصوصيتك أولويّتنا',
    description: 'بياناتك الطبية مشفّرة بأعلى المعايير. لا نشارك معلوماتك مع أي طرف ثالث',
    features: [
      { icon: <Lock size={16} />, label: 'تشفير AES-256' },
      { icon: <Lock size={16} />, label: 'متوافق مع GDPR' },
      { icon: <Lock size={16} />, label: 'تحكّم كامل' },
    ],
    color: 'var(--ink-2)',
    bgGradient: 'linear-gradient(135deg, var(--paper-3), var(--emerald-soft))',
  },
  {
    emoji: '🚀',
    title: 'هيا نبدأ!',
    description: 'حسابك جاهز. ابدأ بحجز أول خدمة أو تصفّح الأطباء',
    features: [
      { icon: <Sparkles size={16} />, label: 'مجاناً للاستخدام' },
      { icon: <Sparkles size={16} />, label: 'بدون رسوم اشتراك' },
      { icon: <Sparkles size={16} />, label: 'الدفع كاش للخدمة' },
    ],
    color: 'var(--amber)',
    bgGradient: 'linear-gradient(135deg, var(--amber-soft), var(--emerald-soft))',
  },
];

interface Props {
  /** هل يظهر دائماً (للاختبار) أم بناءً على localStorage */
  forceShow?: boolean;
  /** يُستدعى عند الإنهاء */
  onComplete?: () => void;
}

export default function OnboardingTutorial({ forceShow, onComplete }: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (forceShow) {
      setShow(true);
      return;
    }
    // اعرض فقط إذا لم يكتمل من قبل
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // تأخير صغير لتجنّب وميض عند التحميل
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ skipped: true, date: Date.now() }));
    setShow(false);
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // إنهاء
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: true, date: Date.now() }));
      setShow(false);
      onComplete?.();
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!show) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'onb-fade 0.3s ease',
      }}
    >
      <style>{`
        @keyframes onb-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes onb-slide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes onb-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <div
        style={{
          background: 'var(--white)',
          width: '100%',
          maxWidth: 440,
          borderRadius: 24,
          padding: 24,
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Skip button */}
        <button
          type="button"
          onClick={handleSkip}
          aria-label="تخطّي"
          style={{
            position: 'absolute',
            top: 14,
            insetInlineEnd: 14,
            width: 32,
            height: 32,
            background: 'var(--paper-3)',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <X size={16} />
        </button>

        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 20,
          }}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentStep ? 24 : 8,
                height: 8,
                background: i <= currentStep ? step.color : 'var(--paper-3)',
                borderRadius: 4,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div
          key={currentStep}
          style={{
            textAlign: 'center',
            animation: 'onb-slide 0.4s ease',
          }}
        >
          {/* Emoji */}
          <div
            style={{
              width: 100,
              height: 100,
              margin: '0 auto 20px',
              background: step.bgGradient,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              animation: 'onb-bounce 2.5s ease-in-out infinite',
            }}
          >
            {step.emoji}
          </div>

          {/* Title */}
          <h2
            id="onboarding-title"
            style={{
              fontSize: 22,
              fontWeight: 900,
              margin: '0 0 10px',
              color: 'var(--ink)',
            }}
          >
            {step.title}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: 13,
              color: 'var(--ink-2)',
              margin: '0 0 20px',
              lineHeight: 1.8,
              maxWidth: 320,
              marginInline: 'auto',
            }}
          >
            {step.description}
          </p>

          {/* Features */}
          <div
            style={{
              background: 'var(--paper-3)',
              borderRadius: 14,
              padding: 14,
              marginBottom: 24,
            }}
          >
            {step.features.map((feature, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                  borderBottom: i < step.features.length - 1 ? '1px solid var(--line)' : 'none',
                }}
              >
                <div style={{ color: step.color, flexShrink: 0 }}>
                  {feature.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>
                  {feature.label}
                </span>
                <Check size={14} color="var(--emerald)" style={{ marginInlineStart: 'auto' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="السابق"
              style={{
                padding: '12px 14px',
                background: 'var(--paper-3)',
                color: 'var(--ink-2)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              style={{
                padding: '12px 14px',
                background: 'var(--paper-3)',
                color: 'var(--ink-3)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              تخطّي
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            style={{
              flex: 1,
              padding: '12px 14px',
              background: step.color,
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {isLast ? (
              <>
                ابدأ الآن
                <Sparkles size={14} />
              </>
            ) : (
              <>
                التالي
                <ArrowLeft size={14} />
              </>
            )}
          </button>
        </div>

        {/* Step indicator */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 11,
            color: 'var(--ink-3)',
          }}
        >
          {currentStep + 1} من {STEPS.length}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: تحقّق هل أكمل المستخدم الـ onboarding
 */
export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  return !!localStorage.getItem(STORAGE_KEY);
}

/**
 * Helper: إعادة تشغيل الـ onboarding (من الإعدادات)
 */
export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * صفحة /onboarding لإجبار العرض من رابط
 */
export function OnboardingPage() {
  const router = useRouter();
  return (
    <OnboardingTutorial
      forceShow
      onComplete={() => router.push('/dashboard')}
    />
  );
}
