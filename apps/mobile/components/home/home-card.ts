// Pure card model + priority rule for the C0.5 home card slot. Kept React-free so
// the selection logic is unit-testable under Vitest (node) — the HomeCardSlot
// component imports the types + selectHomeCard from here.

export type BridgeCard = {
  readonly kind: 'bridge';
  /** Night register swaps the exercise chip to "Night breathing · 2 min". */
  readonly register: 'day' | 'night';
  /** Very-low (state 0) appends the single Help-now sentence. */
  readonly veryLow: boolean;
};

export type ReminderCard = {
  readonly kind: 'reminder';
  // The reminder question line is not quoted in the order or the v5 source, so it
  // is caller-supplied — this slot introduces no invented copy. The production
  // string is a CT4 gap, resolved when the reminder is actually wired (post-A1).
  readonly question: string;
};

export type HomeCard = BridgeCard | ReminderCard;

/**
 * The single card to show, honoring bridge > reminder. While a bridge is present
 * it wins; once dismissed (null), the reminder may surface; otherwise nothing.
 */
export function selectHomeCard(
  bridge: BridgeCard | null,
  reminder: ReminderCard | null,
): HomeCard | null {
  return bridge ?? reminder;
}
