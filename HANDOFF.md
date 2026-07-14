# 옥야 앱 인수인계 문서
> 새 Claude Code 채팅에서 이 파일을 먼저 읽고 시작할 것

---

## 프로젝트 개요

- **앱명**: 옥야 (OKYA) — 창녕옥야고등학교 학생회 전용 PWA
- **배포**: Netlify → https://sage-sunflower-11c110.netlify.app
- **배포 방법**: `C:\Users\SAMSUNG\OneDrive\Desktop\okss\` 폴더 전체를 Netlify → Sites → Deploys 탭에 드래그 앤 드롭
- **소스 파일**: `C:\Users\SAMSUNG\OneDrive\Desktop\okss\index.html` (단일 파일, 917줄)
- **백엔드**: Supabase (https://rzajmazztaarzrqqkezr.supabase.co)
- **인증**: Google OAuth via Supabase

---

## 기술 스택

```
- 단일 HTML 파일 PWA (프레임워크 없음, 순수 JS)
- Supabase JS v2.39.3 (jsdelivr CDN ESM)
- Pretendard 폰트 (jsdelivr CDN)
- Google OAuth (Supabase signInWithOAuth)
- 배포: Netlify 정적 호스팅
```

---

## Supabase 설정

**anon key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YWptYXp6dGFhcnpycXFrZXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODk0NzQsImV4cCI6MjA5ODc2NTQ3NH0.IDk1fSv_B76wbzYouKS8TP4TObso2nA50rpo9qj96MU
```

**테이블 목록:**
| 테이블 | 용도 |
|--------|------|
| `okya_users` | 사용자 (id, name, role, photo) |
| `okya_tx` | 옥야머니 거래내역 (from, to, amount, type, reason, at) |
| `okya_events` | 챌린지 이벤트 |
| `okya_event_subs` | 챌린지 인증 제출 (reactions jsonb 컬럼 필요) |
| `okya_petitions` | 청원 |
| `okya_meetings` | 회의록 (영상 링크) |
| `okya_books` | 책 교환 |
| `okya_prints` | 옥야제본소 신청 |

**아직 실행 필요한 SQL:**
```sql
-- 프로필 사진 컬럼 (MY 화면 사진 업로드)
ALTER TABLE okya_users ADD COLUMN IF NOT EXISTS photo text;

-- 챌린지 리액션 컬럼 (이미 했을 수도 있음)
ALTER TABLE okya_event_subs ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;
```

---

## 코드 구조 (index.html)

### CSS (줄 12~170)
- 디자인 토큰: `--bg:#F7F8FA`, `--primary:#1A5CE6`, `--r:24px`, `--sh`, `--sh-blue`
- 컴포넌트 클래스: `.card`, `.hdr`, `.sub-hdr`, `.bnav`, `.bal-card`, `.bal-act`, `.ldg-item`, `.row-item`, `.school-grid`, `.comm-grid`, `.info-grid`, `.info-card`
- 애니메이션: `.fade-in` (slideUp 250ms)

### JavaScript (줄 160~917)

**핵심 상태 변수:**
```js
let SESSION=null    // 현재 로그인 사용자 {id, name, role, photo}
let USERS=[]        // 전체 사용자 목록
let TAB='home'      // 현재 탭
let STACK=[]        // 서브화면 스택
let commTab='challenge'  // (더 이상 사용 안 함 — 커뮤니티가 그리드로 바뀜)
```

**유틸리티:**
```js
wt(promise, ms)     // 타임아웃 래퍼 (기본 7초)
fmt(n)              // 숫자 → 한국식 콤마 포맷
esc(s)              // XSS 방지 HTML 이스케이프
timeago(iso)        // "3분 전" 형식
toast(msg)          // 하단 토스트 알림
push(fn)            // 서브화면 push
pop()               // 서브화면 pop (뒤로가기)
routeTab()          // 현재 TAB 렌더
```

**화면별 함수:**
| 함수 | 화면 | 상태 |
|------|------|------|
| `rLogin()` | 로그인 | 완료 (토스 스타일) |
| `rHome()` | 홈 | 완료 |
| `rMoney()` | 옥야머니 | 완료 |
| `fTransfer(mode)` | 송금/발행 폼 | 기존 유지 |
| `rSchool()` | 학교 (8개 그리드) | 완료 |
| `rSchoolFood()` | 급식 서브화면 | 완료 (더미) |
| `rSchoolCal()` | 학사일정 서브화면 | 완료 (더미) |
| `rSchoolTT()` | 시간표 서브화면 | 완료 (더미) |
| `rSchoolComingSoon(title)` | 준비중 서브화면 | 완료 |
| `rPrint()` | 옥야제본소 | 완료 (구기능 유지, 이름 변경) |
| `rMeeting()` | 회의록 | 기존 유지 |
| `rComm()` | 커뮤니티 (4카드 그리드) | 완료 |
| `rChallengePage()` | 챌린지 진입 래퍼 | 완료 |
| `rBookPage()` | 책교환 진입 래퍼 | 완료 |
| `rPetitionPage()` | 청원 진입 래퍼 | 완료 |
| `iChallenge()` | 챌린지 내용 렌더 | 기존 유지 |
| `iBook()` | 책교환 내용 렌더 | 기존 유지 |
| `iPetition()` | 청원 내용 렌더 | 기존 유지 |
| `rVerify(eid)` | 챌린지 인증 제출 | 기존 유지 |
| `rGallery(eid)` | 챌린지 인증 갤러리 | 기존 유지 |
| `rAward(subId)` | 옥야머니 지급 | 기존 유지 |
| `rConfirmBook(id)` | 책교환 매칭 확정 | 기존 유지 |
| `rMy()` | MY (프로필+설정) | 완료 (딥블루 헤더) |
| `handleUserUpsert(authUser)` | 로그인 후 처리 | 기존 유지 |

---

## 현재까지 완료된 리디자인

### ✅ 1단계: 홈
- OKSS 로고 + "창녕옥야고등학교" 헤더
- 딥블루 잔액 카드 (소형 송금·내역 버튼 내장)
- 2열 정보 카드: 오늘 급식 + 다가오는 일정 (더미)
- 최근 거래 목록
- 공지 카드 (더미)
- 이모지 전체 제거

### ✅ 2단계: 옥야머니
- "잔액 = 받은 금액 − 사용 금액" 제거
- 잔액 카드 안 소형 버튼으로 교체

### ✅ 3단계: 학교
- 옥야인쇄소 → **옥야제본소** 이름 변경 (전체)
- 8개 메뉴 4열 그리드 추가
- 급식·학사일정·시간표 더미 서브화면 구현
- 나머지 5개 "준비 중" 화면

### ✅ 4단계: 커뮤니티
- 탭 방식 → 2×2 카드 그리드
- 챌린지 / 책교환 / 청원 / 옥야제본소 4카드

### ✅ 5단계: MY
- 딥블루 그라데이션 프로필 헤더 (아이니셜/사진, 이름, 역할 뱃지)
- 사진 업로드 기능 (canvas 압축 → DB 저장)
- 옥야머니·청원 숏컷 제거 → 설정 메뉴만
- **로그아웃 버그 수정** (try/catch로 강제 초기화)

### ✅ 6단계: 로그인
- 토스 스타일 카드 레이아웃
- Google 버튼 hover 효과 + 클릭 disabled 처리

---

## 남은 작업 (미구현)

### 우선순위 높음
- [ ] 홈 화면 급식·일정·공지 → **실제 데이터** 연동 (현재 더미)
- [ ] 학교 탭 나머지 5개 (공지방, 도서관, 교실예약, 버스시간, 시험대비자료) 실제 기능 구현
- [ ] `okya_users` 테이블에 `photo text` 컬럼 추가 SQL 실행

### 우선순위 중간
- [ ] 홈 공지 → `okya_notices` 테이블 신설 또는 기존 테이블 활용
- [ ] 나이스 급식 API 연동 (또는 admin이 직접 입력하는 방식)
- [ ] 학사일정 → admin이 입력, DB 저장 방식
- [ ] 챌린지/청원 UX 개선 (카드 디자인 통일)
- [ ] 서브화면들 전체 새 디자인 토큰 적용 (아직 구형 스타일 혼재)

### 우선순위 낮음
- [ ] PWA manifest.json / service worker (오프라인 지원)
- [ ] 예산 확보 후 Supabase 유료 전환
- [ ] 교실예약 / 도서관 실제 DB 연동

---

## 디자인 토큰 (CSS 변수)

```css
--bg: #F7F8FA          /* 앱 배경 */
--card: #fff           /* 카드 배경 */
--ink: #191F28         /* 본문 텍스트 */
--ink2: #4E5968        /* 보조 텍스트 */
--muted: #8B95A1       /* 비활성 텍스트 */
--line: #EEF1F5        /* 구분선 */
--primary: #1A5CE6     /* 딥블루 (메인 컬러) */
--primary-d: #1349C0   /* 딥블루 다크 */
--primary-tint: #EEF3FF /* 딥블루 틴트 */
--danger: #E53E3E      /* 경고/삭제 */
--danger-tint: #FFF0F0
--r: 24px              /* 카드 border-radius */
--sh: 0 4px 20px rgba(0,0,0,.06),-2px 2px 10px rgba(0,0,0,.04)  /* 카드 그림자 */
--sh-blue: 0 10px 28px rgba(26,92,230,.22),-3px 3px 12px rgba(26,92,230,.1)
```

---

## 주요 규칙 (이어서 작업할 때 반드시 지킬 것)

1. **파일 저장 경로**: 항상 `C:\Users\SAMSUNG\OneDrive\Desktop\okss\index.html`
2. **이모지 금지**: 모든 아이콘은 Lucide 스타일 SVG (`I` 객체에 등록)
3. **단색만 사용**: 딥블루(primary) 외 green/purple/orange/yellow 사용 최소화
4. **카드 스타일**: `border-radius:var(--r)` (24px), `box-shadow:var(--sh)`, `background:var(--card)`
5. **애니메이션**: `.fade-in` 클래스 (250ms slideUp)
6. **DB 쿼리**: 반드시 `wt(query, ms)` 래퍼 사용 (타임아웃 방지)
7. **새 아이콘 추가**: `I` 객체(줄 ~230)에 SVG 문자열로 등록
8. **화면 이동**: `push(fn)` / `pop()` 사용, 탭 이동은 `TAB=` 후 `routeTab()`
