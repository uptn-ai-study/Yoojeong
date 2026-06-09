# ICON HUNT

숨은 아이콘 찾기 웹 게임 (Vanilla HTML/CSS/JS).  
30레벨 클리어, 시간 보너스, 로컬 랭킹을 지원합니다. Iconoir 233개 아이콘 사용.

## 로컬에서 보기

정적 사이트이므로 별도 빌드 없이 `index.html`을 브라우저로 열거나, 로컬 서버로 실행합니다.

```bash
# Python 3
python3 -m http.server 8080

# 또는 npx
npx serve .
```

→ http://localhost:8080

## Vercel 배포

저장소 [uptn-ai-study/Yoojeong](https://github.com/uptn-ai-study/Yoojeong) 연결 시 **Root Directory**를 `proto-03-iconhunt`로 지정합니다.

| 설정 | 값 |
|------|-----|
| Root Directory | `proto-03-iconhunt` |
| Framework Preset | Other |
| Build Command | (비움) |
| Output Directory | (비움) |
| Install Command | (비움) |

## 구성

- `index.html` — 화면 구조 (인트로, 게임, 가이드, 랭킹 등)
- `css/styles.css` — 스타일
- `js/game.js` — 게임 로직, 레벨·점수·랭킹
- `js/icons.js` — 사용 아이콘 목록 (233개)
- `icons/` — Iconoir SVG 에셋

## 랭킹 (현재 / 예정)

- **현재:** `localStorage`에 플레이어 ID·TOP 100 랭킹 저장
- **예정:** Supabase 연동으로 전역 랭킹 공유 (Vercel 배포 후 진행)
