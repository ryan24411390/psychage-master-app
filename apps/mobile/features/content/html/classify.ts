// Block & inline classification — maps an NElement to the native component that
// renders it, by tag + class/role/attr signature (recon-derived). Pure; tested
// against the real web markup signatures. Anything unrecognized falls through to
// 'generic' (children still render) so prose is never dropped.

import { type NElement, type NNode, descendantElements, isElement, textOf } from './ast';

export type BlockRole =
  | 'paragraph'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'list-ordered'
  | 'list-unordered'
  | 'quote'
  | 'table'
  | 'figure'
  | 'image'
  | 'svg'
  | 'callout'
  | 'card'
  | 'accordion'
  | 'tabs'
  | 'generic'
  | 'skip';

const INLINE_TAGS = new Set([
  'strong',
  'b',
  'em',
  'i',
  'a',
  'span',
  'sup',
  'sub',
  'code',
  'u',
  'mark',
  'small',
  'br',
  'button',
]);

// At block level these carry no prose worth rendering (interactive chrome).
const SKIP_BLOCK_TAGS = new Set(['input', 'nav', 'form', 'iframe']);

export const isInlineTag = (tag: string): boolean => INLINE_TAGS.has(tag);

// A citation reference marker: `<button id="citation-ref-N">N</button>`. NOT a
// type predicate — it must not narrow `node` to NElement (that would make the
// negative branch `never` for callers that already hold an NElement).
export function isCitation(node: NNode): boolean {
  return (
    isElement(node) && node.tag === 'button' && (node.attrs.id ?? '').startsWith('citation-ref')
  );
}

function directChildElements(node: NElement): NElement[] {
  return node.children.filter((c): c is NElement => isElement(c));
}

// Tabs/accordion detection is intentionally LOCAL (the node itself or its direct
// children), never `someDescendant` — otherwise a generic page wrapper that
// merely *contains* an accordion deep down would be misclassified and swallow all
// its sibling prose. A wrapper-of-root stays 'generic' and recurses to the real
// root, which then matches.
function isTabsRoot(node: NElement): boolean {
  if ((node.attrs.role ?? '') === 'tablist') return false; // that's the list, not the root
  return directChildElements(node).some(
    (e) => e.attrs.role === 'tablist' || e.attrs.role === 'tabpanel',
  );
}

function hasDataState(e: NElement): boolean {
  return e.attrs['data-state'] === 'open' || e.attrs['data-state'] === 'closed';
}

function startsWithAny(classes: readonly string[], prefixes: string[]): boolean {
  return classes.some((c) => prefixes.some((p) => c.startsWith(p)));
}

function isCalloutClasses(classes: readonly string[]): boolean {
  // Recon: callouts are left-accent-bar boxes — `border-l-4 ... bg-<tint>`.
  return startsWithAny(classes, ['border-l-']) && startsWithAny(classes, ['bg-']);
}

function isCardClasses(classes: readonly string[]): boolean {
  const rounded = startsWithAny(classes, ['rounded']);
  const bordered = classes.includes('border') || startsWithAny(classes, ['border-']);
  const bg = startsWithAny(classes, ['bg-']);
  const padded = startsWithAny(classes, ['p-', 'px-', 'py-']);
  return rounded && (bordered || bg) && padded;
}

function isAccordionRoot(node: NElement): boolean {
  if (isTabsRoot(node)) return false;
  // Radix Accordion.Root's direct children are items carrying data-state. Require
  // a DIRECT child with data-state that contains a trigger button.
  return directChildElements(node).some(
    (item) => hasDataState(item) && descendantElements(item).some((e) => e.tag === 'button'),
  );
}

const CONTAINER_TAGS = new Set(['div', 'section', 'aside', 'article', 'main']);

export function classifyBlock(node: NNode): BlockRole {
  if (!isElement(node)) return 'skip';
  switch (node.tag) {
    case 'p':
      return 'paragraph';
    case 'h1':
    case 'h2':
      return 'heading2';
    case 'h3':
      return 'heading3';
    case 'h4':
    case 'h5':
    case 'h6':
      return 'heading4';
    case 'ul':
      return 'list-unordered';
    case 'ol':
      return 'list-ordered';
    case 'blockquote':
      return 'quote';
    case 'table':
      return 'table';
    case 'figure':
      return 'figure';
    case 'img':
      return 'image';
    case 'svg':
      return 'svg';
  }
  if (SKIP_BLOCK_TAGS.has(node.tag)) return 'skip';
  if (CONTAINER_TAGS.has(node.tag)) {
    if (isTabsRoot(node)) return 'tabs';
    if (isAccordionRoot(node)) return 'accordion';
    if (isCalloutClasses(node.classes)) return 'callout';
    if (isCardClasses(node.classes)) return 'card';
    return 'generic';
  }
  // Inline-ish wrapper sitting at block level → recurse for its prose.
  return 'generic';
}

// ---------------------------------------------------------------------------
// Callout variant — derive a calm tint from the colour the HTML already carries.
// We honour the source classes rather than enumerating all 20 web variants.
// ---------------------------------------------------------------------------

export type CalloutTone = 'teal' | 'amber' | 'rose' | 'violet' | 'sky' | 'neutral';

const TONE_KEYWORDS: ReadonlyArray<readonly [string, CalloutTone]> = [
  ['teal', 'teal'],
  ['emerald', 'teal'],
  ['green', 'teal'],
  ['amber', 'amber'],
  ['yellow', 'amber'],
  ['orange', 'amber'],
  ['red', 'rose'],
  ['rose', 'rose'],
  ['pink', 'rose'],
  ['purple', 'violet'],
  ['violet', 'violet'],
  ['indigo', 'violet'],
  ['blue', 'sky'],
  ['sky', 'sky'],
  ['cyan', 'sky'],
];

export function calloutTone(classes: readonly string[]): CalloutTone {
  for (const c of classes) {
    for (const [kw, tone] of TONE_KEYWORDS) {
      if (c.includes(kw)) return tone;
    }
  }
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Interactive-block extraction (tabs / accordion). Role-based for tabs (radix
// emits explicit roles → reliable); best-effort for accordion. Callers fall
// back to 'generic' when extraction yields nothing, so prose is never lost.
// ---------------------------------------------------------------------------

export type TabPanel = { label: string; content: readonly NNode[] };

export function extractTabs(node: NElement): TabPanel[] {
  const tabs = descendantElements(node).filter((e) => e.attrs.role === 'tab');
  const panels = descendantElements(node).filter((e) => e.attrs.role === 'tabpanel');
  if (panels.length === 0) return [];
  return panels.map((panel, i) => {
    const tab = tabs[i];
    return { label: tab ? textOf(tab).trim() : `Section ${i + 1}`, content: panel.children };
  });
}

export type AccordionItem = { heading: string; content: readonly NNode[] };

export function extractAccordion(node: NElement): AccordionItem[] {
  // An item wrapper carries data-state AND contains a trigger button.
  const items = descendantElements(node).filter(
    (e) =>
      (e.attrs['data-state'] === 'open' || e.attrs['data-state'] === 'closed') &&
      e.children.some((c) => isElement(c)),
  );
  const out: AccordionItem[] = [];
  for (const item of items) {
    const trigger = descendantElements(item).find((e) => e.tag === 'button');
    if (!trigger) continue;
    const heading = textOf(trigger).trim();
    // Content = item children that are NOT the subtree containing the trigger.
    const content = item.children.filter((c) => isElement(c) && !subtreeContains(c, trigger));
    if (heading) out.push({ heading, content });
  }
  return out;
}

function subtreeContains(node: NNode, target: NElement): boolean {
  if (node === target) return true;
  if (!isElement(node)) return false;
  return node.children.some((c) => subtreeContains(c, target));
}
