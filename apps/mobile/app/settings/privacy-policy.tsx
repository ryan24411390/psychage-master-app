import { LegalScreen } from '@/components/settings/LegalScreen';
import { CT4_SETTINGS } from '@/features/settings/copy';

// In-app Privacy Policy (distinct from settings/privacy.tsx, which is the data-control
// toggles). Copy is FIXTURE (CT4_SETTINGS.legal.privacyBody) pending legal sign-off.
export default function PrivacyPolicyScreen() {
  return <LegalScreen body={CT4_SETTINGS.legal.privacyBody} testID="legal-privacy" />;
}
