import { describe, expect, it } from 'vitest';

import { type NElement, type NNode, isElement, textOf } from '@/features/content/html/ast';
import {
  calloutTone,
  classifyBlock,
  extractAccordion,
  extractTabs,
  isCitation,
} from '@/features/content/html/classify';
import { parseArticleHtml } from '@/features/content/html/parse';
import { isLeadParagraph, resolveTextStyle } from '@/features/content/html/tailwind';

// Helpers — the parser returns NNode[]; under noUncheckedIndexedAccess [0] is
// `NNode | undefined`, so assert presence (and element-ness) for terse tests.
function node0(html: string): NNode {
  const n = parseArticleHtml(html)[0];
  if (!n) throw new Error(`no node parsed from: ${html}`);
  return n;
}
function el0(html: string): NElement {
  const n = node0(html);
  if (!isElement(n)) throw new Error(`first node is not an element: ${html}`);
  return n;
}
function wrap(children: readonly NNode[]): NElement {
  return { kind: 'element', tag: 'x', classes: [], attrs: {}, children };
}

describe('parseArticleHtml', () => {
  it('decodes HTML entities so prose is verbatim', () => {
    const node = node0('<p>He said &quot;don&#39;t worry&quot; &amp; smiled — it&rsquo;s fine.</p>');
    expect(textOf(node)).toBe('He said "don\'t worry" & smiled — it’s fine.');
  });

  it('lowercases tags and exposes classes as an array', () => {
    const p = el0('<P class="lead text-xl">x</P>');
    expect(p.tag).toBe('p');
    expect(p.classes).toEqual(['lead', 'text-xl']);
  });

  it('captures <svg> as raw outerHTML and does not recurse into it', () => {
    const svg = el0('<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>');
    expect(svg.tag).toBe('svg');
    expect(svg.svg?.startsWith('<svg')).toBe(true);
    expect(svg.children.length).toBe(0);
  });

  it('drops script/style nodes', () => {
    const nodes = parseArticleHtml('<p>keep</p><script>evil()</script><style>.x{}</style>');
    expect(nodes.filter(isElement).map((n) => n.tag)).toEqual(['p']);
  });

  it('returns [] for empty input', () => {
    expect(parseArticleHtml('')).toEqual([]);
  });
});

describe('classifyBlock', () => {
  it('classifies standard prose tags', () => {
    expect(classifyBlock(node0('<p>x</p>'))).toBe('paragraph');
    expect(classifyBlock(node0('<h2>x</h2>'))).toBe('heading2');
    expect(classifyBlock(node0('<h3>x</h3>'))).toBe('heading3');
    expect(classifyBlock(node0('<h4>x</h4>'))).toBe('heading4');
    expect(classifyBlock(node0('<ul><li>x</li></ul>'))).toBe('list-unordered');
    expect(classifyBlock(node0('<ol><li>x</li></ol>'))).toBe('list-ordered');
    expect(classifyBlock(node0('<blockquote>x</blockquote>'))).toBe('quote');
    expect(classifyBlock(node0('<table><tr><td>x</td></tr></table>'))).toBe('table');
    expect(classifyBlock(node0('<figure><img src="a"/></figure>'))).toBe('figure');
    expect(classifyBlock(node0('<svg><path/></svg>'))).toBe('svg');
  });

  it('detects a callout from its left-accent + tint signature', () => {
    expect(
      classifyBlock(node0('<div class="rounded-xl border-l-4 border-l-teal-400 bg-teal-50">x</div>')),
    ).toBe('callout');
  });

  it('detects a card from rounded+border+padding', () => {
    expect(classifyBlock(node0('<div class="rounded-xl border border-gray-200 p-6">x</div>'))).toBe(
      'card',
    );
  });

  it('detects tabs (role=tablist) and accordion (data-state + trigger)', () => {
    expect(
      classifyBlock(node0('<div><div role="tablist"><button role="tab">A</button></div></div>')),
    ).toBe('tabs');
    expect(
      classifyBlock(node0('<div><div data-state="open"><button>Q</button><div>ans</div></div></div>')),
    ).toBe('accordion');
  });

  it('does NOT classify a generic wrapper that merely contains an accordion deep down', () => {
    // Regression: the outer wrapper must recurse (generic), not swallow siblings.
    expect(
      classifyBlock(
        node0('<div><p>intro</p><div><div data-state="closed"><button>Q</button><div>a</div></div></div></div>'),
      ),
    ).toBe('generic');
  });

  it('falls back to generic for an unknown wrapper (prose preserved downstream)', () => {
    expect(classifyBlock(node0('<div class="grid gap-4">x</div>'))).toBe('generic');
  });
});

describe('citations + tones + text style', () => {
  it('recognises a citation button by id prefix', () => {
    expect(isCitation(node0('<button id="citation-ref-3">3</button>'))).toBe(true);
    expect(isCitation(node0('<button id="x">y</button>'))).toBe(false);
  });

  it('derives a calm tone from the carried colour classes', () => {
    expect(calloutTone(['bg-teal-50', 'border-l-teal-400'])).toBe('teal');
    expect(calloutTone(['bg-amber-50'])).toBe('amber');
    expect(calloutTone(['bg-red-50'])).toBe('rose');
    expect(calloutTone(['bg-gray-50'])).toBe('neutral');
  });

  it('resolves alignment / italic / weight flags and lead', () => {
    expect(resolveTextStyle(['text-center', 'italic', 'font-bold'])).toEqual({
      align: 'center',
      italic: true,
      bold: true,
    });
    expect(isLeadParagraph(['lead', 'text-xl'])).toBe(true);
    expect(isLeadParagraph(['text-xl'])).toBe(false);
  });
});

describe('tabs / accordion extraction', () => {
  it('extracts tab labels + panel content by role', () => {
    const el = el0(
      '<div><div role="tablist"><button role="tab">First</button><button role="tab">Second</button></div>' +
        '<div role="tabpanel"><p>one</p></div><div role="tabpanel"><p>two</p></div></div>',
    );
    const tabs = extractTabs(el);
    expect(tabs.map((t) => t.label)).toEqual(['First', 'Second']);
    expect(textOf(wrap(tabs[0]?.content ?? []))).toBe('one');
  });

  it('extracts accordion heading + content, never dropping the answer prose', () => {
    const el = el0(
      '<div><div data-state="closed"><button>Question?</button><div role="region"><p>Answer prose.</p></div></div></div>',
    );
    const items = extractAccordion(el);
    expect(items[0]?.heading).toBe('Question?');
    expect(textOf(wrap(items[0]?.content ?? []))).toContain('Answer prose.');
  });
});
