import { asLocalCalendarDate } from '@psychage/shared/engagement';
import type { DailyEntry as CheckInEntry } from '@/lib/daily-rollup';
import { describe, expect, it } from 'vitest';

import { buildTherapistPdfHtml, type TherapistToolSummaries } from '@/features/therapist/pdf/build-html';

// Opt-in cross-tool block (2c): default share is unchanged (check-ins only); when tools
// are supplied the block renders with a DRAFT banner, numbers + areas only — no raw
// Navigator confidence (SR-1), no DV/isolation specifics.

const FROM = asLocalCalendarDate('2026-06-01');
const TO = asLocalCalendarDate('2026-06-07');
const ENTRIES: CheckInEntry[] = [{ id: 'a', date: asLocalCalendarDate('2026-06-02'), state: 2 }];

function html(tools?: TherapistToolSummaries): string {
  return buildTherapistPdfHtml({ fullName: 'Alex Rivers', from: FROM, to: TO, entries: ENTRIES, tools });
}

describe('therapist PDF — opt-in tool summaries', () => {
  it('omits the block entirely by default (consent: check-ins only)', () => {
    const out = html();
    // The provenance note / sections only appear when tools are supplied. (The
    // `.tools-block` CSS class always lives in the stylesheet, so assert on the
    // rendered note text + a section heading, not the class name.)
    expect(out).not.toContain('Additional tool summaries — self-tracked');
    expect(out).not.toContain('<section class="tool">');
  });

  it('renders a provenance note and tool sections when tools are supplied', () => {
    const out = html({
      clarity: {
        date: '2026-06-05',
        composite: 64,
        tier: 'balanced',
        domains: [{ label: 'Emotional', value: 14, max: 20 }],
      },
      navigator: { date: '2026-06-04', areas: [{ name: 'Low mood', relevance: 'Strong match' }] },
      sleep: { nights: 3, avgQuality: 3.5 },
    });
    expect(out).toContain('Additional tool summaries — self-tracked, shared for discussion.');
    expect(out).toContain('Clarity Score');
    expect(out).toContain('Composite 64/100 · balanced');
    expect(out).toContain('Emotional: 14/20');
    expect(out).toContain('Symptom Navigator');
    expect(out).toContain('Low mood — Strong match');
    expect(out).toContain('3 nights logged · Average quality 3.5/5');
  });

  it('never emits a raw percentage/confidence for Navigator areas (SR-1)', () => {
    const out = html({
      navigator: { date: '2026-06-04', areas: [{ name: 'Worry', relevance: 'Moderate match' }] },
    });
    expect(out).toContain('Worry — Moderate match');
    // No "0.xx" confidence and no "%" leaked into the Navigator area line.
    expect(out).not.toMatch(/Worry[^<]*\d+%/);
  });

  it('escapes user/content strings in tool sections', () => {
    const out = html({
      navigator: { date: '2026-06-04', areas: [{ name: '<b>x</b>', relevance: 'Low' }] },
    });
    expect(out).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
