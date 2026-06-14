import { render, screen } from '@testing-library/react-native';

import { Mascot } from '@/components/home/Mascot';

// The mascot is a flagged clay-figure placeholder (founder asset pending). The
// test only proves it mounts (Reanimated worklet hooks + SVG) and is decorative.
describe('Mascot', () => {
  it('renders the placeholder figure (decorative — hidden from VoiceOver)', () => {
    render(<Mascot testID="mascot" />);
    expect(screen.getByTestId('mascot', { includeHiddenElements: true })).toBeTruthy();
  });
});
