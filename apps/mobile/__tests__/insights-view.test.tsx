import type { Moment } from '@psychage/shared/engagement';
import { render, screen } from '@testing-library/react-native';

import type { InsightsInput } from '@/features/insights/aggregate';
import { INSIGHTS_COPY } from '@/features/insights/copy';
import { InsightsView } from '@/features/insights/InsightsView';
import { HapticProvider } from '@/lib/haptic-context';

// The mascot reads the active route + loads native image assets; it is incidental to these
// assertions, so stub it. Everything else (ToolScreen chrome, svg charts, MomentRow) renders
// under jest-expo as in the other flow tests.
jest.mock('@/components/home/Mascot', () => ({ Mascot: () => null }));

const noop = () => {};
const NOW_MS = new Date(2026, 5, 17, 12, 0, 0).getTime();

function makeInput(over: Partial<InsightsInput> = {}): InsightsInput {
  return {
    checkins: [],
    clarity: [],
    navigator: [],
    relationship: [],
    moments: [],
    sleep: [],
    toolUsage: { installedAt: 0, usage: {} },
    ...over,
  };
}

const mom = (id: string, timestamp: string, valence: 1 | 2 | 3 | 4 | 5): Moment =>
  ({ id, timestamp, valence, labels: [], context: [], routedToSupport: false }) as Moment;

function renderView(input: InsightsInput) {
  return render(
    <HapticProvider>
      <InsightsView
        input={input}
        onBack={noop}
        onOpenTool={noop}
        onRecordMoment={noop}
        onOpenFullHistory={noop}
        now={() => new Date(NOW_MS)}
        nowMs={() => NOW_MS}
      />
    </HapticProvider>,
  );
}

describe('InsightsView — no data', () => {
  it('explains why there is nothing yet and how to start (not a blank screen)', () => {
    renderView(makeInput());
    expect(screen.getByTestId('insights-no-data')).toBeOnTheScreen();
    expect(screen.getByText(INSIGHTS_COPY.noData.title)).toBeOnTheScreen();
    expect(screen.getByText(INSIGHTS_COPY.noData.why)).toBeOnTheScreen();
    expect(screen.getByText(INSIGHTS_COPY.noData.cta)).toBeOnTheScreen();
    // The data surfaces are not rendered when there is nothing to show.
    expect(screen.queryByTestId('insights-history')).toBeNull();
    expect(screen.queryByTestId('insights-feelings-chart')).toBeNull();
    expect(screen.queryByTestId('insights-your-tools')).toBeNull();
  });
});

describe('InsightsView — dated history', () => {
  it('renders a dated row per recorded moment and the feelings chart', () => {
    const input = makeInput({
      moments: [
        mom('a', '2026-06-17T09:00:00.000Z', 4),
        mom('b', '2026-06-16T09:00:00.000Z', 2),
        mom('c', '2026-06-15T09:00:00.000Z', 3),
      ],
    });
    renderView(input);

    expect(screen.queryByTestId('insights-no-data')).toBeNull();
    expect(screen.getByTestId('insights-history')).toBeOnTheScreen();
    expect(screen.getByTestId('insights-history-row-0')).toBeOnTheScreen();
    expect(screen.getByTestId('insights-history-row-1')).toBeOnTheScreen();
    expect(screen.getByTestId('insights-history-row-2')).toBeOnTheScreen();
    // ≥ 2 moments ⇒ the feelings-over-time chart renders (not the "a little more" fallback).
    expect(screen.getByTestId('insights-feelings-chart')).toBeOnTheScreen();
  });
});

describe('InsightsView — Your Tools', () => {
  it('shows the 4 most-recently-used tools and omits the rest', () => {
    const input = makeInput({
      moments: [mom('a', '2026-06-17T09:00:00.000Z', 3), mom('b', '2026-06-16T09:00:00.000Z', 4)],
      toolUsage: {
        installedAt: 0,
        usage: { toolkit: 5, navigator: 4, mindmate: 3, clarity: 2, breathing: 1 },
      },
    });
    renderView(input);

    expect(screen.getByTestId('insights-your-tools')).toBeOnTheScreen();
    expect(screen.getByTestId('insights-your-tools-toolkit')).toBeOnTheScreen();
    expect(screen.getByTestId('insights-your-tools-navigator')).toBeOnTheScreen();
    expect(screen.getByTestId('insights-your-tools-mindmate')).toBeOnTheScreen();
    expect(screen.getByTestId('insights-your-tools-clarity')).toBeOnTheScreen();
    // The 5th-most-recent (breathing) is dropped by the 4-item cap.
    expect(screen.queryByTestId('insights-your-tools-breathing')).toBeNull();
  });
});
