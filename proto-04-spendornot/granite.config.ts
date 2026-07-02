import { defineConfig } from '@apps-in-toss/web-framework/config';
import {
  BRAND_DISPLAY_NAME,
  BRAND_ICON_DARK,
  BRAND_ICON_LIGHT,
  BRAND_PRIMARY_COLOR,
} from './src/constants/brand';

/**
 * 앱인토스 콘솔 등록 정보와 동일하게 유지해 주세요.
 * - appName: 콘솔 앱 ID (intoss://{appName})
 * - brand.icon: 라이트 모드 로고 URL (번들·네이티브 브랜딩에 사용)
 * - brand.iconDark: 다크 모드 로고 URL (콘솔 등록용 — 콘솔·문서 기준)
 */
export default defineConfig({
  appName: 'spendornot',
  brand: {
    displayName: BRAND_DISPLAY_NAME,
    primaryColor: BRAND_PRIMARY_COLOR,
    icon: BRAND_ICON_LIGHT,
    iconDark: BRAND_ICON_DARK,
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
  },
});
