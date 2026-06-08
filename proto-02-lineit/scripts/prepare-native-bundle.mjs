#!/usr/bin/env node
/**
 * dist/ → iOS·Android 앱에 그대로 복사할 폴더 생성
 * 사용: npm run build:native
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

if (!existsSync(join(dist, 'index.html'))) {
  console.error('❌ dist/index.html 없음. 먼저 npm run build 를 실행하세요.')
  process.exit(1)
}

const targets = [
  { label: 'iOS (Xcode에 LineItWeb 폴더로 추가)', path: join(root, 'native', 'ios', 'LineItWeb') },
  {
    label: 'Android (app/src/main/assets/line-it/ 로 복사)',
    path: join(root, 'native', 'android', 'line-it'),
  },
]

for (const { label, path } of targets) {
  rmSync(path, { recursive: true, force: true })
  mkdirSync(dirname(path), { recursive: true })
  cpSync(dist, path, { recursive: true })
  console.log(`✓ ${label}\n  → ${path}`)
}

console.log('\n다음: native/README.md 의 iOS / Android 연동 단계를 따르세요.')
