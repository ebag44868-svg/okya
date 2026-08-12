# OKSS — Android 실앱 빌드 & 실기기 테스트 가이드

목표: 기존 웹앱/기능/디자인을 **그대로 유지**하며 Android 앱으로 빌드·실행.
(회원가입 승인/Apple/Kakao/관리자 UI는 이번 단계 대상 아님.)

## 현재 환경 상태 (이 PC에서 확인됨)
| 항목 | 상태 |
|---|---|
| JDK (java/javac) | ❌ 없음 (`JAVA_HOME` 비어 있음) |
| Android Studio | ❌ 없음 |
| Android SDK | ❌ 없음 (`ANDROID_HOME` 비어 있음) |
| SDK Platform / Build-Tools / cmdline-tools | ❌ 없음 |
| adb (platform-tools) | ❌ 없음 |
| Gradle (global) | ❌ 없음 (프로젝트는 gradlew 래퍼 사용) |
| Capacitor CLI | ✅ 8.5.0 |

**빌드 차단 지점(실측):** `android/gradlew assembleDebug` 실행 시 즉시
`ERROR: JAVA_HOME is not set and no 'java' command could be found` → **JDK 부재**가 1차 차단.
그 다음으로 Android SDK(Platform 36)도 필요.

**Android 프로젝트 설정(정상):** appId/namespace `com.okya.okss`, app_name `OKSS`,
minSdk 24 / compileSdk 36 / targetSdk 36, AGP 8.13.0, Gradle wrapper 8.14.3. `npm run sync` 정상(exit 0).
→ **프로젝트는 문제없음. 도구(JDK+SDK)만 설치하면 빌드 가능.**

## 설치 항목 & 방법 (임의 설치 안 함 — 사용자가 진행)
가장 간단한 경로 = **Android Studio 설치**(JDK(JBR 21) + SDK Manager + adb + 에뮬레이터 모두 포함).

1. **Android Studio** 다운로드/설치: https://developer.android.com/studio
2. 최초 실행 → SDK 설치 마법사에서 다음 체크:
   - **Android SDK Platform 36** (compileSdk/targetSdk=36)
   - **Android SDK Build-Tools** (최신)
   - **Android SDK Command-line Tools (latest)**
   - **Android SDK Platform-Tools** (adb 포함)
   - **Android Emulator** (실기기 없으면)
3. (CLI로도 빌드하려면) 환경변수 설정:
   - `ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk`
   - PATH에 `platform-tools`(adb), `emulator`, `cmdline-tools\latest\bin` 추가
   - JAVA_HOME: **Android Studio로 빌드하면 불필요**(Studio가 번들 JBR 사용). gradlew를 터미널에서 직접 쓰려면 **JDK 17 이상(권장 21)** 설치 후 `JAVA_HOME` 지정.

> 요구사항: AGP 8.13 + Gradle 8.14.3 → **JDK 17+ (권장 21)**. compileSdk 36 → **SDK Platform 36** 필요.

## 빌드 & 실행 (도구 설치 후)
```
npm run sync            # 웹(index.html/css/js/assets) → www → android 동기화
npm run cap:android     # Android Studio로 프로젝트 열기 → Gradle sync 자동
#   Studio에서 기기/에뮬 선택 → Run ▶
```
CLI만으로:
```
npm run sync
npm run run:android     # = cap run android (기기/에뮬 자동 빌드·설치, SDK/JDK 필요)
# 또는 디버그 APK 직접:
cd android && ./gradlew assembleDebug
#   결과: android/app/build/outputs/apk/debug/app-debug.apk
#   설치: adb install -r app-debug.apk
```
> ⚠️ 웹 소스를 `android/` 내부에 직접 복사하지 말 것. 반드시 `npm run sync`(루트→www→android) 사용.

## 실기기 준비
1. 기기: 설정 → 개발자 옵션 → USB 디버깅 ON, USB 연결.
2. `adb devices` 로 기기 인식 확인(platform-tools 설치 후 사용 가능).
3. Studio Run ▶ 또는 `adb install`.
> 현재 이 PC엔 adb 없음 + 기기 미연결 → 도구 설치 후 진행.

## ⚠️ Google OAuth (Android에서 반드시 확인 · 아직 미수정)
현재 로그인(`js/my.js`): `signInWithOAuth({provider:'google', redirectTo: window.location.origin+window.location.pathname})`.
- **웹**: 정상.
- **Android(Capacitor)**: WebView origin이 `https://localhost` → OAuth 후 앱으로 복귀 실패 가능성 큼.
- **이번 단계에선 OAuth 구조를 뜯어고치지 않음.** 실기기 테스트에서 복귀 여부만 확인.
- 문제 확인 시 필요한 작업(별도 승인 후, 상세는 `AUTH.md` §11~13):
  1. 현재 redirect: `origin+pathname`(=localhost).
  2. 딥링크 스킴: `com.okya.okss://auth/callback`.
  3. Android `AndroidManifest.xml` intent-filter(scheme 등록).
  4. `@capacitor/app`(appUrlOpen 수신) [+ 필요시 `@capacitor/browser`].
  5. Supabase Auth → URL Configuration의 Redirect URLs에 딥링크 추가.
  6. Google Cloud OAuth 클라이언트 승인 redirect에 Supabase 콜백 확인.

## 실기기 회귀 테스트 체크리스트 (웹과 동일해야 함)
- [ ] 앱 실행(스플래시 → 로그인 화면)
- [ ] 로그인 (Google OAuth) — **앱 복귀 여부 집중 확인**
- [ ] 자동 로그인 (앱 종료 후 재실행 시 세션 유지)
- [ ] 로그아웃
- [ ] Home: 급식 / 오늘의 옥야 / 바로가기 / 알림 / 네비
- [ ] Money: 잔액 / 송금 / 송금완료 / 내역 / 전체·받기·송금·출석 / 날짜필터
- [ ] Community: 게시판 / 배너 캐러셀 / 커뮤 기능
- [ ] Petition: 목록 / 상세 / 작성 / 발행
- [ ] Message: 채팅 / 입력 / 키보드 / 자동 스크롤 / 프로필 사진
- [ ] MY: 프로필 / 프로필 사진 변경 / 로그아웃
- [ ] Arcade: 메인 / 랜덤뽑기 / 퀴즈 / DASH / 오늘의 수학 / 보상 / 오늘의 옥야 연동
- [ ] Supabase DB 조회·insert·update
- [ ] Supabase Storage 이미지(프로필/책표지 등) 로드
- [ ] 외부 급식 JSON fetch(GitHub Pages)
- [ ] 키보드(입력창 포커스 시 레이아웃)
- [ ] 파일 선택(사진 업로드 — 네이티브 파일 피커)
- [ ] 가로(landscape) 레이아웃 / 좌측 레일 접기·펼치기
- [ ] 하드웨어 뒤로가기 버튼 동작
- [ ] 앱 종료 후 재실행

## 역할 분담
**사용자(직접 필요):**
1. Android Studio + SDK 구성요소 설치(위 목록).
2. (선택) 환경변수 설정.
3. 실기기 USB 디버깅 연결 또는 에뮬레이터 생성.
4. `npm run cap:android` → Run ▶ 로 실행 후 위 체크리스트 확인.
5. (딥링크 단계 시) Supabase/Google 콘솔 redirect 등록.

**Claude Code(요청 시):**
1. `npm run sync` / 빌드 오류 진단·최소 수정.
2. OAuth 딥링크 코드 + `AndroidManifest.xml` intent-filter + `@capacitor/app` 연동(별도 승인 작업).
3. 아이콘/스플래시 등 네이티브 설정(추후).
> 웹 소스/기능/디자인/DB는 이번 단계에서 변경하지 않음.
