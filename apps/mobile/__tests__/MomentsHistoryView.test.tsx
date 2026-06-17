import type { Moment } from '@psychage/shared/engagement';
import { screen } from '@testing-library/react-native';

import { MomentsHistoryView } from '@/components/moments/MomentsHistoryView';

import { renderWithProviders } from './_helpers';

// Accumulation-only history. Pins: the "just beginning" empty tone, a growing count,
// and the engagement floor — a gap day is simply absent, never rendered as a "miss".

function moment(id: string, ts: string): Moment {
  return { id, timestamp: ts, labelPrimary: 'steady', routedToSupport: false };
}

describe('MomentsHistoryView', () => {
  it('empty: shows the just-beginning tone, no streak/shame state', () => {
    renderWithProviders(<MomentsHistoryView moments={[]} onBack={() => {}} />, { haptics: true });
    expect(screen.getByText('Your record is just beginning.')).toBeTruthy();
    expect(screen.queryByText(/streak/i)).toBeNull();
    expect(screen.queryByText(/missed/i)).toBeNull();
  });

  it('accumulates: shows a growing count and the moments, no gap/miss markers', () => {
    const now = new Date(2026, 5, 17, 12, 0, 0);
    const moments = [
      moment('a', new Date(2026, 5, 17, 9, 0, 0).toISOString()),
      moment('b', new Date(2026, 5, 17, 20, 0, 0).toISOString()),
      // a multi-day GAP to June 14 — the gap days simply do not appear (no miss state)
      moment('c', new Date(2026, 5, 14, 10, 0, 0).toISOString()),
    ];
    renderWithProviders(
      <MomentsHistoryView moments={moments} onBack={() => {}} now={now} />,
      { haptics: true },
    );
    expect(screen.getByText('3 moments so far')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
    // No shame/gap copy for the missing days between the 14th and 17th.
    expect(screen.queryByText(/missed/i)).toBeNull();
    expect(screen.queryByText(/you haven’t|don’t break/i)).toBeNull();
  });
});
