# 쓸까말까

안 쓴 돈을 기록하는 토스 미니앱(웹뷰) 프로젝트입니다.

## 기술 스택

- React 18 + TypeScript + Vite
- React Router v6
- Zustand + Supabase (클라우드 저장, 환경 변수 없으면 `localStorage` 폴백)
- [@toss/tds-mobile](https://tossmini-docs.toss.im/tds-mobile/start/) + `@toss/tds-mobile-ait` (토스 디자인 시스템)
- [@apps-in-toss/web-framework](https://developers-apps-in-toss.toss.im/tutorials/webview.html) (토스 미니앱 번들)

## 로컬 개발

```bash
npm install
npm run dev          # 토스 샌드박스 연동 개발 서버
npm run dev:vite     # 일반 Vite만 사용
```

테스트 데이터: `?seed=1` · 초기화: `?reset=1`

## GitHub 업로드

1. [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)에서 앱 등록
2. `granite.config.ts`의 `appName`, `brand.displayName`, `brand.icon`을 콘솔 값과 맞춤
3. GitHub에 새 저장소 생성 후 push:

```bash
git init
git add .
git commit -m "Initial commit: 쓸까말까 미니앱"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/spendornot.git
git push -u origin main
```

## Vercel 배포 (웹 미리보기·테스트용)

Vercel은 **브라우저에서 앱을 미리 보는 용도**로 쓰면 좋습니다. 토스 앱 **정식 출시**는 아래「토스 미니앱 출시」절의 `.ait` 번들 업로드가 필요합니다.

1. [vercel.com](https://vercel.com) → Import Git Repository
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Deploy

`vercel.json`에 SPA 라우팅 설정이 포함되어 있습니다.

## 토스 미니앱 출시

1. `granite.config.ts`에서 `brand.icon`에 콘솔 아이콘 URL 입력
2. 번들 빌드:

```bash
npm run build:toss   # spendornot.ait 생성
```

3. 프로젝트 루트에 생성된 `*.ait` 파일을 앱인토스 콘솔에 업로드
4. [토스앱 테스트](https://developers-apps-in-toss.toss.im/development/test/toss.html) → 검수 → 출시

> 레벨 배경 이미지는 WebP(960px)로 최적화되어 있습니다. `.ait` 번들 약 4MB. 원본 PNG 교체 시 `npm run optimize-images` 실행.

## Supabase 연동 (사용자 데이터 저장)

별명·기록·통계·월별 차트 데이터는 모두 `records`와 `profiles`에서 계산·저장됩니다. Vercel 연동은 **필수가 아닙니다**.

### 1. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 [`supabase/schema.sql`](./supabase/schema.sql) 실행
3. Project Settings → API에서 URL과 `anon` key 복사

### 2. 환경 변수

`.env` 파일 생성 ([`.env.example`](./.env.example) 참고):

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

- **로컬:** `.env`에 설정 후 `npm run dev`
- **Vercel:** Project Settings → Environment Variables에 동일 키 추가
- **토스 `.ait` 빌드:** `npm run build:toss` 전에 `.env`에 값이 있어야 번들에 포함됩니다

환경 변수가 없으면 기존처럼 `localStorage`만 사용합니다.

### 3. 사용자 식별

토스 앱에서는 [`getAnonymousKey`](https://developers-apps-in-toss.toss.im/)로 사용자별 해시 키를 받아 Supabase `toss_user_key`로 사용합니다. 브라우저 개발 환경에서는 기기별 dev 키로 동작합니다.

### 4. 저장 구조

| 테이블 | 저장 내용 |
|--------|-----------|
| `profiles` | 별명, viewMode(지폐/물고기), 인트로 완료 여부 |
| `records` | 날짜·카테고리·금액·메모 (통계·월별 차트는 여기서 집계) |

> RLS는 `x-toss-user-key` 헤더 기반입니다. 정식 운영 시 토스 `appLogin` 검증 Edge Function 연동을 권장합니다.

## 프로젝트 구조

```
src/
  screens/       # 화면
  components/    # 공통 UI
  store/         # Zustand 상태 + Supabase 동기화
  services/      # Supabase CRUD
  lib/           # Supabase 클라이언트, 토스 사용자 키
public/images/   # 레벨 배경 이미지
granite.config.ts
vercel.json
```

## 라이선스

Private
