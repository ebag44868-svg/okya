'use strict';
// ── Phase 3: 오늘의 옥야 — 오늘 가장 중요한 정보를 동적으로 우선 노출 ──
function todaySummaryHTML(txs,admin){
  const d=new Date(),w=['일','월','화','수','목','금','토'][d.getDay()]
  const dateLine=`${d.getMonth()+1}월 ${d.getDate()}일 · ${w}요일`
  const todayS=todayKey()
  const upcoming=SCHEDULE.filter(s=>s.date>=todayS).sort((a,b)=>a.date<b.date?-1:1)
  const ddOf=s=>Math.max(0,Math.ceil((new Date(s.date)-new Date(todayS))/86400000))
  const examRe=/시험|고사|수능|평가|모의|창심/
  const exam=upcoming.find(s=>examRe.test(s.label)&&ddOf(s)<=14)
  const attNeed=!admin&&!attDoneToday(txs)
  const unread=unreadCount()
  let hl
  if(exam)hl={ic:'📝',t:exam.label,s:`D-${ddOf(exam)} · ${fmtDate(exam.date)}`,tone:'exam'}
  else if(attNeed)hl={ic:'✓',t:'오늘 출석 체크',s:'지금 누르고 +20옥 받기',tone:'att',act:'att'}
  else if(unread)hl={ic:'🔔',t:`새 알림 ${unread}개`,s:'확인해보세요',tone:'notif',act:'bell'}
  else if(upcoming[0])hl={ic:'📅',t:upcoming[0].label,s:`D-${ddOf(upcoming[0])} · ${fmtDate(upcoming[0].date)}`,tone:'notif'}
  else hl={ic:'🌤️',t:cheer(),s:'',tone:'default'}
  const meal=((mealsOf(todayS)||{})[defaultMealSlot()]||[]).filter(Boolean)
  const mealTxt=meal.length?meal.slice(0,2).join(' · '):'정보 없음'
  const next=upcoming[0]
  const strip=[
    `<div class="ts-item"><span class="ts-k">오늘 ${defaultMealSlot()}</span><span class="ts-v">${esc(mealTxt)}</span></div>`,
    next?`<div class="ts-item"><span class="ts-k">다음 일정</span><span class="ts-v">${esc(next.label)}<b class="ts-dd">D-${ddOf(next)}</b></span></div>`:''
  ].filter(Boolean).join('<span class="ts-div"></span>')
  return`<div class="today-okya"${hl.act?` data-act="${hl.act}"`:''}>
    <div class="today-head"><span class="today-eyebrow">오늘의 옥야</span><span class="today-date">${dateLine}</span></div>
    <div class="today-hl tone-${hl.tone}"><span class="today-hl-ic">${hl.ic}</span><div class="today-hl-tx"><div class="today-hl-t">${esc(hl.t)}</div>${hl.s?`<div class="today-hl-s">${esc(hl.s)}</div>`:''}</div>${hl.act?`<span class="today-hl-go">${I.chev}</span>`:''}</div>
    <div class="today-strip">${strip}</div>
  </div>`
}
// ── 옥야 2.0 홈: landscape-first, 카드 스택 폐기 → Hero + 바로가기 타일 + Today ──
function renderHeroMeal(slot){
  const seg=document.getElementById('hero-seg'),ul=document.getElementById('hero-menu')
  if(!seg||!ul)return
  seg.innerHTML=MEAL_SLOTS.map(([k])=>`<button class="h2-slotbtn${k===slot?' on':''}" data-slot="${k}">${k}</button>`).join('')
  const items=((mealsOf(todayKey())||{})[slot]||[]).filter(Boolean)
  ul.innerHTML=items.length?items.map((x,i)=>`<li style="animation-delay:${i*45}ms">${esc(x)}</li>`).join(''):`<li class="h2-menu-empty">오늘 ${slot} 정보가 없어요</li>`
  seg.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>renderHeroMeal(b.dataset.slot))
}
// [Phase 11] 홈 "오늘의 옥야" 카드(급식 hero 오른쪽) — 출석 우선, 완료 시 오늘의 추천 게임.
function okyaCardHTML(txs,admin){
  const attNeed=!admin&&!attDoneToday(txs)
  if(attNeed){
    return`<div class="h2-hero-visual okya-card okc-att" id="okya-card" data-okya="att" role="button" tabindex="0">
      <div class="okc-eyebrow">오늘의 옥야</div>
      <div class="okc-emoji">✓</div>
      <div class="okc-body"><div class="okc-title">오늘 출석 체크</div><div class="okc-desc">아직 출석하지 않았어요</div></div>
      <span class="okc-btn">출석하고 +20옥</span>
    </div>`
  }
  const g=arcGame(arcDailyGameKey())||ARCADE_GAMES[0]
  return`<div class="h2-hero-visual okya-card okc-game" id="okya-card" data-okya="game" role="button" tabindex="0" style="background:${g.grad}">
    <div class="okc-eyebrow">오늘의 옥야</div>
    <div class="okc-emoji">${g.emoji}</div>
    <div class="okc-body"><div class="okc-label">오늘의 추천 게임</div><div class="okc-title">${esc(g.name)}</div></div>
    <span class="okc-btn okc-btn-light">플레이 <span>→</span></span>
  </div>`
}
// 홈 오늘의 옥야 클릭(Phase 12): 출석하기 or 추천 게임으로 바로 이동
function goOkyaCard(mode){
  if(mode==='att'){doAttendance();return}
  const g=arcGame(arcDailyGameKey())||ARCADE_GAMES[0]
  // 아케이드 탭을 base로 두고 게임으로 바로 진입(뒤로가기 시 아케이드 메인). 중간 화면 flash 없음.
  TAB='arcade';STACK=[];push(g.route)
}
// ── 홈 리디자인(그린/자연) — 마크업+스타일만 교체, 데이터/라우팅/기능은 기존 헬퍼 그대로 ──
// 스타일: css/home-redesign.css (.rd 스코프). 애니메이션(캐러셀/리빌)은 후속 단계라 이 단계에선 호출 안 함.
async function rHome(){
  TAB='home'
  const admin=SESSION.role==='admin'
  const d=new Date(),DOW=['일','월','화','수','목','금','토']
  const dateLine=`${d.getMonth()+1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`
  const SICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'
  const topbar=`<header class="hm-top">
      <div class="hm-eyebrow">오늘의 옥야 · ${dateLine}</div>
      <div class="hm-actions">
        <button class="hm-ico" id="home-search" aria-label="검색">${SICO}</button>
        <button class="hm-ico" data-bell aria-label="알림">${I.bell}</button>
      </div>
    </header>`
  app().innerHTML=`<div class="screen fade-in p3 home2 rd"><div class="hm-wrap">${topbar}<div class="loader" style="min-height:220px"><div class="spin"></div></div></div></div>${bnav()}`
  bindNav()

  const[txs]=await Promise.all([getAllTx(),loadNotifs()])
  const bal=balOf(SESSION.id,txs)
  const issued=txs.filter(t=>t.type==='발행').reduce((s,t)=>s+t.amount,0)
  const todayStr=new Date().toISOString().slice(0,10)
  const upcoming=SCHEDULE.filter(s=>s.date>=todayStr).sort((a,b)=>a.date<b.date?-1:1)
  const slot0=defaultMealSlot()

  const TICO={
    cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="18" rx="2.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>',
    vid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="2" y="6" width="14" height="12" rx="2.5"/><path d="M16 10l6-3v10l-6-3z"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 5a2 2 0 0 1 2-2h6v16H6a2 2 0 0 0-2 2z"/><path d="M20 5a2 2 0 0 0-2-2h-6v16h6a2 2 0 0 1 2 2z"/></svg>',
    print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="6" y="3" width="12" height="7" rx="1.5"/><rect x="4" y="10" width="16" height="8" rx="2"/><path d="M8 18v3h8v-3"/></svg>'
  }
  const TILES=[['school-cal','학사일정','cal','t-green'],['school-mt','회의록','vid','t-lav'],['book','책교환','book','t-blue'],['print','제본소','print','t-pink']]
  const tiles=TILES.map(([k,l,ic,cls])=>`<button class="hm-tile ${cls}" data-goto="${k}"><span class="hm-tile-ic">${TICO[ic]}</span><span class="hm-tile-l">${l}</span></button>`).join('')

  const LEAF='<svg class="leaf %C" viewBox="0 0 100 100" fill="currentColor"><path d="M50 5C30 25 20 55 50 95 80 55 70 25 50 5z"/></svg>'
  const leaves=LEAF.replace('%C','l1')+LEAF.replace('%C','l2')+LEAF.replace('%C','l3')

  const up=upcoming.slice(0,3).map(s=>{const dd=Math.max(0,Math.ceil((new Date(s.date)-new Date(todayStr))/86400000));return`<div class="hm-up-row"><div><div class="hm-up-t">${esc(s.label)}</div><div class="hm-up-d">${fmtDate(s.date)}</div></div><div class="hm-up-dd${dd<=7?' soon':''}">D-${dd}</div></div>`}).join('')||`<div class="hm-empty">다가오는 일정이 없어요</div>`

  app().innerHTML=`<div class="screen fade-in p3 home2 rd"><div class="hm-wrap">
    ${topbar}
    <section class="hm-hero-row">
      <div class="hm-hero">
        ${leaves}
        <div class="hm-hero-eyebrow">오늘의 급식</div>
        <h1 class="hm-hero-title">오늘의 급식</h1>
        <div class="hm-slotseg" id="hero-seg"></div>
        <ul class="hm-menu" id="hero-menu"></ul>
        <button class="hm-hero-cta" data-goto="school-food">급식 자세히 보기 <span>→</span></button>
      </div>
      ${okyaCardHTML(txs,admin)}
    </section>

    <section class="hm-tiles">${tiles}</section>

    <section class="hm-life">
      <h2 class="hm-life-h">오늘의 학교생활</h2>
      <div class="hm-life-grid">
        <div class="hm-life-left">
          ${admin?'':`<div class="hm-att" id="att-panel">${attendancePanelHTML(txs)}</div>`}
          <button class="hm-bal" data-goto="money">
            <div class="hm-bal-lbl">${admin?'총 발행량':'옥야머니'}</div>
            <div class="hm-bal-num"><span id="balnum">0</span><small>옥</small></div>
            <div class="hm-gauge"><i id="progbar"></i></div>
            <div class="hm-gauge-lbl"><span>${d.getFullYear()}년</span><span><b id="progpct">0</b>% 지남</span></div>
          </button>
        </div>
        <div class="hm-up">
          <div class="hm-up-h">다가오는 일정</div>
          ${up}
        </div>
      </div>
    </section>
  </div></div>${bnav()}`
  bindNav()
  renderHeroMeal(slot0)

  // click-through: 기존 라우팅 유지
  const goHome=k=>{
    if(k==='school-food'){TAB='school';STACK=[];rSchool(0)}
    else if(k==='school-cal'){TAB='school';STACK=[];rSchool(1)}
    else if(k==='school-mt'){TAB='school';STACK=[];rSchool(3)}
    else if(k==='money'){TAB='money';STACK=[];rMoney()}
    else if(k==='comm'){TAB='comm';STACK=[];rComm()}
    else if(k==='petition'){push(rPetitionPage)}
    else if(k==='challenge'){push(rChallengePage)}
    else if(k==='book'){push(rBookPage)}
    else if(k==='print'){push(rPrint)}
  }
  document.querySelectorAll('.rd [data-goto]').forEach(el=>{
    el.addEventListener('click',()=>goHome(el.dataset.goto))
    if(el.getAttribute('role')==='button')el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goHome(el.dataset.goto)}})
  })

  const attBtn=document.getElementById('att-btn');if(attBtn)attBtn.onclick=doAttendance
  const okc=document.getElementById('okya-card');if(okc){okc.onclick=()=>goOkyaCard(okc.dataset.okya);okc.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goOkyaCard(okc.dataset.okya)}}}
  document.getElementById('home-search').onclick=()=>push(()=>rGlobalSearch())
  countUp(document.getElementById('balnum'),admin?issued:bal)
  animateGauge(document.getElementById('progbar'),document.getElementById('progpct'),yearPct())
  wireBell()
}
