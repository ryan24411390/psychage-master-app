import { screen } from '@testing-library/react-native';

import { MilestonesStrip } from '@/components/milestones/MilestonesStrip';
import { MILESTONES_COPY } from '@/features/milestones/copy';

import { renderWithProviders } from './_helpers';

// The strip is collectible + cumulative-only: markers light up as the total grows.
// These prove every threshold renders, reached vs upcoming is exposed via accessible
// state, and NO loss/deficit framing ever appears.

describe('MilestonesStrip', () => {
  it('renders a marker for every threshold', () => {
    renderWithProviders(<MilestonesStrip reached={[]} />);
    for (const n of [1, 10, 30, 100, 250]) {
      expect(screen.getByText(String(n))).toBeTruthy();
    }
  });

  it('marks reached vs upcoming via accessible state (neutral, future-facing)', () => {
    renderWithProviders(<MilestonesStrip reached={[1, 10]} />);
    expect(screen.getByLabelText(MILESTONES_COPY.markerReached(1))).toBeTruthy();
    expect(screen.getByLabelText(MILESTONES_COPY.markerReached(10))).toBeTruthy();
    expect(screen.getByLabelText(MILESTONES_COPY.markerUpcoming(30))).toBeTruthy();
    expect(screen.getByLabelText(MILESTONES_COPY.markerUpcoming(100))).toBeTruthy();
    expect(screen.getByLabelText(MILESTONES_COPY.markerUpcoming(250))).toBeTruthy();
  });

  it('shows the additive title + subline (count-up framing)', () => {
    renderWithProviders(<MilestonesStrip reached={[]} />);
    expect(screen.getByText(MILESTONES_COPY.title)).toBeTruthy();
    expect(screen.getByText(MILESTONES_COPY.subline)).toBeTruthy();
  });

  it('never renders streak / loss / deficit framing', () => {
    renderWithProviders(<MilestonesStrip reached={[1]} />);
    expect(
      screen.queryByText(/missed|streak|lost|locked|broke|don't break|to go|days? in a row/i),
    ).toBeNull();
  });
});
