import { fireEvent, screen } from '@testing-library/react-native';

import { SortSheet } from '@/features/directory/SortSheet';

import { renderWithProviders } from './_helpers';

describe('SortSheet', () => {
  it('hides "Nearest" without a geo search', () => {
    renderWithProviders(
      <SortSheet visible value="relevance" geoEnabled={false} onSelect={() => {}} onClose={() => {}} />,
    );
    expect(screen.queryByTestId('sort-distance')).toBeNull();
    expect(screen.getByTestId('sort-relevance')).toBeTruthy();
  });

  it('shows "Nearest" on a geo search', () => {
    renderWithProviders(
      <SortSheet visible value="distance" geoEnabled onSelect={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByTestId('sort-distance')).toBeTruthy();
  });

  it('reports the chosen option', () => {
    const onSelect = jest.fn();
    renderWithProviders(
      <SortSheet visible value="relevance" geoEnabled={false} onSelect={onSelect} onClose={() => {}} />,
    );
    fireEvent.press(screen.getByTestId('sort-name'));
    expect(onSelect).toHaveBeenCalledWith('name');
  });
});
