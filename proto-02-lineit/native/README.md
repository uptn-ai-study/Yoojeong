# Line It — 네이티브 WebView 번들

`npm run build:native` 실행 시 `dist/`가 아래 두 곳에 복사됩니다.

| 플랫폼 | 복사 대상 (이 레포) | 앱 프로젝트에 넣을 위치 |
|--------|---------------------|-------------------------|
| iOS | `native/ios/LineItWeb/` | Xcode: **LineItWeb** 폴더 (그룹명 동일 권장) |
| Android | `native/android/line-it/` | `app/src/main/assets/line-it/` |

게임 업데이트할 때마다 `build:native` 후 위 폴더만 앱 쪽에 다시 복사하면 됩니다.

---

## iOS (WKWebView)

### 1. 번들 준비

```bash
npm run build:native
```

### 2. Xcode에 추가

1. `native/ios/LineItWeb` 폴더를 UPTNStation 타겟에 드래그
2. **Copy items if needed** 체크
3. **Create folder references** 또는 그룹으로 추가 (하위 `assets/` 포함 전체)

### 3. WebView 로드

`LineItWebViewController.swift` 를 프로젝트에 추가하거나, 기존 화면에서:

```swift
let vc = LineItWebViewController()
navigationController?.pushViewController(vc, animated: true)
```

핵심 로직 (`loadFileURL` + `assets` 읽기 권한):

```swift
guard let folder = Bundle.main.url(forResource: "LineItWeb", withExtension: nil),
      let indexURL = Bundle.main.url(
          forResource: "index",
          withExtension: "html",
          subdirectory: "LineItWeb"
      ) else { return }

webView.loadFileURL(indexURL, allowingReadAccessTo: folder)
```

> `allowingReadAccessTo`는 **LineItWeb 폴더 URL** 이어야 `./assets/*.js` 가 로드됩니다.

### 4. Info.plist (필요 시)

로컬 파일만 쓰면 ATS 추가 설정은 보통 불필요합니다.

---

## Android (WebView)

### 1. 번들 준비

```bash
npm run build:native
```

### 2. assets 복사

```bash
# 예: UPTNStation Android 모듈 경로에 맞게 수정
cp -R native/android/line-it/* \
  /path/to/UPTNStation/app/src/main/assets/line-it/
```

폴더 구조:

```
app/src/main/assets/line-it/
  index.html
  assets/
  favicon.svg
```

### 3. Activity / Fragment

`LineItWebActivity.kt` 를 참고하거나, 기존 WebView 화면에서:

```kotlin
webView.settings.javaScriptEnabled = true
webView.settings.domStorageEnabled = true
webView.loadUrl("file:///android_asset/line-it/index.html")
```

`AndroidManifest.xml`에 Activity 등록 후 `startActivity` 로 진입.

---

## 로컬에서 file:// 동작 확인

```bash
npm run build:native
npx serve native/ios/LineItWeb -p 4173
```

브라우저에서 `http://localhost:4173` — 경로는 HTTP지만, 빌드 산출물의 **상대 경로(`./assets/`)** 가 맞는지 확인용입니다.

실제 `file://` 검증은 시뮬레이터/기기 WebView에서 하는 것이 가장 정확합니다.

---

## 앱 ↔ 웹 브릿지 (선택)

일일 플레이·랭킹을 서버로 옮길 때:

- **iOS**: `WKScriptMessageHandler` + `window.webkit.messageHandlers.uptn`
- **Android**: `@JavascriptInterface` + `window.UptnAndroid`

웹 쪽은 이후 `src/bridge/` 등으로 분리해 연동하면 됩니다.
