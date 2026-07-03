import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

function createBuildId(): string {
  if (process.env.VITE_BUILD_ID) {
    return process.env.VITE_BUILD_ID;
  }

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const random = createHash('sha256').update(`${timestamp}-${process.pid}`).digest('hex').slice(0, 8);
  return `${timestamp}-${random}`;
}

function buildMetaPlugin(buildId: string): Plugin {
  return {
    name: 'spendornot-build-meta',
    transformIndexHtml(html) {
      const cacheMeta = [
        '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />',
        '<meta http-equiv="Pragma" content="no-cache" />',
        '<meta http-equiv="Expires" content="0" />',
        `<meta name="app-build-id" content="${buildId}" />`,
      ].join('\n    ');

      return html.replace('</head>', `    ${cacheMeta}\n  </head>`);
    },
    closeBundle() {
      writeFileSync(
        resolve('dist/build-meta.json'),
        `${JSON.stringify({ buildId, builtAt: new Date().toISOString() }, null, 2)}\n`,
        'utf8',
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const buildId = createBuildId();
  process.env.VITE_BUILD_ID = buildId;

  return {
    plugins: [react({ jsxImportSource: '@emotion/react' }), buildMetaPlugin(buildId)],
    build: {
      manifest: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
    define: {
      __APP_BUILD_ID__: JSON.stringify(buildId),
    },
    logLevel: mode === 'production' ? 'info' : undefined,
  };
});
