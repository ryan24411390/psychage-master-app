import { render, screen } from '@testing-library/react-native';

import type { BridgeCard, ReminderCard } from '@/components/home/home-card';
import { HomeCardSlot } from '@/components/home/HomeCardSlot';

// C0.5 — the home card slot rendered from fixtures. Bridge copy is verbatim v5;
// the reminder's known copy (time chip + buttons) is verbatim from the order, its
// question line caller-supplied.
const CRISIS = /people you can reach, right away/;

describe('HomeCardSlot', () => {
  it('renders nothing when there is no card', () => {
    render(<HomeCardSlot card={null} />);
    expect(screen.queryByText('Would something steadying help right now?')).toBeNull();
  });

  it('renders the bridge (day) variant without the crisis sentence', () => {
    const card: BridgeCard = { kind: 'bridge', register: 'day', veryLow: false };
    render(<HomeCardSlot card={card} />);
    expect(screen.getByText('Would something steadying help right now?')).toBeTruthy();
    expect(screen.getByText('Breathing')).toBeTruthy();
    expect(screen.getByText('· 1 min')).toBeTruthy();
    expect(screen.getByText('Not now')).toBeTruthy();
    expect(screen.queryByText(CRISIS)).toBeNull();
  });

  it('swaps the exercise chip in the night register', () => {
    const card: BridgeCard = { kind: 'bridge', register: 'night', veryLow: false };
    render(<HomeCardSlot card={card} />);
    expect(screen.getByText('Night breathing')).toBeTruthy();
    expect(screen.getByText('· 2 min')).toBeTruthy();
  });

  it('appends the single Help-now sentence for very-low', () => {
    const card: BridgeCard = { kind: 'bridge', register: 'day', veryLow: true };
    render(<HomeCardSlot card={card} />);
    expect(screen.getByText(CRISIS)).toBeTruthy();
  });

  it('renders the reminder variant with its known copy', () => {
    const card: ReminderCard = { kind: 'reminder', question: 'A gentle check-in tomorrow?' };
    render(<HomeCardSlot card={card} />);
    expect(screen.getByText('A gentle check-in tomorrow?')).toBeTruthy();
    expect(screen.getByText('9:00 PM')).toBeTruthy();
    expect(screen.getByText('Yes, remind me')).toBeTruthy();
    expect(screen.getByText('No thanks')).toBeTruthy();
  });
});
