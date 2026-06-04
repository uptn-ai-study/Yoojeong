# proto-01-ideaspace

IDEA SPACE — AI로 만든 서비스를 공유하고 피드백을 받는 웹 프로토타입.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## 구성

- `index.html`, `styles.css`, `app.js` — 프론트엔드 (해시 라우팅)
- `server.js` — Express API + 파일 업로드
- `data/projects.json` — 프로젝트·코멘트 데이터
- `uploads/` — 업로드 파일 저장소
