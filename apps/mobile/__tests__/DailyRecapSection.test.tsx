import { render } from '@testing-library/react-native';

import { DailyRecapSection } from '@/features/insights/DailyRecapSection';
import type { DailyEntry } from '@/lib/daily-rollup';

// Render harness (jest-expo) for the gentle Insights recap section. Asserts the
// descriptive surface — presence calendar, factual weekly line, energy note — and the
// SR rails: no percentage / score / verdict in the rendered tree.

const TODAY = () => new Date(2026, 5, 17); // 2026-06-17
const entry = (date: string): DailyEntry => ({ id: date, date, state: 2, low: 2, high: 2, count: 1 });

describe('DailyRecapSection', () => {
  it('renders the presence calendar, factual weekly line, and energy note', () => {
    const { getByTestId, getByText } = render(
      <DailyRecapSection
        testID="recap"
        now={TODAY}
        input={{ checkins: [entry('2026-06-17'), entry('2026-06-16')], energy: [{ date: '2026-06-16', energy: 7 }] }}
      />,
    );
    expect(getByTestId('recap-presence')).toBeTruthy();
    expect(getByText('You checked in 2 of 7 days this week.')).toBeTruthy();
    expect(getByText('Energy logged on 1 day so far.')).toBeTruthy();
  });

  it('shows gentle empty copy when there is no data', () => {
    const { getByText } = render(
      <DailyRecapSection testID="recap" now={TODAY} input={{ checkins: [], energy: [] }} />,
    );
    expect(getByText('No check-ins recorded this week yet.')).toBeTruthy();
    expect(getByText('No energy logged yet — it appears here once you add it.')).toBeTruthy();
  });

  it('renders no percentage / score / verdict text (SR-1)', () => {
    const { queryByText, toJSON } = render(
      <DailyRecapSection
        testID="recap"
        now={TODAY}
        input={{ checkins: [entry('2026-06-17')], energy: [{ date: '2026-06-17', energy: 6 }] }}
      />,
    );
    expect(queryByText(/%/)).toBeNull();
    expect(queryByText(/score|composite|diagnos/i)).toBeNull();
    // No literal "of 10" rating presented as a verdict anywhere in the tree.
    expect(JSON.stringify(toJSON())).not.toMatch(/of 10/);
  });
});
