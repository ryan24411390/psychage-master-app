import { render } from '@testing-library/react-native';

import { Terrain } from '@/components/terrain/Terrain';
import type { TerrainDay } from '@/components/terrain/terrain-geometry';

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
});
