import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';

import { AuthStatePanel } from '@/components/auth/AuthStatePanel';
import { AUTH_COPY } from '@/features/auth';
import { useThemeColors } from '@/lib/use-theme-colors';

// Session expired — a graceful, non-alarming re-auth surface (rules/auth.md §6: "on
// refresh failure, user is logged out gracefully"). Reached when a refresh fails while
// the user is on a Tier-2 surface. "Not now" returns to the (still fully usable) Tier-1
// app — never a hard wall (anonymous-first invariant).
export default function SessionExpiredScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  return (
    <AuthStatePanel
      icon={<ShieldAlert size={40} color={colors.inkSecondary} strokeWidth={1.75} />}
      title={AUTH_COPY.sessionExpiredTitle}
      body={AUTH_COPY.sessionExpiredBody}
      primary={{ label: AUTH_COPY.sessionExpiredPrimary, onPress: () => router.replace('/sign-in') }}
      secondary={{ label: AUTH_COPY.sessionExpiredSecondary, onPress: () => router.replace('/') }}
    />
  );
}
