import { Text } from '@/components/ui/Text';

// C-REL-PHRASE — relevance shown as a closed-vocabulary TEXT phrase only
// (Possible · Likely · Strong match). NEVER a bar, meter, gauge, or percentage. The
// 75% cap is the engine's CONFIDENCE_CAP applied to the score; the phrase is all the
// user sees. `phrase` is the engine's relevance_label (capped tier).

export interface RelevancePhraseProps {
  readonly phrase: string;
}

export function RelevancePhrase({ phrase }: RelevancePhraseProps) {
  return (
    <Text
      variant="caption"
      className="uppercase tracking-wide text-text-secondary dark:text-text-secondary-dark"
    >
      {phrase}
    </Text>
  );
}
