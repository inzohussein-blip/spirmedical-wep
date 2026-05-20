'use client';

import { useRouter } from 'next/navigation';
import OnboardingTutorial from '@/components/onboarding/OnboardingTutorial';

export default function OnboardingPageRoute() {
  const router = useRouter();
  return (
    <OnboardingTutorial
      forceShow
      onComplete={() => router.push('/dashboard')}
    />
  );
}
