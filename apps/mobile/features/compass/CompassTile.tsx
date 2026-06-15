import type { ElementType } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';

export type CompassTileTint = 'now' | 'patterns' | 'understand';
export type CompassTileVariant = 'hero' | 'standard';

type CompassTileProps = {
  title: string;
  subLabel: string;
  onPress: () => void;
  tint: CompassTileTint;
  icon: ElementType;
  variant?: CompassTileVariant;
  index: number;
  total: number;
  testID?: string;
};

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function interpolateColor(color1: string, color2: string, factor: number) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = c1.r + factor * (c2.r - c1.r);
  const g = c1.g + factor * (c2.g - c1.g);
  const b = c1.b + factor * (c2.b - c1.b);
  return rgbToHex(r, g, b);
}

const ANCHORS = {
  now: { light: '#EAF4F1', deep: '#D6EAE5' },
  patterns: { light: '#F0EDF6', deep: '#E2DCEF' },
  understand: { light: '#EAEFF4', deep: '#D8E2EC' },
};

export function CompassTile({
  title,
  subLabel,
  onPress,
  tint,
  icon: Icon,
  variant = 'standard',
  index,
  total,
  testID,
}: CompassTileProps) {
  const isHero = variant === 'hero';

  const { light, deep } = ANCHORS[tint];
  const topColor = interpolateColor(light, deep, index / total);
  const bottomColor = interpolateColor(light, deep, (index + 1) / total);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      testID={testID}
      className={`rounded-xl border border-border-hairline overflow-hidden ${isHero ? 'w-full' : 'flex-1'} p-4`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%">
          <Defs>
            <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={topColor} stopOpacity="1" />
              <Stop offset="1" stopColor={bottomColor} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
        </Svg>
      </View>
      
      <View className="absolute bottom-[-20px] right-[-20px]" style={{ opacity: 0.08 }} pointerEvents="none">
        <Icon size={120} color={deep} />
      </View>

      <View className={`relative z-10 gap-3 ${isHero ? 'flex-row items-center' : 'flex-col'}`}>
        <View className="flex-1 justify-center">
          <Text variant="heading">{title}</Text>
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark mt-1">
            {subLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
