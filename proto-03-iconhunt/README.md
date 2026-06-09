# ICON HUNT

숨은 아이콘 찾기 웹 게임 (Vanilla HTML/CSS/JS).  
30레벨 클리어, 시간 보너스, Supabase 전역 랭킹을 지원합니다. Iconoir 233개 아이콘 사용.

## 로컬에서 보기

```bash
npm install
npx vercel dev
```

→ http://localhost:3000

정적 파일만 빠르게 볼 때:

```bash
python3 -m http.server 8080
```

랭킹 API는 `vercel dev`로 실행할 때만 동작합니다. Supabase 환경 변수가 없으면 `localStorage`로 폴백합니다.

## Vercel 배포

**프로덕션 URL:** https://yoojeong-iconhunt.vercel.app

저장소 [uptn-ai-study/Yoojeong](https://github.com/uptn-ai-study/Yoojeong) 연결 시 **Root Directory**를 `proto-03-iconhunt`로 지정합니다.

| 설정 | 값 |
|------|-----|
| Root Directory | `proto-03-iconhunt` |
| Framework Preset | Other |
| Build Command | (비움) |
| Output Directory | (비움) |
| Install Command | `npm install` |

## Supabase 랭킹 연동

### 1. 테이블 생성

Supabase 프로젝트 → **SQL Editor**에서 `supabase/schema.sql` 내용을 실행합니다.

### 2. Vercel 환경 변수

Vercel 프로젝트 → **Settings** → **Environment Variables**:

| 변수 | 값 |
|------|-----|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` (secret) |

설정 후 **Redeploy** 합니다.

### 3. API

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/rankings` | TOP 10 조회 |
| `POST` | `/api/rankings` | `{ "id": "GoldenTiger", "score": 12345 }` 기록 |

서비스 롤 키는 서버(`/api/rankings`)에서만 사용합니다. 브라우저에는 노출되지 않습니다.

## 구성

- `index.html` — 화면 구조
- `css/styles.css` — 스타일
- `js/game.js` — 게임 로직
- `js/rankingApi.js` — 랭킹 API 클라이언트
- `api/rankings.js` — Vercel 서버리스 API
- `lib/` — Supabase 랭킹 저장소
- `icons/` — Iconoir SVG 에셋
