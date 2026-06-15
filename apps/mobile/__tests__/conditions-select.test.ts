import { describe, expect, it } from 'vitest';

import { CONTENT_CATEGORIES, getCategoryBySlug } from '@psychage/shared/peaf';

import {
  CONDITION_TOPICS,
  getConditionSubTopics,
  getConditionSummary,
} from '@/features/conditions/data/condition-summaries';
import { selectConditionCategories, selectConditionDetail } from '@/features/conditions/select';

const DIAGNOSTIC_PHRASES = ['you have', 'diagnosed with', 'diagnosis confirmed'];

// Conditions library — selection logic. These tests pin the SAFETY-critical
// invariants: the condition set is read structurally from the reviewed taxonomy
// (no editorial judgement), names pass through verbatim, and no authored
// description leaks onto the view-model.

describe('selectConditionCategories', () => {
  const selected = selectConditionCategories();

  it('returns ONLY categories the reviewed taxonomy maps to a Navigator condition', () => {
    expect(selected.length).toBeGreaterThan(0);
    for (const c of selected) {
      const source = getCategoryBySlug(c.slug);
      expect(source).toBeTruthy();
      expect(source?.navigatorConditions.length ?? 0).toBeGreaterThan(0);
    }
    // Count matches the taxonomy filter exactly — nothing added, nothing dropped.
    const expected = CONTENT_CATEGORIES.filter((c) => c.navigatorConditions.length > 0);
    expect(selected.length).toBe(expected.length);
  });

  it('excludes wellness/skills categories (empty navigatorConditions)', () => {
    const slugs = selected.map((c) => c.slug);
    expect(slugs).not.toContain('emotional-regulation');
    expect(slugs).not.toContain('habits-behavior-change');
    expect(slugs).not.toContain('spirituality-meaning');
  });

  it('includes the core condition topics', () => {
    const slugs = selected.map((c) => c.slug);
    expect(slugs).toContain('anxiety-stress');
    expect(slugs).toContain('depression-grief');
    expect(slugs).toContain('mental-health-conditions');
    expect(slugs).toContain('psychosis-schizophrenia');
    expect(slugs).toContain('trauma-healing');
  });

  it('preserves the FIXED taxonomy order (never sorted/personalized)', () => {
    const taxonomyOrder = CONTENT_CATEGORIES.filter((c) => c.navigatorConditions.length > 0).map(
      (c) => c.slug,
    );
    expect(selected.map((c) => c.slug)).toEqual(taxonomyOrder);
  });

  it('passes the name through VERBATIM and carries no authored description', () => {
    for (const c of selected) {
      const source = getCategoryBySlug(c.slug);
      expect(c.name).toBe(source?.name);
      // Only slug + name — internal architecture text (description/researchBasis/
      // platformRole) must never ride onto the user-facing view-model.
      expect(Object.keys(c).sort()).toEqual(['name', 'slug']);
    }
  });
});

describe('selectConditionDetail', () => {
  it('resolves a known condition topic with related condition topics only', () => {
    const detail = selectConditionDetail('anxiety-stress');
    expect(detail).not.toBeNull();
    expect(detail?.name).toBe(getCategoryBySlug('anxiety-stress')?.name);
    for (const rel of detail?.related ?? []) {
      expect((getCategoryBySlug(rel.slug)?.navigatorConditions.length ?? 0)).toBeGreaterThan(0);
    }
  });

  it('carries the verbatim reviewed summary + sub-topics, never authored ones', () => {
    const detail = selectConditionDetail('anxiety-stress');
    expect(detail?.summary).toBe(getConditionSummary('anxiety-stress'));
    expect(detail?.summary).toBe(CONDITION_TOPICS['anxiety-stress']?.summary);
    expect((detail?.summary?.length ?? 0)).toBeGreaterThan(0);
    expect(detail?.subTopics).toEqual(getConditionSubTopics('anxiety-stress'));
    expect((detail?.subTopics.length ?? 0)).toBeGreaterThan(0);
  });

  it('reports summary null / empty sub-topics for a slug with nothing ported', () => {
    const detail = selectConditionDetail('anxiety-stress');
    // the fields are exactly the data-module values (verbatim or null/[]) — never fabricated
    expect(detail?.summary).toBe(getConditionSummary('anxiety-stress'));
    expect(detail?.subTopics).toEqual(getConditionSubTopics('anxiety-stress'));
  });
});

describe('CONDITION_TOPICS (verbatim port integrity)', () => {
  const entries = Object.entries(CONDITION_TOPICS);

  it('is keyed only by real, condition-focused taxonomy slugs', () => {
    for (const [slug] of entries) {
      const cat = getCategoryBySlug(slug);
      expect(cat).toBeTruthy();
      expect(cat?.navigatorConditions.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('has non-empty summary + sub-topics for every entry', () => {
    for (const [, { summary, subTopics }] of entries) {
      expect(summary.trim().length).toBeGreaterThan(0);
      expect(subTopics.length).toBeGreaterThan(0);
      for (const topic of subTopics) expect(topic.trim().length).toBeGreaterThan(0);
    }
  });

  it('contains no diagnostic-claim language (SR-2) in any string', () => {
    for (const [, { summary, subTopics }] of entries) {
      for (const text of [summary, ...subTopics]) {
        const lower = text.toLowerCase();
        for (const phrase of DIAGNOSTIC_PHRASES) {
          expect(lower).not.toContain(phrase);
        }
      }
    }
  });

  it('returns null for an unknown slug', () => {
    expect(selectConditionDetail('not-a-real-slug')).toBeNull();
  });

  it('returns null for a non-condition (wellness) slug', () => {
    // emotional-regulation is a real taxonomy category but has no conditions —
    // it must not be reachable through the conditions surface.
    expect(getCategoryBySlug('emotional-regulation')).toBeTruthy();
    expect(selectConditionDetail('emotional-regulation')).toBeNull();
  });
});
