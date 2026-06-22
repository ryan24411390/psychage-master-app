import type { EngagementStore, MomentDraft } from '@psychage/shared/engagement';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Mascot } from '@/components/home/Mascot';
import { MomentCaptureSheet } from '@/components/moments/MomentCaptureSheet';
import { storage } from '@/lib/adapters/storage';
import { useHaptics } from '@/lib/haptic-context';
import { recordCount } from '@/lib/persistence/milestones';

// S3 — the first Moment capture, inside onboarding. The mascot RECEDES and LISTENS: small,
// at the edge of the frame, route-auto 'listening' via /onboarding/moment — the user has
// the floor and the mascot never interferes with the act of naming. The
// shipped MomentCaptureSheet (valence → optional label → optional context → optional one
// line → save) is reused verbatim; the sheet owns its copy (MOMENTS_COPY) and runs the
// acute predicate, stamping routedToSupport on the draft.
//
// Takes the EngagementStore as a prop so render tests inject an in-memory double (the real
// store imports the shared package at runtime — see lib/moment-store). On save it mirrors
// HomeContainer's exact order: append the Moment, then — if the capture flagged it (SR-2) —
// route INTO the ungated crisis surface; otherwise advance to the acknowledgment (S4).
// Dismissing the sheet (X / backdrop) is the "look around first" exit.

export interface OnboardingMomentCaptureProps {
  readonly store: EngagementStore;
  /** Advance to S4 acknowledgment after a non-acute save. */
  readonly onNamed: () => void;
  /** Exit to the first-run home (dismiss without continuing). */
  readonly onExit: () => void;
  /** Acute handoff (SR-2): route INTO the ungated crisis surface. Injected for tests. */
  readonly navigateToCrisis?: () => void;
}

const RECEDED_WIDTH = 73; // small, edge-of-frame — the capture sheet has the focus

export function OnboardingMomentCapture({
  store,
  onNamed,
  onExit,
  navigateToCrisis = () => router.replace('/crisis'),
}: OnboardingMomentCaptureProps) {
  const { fireHaptic } = useHaptics();
  const handleSave = useCallback(
    (draft: MomentDraft) => {
      // Same order + feel as HomeContainer: persist, confirm-haptic, then the acute route
      // (never gates it). The first save should feel identical to every later one.
      store.append(draft);
      fireHaptic('confirm');
      if (draft.routedToSupport) {
        navigateToCrisis();
        return;
      }
      // Mark the cumulative milestone(s) this first capture reaches (the 1st rung)
      // SILENTLY — onboarding owns its own warm beat (S4 acknowledgment), so no
      // celebration overlay fires here; this only records reached state so the 1st
      // rung never re-fires a celebration later on home.
      recordCount(storage, store.getAll().length);
      onNamed();
    },
    [store, onNamed, navigateToCrisis, fireHaptic],
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="items-end px-5 pt-2 opacity-70">
        <Mascot testID="onboarding-moment-mascot" size={RECEDED_WIDTH} />
      </View>
      {/* The first-open "How are you right now?" prompt → source 'prompt'. */}
      <MomentCaptureSheet source="prompt" onSave={handleSave} onClose={onExit} />
    </View>
  );
}
