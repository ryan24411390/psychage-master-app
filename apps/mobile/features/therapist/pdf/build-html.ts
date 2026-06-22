import {
  asLocalCalendarDate,
  type LocalCalendarDate,
  type MomentValence,
  toLocalCalendarDate,
} from '@psychage/shared/engagement';

import { resolveColorRef, terrainTokens } from '@/lib/a1-tokens';
import {
  DAILY_STATE_LABELS as STATE_LABELS,
  type DailyEntry as CheckInEntry,
  type DailyState as CheckInState,
} from '@/lib/daily-rollup';
import { EXPORT_FORMAT_VERSION } from '@/lib/export/record-export';
import { ALL_LABELS, CONTEXT_DOMAINS } from '@/features/moments/constants';
import {
  connectingSegments,
  entryDotY,
  hasBand,
  TERRAIN_BASELINE_Y,
  TERRAIN_HEIGHT,
  type TerrainDay,
  xFor,
} from '@/components/terrain/terrain-geometry';

import { THERAPIST_COPY } from '../copy';
import type { SessionPrepSummary } from '../session-prep/summary';

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

// Exported so sibling feature PDFs (e.g. Sleep export) can CONSUME the same shell +
// helpers rather than fork them. Pure, no behaviour change.
export function pageSizeForLocale(locale?: string): 'A4' | 'letter' {
  if (!locale) return 'A4';
  const l = locale.toLowerCase();
  // US + Canada use Letter; everyone else A4.
  return l.startsWith('en-us') || l.startsWith('en-ca') ? 'letter' : 'A4';
}

export function escapeHtml(value: string): string {
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

export function formatRangeLabel(from: LocalCalendarDate, to: LocalCalendarDate): string {
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
        // Multi-modal day → a low→high capsule (height-encoded ⇒ grayscale-safe), under the dot.
        const band = hasBand(day)
          ? `<line x1="${x}" y1="${round(entryDotY(day.high))}" x2="${x}" y2="${round(entryDotY(day.value))}" stroke="${moodTint(day.value)}" stroke-width="${terrainTokens.dot.radius}" stroke-linecap="round"/>`
          : '';
        // Entry dot: tint fill + INK RING (the grayscale-safe rescue), height = worst-of-day state.
        return `${band}<circle cx="${x}" cy="${round(entryDotY(day.value))}" r="${terrainTokens.dot.radius}" fill="${moodTint(day.value)}" stroke="${INK_RING}" stroke-width="${terrainTokens.dot.ringWidth}"/>`;
      }
      // No-entry day: hollow ink ring at the baseline (never omitted).
      return `<circle cx="${x}" cy="${TERRAIN_BASELINE_Y}" r="${terrainTokens.noEntryDot.radius}" fill="none" stroke="${INK_RING}" stroke-width="1.2"/>`;
    })
    .join('');

  return `<svg width="100%" height="100%" viewBox="0 0 ${SVG_WIDTH} ${TERRAIN_HEIGHT}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Check-in terrain over the range">${baseline}${lines}${dots}</svg>`;
}

function buildRows(
  days: readonly LocalCalendarDate[],
  byDate: Map<string, CheckInEntry>,
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

// The shared print SHELL — both therapist documents emit identical design language
// (white page, ink palette, 8.5pt floor, Fraunces name, per-page counter, fixed
// footer). Each builder supplies its own `extraCss` + `body` between the header and the
// footer. `name`/`footer` are escaped (the name is user input); `rangeLine` is our own
// copy/data and matches the prior un-escaped behaviour.
const BASE_CSS = `  * { box-sizing: border-box; }
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
  .footer {
    position: fixed;
    bottom: 24px;
    left: 40px;
    right: 40px;
    font-size: ${TYPE_FLOOR_PT}pt;
    color: ${INK_HINT};
  }`;

/**
 * A composable document section: the per-tool `extraCss` + `body` that sits between the
 * shell header and footer. Each feature builder exposes one so the unified export can
 * COMPOSE several tools through a single {@link renderDocument} call without forking any
 * layout. The standalone `buildXxxHtml()` wrappers keep emitting byte-identical output.
 */
export interface PdfSection {
  readonly extraCss: string;
  readonly body: string;
}

export function renderDocument(opts: {
  pageSize: 'A4' | 'letter';
  extraCss: string;
  name: string;
  rangeLine: string;
  body: string;
  footer: string;
  versionComment?: string;
}): string {
  const versionLine = opts.versionComment ? `\n  <!-- ${opts.versionComment} -->` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  @page {
    size: ${opts.pageSize};
    margin: 48px 40px 72px;
    @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: ${TYPE_FLOOR_PT}pt; color: ${INK_HINT}; }
  }
${BASE_CSS}
${opts.extraCss}
</style>
</head>
<body>${versionLine}
  <div class="name">${escapeHtml(opts.name)}</div>
  <div class="range-line">${opts.rangeLine}</div>
${opts.body}
  <div class="footer">${escapeHtml(opts.footer)}</div>
</body>
</html>`;
}

// Therapist check-in PDF CSS (terrain + daily table + cross-tool sections).
const THERAPIST_EXTRA_CSS = `  .terrain { display: flex; align-items: stretch; gap: 10px; height: 120px; margin: 0 0 20px; }
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
  ul.metrics li { font-size: 10pt; color: ${INK_TEXT}; }`;

export function buildTherapistPdfHtml(input: TherapistPdfInput): string {
  const from = asLocalCalendarDate(input.from);
  const to = asLocalCalendarDate(input.to);

  const inRange = input.entries.filter((e) => e.date >= from && e.date <= to);
  const byDate = new Map<string, CheckInEntry>(inRange.map((e) => [e.date, e]));
  const days = enumerateDays(from, to);
  const terrainDays: TerrainDay[] = days.map((d) => {
    const e = byDate.get(d);
    const high = e && e.high > e.state ? e.high : undefined;
    return { label: d.slice(8, 10), value: e ? e.state : null, ...(high !== undefined ? { high } : {}) };
  });

  const dayCount = days.length;
  const entryCount = inRange.length;

  const body = `  <div class="terrain">
    <div class="edge-labels"><span>Very good</span><span>Very low</span></div>
    <div class="terrain-canvas">${buildTerrainSvg(terrainDays)}</div>
  </div>
  <table><tbody>${buildRows(days, byDate)}</tbody></table>
  ${buildToolSections(input.tools)}`;

  return renderDocument({
    pageSize: pageSizeForLocale(input.locale),
    extraCss: THERAPIST_EXTRA_CSS,
    name: input.fullName.trim(),
    rangeLine: `${formatRangeLabel(from, to)} · ${THERAPIST_COPY.rangeCountLine(dayCount, entryCount)}`,
    body,
    footer: THERAPIST_COPY.pdfFooter,
  });
}

// ─── Session-prep document ───────────────────────────────────────────────────
// A SEPARATE therapist-oriented artifact rendered through the SAME shell (identical
// design language, grayscale-safe). Unlike the check-in PDF above — which deliberately
// carries NO aggregates — this is the person's own record of WHAT THEY NOTICED, so it
// DOES present frequencies/ranges: that is the point of a session-prep summary. The
// framing stays neutral and non-diagnostic (Sacred Rule #2/#3): counts and the app's
// own affect scale, never assessment/severity. The full window is shown — hard moments
// and all; nothing is positive-filtered.

export interface SessionPrepPdfInput {
  /** Editable full name — the provider files the summary by it. */
  readonly fullName: string;
  /** The pre-aggregated summary (see session-prep/summary.ts). */
  readonly summary: SessionPrepSummary;
  /** BCP-47 locale — drives A4 (default) vs Letter. */
  readonly locale?: string;
}

const LABEL_BY_KEY = new Map(ALL_LABELS.map((l) => [l.key, l.label]));
const CONTEXT_BY_KEY = new Map(CONTEXT_DOMAINS.map((l) => [l.key, l.label]));

// Key → display word, falling back to the raw key (so an unknown/retired key still
// prints rather than vanishing — completeness over prettiness).
function resolveLabel(key: string): string {
  return LABEL_BY_KEY.get(key) ?? key;
}
function resolveContext(key: string): string {
  return CONTEXT_BY_KEY.get(key) ?? key;
}

function formatDateShort(date: LocalCalendarDate): string {
  const d = parseDate(date);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// Local 12-hour clock for a capture instant. Local accessors match the rollup's
// device-day convention; with timestamps minted locally this round-trips deterministically.
function formatClock(timestamp: string): string {
  const d = new Date(timestamp);
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const hour24 = d.getHours();
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minutes} ${ampm}`;
}

const SESSION_PREP_BAR_WIDTH = 240;

// One horizontal distribution bar: width encodes the count, and EVERY bar keeps an ink
// stroke (the grayscale-safe rescue) — the printed count beside it is the real fallback.
function distBarSvg(count: number, max: number, valence: MomentValence): string {
  const height = 16;
  const fill = moodTint((valence - 1) as CheckInState);
  const rect =
    count === 0
      ? ''
      : `<rect x="0.6" y="0.6" width="${round(Math.max(3, (count / max) * SESSION_PREP_BAR_WIDTH))}" height="${height - 1.2}" rx="2" fill="${fill}" stroke="${INK_RING}" stroke-width="1.2"/>`;
  return `<svg width="${SESSION_PREP_BAR_WIDTH}" height="${height}" viewBox="0 0 ${SESSION_PREP_BAR_WIDTH} ${height}" xmlns="http://www.w3.org/2000/svg" role="img">${rect}</svg>`;
}

function distributionBlock(distribution: Readonly<Record<MomentValence, number>>): string {
  const max = Math.max(
    1,
    distribution[1],
    distribution[2],
    distribution[3],
    distribution[4],
    distribution[5],
  );
  // High valence at the top — matches the terrain edge order (Very good … Very low).
  return ([5, 4, 3, 2, 1] as const)
    .map(
      (v) =>
        `<div class="dist-row"><div class="dist-label">${escapeHtml(THERAPIST_COPY.sessionPrep.scale[v])}</div><div class="dist-bar">${distBarSvg(distribution[v], max, v)}</div><div class="dist-count">${distribution[v]}</div></div>`,
    )
    .join('');
}

function freqList(
  items: readonly { readonly key: string; readonly count: number }[],
  resolve: (key: string) => string,
): string {
  const lis = items
    .map(
      (it) =>
        `<li><span class="freq-label">${escapeHtml(resolve(it.key))}</span><span class="freq-count">${it.count}×</span></li>`,
    )
    .join('');
  return `<ul class="freq">${lis}</ul>`;
}

function timeOfDayBlock(timeOfDay: SessionPrepSummary['timeOfDay']): string {
  const c = THERAPIST_COPY.sessionPrep;
  const cells: [string, number][] = [
    [c.morning, timeOfDay.morning],
    [c.afternoon, timeOfDay.afternoon],
    [c.evening, timeOfDay.evening],
    [c.night, timeOfDay.night],
  ];
  return `<div class="tod">${cells
    .map(([label, n]) => `<div class="tod-cell"><div class="tod-n">${n}</div><div class="tod-l">${escapeHtml(label)}</div></div>`)
    .join('')}</div>`;
}

function notesBlock(notes: SessionPrepSummary['notes']): string {
  if (notes.length === 0) {
    return `<p class="empty">${escapeHtml(THERAPIST_COPY.sessionPrep.notesEmpty)}</p>`;
  }
  // Every note, oldest first, verbatim (escaped) — never positive-filtered.
  return notes
    .map(
      (n) =>
        `<div class="note-row"><div class="note-when">${formatDateShort(n.date)}, ${formatClock(n.timestamp)}</div><div class="note-text">${escapeHtml(n.note)}</div></div>`,
    )
    .join('');
}

function section(heading: string, inner: string): string {
  return `  <section class="block"><h2>${escapeHtml(heading)}</h2>${inner}</section>`;
}

const SESSION_PREP_EXTRA_CSS = `  .block { margin: 0 0 18px; page-break-inside: avoid; }
  .block h2 { font-size: 12pt; font-weight: 600; margin: 0 0 6px; color: ${INK_TEXT}; }
  .empty { font-size: 10.5pt; color: ${INK_SECONDARY}; margin: 0; }
  ul.freq { list-style: none; margin: 0; padding: 0; }
  ul.freq li { display: flex; justify-content: space-between; font-size: 10.5pt; padding: 3px 0; border-bottom: 1px solid ${INK_BASELINE}; color: ${INK_TEXT}; }
  .freq-count { color: ${INK_SECONDARY}; font-variant-numeric: tabular-nums; }
  .dist-row { display: flex; align-items: center; gap: 10px; margin: 0 0 5px; }
  .dist-label { width: 80px; font-size: 9.5pt; color: ${INK_SECONDARY}; }
  .dist-count { font-size: 9.5pt; color: ${INK_TEXT}; font-variant-numeric: tabular-nums; }
  .tod { display: flex; gap: 10px; }
  .tod-cell { flex: 1; border: 1px solid ${INK_BASELINE}; border-radius: 6px; padding: 8px 4px; text-align: center; }
  .tod-n { font-size: 14pt; font-weight: 600; color: ${INK_TEXT}; }
  .tod-l { font-size: 9pt; color: ${INK_SECONDARY}; }
  .note-row { padding: 5px 0; border-bottom: 1px solid ${INK_BASELINE}; page-break-inside: avoid; }
  .note-when { font-size: 9pt; color: ${INK_SECONDARY}; }
  .note-text { font-size: 10.5pt; color: ${INK_TEXT}; font-style: italic; }`;

/**
 * The session-prep (Moments) section as { extraCss, body } — the same content the
 * standalone PDF renders between the header and footer. Exposed so the unified export can
 * COMPOSE it through the shared shell alongside other tools, without forking the layout.
 * Non-diagnostic by construction (counts + the app's own affect words, never severity).
 */
export function buildSessionPrepSection(input: SessionPrepPdfInput): PdfSection {
  const { summary } = input;
  const c = THERAPIST_COPY.sessionPrep;

  let body: string;
  if (summary.totalCount === 0) {
    body = `  <p class="empty">${escapeHtml(c.empty)}</p>`;
  } else {
    const sections: string[] = [];
    if (summary.feelingFrequency.length > 0) {
      sections.push(section(c.feelingsHeading, freqList(summary.feelingFrequency, resolveLabel)));
    }
    if (summary.contextFrequency.length > 0) {
      sections.push(section(c.contextHeading, freqList(summary.contextFrequency, resolveContext)));
    }
    sections.push(section(c.spreadHeading, distributionBlock(summary.valence.distribution)));
    sections.push(section(c.timeHeading, timeOfDayBlock(summary.timeOfDay)));
    sections.push(section(c.notesHeading, notesBlock(summary.notes)));
    body = sections.join('\n');
  }

  return { extraCss: SESSION_PREP_EXTRA_CSS, body };
}

export function buildSessionPrepHtml(input: SessionPrepPdfInput): string {
  const { summary } = input;
  const from = asLocalCalendarDate(summary.window.from);
  const to = asLocalCalendarDate(summary.window.to);
  const dayCount = enumerateDays(from, to).length;
  const c = THERAPIST_COPY.sessionPrep;
  const { extraCss, body } = buildSessionPrepSection(input);

  return renderDocument({
    pageSize: pageSizeForLocale(input.locale),
    extraCss,
    name: input.fullName.trim(),
    rangeLine: `${formatRangeLabel(from, to)} · ${c.countLine(dayCount, summary.totalCount)}`,
    body,
    footer: c.footer,
    versionComment: `psychage-session-prep v${EXPORT_FORMAT_VERSION}`,
  });
}
