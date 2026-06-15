import { DirectoryView } from '@/features/directory/DirectoryView';

// S26 Directory — NATIVE provider list (real shared-Supabase data). Replaced the
// WebView wrapper; the web /m/directory surface was never built.
export default function DirectoryRoute() {
  return <DirectoryView />;
}
