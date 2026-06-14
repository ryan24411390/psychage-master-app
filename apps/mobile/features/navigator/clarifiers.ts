// S15 clarifier questions as DATA (the order: ONE template, instantiated per
// question). Session-level (asked once, applied to every selected symptom) to keep
// the flow at 4–6 steps with one decision per screen. Option `value`s are the
// shared engine's UserDuration / UserFrequency unions, so they feed runSymptomNavigator
// directly.
//
// ⚠️ Prompts + labels are CT4 FIXTURE copy (not Flow Book verbatim) — flagged for
// clinical/content review. The TEMPLATE + the duration/frequency mapping are the build.

import type { UserDuration, UserFrequency } from '@psychage/shared/navigator';

export type ClarifierId = 'duration' | 'frequency';

export interface ClarifierOption {
  readonly label: string;
  readonly value: string;
}

export interface ClarifierQuestion {
  readonly id: ClarifierId;
  readonly prompt: string;
  readonly options: readonly ClarifierOption[];
}

// Coarse buckets → the engine's fine-grained unions (fixture mapping → CT4/clinical).
const DURATION_OPTIONS: ReadonlyArray<{ label: string; value: UserDuration }> = [
  { label: 'Today', value: 'less_than_1_week' },
  { label: 'A few days', value: '1_to_2_weeks' },
  { label: 'Weeks or more', value: 'more_than_1_year' },
];

const FREQUENCY_OPTIONS: ReadonlyArray<{ label: string; value: UserFrequency }> = [
  { label: 'Now and then', value: 'sometimes' },
  { label: 'Often', value: 'often' },
  { label: 'Most of the time', value: 'always' },
];

export const CLARIFIERS: readonly ClarifierQuestion[] = [
  { id: 'duration', prompt: 'How long has this been happening?', options: DURATION_OPTIONS },
  { id: 'frequency', prompt: 'How often does it happen?', options: FREQUENCY_OPTIONS },
];
