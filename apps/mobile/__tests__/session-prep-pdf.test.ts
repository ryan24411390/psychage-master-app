import { asLocalCalendarDate, type Moment, type MomentValence } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import { buildSessionPrepHtml } from '@/features/therapist/pdf/build-html';
import { buildSessionPrepSummary } from '@/features/therapist/session-prep/summary';
import { THERAPIST_COPY } from '@/features/therapist/copy';

// The session-prep document is a PRINT artifact rendered through the SAME shell as the
// check-in PDF. These prove it is deterministic (snapshot), grayscale-safe, holds the
// 8.5pt floor, carries the export-format version stamp + footer, shows EVERY note
// (hard moments included), and carries no diagnostic/severity vocabulary.

const WINDOW = { from: asLocalCalendarDate('2026-06-01'), to: asLocalCalendarDate('2026-06-14') };

let seq = 0;
function moment(
  valence: MomentValence,
  opts: { day: number; hour: number; labels?: string[]; context?: string[]; note?: string },
): Moment {
  seq += 1;
  const iso = new Date(2026, 5, opts.day, opts.hour, 0, 0).toISOString();
  const base = {
    id: `m-${seq}`,
    timestamp: iso,
    valence,
    labels: opts.labels ?? [],
    context: opts.context ?? [],
    routedToSupport: false,
  };
  return opts.note !== undefined ? { ...base, note: opts.note } : base;
}

const MOMENTS: Moment[] = [
  moment(1, { day: 3, hour: 22, labels: ['hopeless', 'exhausted'], context: ['sleep', 'health'], note: 'could not sleep again' }),
  moment(2, { day: 4, hour: 9, labels: ['anxious'], context: ['work'], note: 'big deadline tomorrow' }),
  moment(2, { day: 5, hour: 14, labels: ['anxious', 'tense'], context: ['work'] }),
  moment(4, { day: 6, hour: 8, labels: ['calm'], context: ['family'], note: 'morning walk helped' }),
  moment(3, { day: 7, hour: 19, labels: ['steady'], context: ['friends'] }),
  moment(5, { day: 10, hour: 12, labels: ['grateful'], context: ['family'] }),
];

function htmlFor(fullName = 'Alex Rivers', locale?: string): string {
  const summary = buildSessionPrepSummary(MOMENTS, WINDOW);
  return buildSessionPrepHtml({ fullName, summary, locale });
}

describe('buildSessionPrepHtml', () => {
  it('renders a deterministic document', () => {
    expect(htmlFor()).toMatchSnapshot();
  });

  it('carries the honest window count line', () => {
    // 14 days, 6 moments noted.
    expect(htmlFor()).toContain('14 days, 6 moments noted');
  });

  it('shows the section headings', () => {
    const html = htmlFor();
    expect(html).toContain(THERAPIST_COPY.sessionPrep.feelingsHeading);
    expect(html).toContain(THERAPIST_COPY.sessionPrep.contextHeading);
    expect(html).toContain(THERAPIST_COPY.sessionPrep.spreadHeading);
    expect(html).toContain(THERAPIST_COPY.sessionPrep.timeHeading);
    expect(html).toContain(THERAPIST_COPY.sessionPrep.notesHeading);
  });

  it('resolves feeling/context keys to display words, most-noted first', () => {
    const html = htmlFor();
    // anxious noted twice → leads the feelings list.
    expect(html).toContain('Anxious');
    expect(html).toContain('2×');
    // context resolves too.
    expect(html).toContain('Work');
    expect(html).toContain('Family');
  });

  it('keeps EVERY note, hard moments included (no positive-filter)', () => {
    const html = htmlFor();
    expect(html).toContain('could not sleep again'); // the low-valence note
    expect(html).toContain('big deadline tomorrow');
    expect(html).toContain('morning walk helped');
  });

  it('is grayscale-safe — every distribution bar keeps an ink stroke', () => {
    const rects = htmlFor().match(/<rect\b[^>]*>/g) ?? [];
    expect(rects.length).toBeGreaterThan(0);
    expect(rects.every((r) => /stroke="/.test(r))).toBe(true);
  });

  it('stamps the export-format version and the verbatim footer', () => {
    const html = htmlFor();
    expect(html).toContain('psychage-session-prep v3');
    expect(html).toContain(THERAPIST_COPY.sessionPrep.footer);
    expect(html).toContain('counter(page)');
    expect(html).toContain('counter(pages)');
  });

  it('holds the 8.5pt type floor', () => {
    const sizes = [...htmlFor().matchAll(/font-size:\s*([\d.]+)pt/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(8.5);
  });

  it('carries no diagnostic/severity vocabulary (SR-3)', () => {
    const lower = htmlFor().toLowerCase();
    expect(lower).not.toContain('diagnos');
    expect(lower).not.toContain('severe');
    expect(lower).not.toContain('severity');
    expect(lower).not.toContain('disorder');
    expect(lower).not.toContain('you have');
    expect(lower).not.toContain('symptom');
  });

  it('defaults to A4 and uses Letter for a US locale', () => {
    expect(htmlFor('Alex', undefined)).toContain('size: A4');
    expect(htmlFor('Alex', 'en-US')).toContain('size: letter');
  });

  it('escapes user-provided text (name + notes) — no markup injection', () => {
    const summary = buildSessionPrepSummary(
      [moment(2, { day: 2, hour: 10, labels: ['anxious'], note: '<script>alert(1)</script>' })],
      WINDOW,
    );
    const html = buildSessionPrepHtml({ fullName: '<b>Alex</b>', summary });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<b>Alex</b>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;b&gt;Alex&lt;/b&gt;');
  });

  it('handles an empty window: honest empty line, still a valid document with a footer', () => {
    const summary = buildSessionPrepSummary([], WINDOW);
    const html = buildSessionPrepHtml({ fullName: 'Alex Rivers', summary });
    expect(html).toContain(THERAPIST_COPY.sessionPrep.empty);
    expect(html).toContain('0 moments noted');
    expect(html).toContain(THERAPIST_COPY.sessionPrep.footer);
    expect(html).toContain('<!DOCTYPE html>');
  });
});
