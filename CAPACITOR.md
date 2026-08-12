# OKSS — Capacitor (iOS/Android) 안내

기존 웹앱(정적 SPA)을 **변경 없이** iOS/Android 앱으로 감싸기 위한 Capacitor 기반이 추가됨.
사용자가 보는 OKSS는 웹과 동일하다. UI/CSS/기능/Supabase/localStorage/급식데이터 **무변경**.

## 1. 설치된 패키지 (Capacitor 8.5.0)
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`
- 프레임워크 전환 없음(React/Vue/TS/Vite 등 미사용). 순수 HTML/CSS/JS 유지.

## 2. 구조 / webDir 전략
```
okss/
├─ index.html, css/, js/, assets/   ← 웹 소스(단일 진실). GitHub Pages 배포 + npm run dev 소스
├─ www/                             ← webDir. 루트에서 복사된 "생성물"(gitignore). Capacitor가 이걸 네이티브로 복사
├─ capacitor.config.json            ← appId/appName/webDir
├─ scripts/copy-web.cjs             ← 루트 → www 복사 스크립트
├─ android/                         ← 네이티브 Android 프로젝트(생성됨)
└─ ios/                             ← 네이티브 iOS 프로젝트(생성됨, 빌드는 Mac 필요)
```
- 루트를 그대로 webDir로 쓰면 `node_modules/`, `android/`, `ios/`까지 앱에 복사되므로, **`www/`를 사본**으로 두고 webDir=www 로 설정.
- `index.html`의 상대경로(`css/ js/ assets/`)는 네이티브 WebView(`https://localhost/`)에서 그대로 동작. Supabase/폰트/급식 JSON은 절대 HTTPS URL이라 그대로 동작.

`capacitor.config.json`:
```json
{ "appId": "com.okya.okss", "appName": "OKSS", "webDir": "www" }
```
- appId는 학교 공식 도메인이 아닌 합리적 reverse-domain(임시). 정식 배포 시 확정.

## 3. 개발 워크플로우
**웹 개발(기존 그대로):**
```
npm run dev        # → http://localhost:5173 (python http.server)
```
**네이티브 개발(웹 수정 → 반영):**
```
npm run sync       # 루트 → www 복사 후 cap sync (android/ios에 반영)
npm run cap:android   # Android Studio로 열기 (Studio 설치 필요)
npm run cap:ios       # Xcode로 열기 (Mac 필요)
```
> 웹 코드를 고칠 때마다 `npm run sync` 를 실행해야 네이티브에 반영됨.

## 4. Android 실행 (이 PC에 아직 도구 없음)
현재 이 Windows PC에는 **JDK/Android SDK/Android Studio가 없어 빌드 불가**. 프로젝트(`android/`)는 생성 완료되어 있고, `cap doctor` = "Android looking great". 다음만 하면 실행 가능:

1. **Android Studio 설치** (JDK/SDK/에뮬레이터 포함): https://developer.android.com/studio
2. 최초 실행 시 SDK 설치 마법사 완료.
3. 프로젝트 열기:
   ```
   npm run sync
   npm run cap:android      # 또는 Android Studio에서 okss/android 폴더 열기
   ```
4. Android Studio 상단에서 에뮬레이터(또는 USB 디버깅 켠 실기기) 선택 → Run ▶.
5. 확인: 로그인/홈/급식/머니/커뮤/청원/메시지/MY/레일/아케이드/이미지/스크롤/키보드/모달/localStorage/Supabase.

> ⚠️ 로그인은 아래 5번(OAuth) 이슈 때문에 추가 설정 전에는 실패할 수 있음.

## 5. ⚠️ 로그인(Google OAuth) — 네이티브 추가 설정 필요 (미해결, 보고)
현재 로그인(`js/my.js`):
```js
sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin+window.location.pathname }})
```
- **웹**: `redirectTo` = `https://ebag44868-svg.github.io/okya/` → 정상.
- **네이티브**: WebView origin이 `https://localhost` 라 Google이 여기로 리다이렉트해도 앱으로 복귀 못 함 → **로그인 미완성**.
- 원인: OAuth 리다이렉트가 네이티브 앱 컨텍스트로 돌아오려면 **커스텀 딥링크 스킴**이 필요.
- 최소 변경 해결 경로(추후, 별도 승인 후):
  1. `@capacitor/app` (+ 필요시 `@capacitor/browser`) 추가.
  2. 딥링크 스킴(예: `com.okya.okss://auth`)을 android `AndroidManifest.xml` intent-filter / iOS `Info.plist` URL scheme 에 등록.
  3. **Supabase 대시보드 → Auth → URL Configuration** 에 위 리다이렉트 URL 추가.
  4. **Google Cloud OAuth 클라이언트**의 승인된 리다이렉트 URI에 추가.
  5. 네이티브에서만 `redirectTo`를 딥링크로 분기(플랫폼 감지). `App.addListener('appUrlOpen', ...)` 로 복귀 세션 처리.
- 이 작업은 외부(Supabase/Google) 설정 변경 + 코드 분기가 필요해 이번 "무변경 이식" 범위 밖. anon key/URL 등은 **건드리지 않음**.

## 6. iOS (Windows에서 불가 — Mac 필요)
`ios/` 프로젝트는 생성됨(Capacitor 8은 CocoaPods 대신 Package.swift/SPM 사용 → Windows에서도 스캐폴드 생성 성공). **빌드/서명/실행은 Mac+Xcode 필수**:
1. Mac에서 저장소 clone 후 `npm install`.
2. `npm run sync`
3. `npx cap open ios` → Xcode에서 `ios/App/App.xcodeproj`(또는 워크스페이스) 열림.
4. Signing & Capabilities에서 Apple 개발자 팀 설정.
5. 시뮬레이터/실기기 선택 후 Run.
6. 5번 OAuth 딥링크 설정 동일 필요.

## 7. 앱 설정(placeholder)
- 이름 OKSS / appId `com.okya.okss` / webDir `www`.
- **아이콘·스플래시**: 현재 Capacitor 기본(placeholder). 웹앱 자체 splash(`.splash-screen`)는 그대로 동작. 실제 아이콘/스플래시 디자인은 추후 별도 작업(`@capacitor/assets`로 생성 예정).
- **화면 방향**: 잠그지 않음(기기 기본) — 현재 웹의 세로/가로 반응형을 그대로 보존. iPad 가로가 주 사용이지만 세로도 동작. 필요 시 추후 landscape 우선 설정 가능.

## 8. 롤백
- Capacitor 적용 이전 상태: 태그 `pre-capacitor-20260812` 또는 브랜치 `backup/before-capacitor`.
- 웹 배포(GitHub Pages)는 루트 파일 기준이라 Capacitor 추가와 무관하게 그대로 동작.
