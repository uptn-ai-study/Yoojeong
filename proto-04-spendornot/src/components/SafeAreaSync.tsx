import { useEffect } from 'react';
import { SafeAreaInsets } from '@apps-in-toss/web-framework';
import { applySafeAreaCssVars, readBrowserSafeAreaInsets } from '../utils/safeArea';

export default function SafeAreaSync() {
  useEffect(() => {
    let cleanupNative: (() => void) | undefined;

    try {
      applySafeAreaCssVars(SafeAreaInsets.get());
      cleanupNative = SafeAreaInsets.subscribe({
        onEvent: (insets) => applySafeAreaCssVars(insets),
      });
    } catch {
      applySafeAreaCssVars(readBrowserSafeAreaInsets());
    }

    const syncBrowserInsets = () => {
      applySafeAreaCssVars(readBrowserSafeAreaInsets());
    };

    window.addEventListener('resize', syncBrowserInsets);
    window.addEventListener('orientationchange', syncBrowserInsets);
    window.visualViewport?.addEventListener('resize', syncBrowserInsets);

    return () => {
      cleanupNative?.();
      window.removeEventListener('resize', syncBrowserInsets);
      window.removeEventListener('orientationchange', syncBrowserInsets);
      window.visualViewport?.removeEventListener('resize', syncBrowserInsets);
    };
  }, []);

  return null;
}
