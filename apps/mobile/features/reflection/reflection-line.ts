import type { CheckInState } from '@psychage/shared/check-in';

// S9's ONE descriptive line — TEMPLATE-SELECTED by simple SHAPE RULES over a single
// week's states, never free-generated and never evaluative. The selector's only input
// is the multiset of that week's states, so BANNED shapes are structurally impossible:
// no cross-week comparison (it never sees another week), no causes (no day-of-week
// input), no advice, no numbers-as-judgment. The six strings are CT4 FIXTURES (final
// copy is content-reviewed); the selection logic is the build.

export type ReflectionLineKey =
  | 'every_day'
  | 'quieter_three'
  | 'mostly_steady'
  | 'more_low'
  | 'more_good'
  | 'mixed';

// FIXTURE copy → CT4.
export const REFLECTION_LINES: Record<ReflectionLineKey, string> = {
  every_day: 'Every day noted this week.',
  quieter_three: 'A quieter week — three days noted.',
  mostly_steady: 'Mostly steady this week.',
  more_low: 'More low days than not this week.',
  more_good: 'More good days than not this week.',
  mixed: 'A mixed week.',
};

/**
 * Pick the line key for a week's check-in states. Precedence (deterministic):
 *  1. all seven days noted → every_day
 *  2. exactly the three-day minimum → quieter_three
 *  3. low spread (max−min ≤ 1) → mostly_steady
 *  4. majority low (state ≤ 1) → more_low
 *  5. majority good (state ≥ 3) → more_good
 *  6. otherwise → mixed
 * (Only ever called with ≥ 3 states — reflection availability guarantees it — but a
 * 0-length input falls through to `mixed` rather than throwing on min/max.)
 */
export function selectReflectionLine(states: readonly CheckInState[]): ReflectionLineKey {
  const count = states.length;
  if (count === 0) return 'mixed';
  if (count >= 7) return 'every_day';
  if (count === 3) return 'quieter_three';

  const min = Math.min(...states);
  const max = Math.max(...states);
  if (max - min <= 1) return 'mostly_steady';

  const low = states.filter((s) => s <= 1).length;
  const good = states.filter((s) => s >= 3).length;
  if (low * 2 > count) return 'more_low';
  if (good * 2 > count) return 'more_good';
  return 'mixed';
}
