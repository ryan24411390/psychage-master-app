import { Stack } from 'expo-router';

import { ProviderProvider } from '@/features/therapist';

// (therapist) route group — S38–S41 (Flow 17, share-only linking). Auto-registered by
// Expo Router. ACCT-gated in production; the linked provider is held in ProviderProvider
// for the flow. Navigable in isolation; entry points (from Find/settings) are wired by
// the surfaces that own them.
export default function TherapistLayout() {
  return (
    <ProviderProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ProviderProvider>
  );
}
