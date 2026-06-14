import { useRouter } from 'expo-router';
import { useState } from 'react';

import { SignUpForm } from '@/components/auth/SignUpForm';
import { AUTH_COPY, useAuth } from '@/features/auth';

// S34 — Email + password. Thin route: drives the stubbed AuthService and navigates
// to S35 (verify) on success. The REAL Supabase backend is the gated layer; this
// route's logic is unchanged when it lands (only the service impl swaps).
export default function SignUpScreen() {
  const router = useRouter();
  const { service, setSession } = useAuth();
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (email: string, password: string) => {
    setSubmitting(true);
    setFormError(undefined);
    const result = await service.signUp(email, password);
    setSubmitting(false);
    if (result.ok && result.session) {
      setSession(result.session);
      router.push({ pathname: '/verify', params: { email } });
      return;
    }
    setFormError(result.error === 'offline' ? AUTH_COPY.offlineLine : AUTH_COPY.credentialsLine);
  };

  return (
    <SignUpForm
      mode="sign-up"
      formError={formError}
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  );
}
