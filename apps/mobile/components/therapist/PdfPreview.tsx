import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { Terrain } from '@/components/terrain/Terrain';
import type { TerrainDay } from '@/components/terrain/terrain-geometry';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { THERAPIST_COPY } from '@/features/therapist/copy';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S41 — PDF preview + share. The name is EDITABLE (ratified — the provider files by
// it). The on-screen preview reuses the C0.3 Terrain; the actual PDF is generated
// locally from the same range data in the print stylesheet. Share hands the PDF to
// the platform sheet (PII-on-share flagged). Empty range → honest line; the PDF still
// lists no-entry days.
type PdfPreviewProps = {
  initialName: string;
  /** "Jun 8 – Jun 25 · 18 days, 14 entries" */
  summaryLine: string;
  terrainDays: readonly TerrainDay[];
  isEmpty: boolean;
  onShare: (fullName: string) => void;
};

export function PdfPreview({
  initialName,
  summaryLine,
  terrainDays,
  isEmpty,
  onShare,
}: PdfPreviewProps) {
  const reduced = useReducedMotion();
  const [name, setName] = useState(initialName);
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 gap-5 pt-6"
      >
        <AuthTextField
          label={THERAPIST_COPY.previewNameLabel}
          fieldAccessibilityHint={THERAPIST_COPY.previewNameHint}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {summaryLine}
        </Text>

        <Card onLayout={onLayout} className="p-3">
          {width > 0 ? <Terrain days={terrainDays} width={width - 24} /> : null}
        </Card>

        {isEmpty ? (
          <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
            {THERAPIST_COPY.emptyRangeLine}
          </Text>
        ) : null}

        <View className="mt-auto">
          <Button variant="primary" onPress={() => onShare(name.trim())}>
            {THERAPIST_COPY.sharePrimary}
          </Button>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}
