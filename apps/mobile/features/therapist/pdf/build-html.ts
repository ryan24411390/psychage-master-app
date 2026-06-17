import {
  asLocalCalendarDate,
  type CheckInEntry,
  type CheckInState,
  type LocalCalendarDate,
  toLocalCalendarDate,
} from '@psychage/shared/check-in';

import { resolveColorRef, terrainTokens } from '@/lib/a1-tokens';
import { STATE_LABELS } from '@/lib/check-in-labels';
import {
  connectingSegments,
  entryDotY,
  TERRAIN_BASELINE_Y,
  TERRAIN_HEIGHT,
  type TerrainDay,
  xFor,
} from '@/components/terrain/terrain-geometry';

import { THERAPIST_COPY } from '../copy';

// C-PDF — the therapist export. A PRINT artifact, NOT an app screen: white page,
// ink-led, NO night mode. Pure string builder → Vitest-testable; the native
// render (expo-print) lives in print-share.ts.
//
// Grayscale-safe BY CONSTRUCTION: state is encoded as HEIGHT (entryDotY), the mood
// tint is reinforcement only, and EVERY dot keeps an ink ring — so a black-and-white
// printout still reads. The two edge labels (Very good / Very low) are PRINT-EXCLUSIVE
// (the on-screen terrain never grows labels). No aggregates, no clinical vocabulary,
// no decoration. Every day in the range is listed; no-entry days are NEVER omitted.
//
// The terrain reuses C0.3's geometry (terrain-geometry.ts) — the same math as the
// on-screen terrain — rendered in the print stylesheet.

const TYPE_FLOOR_PT = 8.5; // nothing in the document is smaller than this

// Print ink (light register only — the page is always white).
const INK_RING = resolveColorRef('color.charcoal.700').light;
const INK_LINE = resolveColorRef('color.charcoal.500').light;
const INK_BASELINE = resolveColorRef('color.charcoal.300').light;
const INK_TEXT = resolveColorRef('color.text.primary').light;
const INK_SECONDARY = resolveColorRef('color.text.secondary').light;
const INK_HINT = resolveColorRef('color.text.tertiary').light; // no-entry rows (hint weight)

function moodTint(state: CheckInState): string {
  return terrainTokens.color.moodTint[state].light;
}

const SVG_WIDTH = 480;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** A labelled 0–N value for a simple text breakdown (e.g. a Clarity domain). */
export interface TherapistMetric {
  readonly label: string;
  readonly value: number;
  readonly max: number;
}

/**
 * Optional cross-tool summaries appended after the check-in section. Each is a small,
 * pre-summarised, LOCAL-ONLY shape (the caller reads the on-device stores). Numbers are
 * fine; NO raw Navigator confidence is ever passed (SR-1 — relevance LABEL only), and
 * NO Relationship DV/isolation alert specifics (intentionally omitted). Educational
 * framing only; section copy approved by Dr. Dobson (2026-06-17).
 */
export interface TherapistToolSummaries {
  readonly clarity?: { readonly date: string; readonly composite: number; readonly tier: string; readonly domains: readonly TherapistMetric[] };
  readonly navigator?: { readonly date: string; readonly areas: readonly { readonly name: string; readonly relevance: string }[] };
  readonly relationship?: { readonly date: string; readonly composite: number; readonly tier: string; readonly domains: readonly TherapistMetric[] };
  readonly mood?: { readonly momentCount: number; readonly topEmotions: readonly string[] };
  readonly sleep?: { readonly nights: number; readonly avgQuality: number };
}

export interface TherapistPdfInput {
  /** Editable full name — the provider files the summary by it. */
  readonly fullName: string;
  readonly from: LocalCalendarDate;
  readonly to: LocalCalendarDate;
  /** Entries in the range (read from the RecordStore via getRange). */
  readonly entries: readonly CheckInEntry[];
  /** BCP-47 locale — drives A4 (default) vs Letter. */
  readonly locale?: string;
  /** Optional cross-tool summaries (Clarity, Navigator, Relationship, Mood, Sleep). */
  readonly tools?: TherapistToolSummaries;
}

export interface RangeSummary {
  readonly dayCount: number;
  readonly entryCount: number;
}

function parseDate(date: LocalCalendarDate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Every calendar day in [from, to] inclusive, oldest first. */
export function enumerateDays(
  from: LocalCalendarDate,
  to: LocalCalendarDate,
): LocalCalendarDate[] {
  const days: LocalCalendarDate[] = [];
  const cur = parseDate(from);
  const end = parseDate(to);
  while (cur.getTime() <= end.getTime()) {
    days.push(toLocalCalendarDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** The [from, to] window for "the last N days" ending today (inclusive). Local-time. */
export function windowForDays(
  now: Date,
  days: number,
): { from: LocalCalendarDate; to: LocalCalendarDate } {
  const to = toLocalCalendarDate(now);
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { from: toLocalCalendarDate(start), to };
}

/** Honest counts: total calendar days in the range + days that actually have an entry. */
export function summarizeRange(
  from: LocalCalendarDate,
  to: LocalCalendarDate,
  entries: readonly CheckInEntry[],
): RangeSummary {
  const dayCount = enumerateDays(from, to).length;
  const entryCount = entries.filter((e) => e.date >= from && e.date <= to).length;
  return { dayCount, entryCount };
}

function pageSizeForLocale(locale?: string): 'A4' | 'letter' {
  if (!locale) return 'A4';
  const l = locale.toLowerCase();
  // US + Canada use Letter; everyone else A4.
  return l.startsWith('en-us') || l.startsWith('en-ca') ? 'letter' : 'A4';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDateLong(date: LocalCalendarDate): string {
  const d = parseDate(date);
  return `${WEEKDAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatRangeLabel(from: LocalCalendarDate, to: LocalCalendarDate): string {
  const a = parseDate(from);
  const b = parseDate(to);
  return `${MONTHS[a.getMonth()]} ${a.getDate()} – ${MONTHS[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
}

function buildTerrainSvg(days: readonly TerrainDay[]): string {
  const count = days.length;
  const baseline = `<line x1="6" y1="${TERRAIN_BASELINE_Y}" x2="${SVG_WIDTH - 6}" y2="${TERRAIN_BASELINE_Y}" stroke="${INK_BASELINE}" stroke-width="1"/>`;

  const lines = connectingSegments(days, SVG_WIDTH)
    .map(
      (seg) =>
        `<polyline points="${seg.map((p) => `${round(p.x)},${round(p.y)}`).join(' ')}" fill="none" stroke="${INK_LINE}" stroke-width="${terrainTokens.connectingLineWidth}"/>`,
    )
    .join('');

  const dots = days
    .map((day, i) => {
      const x = round(xFor(i, count, SVG_WIDTH));
      if (typeof day.value === 'number') {
        // Entry dot: tint fill + INK RING (the grayscale-safe rescue), height = state.
        return `<circle cx="${x}" cy="${round(entryDotY(day.value))}" r="${terrainTokens.dot.radius}" fill="${moodTint(day.value)}" stroke="${INK_RING}" stroke-width="${terrainTokens.dot.ringWidth}"/>`;
      }
      // No-entry day: hollow ink ring at the baseline (never omitted).
      return `<circle cx="${x}" cy="${TERRAIN_BASELINE_Y}" r="${terrainTokens.noEntryDot.radius}" fill="none" stroke="${INK_RING}" stroke-width="1.2"/>`;
    })
    .join('');

  return `<svg width="100%" height="100%" viewBox="0 0 ${SVG_WIDTH} ${TERRAIN_HEIGHT}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Check-in terrain over the range">${baseline}${lines}${dots}</svg>`;
}

function buildRows(
  days: readonly LocalCalendarDate[],
  byDate: Map<LocalCalendarDate, CheckInEntry>,
): string {
  return days
    .map((date) => {
      const entry = byDate.get(date);
      if (entry) {
        const note = entry.note ? escapeHtml(entry.note) : '';
        return `<tr><td class="date">${formatDateLong(date)}</td><td class="state">${escapeHtml(STATE_LABELS[entry.state])}</td><td class="note">${note}</td></tr>`;
      }
      // No-entry day at hint weight — listed, never omitted.
      return `<tr class="no-entry"><td class="date">${formatDateLong(date)}</td><td class="state">No entry</td><td class="note"></td></tr>`;
    })
    .join('');
}

function metricList(metrics: readonly TherapistMetric[]): string {
  if (metrics.length === 0) return '';
  const items = metrics
    .map((m) => `<li>${escapeHtml(m.label)}: ${m.value}/${m.max}</li>`)
    .join('');
  return `<ul class="metrics">${items}</ul>`;
}

/**
 * The optional cross-tool summary block, appended after the check-in section. Returns
 * '' when no tools are supplied. Numbers + educational labels only — no diagnosis, no
 * raw Navigator confidence (SR-1), no DV/isolation specifics. The block opens with a
 * provenance note (self-tracked, for discussion). Copy approved by Dr. Dobson.
 */
function buildToolSections(tools?: TherapistToolSummaries): string {
  if (!tools) return '';
  const sections: string[] = [];

  if (tools.clarity) {
    sections.push(
      `<section class="tool"><h2>Clarity Score · ${escapeHtml(tools.clarity.date)}</h2>` +
        `<p>Composite ${tools.clarity.composite}/100 · ${escapeHtml(tools.clarity.tier)}</p>` +
        `${metricList(tools.clarity.domains)}</section>`,
    );
  }
  if (tools.relationship) {
    sections.push(
      `<section class="tool"><h2>Relationship Health · ${escapeHtml(tools.relationship.date)}</h2>` +
        `<p>Composite ${tools.relationship.composite}/100 · ${escapeHtml(tools.relationship.tier)}</p>` +
        `${metricList(tools.relationship.domains)}</section>`,
    );
  }
  if (tools.navigator) {
    const areas = tools.navigator.areas
      .map((a) => `<li>${escapeHtml(a.name)} — ${escapeHtml(a.relevance)}</li>`)
      .join('');
    sections.push(
      `<section class="tool"><h2>Symptom Navigator · ${escapeHtml(tools.navigator.date)}</h2>` +
        `<p>Areas explored — for discussion, not a diagnosis:</p>` +
        `<ul class="metrics">${areas}</ul></section>`,
    );
  }
  if (tools.mood) {
    const top = tools.mood.topEmotions.length > 0 ? escapeHtml(tools.mood.topEmotions.join(', ')) : '—';
    sections.push(
      `<section class="tool"><h2>Mood Journal</h2>` +
        `<p>${tools.mood.momentCount} ${tools.mood.momentCount === 1 ? 'moment' : 'moments'} noted · Most noted: ${top}</p></section>`,
    );
  }
  if (tools.sleep) {
    sections.push(
      `<section class="tool"><h2>Sleep</h2>` +
        `<p>${tools.sleep.nights} ${tools.sleep.nights === 1 ? 'night' : 'nights'} logged · Average quality ${tools.sleep.avgQuality}/5</p></section>`,
    );
  }

  if (sections.length === 0) return '';
  // Provenance note — these are the person's own self-tracked tool summaries, shared
  // for discussion (educational, not a diagnosis).
  return (
    `<div class="tools-block"><div class="note">Additional tool summaries — self-tracked, shared for discussion.</div>` +
    `${sections.join('')}</div>`
  );
}

export function buildTherapistPdfHtml(input: TherapistPdfInput): string {
  const from = asLocalCalendarDate(input.from);
  const to = asLocalCalendarDate(input.to);

  const inRange = input.entries.filter((e) => e.date >= from && e.date <= to);
  const byDate = new Map<LocalCalendarDate, CheckInEntry>(inRange.map((e) => [e.date, e]));
  const days = enumerateDays(from, to);
  const terrainDays: TerrainDay[] = days.map((d) => {
    const e = byDate.get(d);
    return { label: d.slice(8, 10), value: e ? e.state : null };
  });

  const dayCount = days.length;
  const entryCount = inRange.length;
  const pageSize = pageSizeForLocale(input.locale);
  const name = input.fullName.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  @page {
    size: ${pageSize};
    margin: 48px 40px 72px;
    @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: ${TYPE_FLOOR_PT}pt; color: ${INK_HINT}; }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: #ffffff;
    color: ${INK_TEXT};
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .name { font-family: "Fraunces", Georgia, "Times New Roman", serif; font-size: 17pt; font-weight: 600; margin: 0 0 4px; }
  .range-line { font-size: 11pt; color: ${INK_SECONDARY}; margin: 0 0 16px; }
  .terrain { display: flex; align-items: stretch; gap: 10px; height: 120px; margin: 0 0 20px; }
  .edge-labels { display: flex; flex-direction: column; justify-content: space-between; font-size: ${TYPE_FLOOR_PT}pt; color: ${INK_SECONDARY}; padding: 2px 0; }
  .terrain-canvas { flex: 1; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 5px 8px; vertical-align: top; border-bottom: 1px solid ${INK_BASELINE}; }
  td.date { font-size: 10pt; color: ${INK_SECONDARY}; white-space: nowrap; width: 40%; }
  td.state { font-size: 10pt; font-weight: 600; width: 22%; }
  td.note { font-size: 10pt; font-style: italic; color: ${INK_TEXT}; }
  tr.no-entry td { color: ${INK_HINT}; font-weight: 400; font-style: normal; }
  .tools-block { margin-top: 28px; page-break-inside: avoid; }
  .note { font-size: ${TYPE_FLOOR_PT}pt; color: ${INK_SECONDARY}; border: 1px solid ${INK_BASELINE}; border-radius: 6px; padding: 6px 8px; margin-bottom: 12px; }
  section.tool { margin-bottom: 14px; page-break-inside: avoid; }
  section.tool h2 { font-size: 11pt; font-weight: 600; margin: 0 0 2px; color: ${INK_TEXT}; }
  section.tool p { font-size: 10pt; margin: 0 0 4px; color: ${INK_SECONDARY}; }
  ul.metrics { margin: 0; padding-left: 16px; }
  ul.metrics li { font-size: 10pt; color: ${INK_TEXT}; }
  .footer {
    position: fixed;
    bottom: 24px;
    left: 40px;
    right: 40px;
    font-size: ${TYPE_FLOOR_PT}pt;
    color: ${INK_HINT};
  }
</style>
</head>
<body>
  <div class="name">${escapeHtml(name)}</div>
  <div class="range-line">${formatRangeLabel(from, to)} · ${THERAPIST_COPY.rangeCountLine(dayCount, entryCount)}</div>
  <div class="terrain">
    <div class="edge-labels"><span>Very good</span><span>Very low</span></div>
    <div class="terrain-canvas">${buildTerrainSvg(terrainDays)}</div>
  </div>
  <table><tbody>${buildRows(days, byDate)}</tbody></table>
  ${buildToolSections(input.tools)}
  <div class="footer">${escapeHtml(THERAPIST_COPY.pdfFooter)}</div>
</body>
</html>`;
}
