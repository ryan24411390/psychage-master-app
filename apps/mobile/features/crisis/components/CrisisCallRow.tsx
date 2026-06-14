import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

import { type Dial, dial as defaultDial } from '../dialer';
import type { HelplineRow } from '../helpline-schema';
import { smsUrl, telUrl } from '../intents';

// One helpline row on S11: service name · five-word description · a Call pill (when the
// row has a voice number) and a Text pill (when it has a text number). A text-only line
// renders no Call pill; a call-only line renders no Text pill — the schema carries the
// two numbers independently so we never dial or text the wrong one. Row ≥56px and grows
// on wrap. Action pills are rust-OUTLINE (≥44px) — never filled; the single filled rust
// element on the surface is the emergency button. No haptics here (PLAIN register; the
// pills open the dialer/messaging directly). `dial` is injectable so a render test
// asserts the tel:/sms: intent without the native layer.
//
// Reused verbatim by the Navigator halt screen (S17) — do not fork it there.

export interface CrisisCallRowProps {
  readonly row: HelplineRow;
  readonly dial?: Dial;
}

function CrisisActionPill({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="min-h-[44px] min-w-[64px] items-center justify-center rounded-full border border-crisis px-4"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Text variant="bodyMedium" className="text-crisis">
        {label}
      </Text>
    </Pressable>
  );
}

export function CrisisCallRow({ row, dial = defaultDial }: CrisisCallRowProps) {
  // Destructure so TS narrows each number to a non-null string inside the press handlers.
  const { name, callNumber, textNumber } = row;
  return (
    <View className="min-h-[56px] flex-row items-center justify-between gap-3 border-b border-border py-3 dark:border-border-dark">
      <View className="flex-1">
        <Text variant="bodyMedium">{name}</Text>
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          {row.fiveWordDesc}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {callNumber ? (
          <CrisisActionPill
            label="Call"
            accessibilityLabel={`Call ${name}`}
            onPress={() => dial(telUrl(callNumber))}
          />
        ) : null}
        {textNumber ? (
          <CrisisActionPill
            label="Text"
            accessibilityLabel={`Text ${name}`}
            onPress={() => dial(smsUrl(textNumber))}
          />
        ) : null}
      </View>
    </View>
  );
}
