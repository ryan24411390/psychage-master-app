import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '@/features/auth';

// Foreground session revalidation (rules/auth.md §6: "When the app comes to foreground
// after >24h, force a session validity check before allowing Tier-2 actions").
//
// On returning to foreground after a long background, we re-read the session (which lets
// supabase-js attempt a token refresh). If the user HAD a session and it's now gone
// (refresh failed → graceful logout), route to the calm session-expired surface. This
// fires only on a foreground transition, never on an in-app sign-out (which happens while
// the app is already active), so it won't misfire on intentional sign-out.

const REVALIDATE_AFTER_MS = 24 * 60 * 60 * 1000; // 24h

export function useSessionRevalidation(): void {
  const router = useRouter();
  const { session, service } = useAuth();
  const hadSession = useRef(false);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    hadSession.current = session !== null;
  }, [session]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state !== 'active') {
        if (backgroundedAt.current === null) backgroundedAt.current = Date.now();
        return;
      }
      const since = backgroundedAt.current;
      backgroundedAt.current = null;
      if (since === null) return;
      if (Date.now() - since < REVALIDATE_AFTER_MS) return;
      if (!hadSession.current) return;
      void service.getSession().then((restored) => {
        if (!restored) router.replace('/session-expired');
      });
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [router, service]);
}
