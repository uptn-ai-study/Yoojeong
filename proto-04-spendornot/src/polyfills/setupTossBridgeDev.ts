import {
  BRAND_DISPLAY_NAME,
  BRAND_ICON_LIGHT,
  BRAND_PRIMARY_COLOR,
} from '../constants/brand';
import {
  applySafeAreaCssVars,
  readBrowserSafeAreaInsets,
  resolveNativeSafeAreaInsets,
} from '../utils/safeArea';

type ConstantHandlerMap = Record<string, () => unknown>;

declare global {
  interface Window {
    __CONSTANT_HANDLER_MAP?: ConstantHandlerMap;
  }
}

function installTossBridgeDevHandlers() {
  const currentMap = window.__CONSTANT_HANDLER_MAP ?? {};

  if (typeof currentMap.getSafeAreaInsets === 'function') {
    return;
  }

  const browserInsets = readBrowserSafeAreaInsets();

  const devHandlers: ConstantHandlerMap = {
    getSafeAreaInsets: () => browserInsets,
    brandPrimaryColor: () => BRAND_PRIMARY_COLOR,
    brandDisplayName: () => BRAND_DISPLAY_NAME,
    brandIcon: () => BRAND_ICON_LIGHT,
    deploymentId: () => 'dev-local',
    getDeploymentId: () => 'dev-local',
    getPlatformOS: () => 'ios',
    getTossAppVersion: () => '0.0.0',
    getOperationalEnvironment: () => 'sandbox',
  };

  window.__CONSTANT_HANDLER_MAP = {
    ...currentMap,
    ...devHandlers,
  };
}

function syncInitialSafeArea() {
  const nativeInsets = resolveNativeSafeAreaInsets();
  applySafeAreaCssVars(nativeInsets ?? readBrowserSafeAreaInsets());
}

installTossBridgeDevHandlers();
syncInitialSafeArea();
