# 개발 · 배포 워크플로

이 폴더가 **Line It**의 공식 작업 위치입니다.  
저장소: [uptn-ai-study/Yoojeong](https://github.com/uptn-ai-study/Yoojeong) · Vercel Root: `proto-02-lineit`

## Cursor에서 열기

**File → Open Workspace from File…** →  
`/Users/ellie/Desktop/Yoojeong/proto-02-lineit.code-workspace`

## 로컬 실행

```bash
cd /Users/ellie/Desktop/Yoojeong/proto-02-lineit
npm install
npm run dev
```

→ http://localhost:5173

## GitHub 반영 (push)

```bash
cd /Users/ellie/Desktop/Yoojeong
git add proto-02-lineit
git status
git commit -m "Update proto-02-lineit: 변경 내용 요약"
git push origin main
```

`main`에 push하면 Vercel(Root: `proto-02-lineit`)이 연결돼 있을 때 자동 배포됩니다.

랭킹은 **Supabase** 연결 시 `/api/rankings`로 전역 저장됩니다. ([README.md](./README.md) 참고)

## 최초 진입 테스트 리셋

브라우저 콘솔:

```javascript
localStorage.removeItem('line-it-player-id')
localStorage.removeItem('line-it-id-welcome-seen')
localStorage.removeItem('line-it-daily-plays')
location.reload()
```

또는 dev 서버 실행 중: http://localhost:5173/?reset=welcome
