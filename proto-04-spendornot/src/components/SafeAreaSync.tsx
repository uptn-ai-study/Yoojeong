import { useLayoutEffect } from 'react';
import { SafeAreaInsets } from '@apps-in-toss/web-framework';
import {
  applySafeAreaCssVarsIfChanged,
  clearSafeAreaInsetsCache,
  isNativeSafeAreaAvailable,
  readBrowserSafeAreaInsets,
} from '../utils/safeArea';

export default function SafeAreaSync() {
  useLayoutEffect(() => {
    let cleanupNative: (() => void) | undefined;
    let useNativeSafeArea = false;

    try {
      clearSafeAreaInsetsCache();
      applySafeAreaCssVarsIfChanged(SafeAreaInsets.get(), 'native');
      cleanupNative = SafeAreaInsets.subscribe({
        onEvent: (insets) => applySafeAreaCssVarsIfChanged(insets, 'native'),
      });
      useNativeSafeArea = true;
    } catch {
      clearSafeAreaInsetsCache();
      applySafeAreaCssVarsIfChanged(readBrowserSafeAreaInsets(), 'browser');
    }

    const syncNativeInsets = () => {
      if (!useNativeSafeArea && !isNativeSafeAreaAvailable()) {
        applySafeAreaCssVarsIfChanged(readBrowserSafeAreaInsets(), 'browser');
        return;
      }

      try {
        clearSafeAreaInsetsCache();
        applySafeAreaCssVarsIfChanged(SafeAreaInsets.get(), 'native');
      } catch {
        applySafeAreaCssVarsIfChanged(readBrowserSafeAreaInsets(), 'browser');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncNativeInsets();
      }
    };

    window.addEventListener('pageshow', syncNativeInsets);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('orientationchange', syncNativeInsets);
    window.visualViewport?.addEventListener('resize', syncNativeInsets);

    if (!useNativeSafeArea) {
      window.addEventListener('resize', syncNativeInsets);
    }

    return () => {
      cleanupNative?.();
      window.removeEventListener('pageshow', syncNativeInsets);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('orientationchange', syncNativeInsets);
      window.visualViewport?.removeEventListener('resize', syncNativeInsets);
      window.removeEventListener('resize', syncNativeInsets);
    };
  }, []);

  return null;
}
