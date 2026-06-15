import { useColorScheme } from 'nativewind';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import {
  colorForScheme,
  fontFamilies,
  resolveColorRef,
  type ThemedColor,
  terrainTokens,
} from '@/lib/a1-tokens';

import {
  connectingSegments,
  dayA11yLabel,
  entryDotY,
  TERRAIN_BASELINE_Y,
  TERRAIN_HEIGHT,
  TERRAIN_LABEL_Y,
  TERRAIN_MIDLINE_Y,
  type TerrainDay,
  xFor,
} from './terrain-geometry';

// C0.3 the terrain — a react-native-svg port of v5's renderTerrain(), parameterized
// by row count (days.length) + width. Three future consumers: S3 7-day, S7
// continuum, S9 reflection. Tinted entry dots r6.5 + a 1px charcoal.500 ring (the
// load-bearing contrast rescue — do NOT change) at fill heights; hollow r4 dots at
// the baseline for no-entry days; today = a dashed open r8 circle at the midline;
// a connecting line ONLY between consecutive entries. No aggregates anywhere.
// Reduced motion: no settle (terrain never animates). Colors per the terrain token
// group: connectingLine = border.default (lighter than v5's border-strong) and the
// today stroke = teal (v5 used grey ink-3) — both deliberate token bindings.

type TerrainProps = {
  days: readonly TerrainDay[];
  width: number;
};

export function Terrain({ days, width }: TerrainProps) {
  const { colorScheme } = useColorScheme();
  const pick = (themed: ThemedColor) => colorForScheme(themed, colorScheme);

  const ringColor = pick(terrainTokens.color.dotRing);
  const lineColor = pick(terrainTokens.color.connectingLine);
  const labelColor = pick(terrainTokens.color.label);
  const labelTodayColor = pick(resolveColorRef('color.text.secondary'));
  const todayStroke = pick(terrainTokens.color.todayDotStroke);

  const count = days.length;
  const segments = connectingSegments(days, width);

  return (
    <Svg width={width} height={TERRAIN_HEIGHT} viewBox={`0 0 ${width} ${TERRAIN_HEIGHT}`}>
      <Line
        x1={6}
        y1={TERRAIN_BASELINE_Y}
        x2={width - 6}
        y2={TERRAIN_BASELINE_Y}
        stroke={lineColor}
        strokeWidth={1}
      />
      {segments.map((segment, segIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: terrain segments are positional, computed in fixed order, never reordered or filtered
        <Polyline key={`seg-${segIndex}`}
          points={segment.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={lineColor}
          strokeWidth={terrainTokens.connectingLineWidth}
        />
      ))}
      {days.map((day, i) => {
        const x = xFor(i, count, width);
        const isTodayColumn = i === count - 1;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: terrain day slots are positional (slot N is always day N) and never reorder; labels repeat across longer ranges so the index is the stable identity
          <G key={`day-${day.label}-${i}`} accessible accessibilityLabel={dayA11yLabel(day)}>
            {typeof day.value === 'number' ? (
              <Circle
                cx={x}
                cy={entryDotY(day.value)}
                r={terrainTokens.dot.radius}
                fill={pick(terrainTokens.color.moodTint[day.value])}
                stroke={ringColor}
                strokeWidth={terrainTokens.dot.ringWidth}
              />
            ) : day.value === null ? (
              <Circle
                cx={x}
                cy={TERRAIN_BASELINE_Y}
                r={terrainTokens.noEntryDot.radius}
                fill="none"
                stroke={ringColor}
                strokeWidth={1.2}
              />
            ) : (
              <Circle
                cx={x}
                cy={TERRAIN_MIDLINE_Y}
                r={terrainTokens.todayDot.radius}
                fill="none"
                stroke={todayStroke}
                strokeWidth={terrainTokens.todayDot.strokeWidth}
                strokeDasharray={[...terrainTokens.todayDot.dash]}
              />
            )}
            <SvgText
              x={x}
              y={TERRAIN_LABEL_Y}
              textAnchor="middle"
              fontFamily={isTodayColumn ? fontFamilies.sansMedium : fontFamilies.sans}
              fontSize={terrainTokens.label.size}
              fill={isTodayColumn ? labelTodayColor : labelColor}
            >
              {day.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
