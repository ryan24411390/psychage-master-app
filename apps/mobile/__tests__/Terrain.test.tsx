import { render } from '@testing-library/react-native';

import { Terrain } from '@/components/terrain/Terrain';
import {
  entryDotY,
  TERRAIN_BASELINE_Y,
  TERRAIN_MIDLINE_Y,
  type TerrainDay,
} from '@/components/terrain/terrain-geometry';
import { terrainTokens } from '@/lib/a1-tokens';

// Collect every rendered svg <Circle>'s props from the serialized tree, so a
// fixture can assert WHERE each dot kind sits (cy) — not just that it exists.
// biome-ignore lint/suspicious/noExplicitAny: walking the untyped RNTL JSON tree
function collectCircles(node: any, out: Record<string, number>[] = []): Record<string, number>[] {
  if (!node) return out;
  if (Array.isArray(node)) {
    for (const child of node) collectCircles(child, out);
    return out;
  }
  if (typeof node === 'object') {
    if (typeof node.type === 'string' && node.type.toLowerCase().includes('circle')) {
      out.push(node.props ?? {});
    }
    if (node.children) collectCircles(node.children, out);
  }
  return out;
}

// biome-ignore lint/suspicious/noExplicitAny: walking the untyped RNTL JSON tree
function collectLines(node: any, out: Record<string, number>[] = []): Record<string, number>[] {
  if (!node) return out;
  if (Array.isArray(node)) {
    for (const child of node) collectLines(child, out);
    return out;
  }
  if (typeof node === 'object') {
    if (typeof node.type === 'string' && node.type.toLowerCase().includes('line')) {
      out.push(node.props ?? {});
    }
    if (node.children) collectLines(node.children, out);
  }
  return out;
}

// C0.3 — the terrain renders from RecordStore-shaped fixtures. Asserting on the
// serialized react-native-svg tree: the connecting polyline appears only when
// there are consecutive entries, the today marker + per-day VoiceOver labels are
// always present, and the empty week renders honestly (no line bridging gaps).
const MIXED: TerrainDay[] = [
  { label: 'Th', fullLabel: 'Thursday', value: 3 },
  { label: 'Fr', fullLabel: 'Friday', value: 2 },
  { label: 'Sa', fullLabel: 'Saturday', value: 1 },
  { label: 'Su', fullLabel: 'Sunday', value: null },
  { label: 'Mo', fullLabel: 'Monday', value: 2 },
  { label: 'Tu', fullLabel: 'Tuesday', value: 3 },
  { label: 'We', fullLabel: 'Wednesday', value: 'today' },
];

const EMPTY: TerrainDay[] = [
  { label: 'Th', fullLabel: 'Thursday', value: null },
  { label: 'Fr', fullLabel: 'Friday', value: null },
  { label: 'Sa', fullLabel: 'Saturday', value: null },
  { label: 'Su', fullLabel: 'Sunday', value: null },
  { label: 'Mo', fullLabel: 'Monday', value: null },
  { label: 'Tu', fullLabel: 'Tuesday', value: null },
  { label: 'We', fullLabel: 'Wednesday', value: 'today' },
];

describe('Terrain', () => {
  // react-native-svg compiles <Polyline> to an RNSVGPath; the terrain has no other
  // path, so RNSVGPath uniquely identifies the connecting line(s).
  it('renders a connecting line, the today marker, and VoiceOver labels from mixed data', () => {
    const json = JSON.stringify(render(<Terrain days={MIXED} width={318} />).toJSON());
    expect(json).toContain('RNSVGPath');
    expect(json).toContain('Tuesday: Good.');
    expect(json).toContain('Sunday: no entry.');
    expect(json).toContain('Today: not yet.');
  });

  it('renders an honest empty week — no connecting line', () => {
    const json = JSON.stringify(render(<Terrain days={EMPTY} width={318} />).toJSON());
    expect(json).not.toContain('RNSVGPath');
    expect(json).toContain('Today: not yet.');
  });

  // Proves the noEntryDot.atFraction token fix (copy-pasted 0.5 → 0.95) is consistent
  // with the render: the hollow no-entry dot sits ON the baseline (bottom band), while
  // the today marker sits at the midline. A gap-day fixture (Sunday null) drives it.
  it('places the no-entry dot at the baseline and the today marker at the midline', () => {
    const circles = collectCircles(render(<Terrain days={MIXED} width={318} />).toJSON());
    const noEntry = circles.find((c) => Number(c.r) === terrainTokens.noEntryDot.radius);
    const today = circles.find((c) => Number(c.r) === terrainTokens.todayDot.radius);
    expect(noEntry).toBeDefined();
    expect(today).toBeDefined();
    expect(Number(noEntry?.cy)).toBeCloseTo(TERRAIN_BASELINE_Y, 5);
    expect(Number(today?.cy)).toBeCloseTo(TERRAIN_MIDLINE_Y, 5);
    // baseline is the bottom band — distinctly below (greater y than) the midline
    expect(TERRAIN_BASELINE_Y).toBeGreaterThan(TERRAIN_MIDLINE_Y);
  });

  // A multi-modal day renders the honest low→high span: a vertical capsule from the
  // worst-of-day dot up to the best, plus the spanned VoiceOver label.
  it('renders a low→high band (a vertical line) for a multi-modal day', () => {
    const banded: TerrainDay[] = [
      { label: 'Fr', fullLabel: 'Friday', value: 1, high: 3 },
      { label: 'Sa', fullLabel: 'Saturday', value: 2 },
      { label: 'Su', fullLabel: 'Sunday', value: 'today' },
    ];
    const tree = render(<Terrain days={banded} width={318} />).toJSON();
    expect(JSON.stringify(tree)).toContain('Friday: Low to Good.');
    // The baseline is a horizontal line (y1 === y2); the band is vertical (x1 === x2),
    // spanning from entryDotY(high) up to entryDotY(low).
    const vertical = collectLines(tree).find((l) => Number(l.x1) === Number(l.x2));
    expect(vertical).toBeDefined();
    expect(Number(vertical?.y1)).toBeCloseTo(entryDotY(3), 5); // top = high
    expect(Number(vertical?.y2)).toBeCloseTo(entryDotY(1), 5); // bottom = worst-of-day
  });
});
