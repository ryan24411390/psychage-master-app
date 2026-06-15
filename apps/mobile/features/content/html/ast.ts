// Normalized node tree (NNode) — a small, parser-agnostic DOM the renderer and
// classifier consume. Decoupling from node-html-parser keeps the renderer and
// every unit test free of parser internals, and guarantees one place where text
// is captured (already entity-decoded → prose stays verbatim).

export type NText = { readonly kind: 'text'; readonly text: string };

export type NElement = {
  readonly kind: 'element';
  /** lowercased tag name */
  readonly tag: string;
  readonly classes: readonly string[];
  readonly attrs: Readonly<Record<string, string>>;
  readonly children: readonly NNode[];
  /** raw outerHTML, present only for <svg> (rendered verbatim via SvgXml) */
  readonly svg?: string;
};

export type NNode = NText | NElement;

export const isElement = (n: NNode): n is NElement => n.kind === 'element';
export const isText = (n: NNode): n is NText => n.kind === 'text';

/** Decoded text content of a node and all descendants (verbatim prose). */
export function textOf(node: NNode): string {
  if (isText(node)) return node.text;
  return node.children.map(textOf).join('');
}

/** Depth-first: all descendant elements (NOT including `node` itself). */
export function descendantElements(node: NElement): NElement[] {
  const out: NElement[] = [];
  const walk = (n: NNode) => {
    if (!isElement(n)) return;
    for (const child of n.children) {
      if (isElement(child)) {
        out.push(child);
        walk(child);
      }
    }
  };
  walk(node);
  return out;
}

/** True if `node` or any descendant element satisfies `pred`. */
export function someDescendant(node: NElement, pred: (e: NElement) => boolean): boolean {
  if (pred(node)) return true;
  return descendantElements(node).some(pred);
}
