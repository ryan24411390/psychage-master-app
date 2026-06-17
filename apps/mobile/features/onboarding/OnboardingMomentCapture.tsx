import type { EngagementStore, MomentDraft } from '@psychage/shared/engagement';
import { useCallback } from 'react';
import { View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Mascot } from '@/components/home/Mascot';
import { MomentCaptureSheet } from '@/components/moments/MomentCaptureSheet';
import { MASCOT_CONTEXTUAL } from '@/features/mascot/mascot.surfaces';
import { useHaptics } from '@/lib/haptic-context';

// S3 — the first Moment capture, inside onboarding. The mascot RECEDES: small, at the edge
// of the frame ('seated', the registered capture pose) — the user has the floor while they
// NAME a feeling. The shipped MomentCaptureSheet (word-first: pick a word → optional second
// word → optional intensity → optional one line → save) is reused; the sheet owns its copy.
//
// Takes the EngagementStore as a prop so render tests inject an in-memory double (the real
// store imports the shared package at runtime — see lib/moment-store). On save it appends
// the Moment, then advances to onboarding's OWN acknowledgment screen (S4) — so the sheet's
// built-in acknowledgment is suppressed here (`acknowledge={false}`). No acute-handoff route
// is run (pending clinical decision); the SR-2 crisis pill in the header is the safety floor.
// Dismissing the sheet (X / backdrop) is the "look around first" exit.

export interface OnboardingMomentCaptureProps {
  readonly store: EngagementStore;
  /** Advance to S4 acknowledgment after a save. */
  readonly onNamed: () => void;
  /** Exit to the first-run home (dismiss without continuing). */
  readonly onExit: () => void;
}

const RECEDED_WIDTH = 56; // small, edge-of-frame — the capture sheet has the focus

export function OnboardingMomentCapture({ store, onNamed, onExit }: OnboardingMomentCaptureProps) {
  const { fireHaptic } = useHaptics();
  const handleSave = useCallback(
    (draft: MomentDraft) => {
      // Persist + confirm-haptic, then advance to onboarding's acknowledgment (S4). The
      // first save should feel identical to every later one.
      store.append(draft);
      fireHaptic('confirm');
      onNamed();
    },
    [store, onNamed, fireHaptic],
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="items-end px-5 pt-2 opacity-70">
        <Mascot testID="onboarding-moment-mascot" state={MASCOT_CONTEXTUAL.momentCapture} size={RECEDED_WIDTH} />
      </View>
      <MomentCaptureSheet onSave={handleSave} onClose={onExit} acknowledge={false} />
    </View>
  );
}
