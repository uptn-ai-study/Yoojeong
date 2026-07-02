# 쓸까말까

안 쓴 돈을 기록하는 토스 미니앱(웹뷰) 프로토타입입니다.  
[Yoojeong](https://github.com/uptn-ai-study/Yoojeong) 모노레포의 `proto-04-spendornot` 폴더에 포함되어 있습니다.

## 기술 스택

- React 18 + TypeScript + Vite
- React Router v6
- Zustand (로컬 저장: `localStorage`)
- [@toss/tds-mobile](https://tossmini-docs.toss.im/tds-mobile/start/) + `@toss/tds-mobile-ait` (토스 디자인 시스템)
- [@apps-in-toss/web-framework](https://developers-apps-in-toss.toss.im/tutorials/webview.html) (토스 미니앱 번들)

## 로컬 개발

```bash
npm install
npm run dev          # 토스 샌드박스 연동 개발 서버
npm run dev:vite     # 일반 Vite만 사용
```

테스트 데이터: `?seed=1` · 초기화: `?reset=1`

## 저장소

이 프로젝트는 [Yoojeong](https://github.com/uptn-ai-study/Yoojeong) 모노레포의 `proto-04-spendornot` 폴더에 있습니다.

토스 미니앱 등록 시 `granite.config.ts`의 `appName`, `brand.displayName`, `brand.icon`을 [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) 값과 맞춥니다.

## Vercel 배포 (웹 미리보기·테스트용)

Vercel은 **브라우저에서 앱을 미리 보는 용도**로 쓰면 좋습니다. 토스 앱 **정식 출시**는 아래「토스 미니앱 출시」절의 `.ait` 번들 업로드가 필요합니다.

1. [vercel.com](https://vercel.com) → Import Git Repository → `uptn-ai-study/Yoojeong`
2. **Root Directory:** `proto-04-spendornot`
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy

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

## 데이터 저장 — Supabase가 필요한가?

| 방식 | 설명 |
|------|------|
| **현재 (localStorage)** | 기기·브라우저마다 따로 저장. 앱 삭제·캐시 삭제·기기 변경 시 데이터 소실 |
| **Supabase (권장)** | 사용자별 별명·기록을 서버에 영구 저장. 기기 바꿔도 유지 |

**결론:** 사용자별로 별명과 기록이 **안전하게 남아야** 한다면 **Supabase(또는 다른 DB) 연동이 필요**합니다. Vercel만으로는 정적 파일 호스팅만 가능하고, 사용자 데이터는 저장할 수 없습니다.

권장 흐름:

1. 앱인토스 **토스 로그인**으로 사용자 식별 (`toss_user_key`)
2. Supabase에 `profiles`(별명) · `records`(기록) 테이블 저장
3. 스키마 예시: [`supabase/schema.sql`](./supabase/schema.sql)
4. 환경 변수: [`.env.example`](./.env.example) 참고

지금은 **localStorage로 동작**하며, Supabase 연동은 다음 단계에서 `VITE_SUPABASE_*` 환경 변수 설정 후 스토어를 API와 동기화하면 됩니다.

## 프로젝트 구조

```
src/
  screens/       # 화면
  components/    # 공통 UI
  store/         # Zustand 상태
  utils/         # 날짜·레벨·포맷
public/images/   # 레벨 배경 이미지
granite.config.ts
vercel.json
```

## 라이선스

Private
