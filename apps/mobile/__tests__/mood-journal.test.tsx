import type { MomentEntry, MomentInput } from '@psychage/shared/mood-journal';
import { fireEvent, screen } from '@testing-library/react-native';

// In-memory store double (the route's real store hits MMKV — convention: jest render
// tests inject a double; the view exercises getAll/addMoment/deleteMoment). `mock`-
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
        ...(input.valence !== undefined ? { valence: input.valence } : {}),
        ...(input.note ? { note: input.note } : {}),
      } as unknown as MomentEntry;
      mockMoments.push(entry);
      return entry;
    },
    deleteMoment: (id: string) => {
      mockMoments = mockMoments.filter((m) => m.id !== id);
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

  it('adds a moment (emotion + trigger) through the wizard and surfaces it', () => {
    renderWithProviders(<MoodJournalRoute />, { haptics: true });

    fireEvent.press(screen.getByTestId('mood-journal-add-cta'));
    // Step 1 is the (optional) valence step; advance to the tags step.
    expect(screen.getByTestId('mood-journal-valence-step')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('mood-journal-next'));
    fireEvent.press(screen.getByTestId('emotion-chip-Calm'));
    fireEvent.press(screen.getByTestId('trigger-chip-Work'));
    fireEvent.press(screen.getByTestId('mood-journal-save'));

    // Empty state gone; insights distribution + the timeline carry the noted tags.
    expect(screen.queryByTestId('mood-journal-empty')).toBeNull();
    expect(screen.getByTestId('mood-journal-emotions')).toBeOnTheScreen();
    expect(screen.getByTestId('mood-journal-triggers')).toBeOnTheScreen();
    expect(screen.getByTestId('mood-journal-timeline')).toBeOnTheScreen();
    expect(screen.getAllByText('Calm').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0);
  });

  it('captures an optional valence and shows it on the timeline', () => {
    renderWithProviders(<MoodJournalRoute />, { haptics: true });

    fireEvent.press(screen.getByTestId('mood-journal-add-cta'));
    fireEvent.press(screen.getByTestId('valence-chip-7'));
    fireEvent.press(screen.getByTestId('mood-journal-next'));
    fireEvent.press(screen.getByTestId('emotion-chip-Calm'));
    fireEvent.press(screen.getByTestId('mood-journal-save'));

    expect(mockMoments[0]?.valence).toBe(7);
    expect(screen.getByText('Felt 7/10')).toBeOnTheScreen();
  });

  it('keeps Save disabled until at least one tag is chosen', () => {
    renderWithProviders(<MoodJournalRoute />, { haptics: true });
    fireEvent.press(screen.getByTestId('mood-journal-add-cta'));
    fireEvent.press(screen.getByTestId('mood-journal-next'));

    // No tag yet → pressing Save does nothing (no moment recorded).
    fireEvent.press(screen.getByTestId('mood-journal-save'));
    expect(mockMoments).toHaveLength(0);

    fireEvent.press(screen.getByTestId('emotion-chip-Happy'));
    fireEvent.press(screen.getByTestId('mood-journal-save'));
    expect(mockMoments).toHaveLength(1);
  });

  it('deletes a moment after a confirm step', () => {
    renderWithProviders(<MoodJournalRoute />, { haptics: true });

    fireEvent.press(screen.getByTestId('mood-journal-add-cta'));
    fireEvent.press(screen.getByTestId('mood-journal-next'));
    fireEvent.press(screen.getByTestId('emotion-chip-Calm'));
    fireEvent.press(screen.getByTestId('mood-journal-save'));
    expect(mockMoments).toHaveLength(1);

    // Trash → confirm row → confirm delete → moment gone, empty state back.
    fireEvent.press(screen.getByTestId('mood-journal-delete-m-1'));
    fireEvent.press(screen.getByTestId('mood-journal-delete-confirm-m-1'));
    expect(mockMoments).toHaveLength(0);
    expect(screen.getByTestId('mood-journal-empty')).toBeOnTheScreen();
  });
});
