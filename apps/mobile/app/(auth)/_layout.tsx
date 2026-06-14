import { Stack } from 'expo-router';

import { AuthProvider } from '@/features/auth';

// (auth) route group — S33–S37. Auto-registered by Expo Router under the root Stack
// (no edit to app/_layout.tsx needed). Wrapped in AuthProvider so every screen reads
// auth through useAuth() (rules/auth.md §10). These screens are navigable in isolation;
// their ENTRY POINTS from settings/home are wired by the surfaces that own them.
export default function AuthLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
