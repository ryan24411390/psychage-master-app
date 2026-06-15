import { Info } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { CT4_CONTENT } from '@/features/content/copy';
import { colors } from '@/lib/colors';

// SR-3 educational framing on the article reader. A persistent, low-key reminder
// that the library is education — not a diagnosis, not treatment — and a pointer
// to the always-present Help now (SR-2). Mirrors the conditions/Sleep disclaimer
// pattern. Copy is CT4 (Dr. Dobson review before ship).
export function MedicalDisclaimer() {
  const { colorScheme } = useColorScheme();
  const tint = colorScheme === 'dark' ? colors.text.tertiary.dark : colors.text.tertiary.light;
  return (
    <Card className="flex-row gap-2 px-4 py-3" testID="article-disclaimer">
      <Info size={16} color={tint} strokeWidth={1.75} />
      <Text
        variant="caption"
        className="flex-1 leading-5 text-text-tertiary dark:text-text-tertiary-dark"
      >
        {CT4_CONTENT.disclaimer}
      </Text>
    </Card>
  );
}
