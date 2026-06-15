import type { MomentEntry, MomentInput } from '@psychage/shared/mood-journal';
import { fireEvent, screen } from '@testing-library/react-native';

// In-memory store double (the route's real store hits MMKV — convention: jest render
// tests inject a double; only getAll/addMoment are exercised by the view). `mock`-
// prefixed so jest's hoisted factory may reference them.
let mockMoments: MomentEntry[] = [];
let mockId = 0;

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
}));

jest.mock('@/lib/mood-journal-store', () => ({
  getMoodJournalStore: () => ({
    getAll: () => [...mockMoments],
    addMoment: (input: MomentInput): MomentEntry => {
      mockId += 1;
      const entry = {
        id: `m-${mockId}`,
        date: '2026-06-16',
        createdAt: `2026-06-16T0${mockId}:00:00.000Z`,
        emotions: [...input.emotions],
        triggers: [...input.triggers],
        ...(input.note ? { note: input.note } : {}),
      } as unknown as MomentEntry;
      mockMoments.push(entry);
      return entry;
    },
  }),
}));

import MoodJournalRoute from '@/app/tools/mood-journal';

import { renderWithProviders } from './_helpers';

describe('Mood Journal route', () => {
  beforeEach(() => {
    mockMoments = [];
    mockId = 0;
  });

  it('renders the crisis pill (SR-2) and the empty state with no moments', () => {
    renderWithProviders(<MoodJournalRoute />, { haptics: true });
    expect(screen.getByLabelText('Help now')).toBeOnTheScreen();
    expect(screen.getByTestId('mood-journal-empty')).toBeOnTheScreen();
  });

  it('adds a moment (emotion + trigger) and surfaces it in the patterns view', () => {
    renderWithProviders(<MoodJournalRoute />, { haptics: true });

    fireEvent.press(screen.getByTestId('mood-journal-add-cta'));
    fireEvent.press(screen.getByTestId('emotion-chip-Calm'));
    fireEvent.press(screen.getByTestId('trigger-chip-Work'));
    fireEvent.press(screen.getByTestId('mood-journal-save'));

    // Empty state gone; the pattern frequency sections now carry the noted tags.
    expect(screen.queryByTestId('mood-journal-empty')).toBeNull();
    expect(screen.getByTestId('mood-journal-emotions')).toBeOnTheScreen();
    expect(screen.getByTestId('mood-journal-triggers')).toBeOnTheScreen();
    expect(screen.getAllByText('Calm').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0);
  });

  it('keeps Save disabled until at least one tag is chosen', () => {
    renderWithProviders(<MoodJournalRoute />, { haptics: true });
    fireEvent.press(screen.getByTestId('mood-journal-add-cta'));

    // No tag yet → pressing Save does nothing (still in the sheet, no moment recorded).
    fireEvent.press(screen.getByTestId('mood-journal-save'));
    expect(mockMoments).toHaveLength(0);

    fireEvent.press(screen.getByTestId('emotion-chip-Happy'));
    fireEvent.press(screen.getByTestId('mood-journal-save'));
    expect(mockMoments).toHaveLength(1);
  });
});
