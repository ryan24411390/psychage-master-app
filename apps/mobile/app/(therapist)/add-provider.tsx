import { useRouter } from 'expo-router';

import { ProviderForm } from '@/components/therapist/ProviderForm';
import { useProvider } from '@/features/therapist';

// S39 — Add provider. Thin route: stores the one provider, advances to the range step.
export default function AddProviderScreen() {
  const router = useRouter();
  const { setProvider } = useProvider();

  return (
    <ProviderForm
      onSubmit={(provider) => {
        setProvider(provider);
        router.push('/range');
      }}
    />
  );
}
