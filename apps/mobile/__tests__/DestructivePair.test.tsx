import { fireEvent, screen } from '@testing-library/react-native';

import { DestructivePair } from '@/components/settings/DestructivePair';

import { renderWithProviders } from './_helpers';

function renderPair(onDestruct = () => {}, onKeep = () => {}) {
  return renderWithProviders(
    <DestructivePair
      destructLabel="Delete my record"
      keepLabel="Keep my account"
      onDestruct={onDestruct}
      onKeep={onKeep}
    />,
    { haptics: true },
  );
}

describe('DestructivePair (geometric sibling rule)', () => {
  it('renders both buttons at identical 54px height', () => {
    renderPair();
    expect(screen.getByTestId('destructive-action').props.className).toContain('min-h-[54px]');
    expect(screen.getByTestId('destructive-keep').props.className).toContain('min-h-[54px]');
  });

  it('destructive is a rust OUTLINE never filled; keep is borderStrong, not a ghost or smaller', () => {
    renderPair();
    const destruct = screen.getByTestId('destructive-action');
    expect(destruct.props.className).toContain('border-error');
    expect(destruct.props.className).not.toContain('bg-error'); // outline, never a fill

    const keep = screen.getByTestId('destructive-keep');
    expect(keep.props.className).toContain('border-charcoal-500'); // borderStrong, not a ghost
    expect(keep.props.className).toContain('border-2'); // same weight/size as destruct
    expect(keep.props.className).toContain('min-h-[54px]');
  });

  it('fires both callbacks', () => {
    const onDestruct = jest.fn();
    const onKeep = jest.fn();
    renderPair(onDestruct, onKeep);
    fireEvent.press(screen.getByTestId('destructive-action'));
    fireEvent.press(screen.getByTestId('destructive-keep'));
    expect(onDestruct).toHaveBeenCalledTimes(1);
    expect(onKeep).toHaveBeenCalledTimes(1);
  });
});
