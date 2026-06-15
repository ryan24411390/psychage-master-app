import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AUTH_COPY } from './copy';
import type { SocialProvider } from './auth-service';
import { useAuth } from './use-auth';

// Shared Apple/Google handler for the screens that offer social sign-in (welcome,
// sign-in, sign-up). Drives service.signInWithProvider, then: success → set session +
// leave the auth stack; cancelled → silent (the user dismissed the sheet, no error);
// offline/failure → a friendly line the screen can surface. Errors stay GENERIC
// (Procedure-B checklist #3) — provider failures never leak account state.

export function useSocialSignIn() {
  const router = useRouter();
  const { service, setSession } = useAuth();
  const [socialError, setSocialError] = useState<string | undefined>(undefined);
  const [socialBusy, setSocialBusy] = useState(false);

  const onProvider = async (provider: SocialProvider) => {
    setSocialBusy(true);
    setSocialError(undefined);
    const result = await service.signInWithProvider(provider);
    setSocialBusy(false);
    if (result.ok && result.session) {
      setSession(result.session);
      router.replace('/');
      return;
    }
    if (result.error === 'cancelled') return; // user dismissed — not an error
    setSocialError(result.error === 'offline' ? AUTH_COPY.offlineLine : AUTH_COPY.socialFailedLine);
  };

  return { onProvider, socialError, socialBusy };
}
