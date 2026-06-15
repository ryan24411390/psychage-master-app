import { AlertTriangle, CloudOff } from 'lucide-react-native';

import { AuthStatePanel } from '@/components/auth/AuthStatePanel';
import { AUTH_COPY } from '@/features/auth/copy';
import { useThemeColors } from '@/lib/use-theme-colors';

// Reusable terminal auth states (brief: "Authentication Error" + "Maintenance/Auth
// Failure"). Folded into the design system as AuthStatePanel variants rather than
// standalone marketing screens — a Supabase outage and a generic auth failure are the
// same calm "try again" shape, differing only in copy/icon.

type RetryProps = { onRetry: () => void; busy?: boolean };

/** Generic auth error — something failed; offer a retry. */
export function AuthErrorState({ onRetry, busy }: RetryProps) {
  const colors = useThemeColors();
  return (
    <AuthStatePanel
      icon={<AlertTriangle size={40} color={colors.inkSecondary} strokeWidth={1.75} />}
      title={AUTH_COPY.authErrorTitle}
      body={AUTH_COPY.authErrorBody}
      primary={{ label: AUTH_COPY.authErrorPrimary, onPress: onRetry, busy }}
    />
  );
}

/** Auth backend unavailable (Supabase outage / maintenance). */
export function AuthOfflineState({ onRetry, busy }: RetryProps) {
  const colors = useThemeColors();
  return (
    <AuthStatePanel
      icon={<CloudOff size={40} color={colors.inkSecondary} strokeWidth={1.75} />}
      title={AUTH_COPY.authMaintenanceTitle}
      body={AUTH_COPY.authMaintenanceBody}
      primary={{ label: AUTH_COPY.authErrorPrimary, onPress: onRetry, busy }}
    />
  );
}
