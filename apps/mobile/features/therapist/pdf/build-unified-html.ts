import type { LocalCalendarDate } from '@psychage/shared/engagement';
import type { SleepEntry } from '@psychage/shared/sleep';

import { resolveColorRef } from '@/lib/a1-tokens';
import {
  buildNavigatorSection,
  type NavigatorSummaryArea,
} from '@/features/navigator/pdf/build-navigator-html';
import { buildSleepSection } from '@/features/sleep-architect/export/build-sleep-html';

import { THERAPIST_COPY } from '../copy';
import type { SessionPrepSummary } from '../session-prep/summary';
import {
  buildSessionPrepSection,
  escapeHtml,
  formatRangeLabel,
  pageSizeForLocale,
  type PdfSection,
  renderDocument,
} from './build-html';

// Unified export — ONE therapist-oriented PDF that COMPOSES the per-tool builders through
// the shared print shell. It does NOT fork any layout: each tool's section comes verbatim
// from its own `buildXxxSection()` (byte-identical to that tool's standalone export), and
// the shell (renderDocument + helpers) supplies the page language. A tool with no data in
// the window is simply omitted — no empty blocks.
//
// SR-4: the Navigator section is SUMMARY-ONLY (area names + relevance LABELS), never raw
// answers / severity / confidence — it reuses buildNavigatorSection, which has no path for
// raw data to reach the page. Pure string builder → Vitest-testable; the native render
// (expo-print) and the store reads live in the route. Egress is user-initiated only.
//
// CT4 FIXTURE — header/footer copy (via THERAPIST_COPY.unifiedExport) is pending Dr. Dobson
// review. The header names the COMPANY + generation time only; no clinician is named.

/** Monotonic version of the unified-export document subsystem (bump on shape changes). */
export const UNIFIED_EXPORT_VERSION = 2;

export interface UnifiedExportInput {
  /** Editable full name — the provider files the summary by it. */
  readonly fullName: string;
  readonly from: LocalCalendarDate;
  readonly to: LocalCalendarDate;
  /** When the document was generated — passed in so the builder stays deterministic. */
  readonly generatedAt: Date;
  /** BCP-47 locale — drives A4 (default) vs Letter via the shared shell. */
  readonly locale?: string;
  /** Moments aggregate for the window. Omitted / 0-count ⇒ the section is left out. */
  readonly moments?: SessionPrepSummary;
  /** All logged sleep nights — the builder filters to [from, to]. None-in-range ⇒ left out. */
  readonly sleep?: readonly SleepEntry[];
  /** Latest Navigator run within the window. SUMMARY-ONLY (labels). No areas ⇒ left out. */
  readonly navigator?: { readonly date: string; readonly areas: readonly NavigatorSummaryArea[] };
}

const c = THERAPIST_COPY.unifiedExport;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

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

function formatRunDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${MONTHS[(m ?? 1) - 1] ?? ''} ${d ?? 1}, ${y ?? ''}`.trim();
}

// Print inks — light register only (the page is always white). Token-resolved to match the
// shared shell's ink palette rather than hardcoding greys.
const INK_TEXT = resolveColorRef('color.text.primary').light;
const INK_SECONDARY = resolveColorRef('color.text.secondary').light;
// Brand teal — accent-only underline beneath each tool title (matches the shared shell's
// masthead/brand rule). Not load-bearing; the title text itself stays ink.
const INK_RULE = resolveColorRef('color.primary.default').light;

// Composition CSS — each tool starts a fresh page (except the first); the inner blocks keep
// their own page-break-inside rules. The tool title sits OUTSIDE any `.block`, so the
// per-section `.block h2` rules never reach it.
const UNIFIED_CSS = `  .tool { page-break-before: always; }
  .tool:first-of-type { page-break-before: avoid; }
  h2.tool-title { font-family: "Fraunces", Georgia, "Times New Roman", serif; font-size: 14pt; font-weight: 600; margin: 0 0 2px; padding: 0 0 5px; border-bottom: 1px solid ${INK_RULE}; color: ${INK_TEXT}; }
  .tool-meta { font-size: 9.5pt; color: ${INK_SECONDARY}; margin: 0 0 12px; }
  .unified-empty { font-size: 10.5pt; color: ${INK_SECONDARY}; margin: 0; }`;

type ToolBlock = { readonly title: string; readonly meta: string; readonly section: PdfSection };

/**
 * Build the unified export as a print-ready HTML string. Composes the present tools'
 * sections through the shared shell; omits any tool with no data in the window. The
 * header carries the company name + window + generation time; no clinician is named.
 */
export function buildUnifiedExportHtml(input: UnifiedExportInput): string {
  const blocks: ToolBlock[] = [];

  // Moments — the person's own record of what they noticed.
  if (input.moments && input.moments.totalCount > 0) {
    blocks.push({
      title: c.momentsTitle,
      meta: c.momentsMeta(input.moments.totalCount),
      section: buildSessionPrepSection({
        fullName: input.fullName,
        summary: input.moments,
        locale: input.locale,
      }),
    });
  }

  // Sleep — filtered to the window inside buildSleepSection; omit when none in range.
  if (input.sleep && input.sleep.length > 0) {
    const sleep = buildSleepSection({
      fullName: input.fullName,
      from: input.from,
      to: input.to,
      entries: input.sleep,
      generatedAt: input.generatedAt,
      locale: input.locale,
    });
    if (sleep.nights > 0) {
      blocks.push({ title: c.sleepTitle, meta: c.sleepMeta(sleep.nights), section: sleep });
    }
  }

  // Symptom Navigator — SUMMARY-ONLY (labels). Omit when no areas were surfaced.
  if (input.navigator && input.navigator.areas.length > 0) {
    blocks.push({
      title: c.navigatorTitle,
      meta: c.navigatorMeta(formatRunDate(input.navigator.date)),
      section: buildNavigatorSection({
        fullName: input.fullName,
        date: input.navigator.date,
        areas: input.navigator.areas,
        locale: input.locale,
      }),
    });
  }

  const extraCss = [UNIFIED_CSS, ...blocks.map((b) => b.section.extraCss)].join('\n');

  const body =
    blocks.length === 0
      ? `  <p class="unified-empty">${escapeHtml(c.emptyAll)}</p>`
      : blocks
          .map(
            (b) =>
              `  <section class="tool">\n` +
              `    <h2 class="tool-title">${escapeHtml(b.title)}</h2>\n` +
              `    <p class="tool-meta">${escapeHtml(b.meta)}</p>\n` +
              `${b.section.body}\n` +
              `  </section>`,
          )
          .join('\n');

  const shell = THERAPIST_COPY.shell;

  return renderDocument({
    pageSize: pageSizeForLocale(input.locale),
    extraCss,
    title: c.docTitle,
    kindLabel: shell.kindLabel,
    meta: [
      { label: shell.metaName, value: input.fullName.trim() },
      { label: shell.metaPeriod, value: formatRangeLabel(input.from, input.to) },
      { label: shell.metaGenerated, value: formatStamp(input.generatedAt) },
    ],
    body,
    footer: c.footer,
    versionComment: `psychage-unified-export v${UNIFIED_EXPORT_VERSION}`,
  });
}
