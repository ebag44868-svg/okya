# OKSS 인증 시스템 — 현재 구조 & 향후 확장 설계

> 이번 작업은 **분석 + 문서화 + 마이그레이션 SQL 제안**만 수행했다.
> 런타임 코드/CSS/Supabase 설정/DB/기존 데이터는 **변경하지 않았다**.
> Apple/Kakao 실제 구현, 관리자 UI, 로그인 UI 리디자인은 하지 않았다.

**전제(사실 확인됨):** 인증은 전적으로 **Supabase Auth**가 담당한다. 코드/설정 어디에도 **Cloudflare는 없다**(auth 흐름에 미사용). 지원 provider는 **Google · Apple · Kakao** 3개로 한정하며 **Naver는 제외**한다.

---

## 1. 현재 Supabase Auth 구조 (코드 기준)

| 요소 | 위치 | 내용 |
|---|---|---|
| Supabase client 초기화 | `js/core.js:2` | `const sb=window.supabase.createClient(URL, ANON_KEY)` — 옵션 없음 → 기본값(`persistSession:true`, storage=localStorage). |
| 앱 부팅/세션 확인 | `js/app.js:56~81` | IIFE: 테마→급식로드→USERS 프리로드→`sb.auth.getSession()`. 세션 있으면 `handleUserUpsert`, 없으면 `rLogin()`. |
| 인증 이벤트 구독 | `js/app.js:72~75` | `onAuthStateChange`: `SIGNED_IN`/`INITIAL_SESSION`→`handleUserUpsert`, `SIGNED_OUT`→세션 초기화 후 `rLogin()`. |
| 로그인 화면/버튼 | `js/my.js:97~127` | `rLogin()` — **Google 버튼 1개**. |
| Google OAuth 호출 | `js/my.js:124` | `sb.auth.signInWithOAuth({provider:'google', options:{redirectTo: window.location.origin+window.location.pathname, queryParams:{prompt:'select_account'}}})`. |
| 사용자 upsert | `js/my.js:129~145` | `handleUserUpsert()` — okya_users 조회/생성 후 `routeTab()`. |
| 로그아웃 | `js/my.js:94` | `sb.auth.signOut()` (MY 화면). |
| 관리자 판별 | 전역 | `SESSION.role==='admin'` (예: `js/community2.js`, `js/home.js` 등 다수). |

**OAuth callback 처리:** 별도 콜백 라우트/서버 없음. OAuth 리다이렉트로 앱 URL에 돌아오면 **Supabase JS가 URL을 파싱해 세션을 생성**하고 `onAuthStateChange`를 발화. 즉 콜백 처리는 Supabase SDK가 담당.

## 2. Google OAuth 흐름 (현재)

```
rLogin() Google 버튼 클릭
  → sb.auth.signInWithOAuth({provider:'google', redirectTo: <앱 URL>})
  → Google 로그인 페이지 (prompt:select_account)
  → Google → Supabase(/auth/v1/callback) → 앱 URL로 리다이렉트
  → Supabase JS가 세션 수립 → onAuthStateChange(SIGNED_IN)
  → handleUserUpsert(user) → okya_users 조회/생성 → routeTab()(홈)
```
- 웹(GitHub Pages)에서는 `redirectTo = https://ebag44868-svg.github.io/okya/` 로 정상 복귀.
- **현재 승인 게이트 없음**: 인증만 되면 곧바로 홈 진입.

## 3. okya_users 구조

**코드가 실제로 사용하는 컬럼** (`js/my.js`, `js/app.js`):
- `id` — **auth.users.id(uuid)와 동일** (insert시 `authUser.id`, 조회 `.eq('id', authUser.id)`). → RLS에서 `auth.uid() = id` 사용 가능.
- `name` — 표시 이름(가입 시 Google `full_name`/`name`/email 앞부분에서 파생).
- `role` — `'student'` | `'admin'`. 신규는 `'student'`, admin은 **개발자가 Supabase에서 수동 설정**(클라이언트가 role을 덮어쓰지 않음, `js/my.js:131~137`).
- `photo` — 프로필 사진 URL(Storage `photos` 버킷).

**확인 필요(DB에서 직접 확인):** `email`, `created_at`, `status`, `approved_at` 등은 **코드가 사용하지 않음** → 존재 여부 불명. 
- `email`은 보통 `auth.users`에 있으므로 okya_users에 별도 저장은 선택.
- `status`/`approved_at`/timestamps는 **현재 없음(코드가 참조 안 함)** → §4·마이그레이션 필요.

## 4. status 구조 (설계)

| status | 의미 | OKSS 이용 |
|---|---|---|
| `pending` | 소셜 인증 완료, 관리자 승인 전 | ❌ 승인 대기 화면 |
| `approved` | 관리자 승인 완료 | ✅ 정상 이용 |
| `rejected` | 가입 거절 | ❌ 거절 화면 |
| `suspended` | 승인됐던 사용자의 이용 정지 | ❌ 정지 화면 |

타임스탬프: `approved_at` / `rejected_at` / `suspended_at` (상태 전이 기록).

**핵심 원칙(§3 프롬프트): "Supabase Auth 인증 여부"와 "OKSS 이용 승인 여부"를 분리.** 인증은 성공해도(=세션 존재) status가 approved가 아니면 서비스 이용 불가. **Auth 자체를 실패시키지 않는다.**

→ 마이그레이션: **`sql/2026-08-12_auth_status.sql`** (제안, 미실행). 신규 기본 `pending`, 기존 사용자 전부 `approved` 백필.

## 5. 관리자 승인 구조 (향후)

```
신규 가입 → okya_users.status='pending'(DB 기본값)
관리자: 신청자 목록 조회 → 승인/거절/정지
  승인: status='approved', approved_at=now()
  거절: status='rejected', rejected_at=now()
  정지: status='suspended', suspended_at=now()
```
- 이번 단계에서 **관리자 UI는 만들지 않음**. 데이터/권한 구조만 준비.
- 상태 변경은 **관리자(admin) 또는 service_role만** 가능해야 함(§14 RLS).

## 6. 자동 로그인 (현재 + 향후)

**현재:** Supabase JS가 세션을 localStorage(`sb-<ref>-auth-token`)에 저장 → 앱 실행 시 `getSession()`으로 복원 → `handleUserUpsert` → 홈. **이 자동 로그인은 유지한다.**

**향후(status 게이트 추가 시):** `handleUserUpsert`에서 okya_users 행을 가져온 뒤 status로 분기.
```
approved  → routeTab()            (홈 진입, 지금과 동일)
pending   → 승인 대기 화면
rejected  → 거절 화면
suspended → 정지 화면
```
> 아래는 **향후 적용할 코드 스니펫(지금은 미적용)**. `js/my.js` `handleUserUpsert` 마지막 `routeTab()` 부분을 교체:
```js
// 예시(미적용): status 게이트
const me = SESSION           // upsert 결과에 status 포함되도록 select에 status 추가 필요
if (me.status === 'approved' || me.role === 'admin') { STACK=[]; routeTab() }
else if (me.status === 'pending')   rAuthPending()
else if (me.status === 'rejected')  rAuthRejected()
else if (me.status === 'suspended') rAuthSuspended()
else { STACK=[]; routeTab() }   // status 컬럼 없거나 알 수 없으면 기존 동작(안전)
```
마지막 else 덕분에 **마이그레이션 전이라도 안전**(status 없으면 기존처럼 진입).

## 7. 기존 사용자 처리

- 현재 사용자들은 status 컬럼이 없음. status를 `pending` 기본으로 추가하면 **전원 승인 대기로 잠길 위험** → 마이그레이션에서 **기존 행 전부 `approved` 백필**(`sql/2026-08-12_auth_status.sql` 4단계).
- 신규 가입 행만 `pending` 기본값을 갖게 됨.
- **기존 데이터 삭제/변경 없음.**

## 8~10. 소셜 provider 확장 (Google / Apple / Kakao)

핵심: **provider별 회원관리 시스템을 따로 만들지 않는다.** 셋 다 `signInWithOAuth({provider})` → Supabase Auth → 동일한 `handleUserUpsert` → 동일한 `okya_users.status` 승인 로직을 공유.

**8) Google** — 이미 작동. `provider:'google'`. Google Cloud OAuth 클라이언트 + Supabase Auth의 Google provider 설정 존재. 추가 작업: 네이티브 딥링크(§11~13).

**9) Apple** — `provider:'apple'`.
- Apple Developer 계정 + App ID + **Service ID** + Sign in with Apple Key(.p8) 필요.
- Supabase Auth → Providers → Apple에 Service ID/키 등록.
- iOS: 네이티브 Sign in with Apple(ASAuthorization)+`signInWithIdToken`도 가능(선택). 아니면 웹 OAuth(브라우저)로 통일.
- Android/웹: 웹 OAuth 플로우(브라우저) 사용.
- **이번 단계 미설정**(가짜 credential 넣지 않음).

**10) Kakao** — `provider:'kakao'`.
- Kakao Developers 앱 + REST API 키 + (필요시) client secret.
- Supabase Auth → Providers → Kakao에 키 등록.
- Kakao 콘솔의 Redirect URI에 Supabase 콜백 등록.
- 네이티브: 웹 OAuth(브라우저)+딥링크 복귀.
- **이번 단계 미설정.**

## 11~13. Capacitor OAuth / Deep Link / Redirect URI

**문제(이미 CAPACITOR.md §5에도 기록):** 네이티브 WebView origin이 `https://localhost` 라, 현재 `redirectTo: window.location.origin+pathname`(=localhost)로는 OAuth 후 앱 복귀 불가 → **딥링크 필요**.

**향후 필요 작업(공통, 3 provider 동일):**
1. `@capacitor/app`(딥링크 수신), 필요시 `@capacitor/browser`(외부 브라우저로 OAuth 열기) 추가.
2. **커스텀 스킴** 예: `com.okya.okss://auth/callback`.
   - Android: `android/app/src/main/AndroidManifest.xml`에 intent-filter(scheme=`com.okya.okss`).
   - iOS: `ios/App/App/Info.plist`의 `CFBundleURLTypes`에 URL scheme 추가.
3. 코드: 플랫폼 감지해 네이티브면 `redirectTo`를 딥링크로.
   ```js
   // 예시(미적용)
   import { Capacitor } from '@capacitor/core'
   const redirectTo = Capacitor.isNativePlatform()
     ? 'com.okya.okss://auth/callback'
     : window.location.origin + window.location.pathname
   await sb.auth.signInWithOAuth({ provider, options:{ redirectTo } })
   ```
   ```js
   // 복귀 처리(미적용): App.addListener('appUrlOpen', ({url}) => {
   //   // PKCE code 포함 → sb.auth.exchangeCodeForSession(url) 또는 SDK 자동 처리
   // })
   ```

**Redirect URI 등록 필요 목록:**
- **각 provider 콘솔**(Google/Apple/Kakao)의 Authorized redirect URI에 **Supabase 콜백** `https://<project-ref>.supabase.co/auth/v1/callback` 등록.
- **Supabase Auth → URL Configuration**:
  - Site URL: 웹 배포 URL(GitHub Pages).
  - Additional Redirect URLs: 웹 URL + **네이티브 딥링크** `com.okya.okss://auth/callback`.

> 현재 실제 provider 설정/키는 **건드리지 않음**.

## 14. Supabase RLS (권장 · 미적용)

**확인 필요:** 현재 okya_users의 RLS 활성화 여부/정책은 **DB에서 직접 확인**해야 함(코드로는 알 수 없음).

**보안 원칙(§8):** 승인/권한은 **DB 기준**. 클라이언트는 UI 숨김만으로 보호하지 않는다. 특히:
- 클라이언트가 자기 행 insert 시 `role`/`status`를 **임의 지정 못 하게** 막아야 함(현재 insert는 role:'student' 고정이지만, RLS/트리거로 강제 필요).
- `status`/`role` **변경은 admin/service_role만**.

**권장 정책(개발자가 현재 정책 확인 후, 신중히 테스트하며 적용 — 잘못 켜면 앱이 잠길 수 있음. 이번 단계 미적용):**
```
-- 개념 예시 (그대로 실행 금지, 현재 정책 확인 후 조정)
-- 본인 행 조회
--   using ( auth.uid() = id )
-- 본인 행 insert 시 status/role 강제(pending/student)는 BEFORE INSERT 트리거로 처리 권장
-- status/role UPDATE는 admin만:
--   using ( exists(select 1 from okya_users a where a.id = auth.uid() and a.role='admin') )
```
→ RLS는 앱 전체 쿼리에 영향 → **별도 작업으로 분리**, 실기기 QA 필수.

## 15. 관리자 권한

- 현재 `role='admin'`이 유일한 관리자 표식. 클라이언트는 `SESSION.role==='admin'`으로 UI 분기만.
- 향후 관리자 기능(신청자 조회/승인/거절/정지)은 **RLS로 서버측 강제**가 전제(§14).
- 관리자 UI는 이번 단계에서 미구현.

---

## 변경 요약
- **수정한 런타임 파일: 없음.** (코드/CSS/설정/DB/기존데이터 무변경)
- **추가한 파일**: `AUTH.md`(이 문서), `sql/2026-08-12_auth_status.sql`(마이그레이션 제안, 미실행).
- **DB 변경**: 없음(SQL은 제안만, 개발자가 검토 후 수동 실행).

## 다음 단계(승인 후 진행)
1. `sql/2026-08-12_auth_status.sql` 검토·실행(status/timestamps 추가, 기존 approved 백필).
2. `handleUserUpsert` select에 `status` 포함 + §6 게이트 코드 적용 + 대기/거절/정지 화면 추가.
3. 관리자 승인 UI(신청자 목록→승인/거절/정지).
4. RLS 정책 적용(신중히, 실기기 QA).
5. 네이티브 딥링크 + Supabase/각 provider redirect 등록(Google부터, 이후 Apple/Kakao).
