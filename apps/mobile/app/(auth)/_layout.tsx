import { Stack } from 'expo-router';

// (auth) route group — S33–S37. Auto-registered by Expo Router under the root Stack.
// The AuthProvider now lives at the ROOT (app/_layout.tsx) so the whole app shares one
// hydrated session; this group no longer mounts its own (a nested provider would shadow
// the root and reintroduce the ephemeral-session bug). Screens read auth via useAuth()
// (rules/auth.md §10).
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
