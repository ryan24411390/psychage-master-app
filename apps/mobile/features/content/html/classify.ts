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
  // Rich PEAF blocks recovered from the web's class-signature soup. The web JSX
  // (StatCard/ProgressSteps/BeforeAfter/MythVsFactBlock/HighlightBox) is flattened
  // to plain HTML by renderToStaticMarkup; the component's Tailwind classes survive
  // and identify the block. Each renderer falls back to generic prose when its
  // extractor finds nothing, so prose is never dropped.
  | 'statcard'
  | 'steps'
  | 'beforeafter'
  | 'mythfact'
  | 'highlight'
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

// ---------------------------------------------------------------------------
// Rich PEAF block detection. Signatures derived from the web block components
// (psychage-v2/src/components/article/blocks/*) and the classes they emit through
// renderToStaticMarkup. All of these would otherwise match isCardClasses, so they
// MUST be tested before the card/generic fallthrough. Detection keys on the
// block's distinctive *inner* signature, which only appears inside the real block.
// ---------------------------------------------------------------------------

function hasDescendantClassStartingWith(node: NElement, prefixes: string[]): boolean {
  return descendantElements(node).some((e) => startsWithAny(e.classes, prefixes));
}

// StatCard — gradient card whose stat values carry `tabular-nums` (unique to it).
function isStatCard(node: NElement): boolean {
  return (
    node.classes.includes('not-prose') &&
    descendantElements(node).some((e) => e.classes.includes('tabular-nums'))
  );
}

// HighlightBox — emphasis box with `bg-gradient-to-br from-{teal,violet,amber}-50`.
// StatCard uses `from-surface`, so the from-tint disambiguates (and StatCard is
// matched first regardless).
function isHighlightBox(node: NElement): boolean {
  return (
    node.classes.includes('bg-gradient-to-br') &&
    startsWithAny(node.classes, ['from-teal-5', 'from-violet-5', 'from-amber-5'])
  );
}

// MythVsFactBlock — paired red (myth) + teal (fact) panels. The `not-prose` gate
// (present on the web outer) keeps a generic wrapper that merely *contains* the
// block from matching and swallowing sibling prose.
function isMythVsFact(node: NElement): boolean {
  return (
    node.classes.includes('not-prose') &&
    hasDescendantClassStartingWith(node, ['bg-red-50']) &&
    hasDescendantClassStartingWith(node, ['bg-teal-50'])
  );
}

// BeforeAfter — paired red (before) + emerald (after) panels. The emerald tint is
// what separates it from MythVsFact (which uses teal for the second panel); the
// `not-prose` gate prevents wrapper-swallow as above.
function isBeforeAfter(node: NElement): boolean {
  return (
    node.classes.includes('not-prose') &&
    hasDescendantClassStartingWith(node, ['bg-red-50']) &&
    hasDescendantClassStartingWith(node, ['bg-emerald-50'])
  );
}

// ProgressSteps — numbered teal step circles (`rounded-full bg-teal-100`).
function isProgressSteps(node: NElement): boolean {
  if (!node.classes.includes('not-prose')) return false;
  return descendantElements(node).some(
    (e) => e.classes.includes('rounded-full') && startsWithAny(e.classes, ['bg-teal-100']),
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
    // Rich PEAF blocks — before callout/card (they'd otherwise match isCardClasses).
    if (isStatCard(node)) return 'statcard';
    if (isHighlightBox(node)) return 'highlight';
    if (isMythVsFact(node)) return 'mythfact';
    if (isBeforeAfter(node)) return 'beforeafter';
    if (isProgressSteps(node)) return 'steps';
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

// ---------------------------------------------------------------------------
// Rich PEAF block extraction. Best-effort; each caller renders generic prose
// when extraction yields nothing, so prose is never lost.
// ---------------------------------------------------------------------------

export type StatCell = { value: string; label: string; description?: string };

export function extractStats(node: NElement): StatCell[] {
  // Each StatValue cell is a centered flex column with padding (`flex flex-col
  // items-center text-center p-6`), a big-number value (`tabular-nums` / text-4xl)
  // and a label <p>.
  const cells = descendantElements(node).filter(
    (e) =>
      e.classes.includes('flex-col') &&
      e.classes.includes('items-center') &&
      startsWithAny(e.classes, ['p-6', 'p-4', 'p-5']),
  );
  const out: StatCell[] = [];
  for (const cell of cells) {
    const valueEl = descendantElements(cell).find(
      (e) => e.classes.includes('tabular-nums') || startsWithAny(e.classes, ['text-4xl', 'text-5xl']),
    );
    const ps = descendantElements(cell).filter((e) => e.tag === 'p');
    const value = valueEl ? textOf(valueEl).trim() : '';
    const label = ps[0] ? textOf(ps[0]).trim() : '';
    const description = ps[1] ? textOf(ps[1]).trim() : undefined;
    if (value || label) out.push({ value, label, description });
  }
  return out;
}

export type StepItem = { title: string; content: readonly NNode[] };

export function extractSteps(node: NElement): StepItem[] {
  // Each step is an <h4> title followed (in document order) by its content block.
  // <h4> has no element children, so the next element in the depth-first list is
  // the sibling content div.
  const els = descendantElements(node);
  const out: StepItem[] = [];
  for (const [i, el] of els.entries()) {
    if (el.tag !== 'h4') continue;
    const title = textOf(el).trim();
    if (!title) continue;
    const next = els[i + 1];
    out.push({ title, content: next ? [next] : [] });
  }
  return out;
}

export type BeforeAfterPanel = { label: string; tone: 'before' | 'after'; content: readonly NNode[] };

export function extractBeforeAfter(node: NElement): BeforeAfterPanel[] {
  const els = descendantElements(node);
  const before = els.find((e) => startsWithAny(e.classes, ['bg-red-50']) && e.classes.includes('p-6'));
  const after = els.find(
    (e) => startsWithAny(e.classes, ['bg-emerald-50']) && e.classes.includes('p-6'),
  );
  const panels: BeforeAfterPanel[] = [];
  for (const [panel, tone] of [
    [before, 'before'],
    [after, 'after'],
  ] as const) {
    if (!panel) continue;
    const span = descendantElements(panel).find((e) => e.tag === 'span');
    const label = span ? textOf(span).trim() : tone === 'before' ? 'Before' : 'After';
    // The panel's content lives in its `text-sm` body div (excludes the label header).
    const body = descendantElements(panel).find(
      (e) => e.tag === 'div' && startsWithAny(e.classes, ['text-sm']),
    );
    panels.push({ label, tone, content: body ? body.children : [] });
  }
  return panels;
}

export type MythFact = { myth: string; fact: string };

export function extractMythFact(node: NElement): MythFact | null {
  const els = descendantElements(node);
  const mythPanel = els.find(
    (e) => startsWithAny(e.classes, ['bg-red-50']) && e.classes.includes('rounded-2xl'),
  );
  const factPanel = els.find(
    (e) => startsWithAny(e.classes, ['bg-teal-50']) && e.classes.includes('rounded-2xl'),
  );
  const textFromPanel = (panel: NElement | undefined): string => {
    if (!panel) return '';
    const p = descendantElements(panel).find((e) => e.tag === 'p');
    return textOf(p ?? panel).trim();
  };
  const myth = textFromPanel(mythPanel);
  const fact = textFromPanel(factPanel);
  if (!myth && !fact) return null;
  return { myth, fact };
}
