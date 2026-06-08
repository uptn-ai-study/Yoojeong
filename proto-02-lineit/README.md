# proto-02-lineit

Line It — 한붓 그리기 미로 퍼즐 웹 게임 (Vue 3 + TypeScript).  
브라우저·Vercel에서 플레이하고, 이후 UPTNStation iOS/Android WebView에 탑재합니다.

모노레포: [uptn-ai-study/Yoojeong](https://github.com/uptn-ai-study/Yoojeong) · Vercel **Root Directory**: `proto-02-lineit`

## 로컬에서 보기

```bash
npm install
npm run dev
```

터미널에 표시되는 주소로 접속합니다.

| 환경 | URL |
|------|-----|
| 이 Mac | http://localhost:5173 |
| 같은 Wi‑Fi 휴대폰 | http://\<내-IP\>:5173 |

빌드 결과만 확인할 때:

```bash
npm run build
npm run preview
```

→ http://localhost:4173 (Vercel 배포와 동일한 정적 빌드)

## Vercel 연동

1. [vercel.com](https://vercel.com) 로그인 → **Add New Project**
2. GitHub 저장소 [uptn-ai-study/Yoojeong](https://github.com/uptn-ai-study/Yoojeong) Import
3. **Root Directory**를 `proto-02-lineit`로 지정
4. Framework: Vite, Output: `dist` (`vercel.json` 참고)
5. **Deploy**

이후 `main` 브랜치에 push할 때마다 자동 배포됩니다.

> WebView 앱 번들(`file://`)용 빌드는 Vercel과 별도: `npm run build:native` → [native/README.md](./native/README.md)

## 게임 규칙

- **시작 점**에서 터치/드래그로 한 붓 그리기
- 모든 블록(칸)을 정확히 한 번씩 지나 **목표 점**에 도달
- **잉크**: 칸 통과 시 시간 보너스 (일정 시간 후 보드에서 사라짐)
- **점수**: 완주, 남은 시간, 해밀턴 경로 유연성, 잉크, 레벨 배율
- **플레이 제한**: 하루 100회 (localStorage)
- **랭킹**: 로컬 TOP 10 (서버 연동 전)

## 앱 WebView 번들 (iOS + Android)

```bash
npm run build:native
```

| 플랫폼 | 출력 폴더 | 앱 연동 |
|--------|-----------|---------|
| iOS | `native/ios/LineItWeb/` | `loadFileURL` — [native/README.md](./native/README.md) |
| Android | `native/android/line-it/` | `file:///android_asset/line-it/` |

샘플 코드: `LineItWebViewController.swift`, `LineItWebActivity.kt`

## 기술 스택

Vue 3 · TypeScript · Vite · UPTNStation UI Kit 토큰
