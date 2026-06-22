import { fireEvent, screen } from '@testing-library/react-native';

import { SessionPrepView } from '@/components/therapist/SessionPrepView';
import { THERAPIST_COPY, windowForDays } from '@/features/therapist';

import { renderWithProviders } from './_helpers';

// The native date picker is a thin shim in tests; the preset-window paths (the ones
// asserted here) never mount it.
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: 'DateTimePicker',
}));

const c = THERAPIST_COPY.sessionPrep;
const c2 = THERAPIST_COPY.unifiedExport;

describe('SessionPrepView', () => {
  it('shows the intro, the window options, and an honest count for the live window', () => {
    const countForWindow = jest.fn(() => ({ dayCount: 30, momentCount: 5, includes: [] }));
    renderWithProviders(
      <SessionPrepView countForWindow={countForWindow} onGenerate={jest.fn()} />,
      { haptics: true },
    );

    expect(screen.getByText(c.screenIntro)).toBeTruthy();
    expect(screen.getByLabelText(c.window14)).toBeTruthy();
    expect(screen.getByLabelText(c.window30)).toBeTruthy();
    expect(screen.getByLabelText(c.windowSince)).toBeTruthy();
    // Default window resolves immediately → the count line renders.
    expect(screen.getByText('30 days, 5 moments noted')).toBeTruthy();
  });

  it('generates for the chosen window with the trimmed name', () => {
    const onGenerate = jest.fn();
    renderWithProviders(
      <SessionPrepView countForWindow={() => ({ dayCount: 30, momentCount: 5, includes: [] })} onGenerate={onGenerate} />,
      { haptics: true },
    );

    fireEvent.changeText(screen.getByLabelText(c.nameLabel), '  Alex Rivers  ');
    fireEvent.press(screen.getByLabelText(c.window30));
    fireEvent.press(screen.getByTestId('session-prep-generate'));

    const expected = windowForDays(new Date(), 30);
    expect(onGenerate).toHaveBeenCalledTimes(1);
    expect(onGenerate).toHaveBeenCalledWith('Alex Rivers', expected);
  });

  it('defaults to the 2-week window so generate works without changing the selection', () => {
    const onGenerate = jest.fn();
    renderWithProviders(
      <SessionPrepView countForWindow={() => ({ dayCount: 14, momentCount: 2, includes: [] })} onGenerate={onGenerate} />,
      { haptics: true },
    );

    fireEvent.press(screen.getByTestId('session-prep-generate'));

    const expected = windowForDays(new Date(), 14);
    expect(onGenerate).toHaveBeenCalledWith('', expected);
  });

  it('reveals the date-picker affordance only for "since a date"', () => {
    renderWithProviders(
      <SessionPrepView countForWindow={() => ({ dayCount: 0, momentCount: 0, includes: [] })} onGenerate={jest.fn()} />,
      { haptics: true },
    );

    expect(screen.queryByTestId('session-prep-since-date')).toBeNull();
    fireEvent.press(screen.getByLabelText(c.windowSince));
    expect(screen.getByTestId('session-prep-since-date')).toBeTruthy();
  });

  it('lists the other tools that ride along, when present in the window', () => {
    renderWithProviders(
      <SessionPrepView
        countForWindow={() => ({ dayCount: 30, momentCount: 3, includes: [c2.sleepTitle, c2.navigatorTitle] })}
        onGenerate={jest.fn()}
      />,
      { haptics: true },
    );

    expect(screen.getByText(`Also includes: ${c2.sleepTitle} · ${c2.navigatorTitle}`)).toBeTruthy();
  });

  it('disables generate when nothing in the window has data', () => {
    const onGenerate = jest.fn();
    renderWithProviders(
      <SessionPrepView countForWindow={() => ({ dayCount: 30, momentCount: 0, includes: [] })} onGenerate={onGenerate} />,
      { haptics: true },
    );

    expect(screen.getByText(c.nothingToExport)).toBeTruthy();
    fireEvent.press(screen.getByTestId('session-prep-generate'));
    expect(onGenerate).not.toHaveBeenCalled();
  });
});
