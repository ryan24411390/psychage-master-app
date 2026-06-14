import { describe, expect, it } from 'vitest';

import {
  type BridgeCard,
  type ReminderCard,
  selectHomeCard,
} from '@/components/home/home-card';

// C0.5 priority rule (Vitest logic) — bridge > reminder, ONE card max.
const bridge: BridgeCard = { kind: 'bridge', register: 'day', veryLow: false };
const reminder: ReminderCard = { kind: 'reminder', question: 'x' };

describe('selectHomeCard', () => {
  it('prefers the bridge when both are present', () => {
    expect(selectHomeCard(bridge, reminder)).toBe(bridge);
  });

  it('shows the reminder only once the bridge is dismissed (null)', () => {
    expect(selectHomeCard(null, reminder)).toBe(reminder);
  });

  it('shows nothing when neither is present', () => {
    expect(selectHomeCard(null, null)).toBeNull();
  });
});
