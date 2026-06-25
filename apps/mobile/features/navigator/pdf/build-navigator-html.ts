// Navigator summary PDF — a user-initiated, SUMMARY-ONLY therapist hand-off.
//
// SR-4: built from the on-device run (areas + relevance LABELS only). It carries NO raw
// answers — no symptom list, no per-symptom severity / duration / frequency. SR-1: each
// area shows its relevance LABEL ("Highly Relevant" / …), NEVER a confidence number or %.
// SR-3: educational, non-diagnostic framing throughout.
//
// Reuses the shared therapist print SHELL (renderDocument / escapeHtml / pageSizeForLocale)
// so the document speaks the same print design language — it does NOT fork it. The native
// render lives in the therapist pdf/expo-printer; this builder is a PURE string fn
// (Vitest-testable, no native import).
//
// CT4 FIXTURE — the user-facing copy (via NAVIGATOR_COPY) is pending Dr. Dobson review.

import { resolveColorRef } from '@/lib/a1-tokens';
import { THERAPIST_COPY } from '@/features/therapist/copy';
import {
  escapeHtml,
  pageSizeForLocale,
  type PdfSection,
  renderDocument,
} from '@/features/therapist/pdf/build-html';

import { NAVIGATOR_COPY } from '../copy';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

// Print hairline — the same token the shared therapist shell uses for its rules (light
// register only; the page is always white). Token-driven, not a raw hex.
const INK_HAIRLINE = resolveColorRef('color.charcoal.300').light;

/** One surfaced area: name + its relevance LABEL (never a numeric score — SR-1). */
export interface NavigatorSummaryArea {
  readonly name: string;
  readonly relevance: string;
}

export interface NavigatorSummaryInput {
  /** Document title — the person's display name, or a neutral fallback when anonymous. */
  readonly fullName: string;
  /** The run's local calendar day, `YYYY-MM-DD`. */
  readonly date: string;
  /** Surfaced areas (already capped/ordered by the engine); LABELS only. */
  readonly areas: readonly NavigatorSummaryArea[];
  /** BCP-47 locale — drives A4 (default) vs Letter via the shared shell. */
  readonly locale?: string;
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${MONTHS[((m ?? 1) - 1)] ?? ''} ${d ?? 1}, ${y ?? ''}`.trim();
}

// Structural-only print CSS — colors are inherited from the shared shell's BASE_CSS (ink
// on white). Type floor stays ≥ 9pt (the shell's 8.5pt floor convention). No decoration.
const NAVIGATOR_PDF_CSS = `  .lead { font-size: 11pt; margin: 0 0 14px; }
  ul.areas { list-style: none; margin: 0 0 22px; padding: 0; }
  ul.areas li { display: flex; justify-content: space-between; gap: 12px; font-size: 11pt; padding: 6px 0; border-bottom: 1px solid ${INK_HAIRLINE}; }
  ul.areas li.empty { justify-content: flex-start; border-bottom: none; font-style: italic; }
  .area { font-weight: 600; }
  .rel { white-space: nowrap; }
  section.things { page-break-inside: avoid; }
  section.things h2 { font-size: 12pt; font-weight: 600; margin: 0 0 6px; }
  section.things ul { margin: 0; padding-left: 16px; }
  section.things li { font-size: 10pt; padding: 2px 0; }`;

/**
 * Build the Navigator summary as a print-ready HTML string. Summary-only by construction:
 * the ONLY data rendered is the run date, the surfaced area names, and their relevance
 * LABELS — there is no path here for raw answers or numeric confidence to reach the page.
 */
export function buildNavigatorSection(input: NavigatorSummaryInput): PdfSection {
  const areas =
    input.areas.length > 0
      ? input.areas
          .map(
            (a) =>
              `<li><span class="area">${escapeHtml(a.name)}</span><span class="rel">${escapeHtml(a.relevance)}</span></li>`,
          )
          .join('')
      : `<li class="empty">${escapeHtml(NAVIGATOR_COPY.summaryEmptyAreas)}</li>`;

  const things = NAVIGATOR_COPY.thingsToKnow
    .map((t) => `<li>${escapeHtml(t)}</li>`)
    .join('');

  const body = `  <p class="lead">${escapeHtml(NAVIGATOR_COPY.summaryLead)}</p>
  <ul class="areas">${areas}</ul>
  <section class="things"><h2>${escapeHtml(NAVIGATOR_COPY.thingsToKnowTitle)}</h2><ul>${things}</ul></section>`;

  return { extraCss: NAVIGATOR_PDF_CSS, body };
}

export function buildNavigatorSummaryHtml(input: NavigatorSummaryInput): string {
  const { extraCss, body } = buildNavigatorSection(input);
  const s = THERAPIST_COPY.shell;

  return renderDocument({
    pageSize: pageSizeForLocale(input.locale),
    extraCss,
    title: NAVIGATOR_COPY.summaryDocTitle,
    kindLabel: s.kindLabel,
    meta: [
      { label: s.metaName, value: input.fullName.trim() },
      { label: s.metaExplored, value: formatDate(input.date) },
    ],
    body,
    footer: NAVIGATOR_COPY.summaryFooter,
  });
}
