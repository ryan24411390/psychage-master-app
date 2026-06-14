import { useRouter } from 'expo-router';

import { WhyAccount } from '@/components/auth/WhyAccount';

// S33 — Why / keep-this-safe. Thin route: wires the two callbacks to navigation.
export default function WhyScreen() {
  const router = useRouter();
  return (
    <WhyAccount
      onPrimary={() => router.push('/sign-up')}
      onSecondary={() => router.back()}
    />
  );
}
