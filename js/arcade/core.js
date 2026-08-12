'use strict';
// ══════════════════════════════════════════════════════════════════
//  OKSS ARCADE — 게임 허브 + 4개 게임 + 데일리 시스템
//  · 네비/머니/날짜 등은 기존 시스템(bnav·addTx·todayKey) 재사용
//  · Phase 4 asset: ARCADE_ASSETS에 실제 URL만 넣으면 이미지 교체(코드 수정 불필요)
//  · Phase 15 persistence: okss_arcade_* 네임스페이스(사용자별)
// ══════════════════════════════════════════════════════════════════

// [Phase 4] 게임별 교체 가능한 asset 슬롯. 비우면 CSS/이모지 placeholder 사용.
const ARCADE_ASSETS={
  lottery:{icon:'',thumbnail:'',hero:'',background:'',decorative:''},
  quiz:   {icon:'',thumbnail:'',hero:'',background:'',decorative:''},
  dash:   {icon:'',thumbnail:'',hero:'',background:'',player:'',obstacle:'',ground:''},
  math:   {icon:'',thumbnail:'',hero:'',background:'',decorative:''},
}
const arcArt=(game,slot)=>((ARCADE_ASSETS[game]||{})[slot]||'')

// [Phase 2] 게임 메타데이터 — UI와 분리(추가/수정 용이)
const ARCADE_GAMES=[
  {key:'lottery',name:'오늘의 옥야 뽑기',desc:'하루 한 번, 운을 시험해봐요',emoji:'🎁',grad:'linear-gradient(145deg,#FFE7D4,#FFC5AE 55%,#FFB1D0)',route:()=>rLottery()},
  {key:'quiz',   name:'옥야 퀴즈',        desc:'학교 상식 4지선다',        emoji:'🧠',grad:'linear-gradient(145deg,#DFE8FF,#C2D3FF 55%,#E4D2FF)',route:()=>rQuiz()},
  {key:'dash',   name:'옥야 DASH',        desc:'점프해서 장애물을 피해요',  emoji:'🐱',grad:'linear-gradient(145deg,#D6F5E9,#B6ECD6 55%,#CEF0FF)',route:()=>rDash()},
  {key:'math',   name:'오늘의 수학',      desc:'매일 새로운 한 문제',      emoji:'✏️',grad:'linear-gradient(145deg,#FFF1CE,#FFDFA1 55%,#FFD0C6)',route:()=>rMathDaily()},
]
const arcGame=k=>ARCADE_GAMES.find(g=>g.key===k)

// [Phase 15] persistence — 사용자별 네임스페이스 + 날짜 기반 일일 상태
const arcKey=sub=>`okss_arcade_${sub}_${SESSION?SESSION.id:'anon'}`
function arcGet(sub,def=null){try{const v=localStorage.getItem(arcKey(sub));return v==null?def:JSON.parse(v)}catch{return def}}
function arcSet(sub,val){try{localStorage.setItem(arcKey(sub),JSON.stringify(val))}catch{}}
const arcDoneToday=sub=>arcGet(sub)===todayKey()      // 값이 오늘이면 완료
const arcMarkToday=sub=>arcSet(sub,todayKey())
// lottery/quiz/math만 일일 완료 개념. dash는 점수제(완료 없음)
const arcGameDone=k=>(k==='lottery'||k==='quiz'||k==='math')?arcDoneToday(k):false

// [Phase 10] 오늘의 추천 게임 — 날짜 기반 deterministic(새로고침해도 고정, 날짜 바뀌면 순환)
function arcDailyGameKey(){
  const t=todayKey()
  let h=0;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))>>>0
  return ARCADE_GAMES[h%ARCADE_GAMES.length].key
}

// [Phase 9] 아케이드 보상 → 기존 옥야머니 시스템에 기록(내역에 "아케이드 · …")
const ARCADE_REWARDS={lottery:50,quiz:20,math:100}
async function arcadeReward(amount,label){
  if(!amount)return true
  return await addTx({from:'u_council',to:SESSION.id,amount,type:'발행',reason:'아케이드 · '+label},{silent:true})
}
// [Phase 5] 당첨 카드 위치 — 날짜+사용자+플레이횟수 기반(첫판은 날짜 deterministic, 재도전마다 이동)
function lotteryWinIndex(n){const s=todayKey()+'|'+(SESSION?SESSION.id:'')+'|'+(n||0);let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%5}
// 오늘의 뽑기 상태 {date, plays, result}. 날짜 바뀌면 자동 초기화.
function lotState(){const s=arcGet('lottery_state');return(s&&s.date===todayKey())?s:{date:todayKey(),plays:0,result:null}}
function saveLotState(st){arcSet('lottery_state',st)}

// [Phase 6] 옥야 퀴즈 — 문제 데이터(UI와 분리, 추가 시 코드 수정 불필요)
// {id, question, options:[4], answer(0~3), explanation, reward}
const QUIZ_BANK=[
  {id:'qz-region', question:'창녕옥야고등학교가 위치한 지역은 어디일까요?', options:['경남 창녕','경북 경주','전남 순천','충북 청주'], answer:0, explanation:'옥야고는 경상남도 창녕군에 있는 기숙형 사립고등학교예요.', reward:20},
  {id:'qz-eng',    question:'"옥야"의 영문 표기로 올바른 것은?', options:['OKYA','OGYA','OKYO','AKYA'], answer:0, explanation:'옥야는 영문으로 OKYA High School로 표기해요.', reward:20},
  {id:'qz-money',  question:'이 앱의 "옥야머니"는 무엇일까요?', options:['실제 현금','학생회 활동 포인트','급식 쿠폰','교통카드'], answer:1, explanation:'옥야머니는 실제 돈이 아니라 학생회 활동 포인트예요.', reward:20},
  {id:'qz-dorm',   question:'옥야 학생들이 주로 생활하는 곳은?', options:['통학','기숙사','하숙','자취'], answer:1, explanation:'옥야는 기숙형 학교라 대부분 기숙사에서 함께 생활해요.', reward:20},
  {id:'qz-meal',   question:'매일 급식 정보는 어디에서 확인할 수 있나요?', options:['학교 정문','옥야앱 급식 메뉴','교무실','매점'], answer:1, explanation:'옥야앱의 급식 메뉴에서 매일 조·중·석식을 확인할 수 있어요.', reward:20},
]
function quizToday(){const s=todayKey();let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return QUIZ_BANK[h%QUIZ_BANK.length]}

// [Phase 8] 오늘의 수학 — 문제 데이터(UI와 분리). 수식은 유니코드(×÷²√ 등)·줄바꿈(\n) 사용.
// {id, date?, question, answer, explanation, reward}  date 지정 시 그날 고정, 없으면 날짜로 순환.
const MATH_BANK=[
  {id:'ma-calc1',  question:'다음을 계산하세요.\n\n12 × 8 − 15', answer:'81',  explanation:'12 × 8 = 96, 96 − 15 = 81 이에요.', reward:100},
  {id:'ma-square', question:'한 변의 길이가 7인 정사각형의 넓이는?', answer:'49',  explanation:'정사각형의 넓이 = 한 변 × 한 변 = 7 × 7 = 49.', reward:100},
  {id:'ma-seq',    question:'다음 수열에서 빈칸에 올 수는?\n\n2, 4, 8, 16, ▢', answer:'32', explanation:'앞 항의 2배씩 커지는 등비수열이에요. 16 × 2 = 32.', reward:100},
  {id:'ma-eq',     question:'x + 5 = 12 일 때, x의 값은?', answer:'7',   explanation:'양변에서 5를 빼면 x = 12 − 5 = 7.', reward:100},
  {id:'ma-pct',    question:'50의 30%는 얼마일까요?', answer:'15',  explanation:'50 × 0.3 = 15 이에요.', reward:100},
]
function mathToday(){const t=todayKey();const dated=MATH_BANK.find(m=>m.date===t);if(dated)return dated;let h=0;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))>>>0;return MATH_BANK[h%MATH_BANK.length]}
