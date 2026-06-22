import type { MomentValence } from '@psychage/shared/engagement';

import { ValenceSlider } from '@/components/moments/ValenceSlider';

// FeelingInput — the STABLE SEAM for a moment's "feeling" control. The capture flow
// codes against THIS component, never the concrete input, so the animated feelings
// visualization can replace the body here in the NEXT prompt WITHOUT touching
// MomentCaptureSheet or its callers. The contract is intentionally minimal and
// presentational: a 1..5 valence (`null` = not yet chosen) + an `onChange`. No state,
// no store, no config — just the input boundary.
//
// Today it renders the discrete ValenceSlider. Swapping that line for the animation is
// the whole of the next prompt's UI change.

export type FeelingInputProps = {
  value: MomentValence | null;
  onChange: (valence: MomentValence) => void;
};

export function FeelingInput({ value, onChange }: FeelingInputProps) {
  return <ValenceSlider value={value} onChange={onChange} />;
}
