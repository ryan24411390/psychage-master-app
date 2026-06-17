import { LegalScreen } from '@/components/settings/LegalScreen';
import { CT4_SETTINGS } from '@/features/settings/copy';

// In-app Educational use & medical disclaimer — the "medically liable" surface.
// Copy is FIXTURE (CT4_SETTINGS.legal.disclaimerBody) pending Dr. Dobson + legal.
export default function DisclaimerScreen() {
  return <LegalScreen body={CT4_SETTINGS.legal.disclaimerBody} testID="legal-disclaimer" />;
}
