import { asLocalCalendarDate, type Moment, type MomentValence } from '@psychage/shared/engagement';
import type { LocalCalendarDate as SleepCalendarDate, SleepEntry } from '@psychage/shared/sleep';
import { describe, expect, it } from 'vitest';

import { THERAPIST_COPY } from '@/features/therapist/copy';
import type { NavigatorSummaryArea } from '@/features/navigator/pdf/build-navigator-html';
import {
  buildUnifiedExportHtml,
  type UnifiedExportInput,
} from '@/features/therapist/pdf/build-unified-html';
import { buildSessionPrepSummary } from '@/features/therapist/session-prep/summary';

// The unified export is ONE document that COMPOSES the per-tool builders through the shared
// shell. These prove: only tools WITH data appear (no empty blocks); it is a SINGLE document
// (not concatenated full docs); the Navigator section stays SUMMARY-ONLY even when composed
// (no %, no raw answers — SR-1/SR-4); the header names the COMPANY + generation time and NO
// clinician; egress copy holds the 8.5pt floor and carries no diagnostic vocabulary.

const UC = THERAPIST_COPY.unifiedExport;

const FROM = asLocalCalendarDate('2026-06-01');
const TO = asLocalCalendarDate('2026-06-30');
const GENERATED = new Date(2026, 5, 22, 21, 14, 0); // Jun 22, 2026 · 9:14 PM (local)

// ── Moments fixture (mirrors session-prep-pdf.test) ─────────────────────────
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
  moment(1, { day: 3, hour: 22, labels: ['hopeless', 'exhausted'], context: ['sleep'], note: 'could not sleep again' }),
  moment(2, { day: 4, hour: 9, labels: ['anxious'], context: ['work'], note: 'big deadline tomorrow' }),
  moment(2, { day: 5, hour: 14, labels: ['anxious', 'tense'], context: ['work'] }),
  moment(4, { day: 6, hour: 8, labels: ['calm'], context: ['family'], note: 'morning walk helped' }),
  moment(3, { day: 7, hour: 19, labels: ['steady'], context: ['friends'] }),
  moment(5, { day: 10, hour: 12, labels: ['grateful'], context: ['family'] }),
];

function momentsSummary() {
  return buildSessionPrepSummary(MOMENTS, { from: FROM, to: TO });
}

// ── Sleep fixture (mirrors sleep-export-pdf.test) ───────────────────────────
function entry(date: string, over: Partial<SleepEntry> = {}): SleepEntry {
  return {
    id: `e-${date}`,
    date: date as SleepCalendarDate,
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

const SLEEP: SleepEntry[] = [
  entry('2026-06-10', { sleep_quality: 5, morning_mood: 4 }),
  entry('2026-06-11', { sleep_quality: 2, morning_mood: 3, notes: 'restless night' }),
  entry('2026-06-12', { sleep_quality: 4, morning_mood: 5 }),
  entry('2026-05-20'), // out of window — excluded
];

// ── Navigator fixture (summary-only) ────────────────────────────────────────
const NAV_AREAS: NavigatorSummaryArea[] = [
  { name: 'Depression', relevance: 'Highly Relevant' },
  { name: 'Generalized Anxiety', relevance: 'Possibly Relevant' },
];
const NAVIGATOR = { date: '2026-06-12', areas: NAV_AREAS };

function build(over: Partial<UnifiedExportInput> = {}): string {
  return buildUnifiedExportHtml({
    fullName: 'Alex Rivers',
    from: FROM,
    to: TO,
    generatedAt: GENERATED,
    moments: momentsSummary(),
    sleep: SLEEP,
    navigator: NAVIGATOR,
    ...over,
  });
}

describe('buildUnifiedExportHtml — composition', () => {
  it('is ONE document, not concatenated full docs', () => {
    const html = build();
    expect((html.match(/<!DOCTYPE html>/g) ?? []).length).toBe(1);
    expect((html.match(/<\/html>/g) ?? []).length).toBe(1);
    expect((html.match(/<body>/g) ?? []).length).toBe(1);
  });

  it('includes every tool that has data, each with its title + honest meta', () => {
    const html = build();
    expect(html).toContain(`class="tool-title">${UC.momentsTitle}<`);
    expect(html).toContain(`class="tool-title">${UC.sleepTitle}<`);
    expect(html).toContain(`class="tool-title">${UC.navigatorTitle}<`);
    expect(html).toContain('6 moments noted');
    expect(html).toContain('3 nights logged'); // 3 in-window nights (May 20 excluded)
    expect(html).toContain('Explored Jun 12, 2026');
    // The composed sections carry their real content.
    expect(html).toContain('Anxious'); // a moments feeling word
    expect(html).toContain('could not sleep again'); // a moments note, verbatim
    expect(html).toContain('Highly Relevant'); // a navigator relevance LABEL
  });
});

describe('buildUnifiedExportHtml — only tools with data', () => {
  it('omits Navigator cleanly when there is no run (no empty block)', () => {
    const html = build({ navigator: undefined });
    expect(html).toContain(`class="tool-title">${UC.momentsTitle}<`);
    expect(html).toContain(`class="tool-title">${UC.sleepTitle}<`);
    expect(html).not.toContain(`class="tool-title">${UC.navigatorTitle}<`);
    expect(html).not.toContain('Highly Relevant');
    expect(html).not.toContain('Explored ');
  });

  it('omits Sleep cleanly when no nights fall in the window', () => {
    const html = build({ sleep: [entry('2026-05-20')] }); // only an out-of-window night
    expect(html).not.toContain(`class="tool-title">${UC.sleepTitle}<`);
    expect(html).not.toContain('nights logged');
    expect(html).toContain(`class="tool-title">${UC.momentsTitle}<`);
  });

  it('renders Moments alone when it is the only tool with data', () => {
    const html = build({ sleep: undefined, navigator: undefined });
    expect(html).toContain(`class="tool-title">${UC.momentsTitle}<`);
    expect(html).not.toContain(`class="tool-title">${UC.sleepTitle}<`);
    expect(html).not.toContain(`class="tool-title">${UC.navigatorTitle}<`);
    expect(html).not.toContain('nights logged');
  });

  it('falls back to a gentle empty body when no tool has data, still a valid doc', () => {
    const html = build({ moments: undefined, sleep: undefined, navigator: undefined });
    expect(html).toContain(UC.emptyAll);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain(UC.footer);
    expect(html).not.toContain('class="tool-title"');
  });
});

describe('buildUnifiedExportHtml — Navigator stays SUMMARY-ONLY when composed (SR-1/SR-4)', () => {
  // Isolate the Navigator section (Sleep introduces a legitimate efficiency "%").
  function navOnly(): string {
    return build({ moments: undefined, sleep: undefined });
  }

  it('renders area names + relevance LABELS only', () => {
    const html = navOnly();
    expect(html).toContain('Depression');
    expect(html).toContain('Highly Relevant');
  });

  it('never emits a numeric confidence / percentage', () => {
    expect(navOnly()).not.toContain('%');
  });

  it('never emits raw per-symptom answers (severity / duration / frequency)', () => {
    // Scan the rendered CONTENT only — the print CSS legitimately uses the keyword
    // "always" (page-break-before: always), which is unrelated to symptom-answer vocab.
    const content = navOnly()
      .replace(/<style>[\s\S]*?<\/style>/, '')
      .toLowerCase();
    expect(content).not.toMatch(/\bseverity\b/);
    expect(content).not.toMatch(/\bduration\b/);
    expect(content).not.toMatch(/\bfrequency\b/);
    expect(content).not.toMatch(/\brarely\b|\bsometimes\b|\boften\b|\bconstant\b|\balways\b/);
  });
});

describe('buildUnifiedExportHtml — header / footer / framing', () => {
  it('names the company + generation date/time in the header', () => {
    const html = build();
    expect(html).toContain('Alex Rivers'); // editable name (shell header)
    expect(html).toContain(UC.companyName); // company
    expect(html).toContain('Jun 22, 2026'); // generated date
    expect(html).toContain('9:14 PM'); // generated time
    expect(html).toContain('Generated');
  });

  it('names NO clinician — no Dr. Dobson, no credential', () => {
    const html = build();
    expect(html).not.toContain('Dobson');
    expect(html).not.toContain('Ph.D.');
    expect(html).not.toContain('PhD');
  });

  it('carries the verbatim footer + the version stamp + page counter', () => {
    const html = build();
    expect(html).toContain(UC.footer);
    expect(html).toContain('psychage-unified-export v2');
    expect(html).toContain('counter(page)');
    expect(html).toContain('counter(pages)');
  });

  it('renders the branded masthead + document title (shared shell chrome)', () => {
    const html = build();
    expect(html).toContain('class="wordmark">Psychage<'); // brand masthead
    expect(html).toContain(`class="doc-title">${UC.docTitle}<`); // document title
    expect(html).toContain(`<dt>${THERAPIST_COPY.shell.metaName}</dt>`); // meta grid
  });

  it('breaks each tool onto a fresh page (first one stays put)', () => {
    const html = build();
    expect(html).toContain('page-break-before: always');
    expect(html).toContain('page-break-before: avoid');
  });

  it('holds the 8.5pt type floor across all composed sections', () => {
    const sizes = [...build().matchAll(/font-size:\s*([\d.]+)pt/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(8.5);
  });

  it('makes no diagnostic CLAIM (SR-2/SR-3)', () => {
    // The composed doc may say "not a diagnosis" (the Navigator's approved educational
    // framing), so the bar is the forbidden CLAIM phrasing, not the word "diagnosis".
    const lower = build().toLowerCase();
    expect(lower).not.toContain('you have');
    expect(lower).not.toContain('you are');
    expect(lower).not.toContain('diagnosed with');
    expect(lower).not.toContain('severity');
    expect(lower).not.toContain('disorder');
  });

  it('defaults to A4 and uses Letter for a US locale', () => {
    expect(build({ locale: undefined })).toContain('size: A4');
    expect(build({ locale: 'en-US' })).toContain('size: letter');
  });

  it('escapes user-provided name — no markup injection', () => {
    const html = build({ fullName: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
