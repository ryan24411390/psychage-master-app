import { fireEvent, screen } from '@testing-library/react-native';

import { Citations } from '@/features/mindmate/components/Citations';
import type { Citation } from '@/features/mindmate/types';

import { renderWithProviders } from './_helpers';

const CITES: Citation[] = [
  { id: 'd1', title: 'Anxiety basics', url: '/learn/anxiety' },
  { id: 'd2', title: 'Sleep and mood', url: '/learn/sleep' },
];

describe('Citations', () => {
  it('renders one chip per server-provided source, verbatim', () => {
    renderWithProviders(<Citations citations={CITES} />);
    expect(screen.getByText('Anxiety basics')).toBeTruthy();
    expect(screen.getByText('Sleep and mood')).toBeTruthy();
  });

  it('opens the source on the web origin when a chip is tapped', () => {
    const onOpen = jest.fn();
    renderWithProviders(<Citations citations={CITES} onOpen={onOpen} />);
    fireEvent.press(screen.getByTestId('mindmate-citation-d1'));
    expect(onOpen).toHaveBeenCalledWith('https://psychage.com/learn/anxiety');
  });

  it('renders nothing when there are no citations', () => {
    renderWithProviders(<Citations citations={[]} />);
    expect(screen.queryByTestId('mindmate-citations')).toBeNull();
  });
});
