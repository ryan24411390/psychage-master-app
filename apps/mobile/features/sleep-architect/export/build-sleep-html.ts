import {
  calculateMetrics,
  formatDuration,
  type LocalCalendarDate,
  type SleepEntry,
} from '@psychage/shared/sleep';

import { resolveColorRef } from '@/lib/a1-tokens';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import {
  escapeHtml,
  formatRangeLabel,
  pageSizeForLocale,
  renderDocument,
} from '@/features/therapist/pdf/build-html';

// Sleep export — the P59 PDF. A PRINT artifact, NOT an app screen: it CONSUMES the
// shared therapist print shell (renderDocument + helpers) rather than forking it, so
// the page language (white page, ink palette, 8.5pt floor, Fraunces name, per-page
// counter, fixed footer) is identical across documents. Pure string builder →
// Vitest-testable; the native render (expo-print) is wired only in the route.
//
// Factual + non-diagnostic BY CONSTRUCTION: averages are the person's own measured
// nights and self-ratings; the composite sleep SCORE is never shown (SR-1 — no number,
// no band in print). Grayscale-safe: it is a plain text table, no colour encoding. No
// clinical vocabulary; "common" not "normal"; no emoji. Generated locally; the person
// shares it themselves via the OS sheet (SR-4).

const c = CT4_SLEEP.export;

export interface SleepPdfInput {
  /** Editable full name — the provider files the summary by it. */
  readonly fullName: string;
  readonly from: LocalCalendarDate;
  readonly to: LocalCalendarDate;
  /** All logged nights (the builder filters to [from, to]). */
  readonly entries: readonly SleepEntry[];
  /** When the document was generated — passed in so the builder stays deterministic. */
  readonly generatedAt: Date;
  /** BCP-47 locale — drives A4 (default) vs Letter. */
  readonly locale?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function parseDate(date: LocalCalendarDate): Date {
  const [y, m, d] = (date as string).split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function formatNightDate(date: LocalCalendarDate): string {
  const d = parseDate(date);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function formatClock(d: Date): string {
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const hour24 = d.getHours();
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatStamp(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${formatClock(d)}`;
}

function avg(nums: readonly number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function ratingWord(value: number): string {
  // 1–5 self-rating → the same words the diary uses. Clamp defensively.
  const i = Math.min(5, Math.max(1, Math.round(value))) - 1;
  return CT4_SLEEP.ratingScale[i] ?? CT4_SLEEP.ratingScale[2];
}

// One definition row in the "typical" block (label + factual value).
function statRow(label: string, value: string): string {
  return `<tr><td class="stat-label">${escapeHtml(label)}</td><td class="stat-value">${escapeHtml(value)}</td></tr>`;
}

function buildAverages(entries: readonly SleepEntry[]): string {
  const metrics = entries.map(calculateMetrics);
  const avgDuration = avg(metrics.map((m) => m.total_sleep_minutes));
  const avgEfficiency = avg(metrics.map((m) => m.sleep_efficiency));
  const avgLatency = avg(metrics.map((m) => m.sleep_latency_minutes));
  const avgQuality = avg(entries.map((e) => e.sleep_quality));
  const avgMood = avg(entries.map((e) => e.morning_mood));

  const rows = [
    statRow(c.pdfAvgLength, formatDuration(Math.round(avgDuration))),
    statRow(c.pdfAvgEfficiency, `${Math.round(avgEfficiency)}%`),
    statRow(c.pdfAvgLatency, `${Math.round(avgLatency)} min`),
    statRow(c.pdfAvgQuality, `${avgQuality.toFixed(1)} / 5`),
    statRow(c.pdfAvgMood, `${avgMood.toFixed(1)} / 5`),
  ].join('');

  return `  <section class="block"><h2>${escapeHtml(c.pdfAveragesHeading)}</h2>` +
    `<table class="stats"><tbody>${rows}</tbody></table></section>`;
}

function buildNightRows(entries: readonly SleepEntry[]): string {
  return entries
    .map((e) => {
      const m = calculateMetrics(e);
      const inBed = `${escapeHtml(e.bedtime)} → ${escapeHtml(e.out_of_bed_time)}`;
      const length = formatDuration(m.total_sleep_minutes);
      const note = e.notes ? escapeHtml(e.notes) : '';
      return (
        `<tr><td class="date">${formatNightDate(e.date)}</td>` +
        `<td class="inbed">${inBed}</td>` +
        `<td class="len">${escapeHtml(length)}</td>` +
        `<td class="rated">${escapeHtml(ratingWord(e.sleep_quality))}</td>` +
        `<td class="rated">${escapeHtml(ratingWord(e.morning_mood))}</td>` +
        `<td class="note">${note}</td></tr>`
      );
    })
    .join('');
}

// Print inks — light register only (the page is always white), token-resolved to match
// the shared therapist PDF's ink palette rather than hardcoding greys.
const INK_RULE = resolveColorRef('color.charcoal.500').light; // header underline
const INK_BORDER = resolveColorRef('color.charcoal.300').light; // row separators
const INK_MUTED = resolveColorRef('color.text.secondary').light; // labels / dates

const SLEEP_EXTRA_CSS = `  .block { margin: 0 0 20px; page-break-inside: avoid; }
  .block h2 { font-size: 12pt; font-weight: 600; margin: 0 0 6px; }
  table { width: 100%; border-collapse: collapse; }
  table.stats td { padding: 5px 8px; border-bottom: 1px solid ${INK_BORDER}; font-size: 10.5pt; }
  td.stat-label { color: ${INK_MUTED}; width: 60%; }
  td.stat-value { text-align: right; font-variant-numeric: tabular-nums; }
  table.nights th { text-align: left; font-size: 9pt; font-weight: 600; color: ${INK_MUTED}; padding: 4px 6px; border-bottom: 1px solid ${INK_RULE}; }
  table.nights td { padding: 5px 6px; vertical-align: top; border-bottom: 1px solid ${INK_BORDER}; font-size: 9.5pt; }
  td.date { white-space: nowrap; color: ${INK_MUTED}; }
  td.inbed { white-space: nowrap; font-variant-numeric: tabular-nums; }
  td.len { white-space: nowrap; font-variant-numeric: tabular-nums; }
  td.note { font-style: italic; }
  .empty { font-size: 10.5pt; color: ${INK_MUTED}; margin: 0; }`;

export function buildSleepPdfHtml(input: SleepPdfInput): string {
  const { from, to } = input;
  const inRange = input.entries
    .filter((e) => e.date >= from && e.date <= to)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const nights = inRange.length;
  const stamp = formatStamp(input.generatedAt);

  let body: string;
  if (nights === 0) {
    body = `  <p class="empty">${escapeHtml(c.pdfEmpty)}</p>`;
  } else {
    const header = `<tr><th>${escapeHtml(c.pdfColDate)}</th><th>${escapeHtml(c.pdfColInBed)}</th>` +
      `<th>${escapeHtml(c.pdfColLength)}</th><th>${escapeHtml(c.pdfColRested)}</th>` +
      `<th>${escapeHtml(c.pdfColMood)}</th><th>${escapeHtml(c.pdfColNotes)}</th></tr>`;
    body =
      buildAverages(inRange) +
      `\n  <section class="block"><h2>${escapeHtml(c.pdfNightsHeading)}</h2>` +
      `<table class="nights"><thead>${header}</thead><tbody>${buildNightRows(inRange)}</tbody></table></section>`;
  }

  return renderDocument({
    pageSize: pageSizeForLocale(input.locale),
    extraCss: SLEEP_EXTRA_CSS,
    name: input.fullName.trim(),
    rangeLine: `${c.pdfTitle} · ${formatRangeLabel(from, to)} · ${c.pdfNightsLine(nights)} · ${c.pdfGenerated(stamp)}`,
    body,
    footer: c.pdfFooter,
  });
}
