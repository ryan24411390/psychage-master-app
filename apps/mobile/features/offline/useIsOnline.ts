import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// The one offline detector (rules/offline.md §3 names NetInfo → isConnected). Used
// by S25/S28 and the WebView chrome's offline hand-off. Optimistic default: assume
// online until told otherwise, so a slow first probe never flashes the fallback.
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let active = true;
    NetInfo
      .fetch()
      .then((state) => {
        if (active) setOnline(state.isConnected !== false);
      })
      .catch(() => {
        // Probe failed — keep the optimistic default (online) rather than leaving
        // an unhandled rejection.
        if (active) setOnline(true);
      });
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return online;
}
