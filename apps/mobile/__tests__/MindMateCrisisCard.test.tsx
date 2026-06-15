import { fireEvent, screen } from '@testing-library/react-native';

import { CrisisCard } from '@/features/mindmate/components/CrisisCard';

import { renderWithProviders } from './_helpers';

describe('CrisisCard (SR-2)', () => {
  it('renders an inline tel: Call action and dials the region hotline', () => {
    const dial = jest.fn();
    renderWithProviders(
      <CrisisCard
        onGetSupport={jest.fn()}
        hotline={{ name: '988 Lifeline', callNumber: '988' }}
        dial={dial}
      />,
      { haptics: true },
    );

    const call = screen.getByTestId('mindmate-crisis-call');
    expect(call).toBeTruthy();
    fireEvent.press(call);
    expect(dial).toHaveBeenCalledWith('tel:988');
  });

  it('still routes to the full crisis surface', () => {
    const onGetSupport = jest.fn();
    renderWithProviders(
      <CrisisCard
        onGetSupport={onGetSupport}
        hotline={{ name: '988 Lifeline', callNumber: '988' }}
        dial={jest.fn()}
      />,
      { haptics: true },
    );
    fireEvent.press(screen.getByTestId('mindmate-crisis-cta'));
    expect(onGetSupport).toHaveBeenCalled();
  });

  it('omits the Call action when the region has no bundled voice hotline', () => {
    renderWithProviders(<CrisisCard onGetSupport={jest.fn()} hotline={null} />, { haptics: true });
    expect(screen.queryByTestId('mindmate-crisis-call')).toBeNull();
    // The card and the route-to-crisis CTA remain (the safety surface never depends
    // on hotline data being present).
    expect(screen.getByTestId('mindmate-crisis-card')).toBeTruthy();
    expect(screen.getByTestId('mindmate-crisis-cta')).toBeTruthy();
  });
});
