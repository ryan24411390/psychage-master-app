import Svg, { Polyline } from 'react-native-svg';

// Minimal sleep-length trend. Factual measured data (total sleep per night), not a
// verdict — so a plain line is fine and stays within SR-1 (no score number/gauge).
// Uses react-native-svg (already a dep); avoids pulling in a charting library.

type SparklineProps = {
  values: readonly number[];
  width: number;
  height?: number;
  color: string;
};

export function Sparkline({ values, width, height = 56, color }: SparklineProps) {
  if (values.length < 2 || width <= 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const pad = 4;
  const usable = height - pad * 2;

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - pad - ((v - min) / range) * usable;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height} accessibilityRole="image">
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
