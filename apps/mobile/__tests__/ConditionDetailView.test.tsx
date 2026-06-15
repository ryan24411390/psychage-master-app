import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

import { getCategoryBySlug } from '@psychage/shared/peaf';

import { ConditionDetailView } from '@/features/conditions/ConditionDetailView';
import {
  getConditionSubTopics,
  getConditionSummary,
} from '@/features/conditions/data/condition-summaries';
import { selectConditionDetail } from '@/features/conditions/select';

import { renderWithProviders } from './_helpers';

const DIAGNOSTIC_PHRASES = ['you have', 'diagnosed with', 'diagnosis confirmed'];

describe('Conditions library (topic overview)', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('shows the reviewed topic NAME verbatim from the taxonomy', () => {
    renderWithProviders(<ConditionDetailView slug="anxiety-stress" />);
    const name = getCategoryBySlug('anxiety-stress')?.name as string;
    expect(screen.getByText(name)).toBeTruthy();
  });

  it('renders the verbatim reviewed summary (B1), not authored text', () => {
    renderWithProviders(<ConditionDetailView slug="anxiety-stress" />);
    const summary = getConditionSummary('anxiety-stress') as string;
    expect(summary.length).toBeGreaterThan(0);
    expect(screen.getByTestId('condition-summary')).toBeTruthy();
    expect(screen.getByText(summary)).toBeTruthy();
  });

  it('renders the verbatim reviewed sub-topic outline (B1), not authored text', () => {
    renderWithProviders(<ConditionDetailView slug="anxiety-stress" />);
    const subTopics = getConditionSubTopics('anxiety-stress');
    expect(subTopics.length).toBeGreaterThan(0);
    expect(screen.getByTestId('condition-subtopics')).toBeTruthy();
    for (const topic of subTopics) {
      expect(screen.getByText(`•  ${topic}`)).toBeTruthy();
    }
  });

  it('routes to the real article library on browse', () => {
    renderWithProviders(<ConditionDetailView slug="anxiety-stress" />);
    fireEvent.press(screen.getByTestId('condition-browse-library'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/library');
  });

  it('renders related condition topics and navigates between them', () => {
    const detail = selectConditionDetail('anxiety-stress');
    // anxiety-stress cross-references other condition topics in the taxonomy.
    expect((detail?.related.length ?? 0)).toBeGreaterThan(0);
    renderWithProviders(<ConditionDetailView slug="anxiety-stress" />);
    const first = detail?.related[0];
    if (first) {
      fireEvent.press(screen.getByTestId(`condition-related-${first.slug}`));
      expect(router.push as jest.Mock).toHaveBeenCalledWith(`/conditions/${first.slug}`);
    }
  });

  it('keeps the crisis Help-now pill reachable (SR-2)', () => {
    renderWithProviders(<ConditionDetailView slug="anxiety-stress" />);
    expect(screen.getByLabelText('Help now')).toBeTruthy();
  });

  it('shows a safe not-found state for an unknown / non-condition slug', () => {
    renderWithProviders(<ConditionDetailView slug="not-a-real-slug" />);
    expect(screen.getByTestId('condition-not-found')).toBeTruthy();
    // Crisis stays reachable even on the fallback.
    expect(screen.getByLabelText('Help now')).toBeTruthy();
  });

  it('contains no diagnostic-claim language (SR-2)', () => {
    renderWithProviders(<ConditionDetailView slug="anxiety-stress" />);
    const tree = JSON.stringify(screen.toJSON()).toLowerCase();
    for (const phrase of DIAGNOSTIC_PHRASES) {
      expect(tree).not.toContain(phrase);
    }
  });
});
