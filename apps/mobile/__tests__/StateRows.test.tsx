import { fireEvent, render, screen } from '@testing-library/react-native';

import { StateRows } from '@/components/check-in/StateRows';

// C0.4 — the five-state selector. Fixed order, radio-group semantics, selection =
// border + check (the checked accessibility state is the non-color signal we
// assert), and onChange reports the chosen state.
const ORDER = ['Very low', 'Low', 'Okay', 'Good', 'Very good'];

describe('StateRows', () => {
  it('renders five radios in fixed Very low → Very good order', () => {
    render(<StateRows value={null} onChange={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    for (const label of ORDER) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('marks nothing checked when value is null', () => {
    render(<StateRows value={null} onChange={() => {}} />);
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0);
  });

  it('checks exactly the selected row and announces it', () => {
    render(<StateRows value={2} onChange={() => {}} />);
    const checked = screen.getAllByRole('radio', { checked: true });
    expect(checked).toHaveLength(1);
    expect(checked[0].props.accessibilityLabel).toBe('Okay');
  });

  it('fires onChange with the pressed state', () => {
    const onChange = jest.fn();
    render(<StateRows value={null} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Good'));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
