// Read-aloud segmentation (P21) — turn an article into an ordered list of plain-text
// segments a text-to-speech engine reads start to finish. PURE (no expo-speech, no
// React) so it's the unit-test target and safe under vitest.
//
// Source of truth is the same verbatim, clinician-reviewed body the reader renders:
// parse the HTML once, then read each top-level block's decoded text via textOf
// (entity-decoded, byte-faithful). Decorative <svg> and empty/whitespace nodes are
// dropped; generic wrappers are descended into so each block becomes its own segment
// (good play/pause granularity). Title + subtitle lead. Over-long segments are split
// on sentence boundaries to stay under the platform TTS input cap.

import { isText, type NNode, textOf } from './html/ast';
import { parseArticleHtml } from './html/parse';

/** Conservative cap under the platform TTS limit (Android ~4000 chars). */
export const MAX_SEGMENT_CHARS = 3800;

/** Generic containers we descend into so their child blocks become separate segments. */
const CONTAINER_TAGS = new Set(['div', 'section', 'article', 'main', 'header', 'footer']);

export interface ReadAloudSource {
  readonly title: string;
  readonly subtitle: string | null;
  readonly contentHtml: string;
}

function collectBlocks(nodes: readonly NNode[], out: string[]): void {
  for (const node of nodes) {
    if (isText(node)) {
      const t = node.text.trim();
      if (t) out.push(t);
      continue;
    }
    if (node.svg) continue; // decorative — nothing to read
    if (CONTAINER_TAGS.has(node.tag)) {
      collectBlocks(node.children, out);
      continue;
    }
    const t = textOf(node).trim();
    if (t) out.push(t);
  }
}

/** Split a string into sentence-ish runs (keeps trailing punctuation). */
function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g);
  if (!matches) {
    const t = text.trim();
    return t ? [t] : [];
  }
  return matches.map((s) => s.trim()).filter(Boolean);
}

/** Split one segment into <= maxChars chunks on sentence boundaries (hard-slice if needed). */
export function capSegment(segment: string, maxChars: number = MAX_SEGMENT_CHARS): string[] {
  if (segment.length <= maxChars) return [segment];
  const out: string[] = [];
  let buf = '';
  for (const sentence of splitSentences(segment)) {
    if (sentence.length > maxChars) {
      if (buf) {
        out.push(buf);
        buf = '';
      }
      for (let i = 0; i < sentence.length; i += maxChars) {
        out.push(sentence.slice(i, i + maxChars));
      }
      continue;
    }
    const candidate = buf ? `${buf} ${sentence}` : sentence;
    if (candidate.length > maxChars) {
      if (buf) out.push(buf);
      buf = sentence;
    } else {
      buf = candidate;
    }
  }
  if (buf) out.push(buf);
  return out;
}

/**
 * Ordered read-aloud segments: title, subtitle (if any), then every body block in
 * document order. Empty article → []. Each segment is capped to MAX_SEGMENT_CHARS.
 */
export function buildReadAloudSegments(
  source: ReadAloudSource,
  maxChars: number = MAX_SEGMENT_CHARS,
): string[] {
  const raw: string[] = [];
  const title = source.title?.trim();
  if (title) raw.push(title);
  const subtitle = source.subtitle?.trim();
  if (subtitle) raw.push(subtitle);
  collectBlocks(parseArticleHtml(source.contentHtml), raw);
  return raw.flatMap((segment) => capSegment(segment, maxChars));
}
