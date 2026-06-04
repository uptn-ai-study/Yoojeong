# proto-01-ideaspace

IDEA SPACE — AI로 만든 서비스를 공유하고 피드백을 받는 웹 프로토타입.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## Vercel 배포

**프로덕션 URL:** https://yoojeong-ideaspace.vercel.app

저장소 [uptn-ai-study/Yoojeong](https://github.com/uptn-ai-study/Yoojeong) 연결 시 **Root Directory**를 `proto-01-ideaspace`로 지정합니다.

| 설정 | 값 |
|------|-----|
| Root Directory | `proto-01-ideaspace` |
| Framework Preset | Other |
| Build Command | (비움) |
| Output Directory | (비움) |
| Install Command | `npm install` |

### Vercel Blob (필수)

프로덕션에서 **아이디어·배너·파일 저장**이 유지되려면 Vercel 프로젝트에 Blob 스토어를 연결해야 합니다.

1. [Vercel Dashboard](https://vercel.com) → 프로젝트 `yoojeong-ideaspace` → **Storage** → **Create Database** → **Blob**
2. 프로젝트에 연결하면 `BLOB_READ_WRITE_TOKEN` 환경 변수가 자동 설정됩니다.
3. **Redeploy** 후 등록·수정 내용이 유지됩니다.

Blob이 없으면 서버리스 환경에서 업로드·저장이 동작하지 않습니다.

## 구성

- `index.html`, `styles.css`, `app.js` — 프론트엔드 (해시 라우팅)
- `server.js` — Express API + 파일 업로드
- `data/projects.json` — 프로젝트·코멘트 데이터
- `uploads/` — 업로드 파일 저장소
