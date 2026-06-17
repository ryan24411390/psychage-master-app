import { LegalScreen } from '@/components/settings/LegalScreen';
import { CT4_SETTINGS } from '@/features/settings/copy';

// In-app Educational use & medical disclaimer — the "medically liable" surface.
// Copy (CT4_SETTINGS.legal.disclaimerBody) approved by Dr. Dobson 2026-06-17.
export default function DisclaimerScreen() {
  return <LegalScreen body={CT4_SETTINGS.legal.disclaimerBody} testID="legal-disclaimer" />;
}
