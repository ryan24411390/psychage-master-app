import { fireEvent, screen } from '@testing-library/react-native';

import { ProviderCard } from '@/features/directory/ProviderCard';
import type { ProviderCardData } from '@/features/directory/types';

import { renderWithProviders } from './_helpers';

const base: ProviderCardData = {
  id: 'p1',
  display_name: 'BRIAN SWANSON',
  credentials_suffix: 'Psy.D., J.D.',
  bio: null,
  photo_url: null,
  status: 'seeded',
  tier: 'free',
  practice_name: null,
  phone: '8189719446',
  email: null,
  website_url: null,
  appointment_url: null,
  npi_number: null,
  telehealth_available: true,
  in_person_available: false,
  is_accepting_patients: true,
  verified_at: null,
  trust_score_cached: null,
  provider_type_slug: 'psychologist',
  provider_type_label: 'Psychologist',
  primary_city: 'Reseda',
  primary_state: 'CA',
  specialty_tags: [{ slug: 'anxiety', label: 'Anxiety', category: 'condition' }],
  language_tags: [],
  competency_tags: [],
  insurance_tags: [],
};

describe('ProviderCard', () => {
  it('renders the real name, credentials and location verbatim', () => {
    renderWithProviders(<ProviderCard provider={base} onPress={() => {}} />);
    expect(screen.getByText('BRIAN SWANSON')).toBeTruthy();
    expect(screen.getByText(', Psy.D., J.D.')).toBeTruthy();
    expect(screen.getByText('Psychologist · Reseda, CA')).toBeTruthy();
    expect(screen.getByText('Telehealth')).toBeTruthy();
    expect(screen.getByText('Anxiety')).toBeTruthy();
    expect(screen.getByText('Listed')).toBeTruthy(); // seeded → "Listed", not an endorsement
  });

  it('omits absent fields without inventing them', () => {
    renderWithProviders(<ProviderCard provider={{ ...base, credentials_suffix: null }} onPress={() => {}} />);
    expect(screen.queryByText(/Psy\.D/)).toBeNull();
  });

  it('fires onPress with the provider id', () => {
    const onPress = jest.fn();
    renderWithProviders(<ProviderCard provider={base} onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('BRIAN SWANSON'));
    expect(onPress).toHaveBeenCalledWith('p1');
  });
});
