'use client';

import dynamic from 'next/dynamic';

const OnboardingTutorial = dynamic(
  () => import('@/components/onboarding/OnboardingTutorial'),
  { ssr: false }
);

/**
 * Wrapper component يعرض الـ onboarding تلقائياً
 * للمستخدمين الجدد (بناءً على localStorage)
 *
 * يُضاف في dashboard/page.tsx
 */
export default function OnboardingTrigger() {
  return <OnboardingTutorial />;
}
