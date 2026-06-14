import { Text } from '@/components/ui/Text';
import { READ_CREDIT } from '@/lib/home-model';

// The Dr. Lena Dobson credit line — VERBATIM and FULL, the SINGLE enforcement point
// wherever reviewed content appears. Imports READ_CREDIT (never retyped); has NO
// `numberOfLines` and no truncation prop, so the credential can never be shortened.
export function ReviewedByCredit() {
  return (
    <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
      {READ_CREDIT}
    </Text>
  );
}
