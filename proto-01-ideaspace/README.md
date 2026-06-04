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

> Vercel 서버리스 환경에서는 `data/projects.json`·`uploads/` 변경이 재배포·콜드스타트 후 초기화될 수 있습니다. 데모·프로토타입 용도로 사용하세요.

## 구성

- `index.html`, `styles.css`, `app.js` — 프론트엔드 (해시 라우팅)
- `server.js` — Express API + 파일 업로드
- `data/projects.json` — 프로젝트·코멘트 데이터
- `uploads/` — 업로드 파일 저장소
