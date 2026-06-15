import { useLocalSearchParams } from 'expo-router';

import { ToolkitDetailView, getToolkitProgressStore } from '@/features/toolkits';

// Toolkit detail — a pushed route. The local-first progress store (singleton, which
// pulls in the Supabase client for best-effort sync) is resolved HERE and injected
// into the view, so the view stays render-testable with an in-memory double.
export default function ToolkitDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ToolkitDetailView id={typeof id === 'string' ? id : ''} store={getToolkitProgressStore()} />
  );
}
