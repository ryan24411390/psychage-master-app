import { useLocalSearchParams } from 'expo-router';

import { WebViewSurface } from '@/features/webview/WebViewSurface';

// S27 Provider detail — WebView chrome around /m/directory/provider/:id.
export default function ProviderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WebViewSurface surface="provider" params={typeof id === 'string' ? { id } : undefined} />;
}
