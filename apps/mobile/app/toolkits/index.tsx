import { ToolkitsView } from '@/features/toolkits';

// Toolkits index — a pushed route (auto-registered file-based; no root/tabs edit).
// Browse published toolkits read live from the shared Supabase.
export default function ToolkitsIndexRoute() {
  return <ToolkitsView />;
}
