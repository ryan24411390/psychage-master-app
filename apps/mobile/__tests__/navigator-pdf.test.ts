import { describe, expect, it } from 'vitest';

import { NAVIGATOR_COPY } from '@/features/navigator/copy';
import {
  buildNavigatorSummaryHtml,
  type NavigatorSummaryArea,
} from '@/features/navigator/pdf/build-navigator-html';

// SR-4 / SR-1: the Navigator summary PDF is SUMMARY-ONLY. It renders area names + their
// relevance LABELS and nothing else — no raw answers (severity / duration / frequency),
// no symptom list, no numeric confidence / "%".

const AREAS: NavigatorSummaryArea[] = [
  { name: 'Depression', relevance: 'Highly Relevant' },
  { name: 'Generalized Anxiety', relevance: 'Possibly Relevant' },
];

function build(areas: NavigatorSummaryArea[] = AREAS): string {
  return buildNavigatorSummaryHtml({ fullName: 'Alex Rivera', date: '2026-06-22', areas });
}

describe('buildNavigatorSummaryHtml (summary-only therapist hand-off)', () => {
  it('renders the title, the areas, and their relevance LABELS', () => {
    const html = build();
    expect(html).toContain('Alex Rivera');
    expect(html).toContain('Depression');
    expect(html).toContain('Generalized Anxiety');
    expect(html).toContain('Highly Relevant');
    expect(html).toContain('Possibly Relevant');
  });

  it('includes the educational lead + "things to know" (no diagnostic framing)', () => {
    const html = build();
    expect(html).toContain(NAVIGATOR_COPY.summaryLead);
    expect(html).toContain(NAVIGATOR_COPY.thingsToKnowTitle);
    for (const item of NAVIGATOR_COPY.thingsToKnow) {
      expect(html).toContain(item);
    }
  });

  it('SR-1: never emits a numeric confidence / percentage', () => {
    expect(build()).not.toContain('%');
  });

  it('SR-4: never emits raw per-symptom answers (severity / duration / frequency)', () => {
    const html = build().toLowerCase();
    expect(html).not.toMatch(/\bseverity\b/);
    expect(html).not.toMatch(/\bduration\b/);
    expect(html).not.toMatch(/\bfrequency\b/);
    // Frequency answer vocabulary must not leak either.
    expect(html).not.toMatch(/\brarely\b|\bsometimes\b|\boften\b|\bconstant\b|\balways\b/);
  });

  it('SR-3: no diagnostic claims in the document copy', () => {
    const html = build().toLowerCase();
    expect(html).not.toContain('you have');
    expect(html).not.toContain('you are');
    expect(html).not.toContain('diagnosed with');
  });

  it('renders a gentle empty state when no areas surfaced', () => {
    const html = build([]);
    expect(html).toContain(NAVIGATOR_COPY.summaryEmptyAreas);
    expect(html).not.toContain('%');
  });

  it('escapes user-supplied names (no HTML injection)', () => {
    const html = buildNavigatorSummaryHtml({
      fullName: '<script>x</script>',
      date: '2026-06-22',
      areas: AREAS,
    });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
