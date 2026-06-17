import { Text } from 'react-native';

import { Text as UIText } from '@/components/ui/Text';

export function PsychageLogo({ className }: { className?: string }) {
  return (
    <UIText variant="h2" className={className} accessibilityRole="header" accessibilityLabel="Psychage">
      <Text className="text-primary dark:text-primary-dark">Psy</Text>
      <Text className="text-text-primary dark:text-text-primary-dark">chage</Text>
    </UIText>
  );
}
