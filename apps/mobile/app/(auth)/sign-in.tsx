import { useRouter } from 'expo-router';
import { useState } from 'react';

import { SignUpForm } from '@/components/auth/SignUpForm';
import { AUTH_COPY, useAuth } from '@/features/auth';

// Sign in — email + password. Mirror of S34 sign-up: drives the same AuthService and
// reuses SignUpForm in `mode="sign-in"`. This is the entry for returning users and for
// web users logging into mobile with the same Supabase account (rules/auth.md §231).
// On success the root AuthProvider already reflects the session (onAuthChange), and we
// `replace` to the app root so the auth screen leaves the back stack. Errors are GENERIC
// — never leak whether an account exists (Procedure-B security checklist #3).
export default function SignInScreen() {
  const router = useRouter();
  const { service, setSession } = useAuth();
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
    setFormError(result.error === 'offline' ? AUTH_COPY.offlineLine : AUTH_COPY.credentialsLine);
  };

  return (
    <SignUpForm mode="sign-in" formError={formError} submitting={submitting} onSubmit={handleSubmit} />
  );
}
