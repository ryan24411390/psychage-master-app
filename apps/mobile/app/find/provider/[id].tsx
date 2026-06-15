import { useLocalSearchParams } from 'expo-router';

import { ProviderDetailView } from '@/features/directory/ProviderDetailView';

// S27 Provider detail — NATIVE (real shared-Supabase data). Replaced the WebView
// wrapper; the web /m/directory/provider/:id surface was never built.
export default function ProviderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProviderDetailView id={typeof id === 'string' ? id : ''} />;
}
