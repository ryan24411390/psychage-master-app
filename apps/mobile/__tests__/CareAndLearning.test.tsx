import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import { CareAndLearning } from '@/components/home/rails/CareAndLearning';

import { renderWithProviders } from './_helpers';

// The two outward doorways at the foot of Today — each into an existing destination.
describe('CareAndLearning', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('routes the two rows to Find Care and the Library', () => {
    renderWithProviders(<CareAndLearning />);

    expect(screen.getByText('400,000+ providers from the NPI registry')).toBeTruthy();
    expect(screen.getByText('Plain answers, reviewed by clinicians')).toBeTruthy();

    fireEvent.press(screen.getByTestId('care-find'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/find');

    fireEvent.press(screen.getByTestId('care-library'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/library');
  });
});
