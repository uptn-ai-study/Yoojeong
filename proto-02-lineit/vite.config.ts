import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // WebView loadFileURL / file:///android_asset — 상대 경로 필수
  base: './',
})
