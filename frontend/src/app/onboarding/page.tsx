'use client';

import { useRouter } from 'next/navigation';
import { OnboardingSlides } from '@/components/landing/OnboardingSlides';
import { usePersistedAuth } from '@/stores/authStore';

export default function OnboardingPage() {
  const router = useRouter();
  const { setHasOnboarded } = usePersistedAuth();

  const handleComplete = () => {
    setHasOnboarded();
    router.replace('/dashboard');
  };

  return <OnboardingSlides onComplete={handleComplete} />;
}
