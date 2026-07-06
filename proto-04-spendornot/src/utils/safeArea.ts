import { SafeAreaInsets as TossSafeAreaInsets } from '@apps-in-toss/web-framework';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** iOS 홈 인디케이터 기본값 — env()/native 미제공 시 폴백 */
const MOBILE_BOTTOM_INSET_FALLBACK_PX = 34;

let lastAppliedInsetsKey = '';
let nativeSafeAreaAvailable = false;
let peakNativeBottomInset = 0;

function readEnvInset(property: string): number {
  if (typeof document === 'undefined') {
    return 0;
  }

  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.paddingTop = property;
  document.documentElement.appendChild(probe);
  const value = Number.parseFloat(getComputedStyle(probe).paddingTop) || 0;
  document.documentElement.removeChild(probe);
  return value;
}

export function readBrowserSafeAreaInsets(): SafeAreaInsets {
  return {
    top: readEnvInset('env(safe-area-inset-top)'),
    bottom: readEnvInset('env(safe-area-inset-bottom)'),
    left: readEnvInset('env(safe-area-inset-left)'),
    right: readEnvInset('env(safe-area-inset-right)'),
  };
}

export function isNativeSafeAreaAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const w = window as Window & {
    __GRANITE_NATIVE_EMITTER?: unknown;
    ReactNativeWebView?: unknown;
  };

  // dev polyfill은 get()만 가능하고 subscribe는 __GRANITE_NATIVE_EMITTER가 필요합니다.
  if (!w.__GRANITE_NATIVE_EMITTER && !w.ReactNativeWebView) {
    return false;
  }

  try {
    TossSafeAreaInsets.get();
    return true;
  } catch {
    return false;
  }
}

export function clearSafeAreaInsetsCache(): void {
  lastAppliedInsetsKey = '';
}

function normalizeInsets(insets: SafeAreaInsets, source: 'native' | 'browser'): SafeAreaInsets {
  const bottomWithFloor = Math.max(insets.bottom, MOBILE_BOTTOM_INSET_FALLBACK_PX);

  if (source === 'native') {
    peakNativeBottomInset = Math.max(peakNativeBottomInset, bottomWithFloor);
    return { ...insets, bottom: bottomWithFloor };
  }

  // 토스 웹뷰 재진입 시 env()가 0으로 떨어져 native 값을 덮어쓰지 않도록 보호
  const bottom = Math.max(bottomWithFloor, peakNativeBottomInset);
  return { ...insets, bottom };
}

export function applySafeAreaCssVars(insets: SafeAreaInsets) {
  if (typeof document === 'undefined') {
    return;
  }

  const { top, bottom, left, right } = insets;
  const targets = [document.documentElement, document.body];

  for (const target of targets) {
    target.style.setProperty('--toss-safe-area-top', `${top}px`);
    target.style.setProperty('--toss-safe-area-bottom', `${bottom}px`);
    target.style.setProperty('--toss-pure-safe-area-top', `${top}px`);
    target.style.setProperty('--toss-pure-safe-area-bottom', `${bottom}px`);
    target.style.setProperty('--toss-pure-safe-area-left', `${left}px`);
    target.style.setProperty('--toss-pure-safe-area-right', `${right}px`);
  }
}

export function applySafeAreaCssVarsIfChanged(
  insets: SafeAreaInsets,
  source: 'native' | 'browser' = 'native',
) {
  const normalized = normalizeInsets(insets, source);
  const nextKey = `${normalized.top}:${normalized.bottom}:${normalized.left}:${normalized.right}:${source}`;
  if (nextKey === lastAppliedInsetsKey) {
    return;
  }

  lastAppliedInsetsKey = nextKey;
  applySafeAreaCssVars(normalized);
}

export function resolveNativeSafeAreaInsets(): SafeAreaInsets | null {
  try {
    nativeSafeAreaAvailable = true;
    return TossSafeAreaInsets.get();
  } catch {
    return null;
  }
}

export function shouldUseBrowserSafeAreaFallback(): boolean {
  return !nativeSafeAreaAvailable && !isNativeSafeAreaAvailable();
}

export { MOBILE_BOTTOM_INSET_FALLBACK_PX };
