import { render, screen } from '@testing-library/react-native';

import { MoodGlyphFace, MOOD_STATES } from '@/components/icon-system/mood';

// Slice 3a mood-scale glyph (MoodGlyphFace — the face direction Dr. Lena Dobson
// chose; the gradient direction was removed). A pure vector now wired into the
// check-in surfaces. These tests pin the contract: a glyph for every one of the
// five states, rendering without throwing. They do NOT assert pixels (that is the
// human/clinical review on app/dev-icons.tsx).

describe('mood glyph (Slice 3a)', () => {
  it('exposes the fixed five-point scale, lowest → highest', () => {
    expect(MOOD_STATES).toEqual([0, 1, 2, 3, 4]);
  });

  it('renders MoodGlyphFace for every state', () => {
    for (const state of MOOD_STATES) {
      render(<MoodGlyphFace state={state} testID={`face-${state}`} />);
      expect(screen.getByTestId(`face-${state}`)).toBeTruthy();
    }
  });

  it('accepts a caller-supplied ink color without throwing', () => {
    render(<MoodGlyphFace state={2} color="#1A9B8C" testID="face-tinted" />);
    expect(screen.getByTestId('face-tinted')).toBeTruthy();
  });
});
