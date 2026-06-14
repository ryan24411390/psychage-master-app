import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { SettingsRadioRow } from '@/components/settings/SettingsRadioRow';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'night', label: 'Night' },
  { value: 'system', label: 'Match system' },
] as const;

function Harness({ initial = 'system' as 'light' | 'night' | 'system' }) {
  const [value, setValue] = useState<'light' | 'night' | 'system'>(initial);
  return (
    <SettingsRadioRow
      groupLabel="Appearance"
      options={OPTIONS}
      value={value}
      onChange={setValue}
    />
  );
}

describe('SettingsRadioRow (C-RADIO grammar)', () => {
  it('renders a radiogroup with exactly one checked option, announced', () => {
    render(<Harness initial="night" />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    const checked = screen.getAllByRole('radio', { checked: true });
    expect(checked).toHaveLength(1);
    expect(checked[0].props.accessibilityLabel).toBe('Night');
  });

  it('marks selection with charcoal, never teal/primary', () => {
    render(<Harness initial="light" />);
    // The selection treatment uses borderStrong (charcoal.500), NOT border-primary
    // (the register-neutral rule — settings marks are charcoal, never brand teal).
    const checked = screen.getAllByRole('radio', { checked: true })[0];
    expect(checked.props.className).toContain('border-charcoal-500');
    expect(checked.props.className).not.toContain('border-primary');
  });

  it('moves selection on press', () => {
    render(<Harness initial="system" />);
    fireEvent.press(screen.getByLabelText('Light'));
    const checked = screen.getAllByRole('radio', { checked: true });
    expect(checked).toHaveLength(1);
    expect(checked[0].props.accessibilityLabel).toBe('Light');
  });
});
