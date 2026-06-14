import { useLocalSearchParams } from 'expo-router';

import { VerifyPanel } from '@/components/auth/VerifyPanel';
import { useAuth } from '@/features/auth';

// S35 — Check your email + verification. Thin route: resend goes through the stubbed
// AuthService; the email is carried in from S34 via route params.
export default function VerifyScreen() {
  const { service } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';

  return (
    <VerifyPanel
      email={email}
      onResend={() => {
        void service.resendVerification();
      }}
    />
  );
}
