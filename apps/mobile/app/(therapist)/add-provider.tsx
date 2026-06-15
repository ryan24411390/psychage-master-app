import { useLocalSearchParams, useRouter } from 'expo-router';

import { ProviderForm } from '@/components/therapist/ProviderForm';
import { useProvider } from '@/features/therapist';

// S39 — Add provider. Thin route: stores the one provider, advances to the range step.
// When reached from the directory (S27 "Use in my therapist record") the name/contact
// arrive as params and pre-seed the form (still editable). Params are read-only here
// and the contact stays in-memory — never persisted/logged (Sacred Rule #11).
export default function AddProviderScreen() {
  const router = useRouter();
  const { setProvider } = useProvider();
  const { name, contact } = useLocalSearchParams<{ name?: string; contact?: string }>();

  return (
    <ProviderForm
      initialName={typeof name === 'string' ? name : ''}
      initialContact={typeof contact === 'string' ? contact : ''}
      onSubmit={(provider) => {
        setProvider(provider);
        router.push('/range');
      }}
    />
  );
}
