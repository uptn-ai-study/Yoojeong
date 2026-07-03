import { useLayoutEffect } from 'react';
import { SafeAreaInsets } from '@apps-in-toss/web-framework';
import { applySafeAreaCssVarsIfChanged, readBrowserSafeAreaInsets } from '../utils/safeArea';

export default function SafeAreaSync() {
  useLayoutEffect(() => {
    let cleanupNative: (() => void) | undefined;

    try {
      applySafeAreaCssVarsIfChanged(SafeAreaInsets.get());
      cleanupNative = SafeAreaInsets.subscribe({
        onEvent: (insets) => applySafeAreaCssVarsIfChanged(insets),
      });
    } catch {
      applySafeAreaCssVarsIfChanged(readBrowserSafeAreaInsets());
    }

    const syncBrowserInsets = () => {
      applySafeAreaCssVarsIfChanged(readBrowserSafeAreaInsets());
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
