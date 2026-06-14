import { screen } from '@testing-library/react-native';

import type { HomeViewModel } from '@/lib/home-model';
import { READS, toTerrainDays } from '@/lib/home-model';

import { HomeView } from '@/components/home/HomeView';

import { renderWithProviders } from './_helpers';

const TODAY = new Date(2026, 5, 14);

const REGULAR: HomeViewModel = {
  greeting: 'Good evening',
  status: 'Not yet checked in today · Yesterday: Good.',
  recordLabel: 'Your last 7 days',
  terrainDays: toTerrainDays([3, 2, 1, null, 2, 3, 'today'], TODAY),
  read: READS.day,
  ctaLabel: 'Check in — 30 seconds',
  card: null,
};

const FIRST_RUN: HomeViewModel = {
  greeting: 'Welcome',
  status: 'This is your space. It starts whenever you’re ready.',
  recordLabel: 'Your record',
  terrainDays: toTerrainDays([null, null, null, null, null, null, 'today'], TODAY),
  read: READS.day,
  ctaLabel: 'Check in — 30 seconds',
  card: null,
};

function render(model: HomeViewModel) {
  return renderWithProviders(
    <HomeView model={model} onCheckIn={() => {}} onHistory={() => {}} />,
    { haptics: true },
  );
}

describe('HomeView (S3)', () => {
  it('renders the regular state anatomy top-to-bottom', () => {
    render(REGULAR);
    expect(screen.getByText('Good evening')).toBeTruthy();
    expect(screen.getByText('Not yet checked in today · Yesterday: Good.')).toBeTruthy();
    expect(screen.getByText('Your last 7 days')).toBeTruthy();
    expect(screen.getByText('History')).toBeTruthy();
    expect(screen.getByText('Check in — 30 seconds')).toBeTruthy();
    expect(screen.getByText('When you need something now')).toBeTruthy();
    expect(screen.getByText('Steady yourself right now')).toBeTruthy();
    expect(screen.getByText('Make sense of what you feel')).toBeTruthy();
    expect(screen.getByText('Care and learning')).toBeTruthy();
    expect(screen.getByText('Why your chest gets tight when you worry')).toBeTruthy();
    expect(screen.getByText('Free for everyone · 5 languages · No ads')).toBeTruthy();
  });

  it('renders the first-run state', () => {
    render(FIRST_RUN);
    expect(screen.getByText('Welcome')).toBeTruthy();
    expect(screen.getByText('This is your space. It starts whenever you’re ready.')).toBeTruthy();
    expect(screen.getByText('Your record')).toBeTruthy();
  });
});
