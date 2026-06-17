import type { MomentDraft } from '@psychage/shared/engagement';

import { CRISIS_ADJACENT_LABEL_KEYS, LOWEST_VALENCE } from '@/features/moments/constants';

// Acute handoff predicate (SR-2: route INTO crisis support, NEVER gate it).
//
// Pure + side-effect-free so it is unit-testable and can run BEFORE persist — the
// capture flow checks this, routes to the existing ungated crisis surface if true,
// and stamps `routedToSupport` on the moment it then saves. This is a non-diagnostic
// SERVICE-QUALITY signal, not an assessment: lowest valence co-occurring with an
// acute-risk word is a moment to surface help, not a conclusion about the person.
//
// The crisis word set + the lowest-valence floor are the clinical-review constants
// (features/moments/constants.ts), owned by Dr. Lena Dobson.

/**
 * True when a capture should route to crisis support: the valence is at its lowest
 * AND at least one chosen label is in the crisis-adjacent set. Both conditions are
 * required — a low valence alone, or an acute word at a higher valence, does not
 * route (it would over-trigger and dull the signal).
 */
export function shouldRouteToSupport(draft: Pick<MomentDraft, 'valence' | 'labels'>): boolean {
  if (draft.valence !== LOWEST_VALENCE) return false;
  const labels = draft.labels ?? [];
  return labels.some((key) => CRISIS_ADJACENT_LABEL_KEYS.has(key));
}
