# OKSS / 옥야 앱 — 구조 인수인계 문서

> 이 문서는 **새 대화(다른 Claude 세션)가 `index.html` 하나만으로 앱 전체를 이해하고 버그 없이 이어서 작업**하기 위한 지도다.
> 작업 전 이 문서 전체를 읽어라. 특히 맨 아래 **"⚠️ 반드시 지킬 함정 목록"** 은 실제로 버그를 낸 지점들이다.

---

## 1. 앱 개요
- **무엇**: 창녕옥야고등학교 학생회 앱. 급식/학사일정/청원/옥야머니(교내 포인트)/커뮤니티(챌린지·책교환·제본소)/메시지(DM)/알림.
- **형태(2026-08-12 모듈 분리 완료)**: `index.html`(진입점: head의 CSS `<link>` + body 끝 JS `<script>`) + **`css/`(8) + `js/`(17)** 로 분리. **빌드 스텝 없음.** 브라우저가 클래식 스크립트를 순서대로 로드(전역 스코프 공유 — 단일 파일 시절과 동일한 동작). supabase는 UMD 전역(`window.supabase.createClient`).
  - **파일 맵**: `css/` = base·home·money·components·my-overlay·layout-landscape·pages·arcade. `js/` = core(sb·헬퍼·모달·알림·거래) → school-data → navigation → home → money → school → community → message → community2(챌린지/책/청원/게시판) → my → `arcade/`{core,main,lottery,quiz,dash,math} → **app(테마+부팅, 반드시 마지막)**. 로드 순서 = 원본 소스 순서(바꾸지 말 것).
  - ⚠️ 함수/전역은 여전히 **한 전역 스코프 공유**(파일 캡슐화 아님). 새 함수는 아무 파일에 넣어도 서로 보이지만, **로드 시점에 실행되는 최상위 문장**(const 초기화가 함수 호출, IIFE 등)은 의존 대상보다 뒤 파일에 두지 말 것. 부팅 IIFE는 app.js에 유지.
- **주 사용 기기**: **가로형 태블릿(landscape tablet)** 우선. 모바일 세로도 지원하지만 QA 기준은 태블릿 가로.
- **백엔드**: Supabase (CDN import, `@supabase/supabase-js@2.39.3`). 인증 + Postgres 테이블 + Storage(`photos` 버킷).
- **데이터 서비스(별도 repo)**: 급식/학사일정은 앱이 `https://ebag44868-svg.github.io/okya_data` (GitHub Pages)에서 fetch. 그 repo는 매일 자동 갱신(cron). **이 repo와 합치지 말 것.** 로컬 `okya-data/` 폴더는 `.gitignore`됨.

## 2. 파일 / 실행 / 배포
- 앱 코드: `C:\Users\SAMSUNG\OneDrive\Desktop\okss\index.html`
- Git 리모트: `https://github.com/ebag44868-svg/okya.git` (브랜치 `main`)
- 배포: GitHub Pages 계열(파일 push하면 반영). 로컬에서 열어도 Supabase는 원격이라 동작.

## 3. 🔧 빌드 검증 절차 (커밋 전 매번 필수)
빌드 도구가 없으므로 **직접 검증**한다. 모듈 분리 후에는 각 JS 파일을 문법 검사한다. Git Bash에서:
```bash
cd /c/Users/SAMSUNG/OneDrive/Desktop/okss
for f in js/*.js js/arcade/*.js; do node --check "$f" || echo "FAIL $f"; done && echo "JS OK"
```
- 모든 파일에서 에러 없이 **`JS OK`** 가 떠야 한다.
- CSS 중괄호 균형은 편집한 파일에서 `{`/`}` 개수가 같은지 확인.
- 라이브 기능 테스트는 Supabase 로그인이 필요해 **개발자가 실기기에서 QA**한다.
- 참고: 최초 분리는 `_split.cjs`(gitignore됨)가 "재결합==원본" 검증과 함께 수행했다. 대규모 재분할이 필요하면 이 스크립트를 참고/재사용.

## 4. 커밋 / 브랜치 규칙
- 큰 작업 전 **백업 브랜치** 생성: `git checkout -b backup/before-xxx` 후 `main` 복귀.
- 커밋 메시지 마지막 줄: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- 의미 단위로 자주 커밋. push는 개발자 요청 시 or 관례대로.
- 되돌릴 땐 `git revert <hash> --no-edit` (해당 커밋만 안전하게 취소).

## 5. 코드 전역 구조 (로드 순서 = 원본 소스 순서)
1. `<head>`: 폰트 CSS(외부) → `css/*.css` 8개(§1 파일맵 순서). **랜드스케이프 미디어쿼리** `@media (min-width:820px) and (min-aspect-ratio:1/1)`는 여러 CSS 파일에 분산(원래 소스 순서 유지 — cascade 보존).
2. `<body>`: `<div id="app">`(splash) + 토스트 DOM.
3. supabase UMD `<script>` → `js/*.js` 17개(§1 파일맵 순서). 흐름: 상수/헬퍼 → 상태 → 렌더 함수 → 아케이드 → **부팅(app.js)**. (분리 전 단일 스크립트와 동일한 실행 의미.)

## 6. 전역 상태 변수 (module 스코프 `let`)
| 변수 | 용도 |
|---|---|
| `SESSION` | 현재 로그인 유저 객체 `{id,name,role,photo}`. `role==='admin'`이면 학생회. |
| `USERS` | 전체 유저 배열 `{id,name,role,photo}`. **select에 photo 포함됨**(프로필 사진 표시용). |
| `TAB` | 현재 최상위 탭 `home|money|school|comm|search|my`. |
| `STACK` | 푸시된 상세 화면 렌더 함수 스택(뒤로가기용). |
| `NOTIFS` | 알림 배열. |
| `OK_OV` | **열린 오버레이 1개** 핸들 `{bd,pn,onKey}` (알림/내역). null이면 없음. |
| `OK_HOME` | 홈 바로가기 carousel 인스턴스(`.destroy()` 보유). |
| `RAIL_COLLAPSED` | 좌측 레일 접힘 여부(landscape). |
| `MEALS`,`SCHEDULE`,`HOME_MEAL` | 급식/학사 데이터. |
| `SHEET_OPEN`,`MODAL_OPEN` | 바텀시트/모달 상태. |

## 7. 핵심 유틸 헬퍼 (반드시 재사용, 새로 만들지 말 것)
- `sb` — Supabase 클라이언트.
- `wt(promise, ms=7000)` — **타임아웃 래퍼**. 모든 Supabase 호출은 `await wt(sb.from(...)...)` 로 감싼다.
- `esc(s)` — HTML 이스케이프. **모든 사용자 입력 출력에 필수** (XSS 방지).
- `fmt(n)` — 숫자 천단위 콤마.
- `uid(prefix)` — 랜덤 id.
- `nowISO()` — `new Date().toISOString()` → **UTC**. (⚠️ 함정 목록 참고)
- `uploadImg(file, folder='misc', maxW=900, q=0.6)` — 이미지 리사이즈+업로드, URL 반환(실패 시 falsy).
- `toast(msg)` / `popMsg(text,emoji)` — 알림 토스트.
- `notify/notifyMany/notifyStudents/notifyAdmins` — 알림 생성(`okya_notifications`).
- `getAllTx()` — 전체 거래(`okya_tx`). `balOf(id,txs)` — 잔액 계산.
- `nameOf(id)` / `photoOf(id)` / `avatarHTML(id,size=34)` — 유저 이름/사진/아바타 HTML. **아바타는 avatarHTML 재사용.**
- `I` — SVG 아이콘 딕셔너리(`I.home`,`I.menu`,`I.camera`,`I.chev` …).
- `openSheet({title,body,actions,onMount})` — 바텀시트(아래→위 슬라이드, z-index 300/301).
- `openOverlay/closeOverlay` — 오버레이(§11.4).

## 8. 라우팅 / 네비게이션 모델
- `app()` = `#app` 컨테이너. 화면 전환 = **`app().innerHTML` 통째 교체**.
- `routeTab()` — `TAB`에 맞는 최상위 렌더(`{home:rHome, money:rMoney, school:rSchool, comm:rComm, search:rSearch, my:rMy}[TAB]()`).
- `push(fn)` — 상세화면 진입. `STACK.push(fn); fn()`.
- `pop()` — 뒤로. STACK 되감아 이전 렌더 재실행, 없으면 `routeTab()`.
- `bnav()` — 하단/좌측 네비 HTML 문자열 반환. **모든 최상위 화면은 innerHTML 끝에 `${bnav()}` 를 붙인다.**
- `bindNav()` — 네비/레일 버튼 이벤트 배선. **화면 렌더 직후 반드시 `bindNav()` 호출**(안 하면 탭/레일 안 먹음).
- ⚠️ **`app().innerHTML` 교체는 오버레이(§11.4)를 제거하지 않는다** — 오버레이는 `document.body`에 직접 붙기 때문. 라우팅과 독립.

## 9. Supabase 데이터 모델
테이블(모두 `okya_` 접두사). **insert 시 스키마에 없는 컬럼이 하나라도 있으면 PostgREST가 전체 실패**시킨다 → §11.1의 "컬럼 제거 재시도" 패턴 사용.

| 테이블 | 주요 컬럼(코드에서 쓰는 것) |
|---|---|
| `okya_users` | `id, name, role, photo` |
| `okya_tx` | `id, from, to, amount, type(송금/발행/회수/출석), reason, at` |
| `okya_petitions` | `id, title, category, purpose, content, txt, status(pending/approved/rejected), phase, goal, by_id, at, reacts(jsonb)` |
| `okya_books` | `id, title, grade, kind(나눔/교환), want, photo, owner, owner_name, status(open/matched), applicants(jsonb), comments(jsonb), recipient, recipient_name, at` |
| `okya_prints` | `id, title, pages, copies, bind, cost, file, status, owner, owner_name, at` |
| `okya_events` | 챌린지 이벤트 `id, title, reward, deadline, desc, at` |
| `okya_event_subs` | 챌린지 인증 제출 |
| `okya_meetings` | 회의록 영상 |
| `okya_board` / `okya_lost` | 게시판 / 분실물 |
| `okya_dm` | `id, from_id, to_id, text, at` |
| `okya_notifications` | `id, user_id, type, title, body, link, read, at` |
| `okya_reservations` / `okya_meal_ratings` | 예약 / 급식 별점 |
- **Storage**: 버킷 `photos` (프로필/책표지/제본/챌린지 사진). `uploadImg`가 사용.
- ⚠️ 개발자만 DB 접근 가능. 컬럼 추가가 필요하면 개발자에게 `alter table ... add column if not exists ...` SQL을 제시한다(코드는 없는 컬럼을 견디도록 방어).

## 10. 화면(렌더 함수) 지도
접두사 규칙: `r*`=화면 렌더, `f*`=플로우(송금 등), `i*`=리스트 로더(비동기 채우기).
- **홈**: `rHome`. 급식 hero + 바로가기 타일 + Today 카드.
- **머니**: `rMoney`(메인, 잔액/액션/최근거래) · `fTransfer`→`fTransferAmt`→`fTransferConfirm`(송금/발행/회수 플로우) · `openHistoryOverlay`(내역, §11.4).
- **학교**: `rSchool`(급식/학사일정/자습감독표/회의록 덱) + `rSchoolFood/rSchoolCal/rSchoolTT/rMeeting`.
- **커뮤니티**: `rComm`(허브 + 배너 캐러셀) → `rChallengePage`/`rBookPage`/`rPetitionPage`/`rPrint`. 상세: `rChallengeDetail/rBookDetail/rPetitionDetail/rPrintDetail`. 작성: `rChallengeNew/rBookNew/rPetitionNew/rPrintNew`. 로더: `iChallengeGallery/iBook/iPetition/iPrint`.
- **메시지**: `rSearch`(DM 목록/검색) → `rDmChat`(1:1 채팅). `rUserProfile`(프로필).
- **MY**: `rMy`(프로필/사진변경/로그아웃). `rNotifications`(MY에서 여는 전체화면 알림 — Home 벨과 별개).
- **알림 오버레이**: `openNotifOverlay`(Home 벨). **내역/알림은 오버레이가 정식 경로**(§11.4).
- **로그인**: `rLogin`.

## 11. 하위 시스템 상세

### 11.1 Supabase insert 방어 패턴 (중요)
스키마에 컬럼이 없어 insert가 통째 실패하는 것을 방지. `okya_books`/`okya_petitions` 등록에 이미 적용됨:
```js
let{error}=await wt(sb.from('TABLE').insert(row)).catch(e=>({error:e}))
for(let i=0;error&&i<5;i++){
  const col=(error.message||'').match(/'([^']+)' column/)?.[1]
  if(!col||!(col in row))break
  delete row[col]
  ;({error}=await wt(sb.from('TABLE').insert(row)).catch(e=>({error:e})))
}
```
새 insert 화면을 만들면 이 패턴을 쓰라. (임시로 fake 성공 처리 금지.)

### 11.2 ⚠️ CSS 스코프 `.p3` (버그 다발 지점)
`.lrow`, `.chip`, `.ntrow`, `.pbtn`, `.upload`, 대부분의 컴포넌트 CSS가 **`.p3 .xxx` 로 스코프**돼 있다.
- 모든 화면 최상위 요소는 `class="screen ... p3"` 를 가진다 → 그래서 화면 안에선 스타일이 먹는다.
- **`document.body`에 직접 붙는 요소(오버레이 등)는 `.p3` 밖이라 이 스타일이 안 먹는다.** → 그런 컨테이너에는 **`p3` 클래스를 직접 추가**해야 한다. (오버레이 패널이 `ov-panel p3 ...` 인 이유. 이거 빠지면 아이콘 거대해지고 레이아웃 깨짐.)

### 11.3 모션 시스템
- 토큰: `--dur-micro/standard/emphasis`, `--ease-out/spring/inout`.
- 홈 ambient: `okFloat`(급식 이모지 7s), `okGlow`(뒤 글로우 11s). 바로가기 auto-carousel `initShortcutCarousel()`(5s, 스와이프 시 정지/재개, `OK_HOME.destroy()`로 라우팅 시 정리 — **leak 방지 필수**).
- 스크롤 리빌: `.ok-reveal`/`okRevealObserve()` (IntersectionObserver).
- `prefers-reduced-motion` 전역 지원. 새 애니메이션 추가 시 이 미디어쿼리에 off 규칙도 추가.

### 11.4 오버레이 시스템 (알림=우측상단 / 내역=중앙)
- `openOverlay({variant,title,bodyHTML})` → 패널 클래스 `ov-panel p3 (ov-tr|ov-center)`. `closeOverlay()`. **동시에 하나만**(OK_OV). ESC/백드롭 클릭으로 닫힘. `document.body`에 붙음(뒤 화면 유지).
- `openNotifOverlay()` — Home 벨(`[data-bell]`, `wireBell()`에서 배선). 재클릭 토글.
- `openHistoryOverlay()` — 머니 내역/전체보기(`m-hist`,`m-all`), 송금완료 "내역보기", money 알림. 필터(전체/받기/송금/출석) + **날짜**(date picker, **KST 기준** `kstDateKey`/`kstToday`), 내부 스크롤(헤더/필터 고정).
- 알림 클릭 딥링크: `openNotif(n)` — 오버레이면 `closeOverlay()` 후 push, 아니면 pop 후 push.
- 리스트 행은 `txRow()`(거래)·notif rowHTML 사용 → 머니 메인과 동일 룩(그래서 패널에 `p3` 필수).

### 11.5 메시지 / 키보드 / 자동 스크롤 (`rDmChat`)
- 키보드 처리: `window.visualViewport` 사용. **키보드가 실제로 뷰포트를 줄일 때만**(`innerHeight-vv.height>90`) `.dm-screen`을 `position:fixed`+`top=vv.offsetTop`+`height=vv.height`로 고정 → 헤더 안정, 입력바만 키보드 위, 배경 안 튐. 키보드 내려가면 스타일 clear. (데스크톱/하드웨어 키보드는 안 건드림.)
- 자동 스크롤: `nearBottom(feed)`(하단 90px 이내)일 때만 최신으로 스크롤. `loadDms(force)` — force면 항상 하단(본인 전송/최초). 과거 읽는 중엔 위치 유지.

### 11.6 아바타 / 프로필 사진
- `okya_users.photo`에 사진 URL 저장. `USERS`는 `select('id,name,role,photo')`로 로드(**photo 빼먹지 말 것** — 빼면 타인 사진 전부 안 보임).
- 본인 변경 시 `SESSION.photo`와 `USERS` 내 본인 항목 둘 다 갱신.
- 타인 사진 표시: DM 헤더/메시지, 송금(검색/키패드/확인). `avatarHTML(id)` 또는 `user.photo` 사용.

### 11.7 좌측 레일 (landscape 전용)
- 하단 탭(`bnav`)이 landscape 미디어쿼리에서 **좌측 세로 레일**로 변신. 접기: `.rail-burger`(☰, `I.menu`) 클릭 → `RAIL_COLLAPSED` 토글 → `.bnav.collapsed`(66px, 아이콘만) + `body.rail-collapsed`(`.screen` padding-left 66px). width/padding transition 0.28s.
- ⚠️ `.rail-burger` display는 **특이도**로 관리(`.bnav .rail-burger{display:flex}`). 세로용 전역 `.rail-burger{display:none}`이 소스 순서상 뒤라, 특이도 안 높이면 가로에서도 숨겨진다(과거 버그).

### 11.8 커뮤니티 배너 캐러셀
- `rComm`의 커버플로우 배너(`initCarousel`, `startCommPoll`). **아코디언/배너 시스템 절대 삭제 금지**(개발자 강조 사항).

## 12. ⚠️ 반드시 지킬 함정 목록 (실제로 버그 났던 것들)
1. **`.p3` 스코프**: body 직속 요소엔 `p3` 클래스 추가 안 하면 스타일 안 먹음(§11.2).
2. **CSS 소스 순서 = 특이도 동률일 때 승자**: 뒤 규칙이 이긴다. landscape에서 뭔가 안 보이면 뒤쪽 전역 규칙이 덮는지 의심. 특이도를 올려라(무지성 `!important` 금지).
3. **insert 컬럼 실패**: 스키마에 없는 컬럼 → 전체 실패. §11.1 패턴 사용. "안 올라감" 버그의 흔한 원인.
4. **`nowISO()`는 UTC**. 날짜 필터/그룹은 **KST(+9)** 로 계산(`kstDateKey`). 안 그러면 이른 새벽 거래가 하루 밀린다.
5. **네이티브 파일 선택창은 우리가 못 바꾼다**: `<input type=file>` 탭 시 뜨는 "사진선택/촬영/파일" 시트는 OS UI. 애니메이션/스타일 제어 불가(개발자와 합의됨 — 건드리지 말 것).
6. **`bindNav()` 누락**: 최상위 화면 렌더 후 안 부르면 네비/레일 죽음.
7. **오버레이 leak/중복**: 항상 `openOverlay`가 기존 것 닫고 하나만. carousel은 `OK_HOME.destroy()`로 정리.
8. **`esc()` 누락 = XSS**: 사용자 문자열 출력 시 필수.
9. **기존 기능 삭제/mock 대체 금지**. 데이터 흐름을 실제로 복구할 것.

## 13. 알려진 미결 이슈
- 홈 "오늘의 옥야" 하이라이트 카드(`.today-okya[data-act="bell"]`, "새 알림 N개")는 **클릭 핸들러가 없어 무동작**. 원하면 `openNotifOverlay()`에 연결 가능(현재 방치, 범위 밖).
- 라이브 기능 QA는 개발자 실기기 몫(Supabase 로그인 필요).

## 14. 최근 작업 로그 (최신순)
- `e947a60` 사진 picker 인라인 버튼 **revert**(원래 단일 업로드로 복귀 — 개발자 선호).
- `18207d8` 레일 접기 버그 수정(햄버거 특이도) + width transition.
- `fc98eef` 오버레이 리스트에 `p3` 추가(아이콘 정상화).
- `f2540be`~`5d5622e` 알림/내역 **오버레이 개편**(Phase8-12): 벨→우측상단, 내역→중앙카드, 날짜필터(KST), 내부스크롤.
- `adf569b` 메시지 키보드 UX + 자동스크롤 + 프로필 사진 연동(Phase5-7).
- `5575864` 버튼 중앙정렬 + 송금 홈으로(rMoney) + 청원 등록 버그 + 청원 헤더 통일(Phase1-4).
- `a1f05b7` 모션 시스템(홈 ambient/carousel/reveal/reduced-motion).

## 15. 개발자가 Supabase에서 실행해야 하는 것 (해당 시)
컬럼이 없어 저장이 안 되면 SQL Editor에서:
```sql
alter table okya_users     add column if not exists photo text;
alter table okya_petitions add column if not exists purpose text;
alter table okya_petitions add column if not exists category text;
alter table okya_petitions add column if not exists reacts jsonb default '{}';
alter table okya_books     add column if not exists photo text;
```
(모두 `if not exists`라 이미 있으면 무동작 — 안전.)

---
_작성 기준 커밋: `e947a60`. 함수/셀렉터 이름 기준으로 서술했으니(줄번호는 변함) grep으로 위치를 찾아 확인하며 작업하라._
