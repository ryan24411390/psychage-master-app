import { fireEvent, screen } from '@testing-library/react-native';

import RemindersScreen from '@/app/settings/reminders';
import { storage } from '@/lib/adapters/storage';
import { loadReminderSettings } from '@/lib/persistence/reminder-settings';

import { renderWithProviders } from './_helpers';

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: 'DateTimePicker',
}));

describe('S43 Reminders', () => {
  beforeEach(() => {
    storage.remove('mobile:reminder-settings');
  });

  it('turning the reminder on shows the verbatim confirmation', () => {
    renderWithProviders(<RemindersScreen />);
    fireEvent(screen.getByTestId('reminder-enabled-toggle'), 'valueChange', true);
    expect(screen.getByText('Set. 9:00 PM, changeable in Settings.')).toBeTruthy();
    expect(loadReminderSettings(storage).enabled).toBe(true);
  });

  it('"Never" sets neverAsked permanently and shows the verbatim line', () => {
    renderWithProviders(<RemindersScreen />);
    fireEvent.press(screen.getByTestId('reminder-never'));
    expect(screen.getByTestId('reminder-never-confirmation')).toBeTruthy();
    expect(
      screen.getByText('Okay — reminders stay off. You can turn them on any time in Settings.'),
    ).toBeTruthy();
    expect(loadReminderSettings(storage).neverAsked).toBe(true);
    // The prompt is gone — Never is permanent, the app does not re-ask.
    expect(screen.queryByTestId('reminder-never')).toBeNull();
    expect(screen.queryByTestId('reminder-not-now')).toBeNull();
  });
});
