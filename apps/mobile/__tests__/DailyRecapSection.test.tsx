import { render } from '@testing-library/react-native';

import { DailyRecapSection } from '@/features/insights/DailyRecapSection';
import type { DailyEntry } from '@/lib/daily-rollup';

// Render harness (jest-expo) for the gentle "This week" recap. Asserts the descriptive
// surface — presence calendar + factual weekly line — and the SR rails: no percentage /
// score / verdict in the rendered tree. (Energy was dropped from this surface in the
// P45–P48 rebuild.)

const TODAY = () => new Date(2026, 5, 17); // 2026-06-17
const entry = (date: string): DailyEntry => ({ id: date, date, state: 2, low: 2, high: 2, count: 1 });

describe('DailyRecapSection', () => {
  it('renders the presence calendar and the factual weekly line', () => {
    const { getByTestId, getByText } = render(
      <DailyRecapSection
        testID="recap"
        now={TODAY}
        input={{ checkins: [entry('2026-06-17'), entry('2026-06-16')] }}
      />,
    );
    expect(getByTestId('recap-presence')).toBeTruthy();
    expect(getByText('You recorded on 2 of 7 days this week.')).toBeTruthy();
  });

  it('shows the gentle empty weekly line when nothing was recorded', () => {
    const { getByText } = render(
      <DailyRecapSection testID="recap" now={TODAY} input={{ checkins: [] }} />,
    );
    expect(getByText('No moments recorded this week yet.')).toBeTruthy();
  });

  it('renders no percentage / score / verdict text (SR-1)', () => {
    const { queryByText, toJSON } = render(
      <DailyRecapSection testID="recap" now={TODAY} input={{ checkins: [entry('2026-06-17')] }} />,
    );
    expect(queryByText(/%/)).toBeNull();
    expect(queryByText(/score|composite|diagnos/i)).toBeNull();
    // No literal "of 10" rating presented as a verdict anywhere in the tree.
    expect(JSON.stringify(toJSON())).not.toMatch(/of 10/);
  });
});
