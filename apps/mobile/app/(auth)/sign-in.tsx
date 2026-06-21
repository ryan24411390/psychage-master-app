import { useRouter } from 'expo-router';
import { useState } from 'react';

import { SignInForm } from '@/components/auth/SignInForm';
import { AUTH_COPY, useAuth, useSocialSignIn } from '@/features/auth';

// Sign in — email + password + social. Entry for returning users and for web users
// logging into mobile with the same Supabase account (rules/auth.md §231). On success
// the root AuthProvider already reflects the session (onAuthChange); we `replace` to
// the app root so the auth screen leaves the back stack. Errors are GENERIC — never
// leak whether an account exists (Procedure-B security checklist #3).
export default function SignInScreen() {
  const router = useRouter();
  const { service, setSession } = useAuth();
  const { onProvider, socialError, socialBusy } = useSocialSignIn();
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (email: string, password: string) => {
    setSubmitting(true);
    setFormError(undefined);
    const result = await service.signIn(email, password);
    setSubmitting(false);
    if (result.ok && result.session) {
      setSession(result.session);
      router.replace('/');
      return;
    }
    // Right password, unconfirmed account: send them to the resend/confirm screen so the
    // confirm-email round-trip is recoverable (P14) — not a dead-end credential error.
    if (result.error === 'email-not-confirmed') {
      router.push({ pathname: '/verify', params: { email } });
      return;
    }
    setFormError(result.error === 'offline' ? AUTH_COPY.offlineLine : AUTH_COPY.credentialsLine);
  };

  return (
    <SignInForm
      formError={formError ?? socialError}
      submitting={submitting || socialBusy}
      onSubmit={handleSubmit}
      onProvider={onProvider}
      onForgotPassword={() => router.push('/forgot-password')}
      onSignUp={() => router.push('/sign-up')}
    />
  );
}
