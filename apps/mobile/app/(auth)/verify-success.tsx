import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';

import { AuthStatePanel } from '@/components/auth/AuthStatePanel';
import { AUTH_COPY } from '@/features/auth';
import { useThemeColors } from '@/lib/use-theme-colors';

// Verification success — the landing for the email-confirmation deep-link. The deep-link
// handler exchanges the token (which signs the user in), then routes here. "Continue"
// leaves the auth stack for the app root.
export default function VerifySuccessScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  return (
    <AuthStatePanel
      icon={<CheckCircle2 size={40} color={colors.primary} strokeWidth={1.75} />}
      title={AUTH_COPY.verifySuccessTitle}
      body={AUTH_COPY.verifySuccessBody}
      primary={{ label: AUTH_COPY.verifySuccessPrimary, onPress: () => router.replace('/') }}
    />
  );
}
