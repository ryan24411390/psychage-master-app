import { ScreenShell } from '@/components/ui/ScreenShell';
import { DirectoryView } from '@/features/directory/DirectoryView';
import { LocationSetup } from '@/features/directory/LocationSetup';
import { OfflineFallback } from '@/features/offline/OfflineFallback';
import { useIsOnline } from '@/features/offline/useIsOnline';
import { useDirectoryLocation } from '@/lib/use-directory-location';

// S28 Find tab — the directory IS the tab (no dead landing tap). A one-time
// location gate runs on first visit (LocationSetup persists a home browse scope);
// every visit after lands straight in the directory, scoped to that state. The
// tabs GlobalHeader (with the crisis pill, SR-2) sits above this content, so the
// embedded directory does not render its own header. Online-only per
// rules/offline.md; offline shows the honest fallback.
export default function FindScreen() {
  const online = useIsOnline();
  const loc = useDirectoryLocation();

  if (!online) {
    return (
      <ScreenShell edges={['bottom']}>
        <OfflineFallback variant="offline" testID="find-offline" />
      </ScreenShell>
    );
  }

  if (!loc.configured) {
    return <LocationSetup />;
  }

  return <DirectoryView embedded initialState={loc.stateAbbr} initialCity={loc.city} />;
}
