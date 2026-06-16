import { View } from 'react-native';

import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

// Plain confirm sheet (S37 sign-out uses it). Now composes the shared AnimatedSheet
// (dim backdrop, weighted slide-up, drag-to-dismiss) so it animates identically to
// every other non-destructive sheet. The primary action is NOT destructive-styled —
// sign-out is reversible (you sign back in), so it uses the ordinary primary button,
// never a red/destructive treatment. Backdrop tap OR drag-down = cancel.

type ConfirmSheetProps = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <AnimatedSheet onDismiss={onCancel}>
      <View className="gap-2">
        <Text variant="heading">{title}</Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {body}
        </Text>
      </View>
      <View className="gap-2">
        <Button variant="primary" onPress={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onPress={onCancel}>
          {cancelLabel}
        </Button>
      </View>
    </AnimatedSheet>
  );
}
