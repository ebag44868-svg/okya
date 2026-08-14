# 🎨 옥야앱(OKSS) Stitch 디자인 프롬프트

앱 전체 화면·팝업을 Google Stitch로 새로 뽑기 위한 프롬프트 모음.
Stitch는 **화면 하나씩** 뽑는 게 품질이 제일 좋으므로,
"공통 스타일 블록 + 화면별 프롬프트" 구조로 구성.

## 사용법
1. Stitch에서 **Mobile** 모드 선택
2. 아래 **[공통 스타일 블록]**을 매번 맨 앞에 복붙
3. 그 아래에 뽑고 싶은 **화면 번호의 프롬프트**를 붙여넣고 생성
4. 첫 3~4개 화면(로그인·홈·머니·MY)을 먼저 뽑아 톤을 확정한 뒤,
   마음에 드는 결과의 스타일을 유지하며 나머지를 뽑는 걸 추천

> 참고: 영어 설명 + 한글 UI라벨 혼합으로 작성됨(영어 설명이 Stitch 결과물 퀄이 더 안정적).

---

## ⬛ [공통 스타일 블록] — 매 프롬프트 맨 앞에 붙이기

```
A modern mobile app for a Korean high school student council, called "okya" (옥야).
Design language: clean, youthful, friendly, premium. iOS-quality polish.

Brand & color:
- Primary: violet #7B6CFF, with a 2-tone gradient (violet #7B6CFF → soft lavender-blue).
- Backgrounds: near-white #F7F7FB, cards pure white with soft shadows.
- Text: near-black #1A1A22 primary, gray #8A8A99 secondary.
- Accent gradient used on hero cards, primary buttons, coin/points.
- Danger: red #FB5B6B for logout / warnings.

Style rules:
- Rounded corners: cards 20px, buttons 14px, chips/pills full-round.
- Soft, diffused shadows (no harsh borders). Generous white space.
- Rounded sans-serif Korean font (Pretendard-like). Bold headings, medium body.
- Floating pill-shaped bottom navigation bar with 7 icons: 홈(home), 머니(wallet), 학교(school/building), 커뮤(community/people), 아케이드(game controller), 메시지(chat), MY(person). Active tab = violet.
- Subtle micro-interactions feel (press-scale). Light, airy, "cute but clean" mood.
- All UI text in KOREAN. Currency unit is "옥" (points, like coins).
Show a single mobile screen, realistic content, no lorem ipsum.
```

---

## 📱 화면별 프롬프트

### 0. 스플래시
```
Splash screen. Centered "okya" wordmark in violet gradient with a soft glowing halo, a small rounded square logo above it, subtitle "창녕옥야고등학교 학생회". Minimal, elegant, violet-tinted white background.
```

### 1. 로그인
```
Login screen. Top: glowing app logo + "okya" gradient wordmark + "옥야" + "창녕옥야고등학교 학생회". Center-bottom white card titled "로그인" with text "학교 구글 계정으로 로그인하면 옥야 서비스를 이용할 수 있어요." and a single white Google button "Google 계정으로 계속하기" with the Google G icon. Small note "처음 로그인하면 자동으로 계정이 만들어져요." Only Google login, nothing else.
```

### 2. 홈
```
Home screen with floating bottom nav. Top bar: "okya" brand with logo, search icon, bell icon (with red unread dot).
Hero row: a large "오늘의 급식" card (eyebrow "오늘의 옥야 · 8월 13일 수요일", segmented toggle 조식/중식/석식, a bulleted menu list, and a "급식 자세히 보기 →" button) next to a smaller gradient "오늘의 옥야" daily card (shows either "출석하기" or today's recommended arcade game).
Section "바로가기": horizontal row of square emoji tiles (💰옥야머니, 📢청원, 🔥챌린지, 🍚급식, 📅학사일정, 📹회의록, 📚책교환, 📖제본소).
Section "오늘의 학교생활": a "매일 출석" panel with a weekly 월~금 dot streak + "받기" button; below it two cards side by side — "옥야머니" with big number "1,240옥" and a year-progress bar, and "다가오는 일정" listing upcoming events with D-day badges.
```

### 3. 머니 (메인)
```
Wallet/money main screen. Hero card with gradient: "내 잔액" label, huge number "1,240옥", a line "이번 달 +320 받음 · -80 사용". Action buttons row: primary "송금" (send icon), "내역" (history icon).
Section "최근 거래" with a "전체보기 >" link, a horizontal category filter chip row (전체/출석/송금/챌린지/발행), and a transaction list. Each transaction row: colored circular icon, title (name/reason), date, and amount in green (+) or red (−) with running balance. Floating bottom nav.
```

### 3-1. 송금 ①받는 사람 선택
```
Send money — step 1 "받는 사람 선택". Header with back arrow, title "송금", "취소" text button. A search input "이름으로 검색". A scrollable list of selectable people rows (avatar circle, name, subtitle 학생/학생회 임원); the selected row highlighted with a violet ring/check. Bottom primary button "다음" (disabled/greyed until someone selected).
```

### 3-2. 송금 ②금액 입력 (키패드)
```
Send money — step 2 amount entry. Header: back arrow, title "송금", "취소". Shows recipient chip (avatar + name + "창녕옥야고등학교"). Center: huge amount display "0옥", below it "보유 1,240옥". Quick-add chips (+100, +500, +1,000, 전액). An optional message input with a chat icon "메시지 (선택)". A numeric keypad (1-9, 00, 0, delete). Full-width "다음" button at bottom. White background, clean.
```

### 3-3. 송금 ③확인 바텀시트
```
Confirmation bottom sheet sliding up over a dimmed screen. Grab handle at top. Centered recipient avatar, label "송금 확인", bold text "홍길동님에게 300옥 송금할까요?", optional quoted message. Two buttons: grey "취소" and wide gradient "보내기".
```

### 3-4. 송금 완료
```
Transfer success screen. Big animated check/coin celebration, "송금 완료!" heading, amount "300옥", recipient name, and a "확인" / "홈으로" button. Confetti accents in violet/gold. Joyful.
```

### 3-5. 거래 상세 바텀시트
```
Transaction detail bottom sheet. Title "거래 상세". Large amount at top (green + or red −) "＋300옥". A list of rows: 종류, 보낸/받는 사람, 메모, 일시, 거래번호. Clean key-value layout.
```

### 3-6. 거래 내역 오버레이
```
Transaction history modal card centered over dimmed background. Title "거래 내역" with close ✕. Filter chips (전체/받기/송금/출석) + a "날짜" chip with a date picker bar. Scrollable list grouped by date headers (e.g. "8월 13일 수요일") with transaction rows. Internal scroll.
```

### 3-7. 알림 오버레이
```
Notifications panel anchored top-right, sliding down over the home screen. Title "알림" with close ✕. List grouped by 오늘/어제/이번 주/이전. Each row: tinted circular icon, title, subtitle + relative time, unread dot. An empty state variant with 🔔 "아직 알림이 없어요".
```

### 4. 학교 — 급식
```
School tab, "급식" sub-tab active (top segmented tabs: 급식/학사일정/자습감독표/회의록). Meal cards for 조식·중식·석식, each a white card with a header, kcal, and a bulleted menu. A 5-star meal rating widget under today's meal. Date navigation. Floating bottom nav.
```

### 4-1. 학교 — 학사일정 (달력)
```
School "학사일정" sub-tab. A monthly calendar grid; days with events have a dot. Tapping a date reveals a detail list below. Month navigation arrows. A list of upcoming events with dates. Clean calendar UI.
```

### 4-2. 학교 — 자습감독표
```
School "자습감독표" (self-study supervision timetable) sub-tab. A weekly table/grid showing teacher-on-duty per day/period (월~일, 야자1·야자2). Clean tabular layout with the current day highlighted.
```

### 4-3. 학교 — 회의록
```
School "회의록" (meeting minutes) sub-tab. A list of student-council meeting records, each card with title, date, and a short summary + a play/video icon (some have recordings). Tap opens detail.
```

### 4-4. 교실 예약
```
Classroom reservation screen. Title "교실 예약". A weekday selector (월~금 야자1/야자2, 토·일 오전/오후/야자) with multi-select time slots as toggle chips. Shows who reserved each slot. A "예약하기" primary button.
```

### 4-5. 제본소 (목록 / 상세 / 작성)
```
"제본소" (study-material binding/printing) list screen: cards of shared exam materials with title, subject tag, uploader, thumbnail. A floating "+" to add. Include a detail view (large preview, description, download/print button) and a "새 자료 올리기" upload form with title, subject, file/photo picker.
```

### 5. 커뮤 (메인)
```
Community tab main screen. Top: a swipeable banner carousel (rounded promo cards with dots indicator). Below: entry cards/tiles to 챌린지, 청원, 책 교환, 제본소, 게시판. Friendly, colorful but clean. Floating bottom nav.
```

### 5-1. 챌린지 (목록)
```
"챌린지" list screen. Cards for each challenge: cover image, title, reward "+20옥" badge, participant count, progress. A "+" to create. Tabs for 진행중/종료. Energetic mood.
```

### 5-2. 챌린지 상세 + 인증
```
Challenge detail screen: big cover, title, description, reward, participant avatars, a photo gallery of submissions grid, and a primary "인증하기" button. Include a separate "인증" photo-submission sheet (camera/photo upload + caption).
```

### 5-3. 챌린지 만들기
```
"챌린지 만들기" form. Fields: title, description, reward amount (옥), cover image picker, start/end date. Primary "만들기" button. Clean form UI.
```

### 5-4. 청원 (목록)
```
"청원" (petition) list screen. Cards each with title, author, preview text, an agree/react count with a raised-hand or heart icon, and time. A "+" to write. Serious-but-approachable tone.
```

### 5-5. 청원 상세
```
Petition detail screen. Title, author + date, full body text, a large "동의" reaction button with live count, and supporter avatars. Clean reading layout.
```

### 5-6. 청원 작성
```
"청원 작성" form. Title input, large body textarea, a submit "발행"/"올리기" button. Minimal, focused writing UI.
```

### 5-7. 책 교환 (목록 / 상세 / 등록)
```
"책 교환" (book exchange) marketplace. Grid of book cards: cover photo, title, condition tag, owner. A "+" to register. Include a detail view (large cover, description, owner, "교환 신청" button) and a "책 등록" form with photo upload, title, description.
```

### 5-8. 게시판
```
Anonymous "게시판" (board) screen. A feed of posts: each card shows anonymous author, text content, timestamp, like/comment counts. A floating "+" compose button. Casual social feed style.
```

### 5-9. 분실물
```
"분실물" (lost & found) screen. Grid/list of lost item cards with photo, description, location, date, and status (분실/보관중). A "+" to report.
```

### 6. 아케이드 (메인)
```
Arcade tab main screen. Title "아케이드". A 2×2 grid of large colorful game cards, each with a gradient background, emoji/icon, name and subtitle: "오늘의 옥야 뽑기 🎁", "옥야 퀴즈 ❓", "옥야 DASH 🐱", "오늘의 수학 ➗". A "today's recommended game" highlight. Playful, arcade-like but still clean. Floating bottom nav.
```

### 6-1. 랜덤 뽑기
```
Arcade "오늘의 옥야 뽑기" game. A row of 5 face-down mystery cards to flip, a "뽑기" prompt, and a result reveal state showing a card flipping to reveal a reward "+50옥" with celebration. Fun, gacha-like.
```

### 6-2. 옥야 퀴즈
```
Arcade "옥야 퀴즈" game. A question card with the question text and 4 answer option buttons stacked. Show a revealed state where the correct option turns green and wrong turns red, with an explanation box and "+20옥" reward. Quiz-game style.
```

### 6-3. 옥야 DASH
```
Arcade "옥야 DASH" — an endless runner mini-game. A canvas game scene: a cute cat character jumping over obstacles on a scrolling ground, score at top, "BEST" score, and a tap-to-jump hint. Retro-cute runner aesthetic.
```

### 6-4. 오늘의 수학
```
Arcade "오늘의 수학" game. A math problem card with the question, a numeric text input for the answer, a submit button, and a correct/incorrect reveal with explanation and "+100옥" reward. Clean, focused.
```

### 7. 메시지 (목록)
```
Messages tab. Title "메시지". A search bar to find students. A list of DM conversation rows: avatar, name, last message preview, time, unread badge. Clean chat-list UI. Floating bottom nav.
```

### 7-1. 통합 검색
```
Global search screen. A prominent search input at top. Results grouped by category (사람, 청원, 책, 게시글...) each in a section with rows. Recent searches chips. Clean search UX.
```

### 7-2. DM 채팅
```
1:1 chat screen. Header: back arrow, avatar + name. Chat bubbles: mine in violet gradient on the right, received in light grey on the left, with timestamps. Bottom input bar with a text field and send button. White background. Auto-scroll feel.
```

### 7-3. 유저 프로필
```
User profile screen (viewing another student). Large avatar, name, "창녕옥야고등학교 · 학생", activity stats (출석, 챌린지, 등록 책...), and a "메시지 보내기" / "송금" button. Clean profile card layout.
```

### 8. MY
```
"MY" profile tab. Top: avatar with a camera-edit badge, name, "창녕옥야고등학교 · 학생", and a "Lv.5" badge. A level progress bar with "활동점수 1,240p · 다음 레벨까지 320p · 🔥 7일 연속". A row of stat tiles (옥야머니, 출석, 챌린지, 등록 책, 참여 청원). A menu list (거래 내역, 챌린지, 청원, 알림, and red 로그아웃). A "개인 설정" section titled "색상 테마" with a circular spectrum color-picker fan of 12 gradient color dots plus a custom color option. Version footer "옥야 v1.0 · 창녕옥야고 학생회". Floating bottom nav.
```

---

## 🧩 공통 컴포넌트 (필요 시 별도 생성)
```
- Toast: small rounded dark pill notification at top, e.g. "출석 완료".
- popMsg: centered emoji + short message pill, celebratory.
- 출석 축하 연출: full-screen confetti burst with a spinning coin badge "+20옥" and "출석 완료! 🔥".
- Empty state: friendly emoji + title + one-line description, centered.
- Loading: centered violet spinner.
- Generic bottom sheet & center modal shells (grab handle / close ✕).
```

---

## 화면 인벤토리 (코드 기준 대응표)
- 스플래시 → `index.html` #app
- 로그인 → `rLogin` (js/my.js)
- 홈 → `rHome` (js/home.js)
- 머니 → `rMoney` / 송금 `fTransfer`·`fTransferAmt`·`fTransferConfirm` / 거래상세 `txDetailSheet` / 내역 `openHistoryOverlay` / 알림 `openNotifOverlay`·`rNotifications` (js/money.js)
- 학교 → `rSchool`(급식/학사일정/자습감독표/회의록) / `rSchoolFood`·`rSchoolCal`·`rSchoolTT`·`rMeeting` / 교실예약 `rRoom` / 제본소 `rPrint`·`rPrintDetail`·`rPrintNew` (js/school.js)
- 커뮤 → `rComm` / 챌린지 `rChallengePage`·`rChallengeNew`·`rChallengeDetail`·`rVerify`·`rGallery`·`rAward` / 청원 `rPetitionPage`·`rPetitionNew`·`rPetitionDetail` / 책교환 `rBookPage`·`rBookNew`·`rBookDetail`·`rConfirmBook` / 게시판 `rBoard` / 분실물 `rLost` (js/community.js, community2.js)
- 아케이드 → `rArcade` / `rLottery`·`rQuiz`·`rDash`·`rMathDaily` (js/arcade/*)
- 메시지 → `rSearch` / 통합검색 `rGlobalSearch` / 채팅 `rDmChat` / 프로필 `rUserProfile` (js/message.js)
- MY → `rMy` (js/my.js)
- 공통 팝업 → `openSheet`·`openModal`·`openOverlay`·`toast`·`popMsg`·`celebrate` (js/core.js, money.js, school-data.js)
