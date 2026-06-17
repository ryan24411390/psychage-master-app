import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { WV_ORIGIN } from './wv-url';

export function WebViewPrewarmer() {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Unmount after 5 seconds to free memory.
    // By then, the underlying web engine has cached the DNS and base assets,
    // meaning subsequent WebView mounts in the app will be nearly instantaneous.
    const timer = setTimeout(() => {
      setShouldRender(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  return (
    <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} pointerEvents="none">
      <WebView
        source={{ uri: WV_ORIGIN }}
        style={{ flex: 1 }}
        cacheEnabled={true}
      />
    </View>
  );
}
