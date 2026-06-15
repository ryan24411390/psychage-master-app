import { useRouter } from 'expo-router';

import { ConsentIntro } from '@/components/therapist/ConsentIntro';

// S38 — Why / consent intro. Thin route.
export default function ConsentScreen() {
  const router = useRouter();
  return <ConsentIntro onPrimary={() => router.push('/add-provider')} />;
}
