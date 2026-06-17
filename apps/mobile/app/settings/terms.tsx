import { LegalScreen } from '@/components/settings/LegalScreen';
import { CT4_SETTINGS } from '@/features/settings/copy';

// In-app Terms of Use. Copy (CT4_SETTINGS.legal.termsBody) approved by Dr. Dobson 2026-06-17.
export default function TermsScreen() {
  return <LegalScreen body={CT4_SETTINGS.legal.termsBody} testID="legal-terms" />;
}
