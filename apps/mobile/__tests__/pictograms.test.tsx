import { render } from '@testing-library/react-native';
import { processColor } from 'react-native';

import { CompassPictogram } from '@/components/pictograms/Compass';
import { FindPictogram } from '@/components/pictograms/Find';
import { LearnPictogram } from '@/components/pictograms/Learn';
import type { PictogramProps } from '@/components/pictograms/shared';
import { TodayPictogram } from '@/components/pictograms/Today';

// The four tab pictograms each render an SVG with exactly one teal dot
// (color.primary.default — light register #1A9B8C in jest's default scheme).
// react-native-svg normalizes color props to ARGB integers in toJSON, so we
// match the processColor() integer (derived from the source hex, not a magic
// number) to prove the constant dot — and the passed ink — are present.
const TEAL = String(processColor('#1A9B8C'));

const PICTOGRAMS: ReadonlyArray<readonly [string, (props: PictogramProps) => React.JSX.Element]> = [
  ['Today', TodayPictogram],
  ['Learn', LearnPictogram],
  ['Compass', CompassPictogram],
  ['Find', FindPictogram],
];

describe('tab pictograms', () => {
  it.each(PICTOGRAMS)('%s renders an svg carrying the teal dot', (_name, Pictogram) => {
    const tree = render(<Pictogram color="#57534e" />).toJSON();
    expect(tree).toBeTruthy();
    expect(JSON.stringify(tree)).toContain(TEAL);
  });

  it('uses the passed ink color for the body, distinct from the teal dot', () => {
    const ink = String(processColor('#0a0a0a'));
    const json = JSON.stringify(render(<TodayPictogram color="#0a0a0a" />).toJSON());
    expect(json).toContain(ink); // body ink (active tint)
    expect(json).toContain(TEAL); // constant teal dot
    expect(ink).not.toBe(TEAL);
  });
});
