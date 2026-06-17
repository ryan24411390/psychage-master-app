import { LegalScreen } from '@/components/settings/LegalScreen';
import { CT4_SETTINGS } from '@/features/settings/copy';

// In-app Terms of Use. Copy is FIXTURE (CT4_SETTINGS.legal.termsBody) pending legal
// sign-off; the screen + route ship now so the app no longer depends on an external URL.
export default function TermsScreen() {
  return <LegalScreen body={CT4_SETTINGS.legal.termsBody} testID="legal-terms" />;
}
