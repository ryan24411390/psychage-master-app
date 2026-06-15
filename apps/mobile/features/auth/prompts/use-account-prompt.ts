import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth';
import type { PromptKind } from './AccountPrompt';

// Controller for the just-in-time account prompt (rules/auth.md §2).
//
// GATING (both enforced here so Tier-1 features stay clean — rules/auth.md §10):
//   • Anonymous-only — never prompts a user who already has a session.
//   • One per session — at most ONE just-in-time prompt shows per app session; the
//     module flag below is the session-scoped guard (reset on next cold start).
//
// USAGE (the two V1 triggers, §2): a feature calls request('streak-save') when the streak
// ticks to 4, or request('therapist-link') on the first "Add my therapist" tap, then
// renders <AccountPrompt kind onAccept onDismiss/> while `kind` is non-null. Accept routes
// to the account flow; dismiss is always available ("Skip for now").

let promptShownThisSession = false;

/** Test/diagnostic hook — clears the one-per-session guard. */
export function resetAccountPromptSession(): void {
  promptShownThisSession = false;
}

export function useAccountPrompt() {
  const router = useRouter();
  const { session } = useAuth();
  const [kind, setKind] = useState<PromptKind | null>(null);

  // Returns true if the prompt was shown (caller may suppress its own follow-up UI).
  const request = useCallback(
    (next: PromptKind): boolean => {
      if (session) return false; // already has an account
      if (promptShownThisSession) return false; // one per session
      promptShownThisSession = true;
      setKind(next);
      return true;
    },
    [session],
  );

  const dismiss = useCallback(() => setKind(null), []);
  const accept = useCallback(() => {
    setKind(null);
    router.push('/why'); // S33 → sign-up (rules/auth.md §2 account flow entry)
  }, [router]);

  return { kind, request, dismiss, accept };
}
