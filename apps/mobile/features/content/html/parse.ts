// HTML string → NNode[] (the normalized tree).
//
// Fidelity guarantee: text is read via node-html-parser's `.text`, which decodes
// HTML entities (&quot; → ", &rsquo; → ’), so the rendered prose is byte-faithful
// to the clinician-reviewed source. <svg> subtrees are captured as raw outerHTML
// for verbatim rendering; non-content nodes (script/style/head) are dropped.

import { type HTMLElement, NodeType, type Node, parse as parseHtml } from 'node-html-parser';

import type { NNode } from './ast';

const DROP_TAGS = new Set(['script', 'style', 'noscript', 'head', 'meta', 'link', 'title']);

function toNNode(node: Node): NNode | null {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const text = (node as unknown as { text: string }).text ?? '';
    // Keep whitespace (meaningful between inline runs); the block walker drops
    // whitespace-only nodes itself.
    return text.length > 0 ? { kind: 'text', text } : null;
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) return null;

  const el = node as HTMLElement;
  const tag = (el.rawTagName ?? el.tagName ?? '').toLowerCase();
  if (!tag || DROP_TAGS.has(tag)) return null;

  if (tag === 'svg') {
    return {
      kind: 'element',
      tag,
      classes: el.classList?.value ?? [],
      attrs: el.attributes ?? {},
      children: [],
      svg: el.outerHTML,
    };
  }

  const children: NNode[] = [];
  for (const child of el.childNodes) {
    const mapped = toNNode(child);
    if (mapped) children.push(mapped);
  }
  return {
    kind: 'element',
    tag,
    classes: el.classList?.value ?? [],
    attrs: el.attributes ?? {},
    children,
  };
}

/** Parse an article body (HTML) into the normalized tree. Empty input → []. */
export function parseArticleHtml(html: string): NNode[] {
  if (!html) return [];
  const root = parseHtml(html, { comment: false });
  const out: NNode[] = [];
  for (const child of root.childNodes) {
    const mapped = toNNode(child);
    if (mapped) out.push(mapped);
  }
  return out;
}
