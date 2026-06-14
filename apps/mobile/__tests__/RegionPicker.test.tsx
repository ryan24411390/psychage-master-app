import { fireEvent, screen } from '@testing-library/react-native';

import type { RegionOption } from '@/features/crisis/helpline-schema';
import { RegionPickerView } from '@/features/crisis/RegionPickerView';

import { renderWithProviders } from './_helpers';

const REGIONS: readonly RegionOption[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'BD', name: 'Bangladesh' },
];

describe('RegionPickerView (S12)', () => {
  it('lists the regions and selects one by code', () => {
    const onSelect = jest.fn();
    renderWithProviders(
      <RegionPickerView regions={REGIONS} currentRegion="US" onSelect={onSelect} onBack={() => {}} />,
    );
    fireEvent.press(screen.getByText('Bangladesh'));
    expect(onSelect).toHaveBeenCalledWith('BD');
  });

  it('filters as you type', () => {
    renderWithProviders(
      <RegionPickerView regions={REGIONS} currentRegion="US" onSelect={() => {}} onBack={() => {}} />,
    );
    fireEvent.changeText(screen.getByLabelText('Search countries'), 'king');
    expect(screen.getByText('United Kingdom')).toBeTruthy();
    expect(screen.queryByText('Bangladesh')).toBeNull();
  });

  it('shows the no-match label when nothing matches', () => {
    renderWithProviders(
      <RegionPickerView regions={REGIONS} currentRegion="US" onSelect={() => {}} onBack={() => {}} />,
    );
    fireEvent.changeText(screen.getByLabelText('Search countries'), 'zzzz');
    expect(screen.getByText('No match')).toBeTruthy();
  });

  it('routes back', () => {
    const onBack = jest.fn();
    renderWithProviders(
      <RegionPickerView regions={REGIONS} currentRegion="US" onSelect={() => {}} onBack={onBack} />,
    );
    fireEvent.press(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalled();
  });
});
