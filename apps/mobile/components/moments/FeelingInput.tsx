import type { MomentValence } from '@psychage/shared/engagement';

import { FeelingVisualization } from '@/components/moments/FeelingVisualization';

// FeelingInput — the STABLE SEAM for a moment's "feeling" control. The capture flow
// codes against THIS component, never the concrete input, so the input implementation
// can change WITHOUT touching MomentCaptureSheet or its callers. The contract is
// intentionally minimal and presentational: a 1..5 valence (`null` = not yet chosen) +
// an `onChange`. No state, no store, no config — just the input boundary.
//
// It now renders the animated FeelingVisualization (Apple "State of Mind"-style scrub
// shape; named design-doctrine exception #2). The earlier discrete ValenceSlider has
// been retired. Swapping this one line was the whole of the input change — the seam held.

export type FeelingInputProps = {
  value: MomentValence | null;
  onChange: (valence: MomentValence) => void;
};

export function FeelingInput({ value, onChange }: FeelingInputProps) {
  return <FeelingVisualization value={value} onChange={onChange} />;
}
