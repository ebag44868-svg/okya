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
async function rHome(){
  TAB='home'
  const topbar=`<div class="h2-top">
      <div class="t brand"><img src="${LOGO}" style="width:26px;height:26px;border-radius:8px;object-fit:cover">okya</div>
      <div style="display:flex;align-items:center;gap:2px">
        <button id="home-search" aria-label="검색"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button>
        <button data-bell>${I.bell}</button>
      </div>
    </div>`
  app().innerHTML=`<div class="screen fade-in p3 home2"><div class="h2-wrap">${topbar}<div class="loader" style="min-height:220px"><div class="spin"></div></div></div></div>${bnav()}`
  bindNav()

  const admin=SESSION.role==='admin'
  const[txs]=await Promise.all([getAllTx(),loadNotifs()])
  const bal=balOf(SESSION.id,txs)
  const issued=txs.filter(t=>t.type==='발행').reduce((s,t)=>s+t.amount,0)
  const todayStr=new Date().toISOString().slice(0,10)
  const upcoming=SCHEDULE.filter(s=>s.date>=todayStr).sort((a,b)=>a.date<b.date?-1:1)
  const d=new Date(),DOW=['일','월','화','수','목','금','토']
  const dateLine=`${d.getMonth()+1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`
  const slot0=defaultMealSlot()

  // 바로가기 타일: 각진 정사각형, 여백 없이 붙여서 가로 슬라이드. 각 타일은 향후 이미지를 꽉 채워 넣을 슬롯
  const SHORTCUTS=[['money','옥야머니','💰'],['petition','청원','📢'],['challenge','챌린지','🔥'],['school-food','급식','🍚'],['school-cal','학사일정','📅'],['school-mt','회의록','📹'],['book','책교환','📚'],['print','제본소','📖']]
  const shortcuts=SHORTCUTS.map(([k,l,e],i)=>`<button class="h2-sc sc-${i}" data-goto="${k}"><span class="h2-sc-emoji">${e}</span><span class="h2-sc-l">${l}</span></button>`).join('')

  const up=upcoming.slice(0,3).map(s=>{const dd=Math.max(0,Math.ceil((new Date(s.date)-new Date(todayStr))/86400000));return`<div class="h2-up-row"><div><div class="h2-up-t">${esc(s.label)}</div><div class="h2-up-d">${fmtDate(s.date)}</div></div><div class="h2-up-dd">D-${dd}</div></div>`}).join('')||`<div class="h2-empty">다가오는 일정이 없어요</div>`

  app().innerHTML=`<div class="screen fade-in p3 home2"><div class="h2-wrap">
    ${topbar}
    <section class="h2-hero">
      <div class="h2-hero-main">
        <div class="h2-eyebrow">오늘의 옥야 · ${dateLine}</div>
        <h1 class="h2-title">오늘의 급식</h1>
        <div class="h2-slotseg" id="hero-seg"></div>
        <ul class="h2-menu" id="hero-menu"></ul>
        <button class="h2-cta" data-goto="school-food">급식 자세히 보기 <span>→</span></button>
      </div>
      ${okyaCardHTML(txs,admin)}
    </section>

    <section class="h2-sec h2-sec-flush">
      <div class="h2-sec-head" style="padding:0 20px"><h2 class="h2-sec-t">바로가기</h2></div>
      <div class="h2-grid" id="h2-grid">${shortcuts}</div>
    </section>

    <section class="h2-sec">
      <div class="h2-sec-head"><h2 class="h2-sec-t">오늘의 학교생활</h2></div>
      <div class="h2-today">
        ${admin?'':`<div class="pcard tight att h2-att" id="att-panel">${attendancePanelHTML(txs)}</div>`}
        <div class="h2-today-cols">
          <button class="h2-surf h2-money" data-goto="money">
            <div class="h2-surf-lbl">${admin?'총 발행량':'옥야머니'}</div>
            <div class="h2-bignum"><span id="balnum">0</span><small>옥</small></div>
            <div class="h2-prog"><i id="progbar" style="width:0"></i></div>
            <div class="h2-prog-lbl"><span>${d.getFullYear()}년</span><span><b id="progpct">0</b>% 지남</span></div>
          </button>
          <div class="h2-surf h2-updates" data-goto="school-cal" role="button" tabindex="0">
            <div class="h2-surf-lbl">다가오는 일정</div>
            ${up}
          </div>
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
  document.querySelectorAll('.home2 [data-goto]').forEach(el=>{
    el.addEventListener('click',()=>goHome(el.dataset.goto))
    if(el.getAttribute('role')==='button')el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goHome(el.dataset.goto)}})
  })

  const attBtn=document.getElementById('att-btn');if(attBtn)attBtn.onclick=doAttendance
  const okc=document.getElementById('okya-card');if(okc){okc.onclick=()=>goOkyaCard(okc.dataset.okya);okc.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goOkyaCard(okc.dataset.okya)}}}
  document.getElementById('home-search').onclick=()=>push(()=>rGlobalSearch())
  const brand=document.querySelector('.h2-top .brand');if(brand){brand.style.cursor='pointer';brand.onclick=()=>eggTap('logo',5,()=>{brand.classList.remove('egg-wobble');void brand.offsetWidth;brand.classList.add('egg-wobble');confettiBurst();popMsg('옥야 파이팅!','🎉')})}
  countUp(document.getElementById('balnum'),admin?issued:bal)
  animateGauge(document.getElementById('progbar'),document.getElementById('progpct'),yearPct())
  wireBell()
  initShortcutCarousel()          // 바로가기 자동 소개 carousel (Phase 7·8)
  okRevealObserve(app())          // 스크롤 등장 리빌 (Phase 17)
}
