import { screen } from '@testing-library/react-native';

import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { ScoreBand } from '@/features/sleep-architect/dashboard/ScoreBand';

import { renderWithProviders } from './_helpers';

// SR-1: the composite score reaches the UI only as one of four bands — never a
// number, gauge, or percentage bar.
describe('ScoreBand (SR-1 band-only)', () => {
  it('renders the band label + caption with no score number', () => {
    renderWithProviders(<ScoreBand band="rested" caption={CT4_SLEEP.scoreCaption} />);
    expect(screen.getByText(CT4_SLEEP.bands.rested.label)).toBeTruthy();
    expect(screen.getByText(CT4_SLEEP.scoreCaption)).toBeTruthy();
    // No 0–100 number leaks into the rendered output.
    expect(screen.queryByText(/\d/)).toBeNull();
  });

  it('renders the lowest band gently (its own copy, not an alarm)', () => {
    renderWithProviders(<ScoreBand band="low" />);
    expect(screen.getByText(CT4_SLEEP.bands.low.label)).toBeTruthy();
  });
});
