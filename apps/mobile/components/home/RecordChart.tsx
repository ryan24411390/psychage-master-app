import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/Text';
import type { TerrainDay } from '@/components/terrain/terrain-geometry';

type RecordChartProps = {
  days: readonly TerrainDay[];
  insight: { headline: string; consistency: string } | null;
  width: number;
};

export function RecordChart({ days, insight, width }: RecordChartProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const lineColor = isDark ? '#A1A1AA' : '#52525B'; // zinc-400 / zinc-600
  const dotColor = isDark ? '#4FD1C5' : '#0F766E'; // teal-400 / teal-700
  const gridColor = isDark ? '#3F3F46' : '#E4E4E7'; // zinc-700 / zinc-200

  const h = 100;
  const pdX = 10;
  const pdY = 20;
  
  const segments: { d: string }[] = [];
  let currentPath = "";
  
  const step = (width - pdX * 2) / (days.length - 1);
  const getY = (val: number) => pdY + ((4 - val) / 4) * (h - pdY * 2);

  days.forEach((day, i) => {
    if (typeof day.value === 'number') {
      const x = pdX + i * step;
      const y = getY(day.value);
      if (!currentPath) {
        currentPath = `M ${x} ${y}`;
      } else {
        currentPath += ` L ${x} ${y}`;
      }
    } else {
      if (currentPath) {
        segments.push({ d: currentPath });
        currentPath = "";
      }
    }
  });
  if (currentPath) segments.push({ d: currentPath });

  return (
    <View className="gap-4">
      {insight ? (
        <View className="gap-1">
          <Text variant="bodyBold" className="text-text-primary dark:text-text-primary-dark">{insight.headline}</Text>
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">{insight.consistency}</Text>
        </View>
      ) : (
        <Text variant="bodyBold" className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-2">No history to show yet.</Text>
      )}
      <View style={{ width, height: h }}>
        <Svg width={width} height={h}>
          {[0, 1, 2, 3, 4].map(v => (
            <Line key={v} x1={0} x2={width} y1={getY(v)} y2={getY(v)} stroke={gridColor} strokeWidth={1} strokeDasharray="2 4" />
          ))}
          {segments.map((seg, i) => (
            <Path key={i} d={seg.d} stroke={lineColor} strokeWidth={2} fill="none" />
          ))}
          {days.map((day, i) => {
            if (typeof day.value === 'number') {
              const x = pdX + i * step;
              const y = getY(day.value);
              return <Circle key={i} cx={x} cy={y} r={4} fill={dotColor} />;
            }
            return null;
          })}
        </Svg>
        <View className="flex-row justify-between mt-2">
          {days.map((day, i) => (
            i % 2 === 0 && <Text key={i} variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark text-[10px] w-6 text-center">{day.label}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}
