import { fireEvent, screen } from '@testing-library/react-native';

import { CrisisView } from '@/features/crisis/CrisisView';
import type { HelplineRow } from '@/features/crisis/helpline-schema';

import { renderWithProviders } from './_helpers';

const ROWS: readonly HelplineRow[] = [
  {
    name: 'Sample Support Line',
    fiveWordDesc: 'Free confidential support, all hours',
    callNumber: '0-000-000-0001',
    textNumber: '0-000-000-0001',
    region: 'US',
  },
];

describe('CrisisView (S11)', () => {
  it('renders the verbatim lead, the emergency button, and the helpline rows', () => {
    renderWithProviders(
      <CrisisView
        regionName="United States"
        emergencyNumber="911"
        helplines={ROWS}
        onBack={() => {}}
        onChangeRegion={() => {}}
      />,
      { haptics: true },
    );
    expect(screen.getByText('Help now.')).toBeTruthy();
    expect(screen.getByText(/you deserve help right now/)).toBeTruthy();
    expect(
      screen.getByText('Free, confidential helplines are also available in most countries.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Call your local emergency number')).toBeTruthy();
    expect(screen.getByText('Sample Support Line')).toBeTruthy();
    expect(screen.getByLabelText('Call Sample Support Line')).toBeTruthy();
    expect(screen.getByLabelText('Text Sample Support Line')).toBeTruthy();
  });

  it('forms the tel: intent for the region emergency number on press', () => {
    const dial = jest.fn();
    renderWithProviders(
      <CrisisView
        regionName="United States"
        emergencyNumber="911"
        helplines={[]}
        onBack={() => {}}
        onChangeRegion={() => {}}
        dial={dial}
      />,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText('Call your local emergency number'));
    expect(dial).toHaveBeenCalledWith('tel:911');
  });

  it('forms the tel: and sms: intents for a text-capable helpline row', () => {
    const dial = jest.fn();
    renderWithProviders(
      <CrisisView
        regionName="United States"
        emergencyNumber="911"
        helplines={ROWS}
        onBack={() => {}}
        onChangeRegion={() => {}}
        dial={dial}
      />,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText('Call Sample Support Line'));
    fireEvent.press(screen.getByLabelText('Text Sample Support Line'));
    expect(dial).toHaveBeenCalledWith('tel:00000000001');
    expect(dial).toHaveBeenCalledWith('sms:00000000001');
  });

  it('shows the dataset-gap line + emergency button (no helpline intro) when empty', () => {
    renderWithProviders(
      <CrisisView
        regionName="India"
        emergencyNumber="112"
        helplines={[]}
        onBack={() => {}}
        onChangeRegion={() => {}}
      />,
      { haptics: true },
    );
    expect(screen.getByText(/We don't yet have verified helplines for India\./)).toBeTruthy();
    expect(screen.getByLabelText('Call your local emergency number')).toBeTruthy();
    expect(
      screen.queryByText('Free, confidential helplines are also available in most countries.'),
    ).toBeNull();
  });

  it('routes back and to the region picker', () => {
    const onBack = jest.fn();
    const onChangeRegion = jest.fn();
    renderWithProviders(
      <CrisisView
        regionName="India"
        emergencyNumber="112"
        helplines={[]}
        onBack={onBack}
        onChangeRegion={onChangeRegion}
      />,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText('Back'));
    fireEvent.press(screen.getByLabelText('Not in India?'));
    expect(onBack).toHaveBeenCalled();
    expect(onChangeRegion).toHaveBeenCalled();
  });

  it('omits the precise-location control by default (crisis never auto-prompts)', () => {
    renderWithProviders(
      <CrisisView
        regionName="India"
        emergencyNumber="112"
        helplines={[]}
        onBack={() => {}}
        onChangeRegion={() => {}}
      />,
      { haptics: true },
    );
    // The region override stays; the opt-in control is absent unless wired.
    expect(screen.getByLabelText('Not in India?')).toBeTruthy();
    expect(screen.queryByLabelText('Use my precise location')).toBeNull();
  });

  it('renders the opt-in precise-location control and fires it on tap when wired', () => {
    const onUsePreciseLocation = jest.fn();
    renderWithProviders(
      <CrisisView
        regionName="India"
        emergencyNumber="112"
        helplines={[]}
        onBack={() => {}}
        onChangeRegion={() => {}}
        onUsePreciseLocation={onUsePreciseLocation}
      />,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText('Use my precise location'));
    expect(onUsePreciseLocation).toHaveBeenCalled();
    // "Not in [country]?" is never removed or gated by the opt-in control.
    expect(screen.getByLabelText('Not in India?')).toBeTruthy();
  });
});
