import { SafeAreaInsets as TossSafeAreaInsets } from '@apps-in-toss/web-framework';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

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

let lastAppliedInsetsKey = '';

export function applySafeAreaCssVarsIfChanged(insets: SafeAreaInsets) {
  const nextKey = `${insets.top}:${insets.bottom}:${insets.left}:${insets.right}`;
  if (nextKey === lastAppliedInsetsKey) {
    return;
  }

  lastAppliedInsetsKey = nextKey;
  applySafeAreaCssVars(insets);
}

export function resolveNativeSafeAreaInsets(): SafeAreaInsets | null {
  try {
    return TossSafeAreaInsets.get();
  } catch {
    return null;
  }
}
