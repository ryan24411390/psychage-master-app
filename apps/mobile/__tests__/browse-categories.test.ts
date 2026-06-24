// Tests for getCategoryGroup (pure slug→group classifier) and the
// listBrowseCategories export shape. The repo function itself is thin network
// glue (see repo.ts header) so network-layer tests are out of scope; the
// pure classifier carries all tested logic.
import { describe, expect, it } from 'vitest';

import { getCategoryGroup } from '@psychage/shared/peaf';
import { listBrowseCategories } from '@/lib/articles';

describe('getCategoryGroup', () => {
  describe('known reviewed-taxonomy slugs', () => {
    it('condition-focused slug → Conditions & Disorders', () => {
      // anxiety-stress has navigatorConditions: ['GAD', 'SOC_ANX', ...]
      expect(getCategoryGroup('anxiety-stress')).toBe('Conditions & Disorders');
      // depression-grief has navigatorConditions
      expect(getCategoryGroup('depression-grief')).toBe('Conditions & Disorders');
      // trauma-healing has navigatorConditions
      expect(getCategoryGroup('trauma-healing')).toBe('Conditions & Disorders');
      // psychosis-schizophrenia has navigatorConditions
      expect(getCategoryGroup('psychosis-schizophrenia')).toBe('Conditions & Disorders');
    });

    it('wellness slug → Behavior & Wellness', () => {
      // emotional-regulation has navigatorConditions: []
      expect(getCategoryGroup('emotional-regulation')).toBe('Behavior & Wellness');
      // digital-life has navigatorConditions: []
      expect(getCategoryGroup('digital-life')).toBe('Behavior & Wellness');
      // habits-behavior-change has navigatorConditions: []
      expect(getCategoryGroup('habits-behavior-change')).toBe('Behavior & Wellness');
      // spirituality-meaning has navigatorConditions: []
      expect(getCategoryGroup('spirituality-meaning')).toBe('Behavior & Wellness');
    });
  });

  describe('orphan slugs absent from reviewed taxonomy', () => {
    it('explicit clinical orphan slugs → Conditions & Disorders', () => {
      expect(getCategoryGroup('eating-body')).toBe('Conditions & Disorders');
      expect(getCategoryGroup('substance-addiction')).toBe('Conditions & Disorders');
      expect(getCategoryGroup('ocd-related')).toBe('Conditions & Disorders');
      expect(getCategoryGroup('neurodivergence-adhd-autism')).toBe('Conditions & Disorders');
      expect(getCategoryGroup('trauma-ptsd')).toBe('Conditions & Disorders');
      expect(getCategoryGroup('neurodevelopmental')).toBe('Conditions & Disorders');
      expect(getCategoryGroup('children-adolescents')).toBe('Conditions & Disorders');
    });

    it('orphan slug matching clinical keyword pattern → Conditions & Disorders', () => {
      expect(getCategoryGroup('bipolar-disorder')).toBe('Conditions & Disorders');
      expect(getCategoryGroup('personality-disorders')).toBe('Conditions & Disorders');
      expect(getCategoryGroup('eating-disorders')).toBe('Conditions & Disorders');
    });

    it('unknown orphan slug without clinical pattern → Life & Society', () => {
      expect(getCategoryGroup('some-wellness-topic')).toBe('Life & Society');
      expect(getCategoryGroup('community-belonging')).toBe('Life & Society');
    });
  });
});

describe('listBrowseCategories export', () => {
  it('is exported and callable, returns a Promise', () => {
    // No real DB connection in test env — getSupabaseClient() returns null,
    // listPopulatedCategories returns [], listBrowseCategories returns [].
    // This confirms the export exists and the function is structurally sound.
    const result = listBrowseCategories();
    expect(result).toBeInstanceOf(Promise);
    return result.then((cats) => {
      expect(Array.isArray(cats)).toBe(true);
    });
  });
});
