import {
  asLocalCalendarDate,
  type LocalCalendarDate,
  type SleepEntry,
} from '@psychage/shared/sleep';
import { describe, expect, it } from 'vitest';

import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { buildSleepPdfHtml } from '@/features/sleep-architect/export/build-sleep-html';

// The Sleep export is a PRINT artifact rendered through the SHARED therapist shell.
// These prove it consumes that shell (8.5pt floor, page size by locale), stamps the
// company + generated date/time + every logged night, escapes user notes, surfaces
// self-ratings as WORDS (no composite score number — SR-1), and carries no diagnostic
// vocabulary.

function entry(date: string, over: Partial<SleepEntry> = {}): SleepEntry {
  return {
    id: `e-${date}`,
    date: date as LocalCalendarDate,
    created_at: `${date}T08:00:00.000Z`,
    bedtime: '23:00',
    lights_out: '23:15',
    sleep_onset_minutes: 15,
    wake_time: '07:00',
    out_of_bed_time: '07:15',
    night_wakings: 0,
    night_waking_duration_minutes: 0,
    sleep_quality: 4,
    morning_mood: 4,
    dream_recall: false,
    naps: [],
    substances: { alcohol: false, exercise: false, medication_sleep_aid: false },
    ...over,
  };
}

const FROM = asLocalCalendarDate('2026-06-01');
const TO = asLocalCalendarDate('2026-06-30');
const GENERATED = new Date(2026, 5, 22, 21, 14, 0); // Jun 22, 2026 · 9:14 PM (local)

const ENTRIES: SleepEntry[] = [
  entry('2026-06-10', { sleep_quality: 5, morning_mood: 4 }),
  entry('2026-06-11', { sleep_quality: 2, morning_mood: 3, notes: 'restless <b>night</b>' }),
  entry('2026-06-12', { sleep_quality: 4, morning_mood: 5 }),
  // Out of window — must be excluded.
  entry('2026-05-20'),
];

function htmlFor(opts: { fullName?: string; locale?: string } = {}): string {
  return buildSleepPdfHtml({
    fullName: opts.fullName ?? 'Alex Rivers',
    from: FROM,
    to: TO,
    entries: ENTRIES,
    generatedAt: GENERATED,
    ...(opts.locale ? { locale: opts.locale } : {}),
  });
}

describe('buildSleepPdfHtml', () => {
  it('stamps the company name, range and generated date/time', () => {
    const html = htmlFor();
    expect(html).toContain('Psychage'); // company (footer credential)
    expect(html).toContain('Jun 22, 2026'); // generated date
    expect(html).toContain('9:14 PM'); // generated time
    expect(html).toContain(CT4_SLEEP.export.pdfTitle);
  });

  it('renders the editable name in the document header', () => {
    expect(htmlFor({ fullName: 'Jordan Lee' })).toContain('Jordan Lee');
  });

  it('lists every night IN the window and excludes nights outside it', () => {
    const html = htmlFor();
    expect(html).toContain('Jun 10');
    expect(html).toContain('Jun 11');
    expect(html).toContain('Jun 12');
    expect(html).not.toContain('May 20'); // outside [from, to]
  });

  it('escapes user-entered notes', () => {
    const html = htmlFor();
    expect(html).toContain('restless &lt;b&gt;night&lt;/b&gt;');
    expect(html).not.toContain('restless <b>night</b>');
  });

  it('surfaces self-ratings as words, not the composite score number (SR-1)', () => {
    const html = htmlFor();
    expect(html).toContain('Very good'); // quality 5 word
    expect(html).not.toMatch(/\/\s*100/); // no x/100 composite score
    // No band verdict copy bleeds into the print artifact.
    for (const band of Object.values(CT4_SLEEP.bands)) {
      expect(html).not.toContain(band.label);
    }
  });

  it('carries no diagnostic vocabulary and avoids "normal"', () => {
    const html = htmlFor().toLowerCase();
    expect(html).not.toContain('normal');
    expect(html).not.toContain('diagnosed');
    expect(html).not.toContain('you have');
    expect(html).not.toContain('disorder');
  });

  it('consumes the shared shell — 8.5pt type floor + page size by locale', () => {
    expect(htmlFor()).toContain('8.5pt'); // shell BASE_CSS floor
    expect(htmlFor()).toContain('size: A4'); // default
    expect(htmlFor({ locale: 'en-US' })).toContain('size: letter'); // US → Letter
  });

  it('shows the empty-range copy when no nights fall in the window', () => {
    const html = buildSleepPdfHtml({
      fullName: 'Alex Rivers',
      from: asLocalCalendarDate('2026-01-01'),
      to: asLocalCalendarDate('2026-01-31'),
      entries: ENTRIES,
      generatedAt: GENERATED,
    });
    expect(html).toContain(CT4_SLEEP.export.pdfEmpty);
  });
});
