'use strict';
// ── 학교 데이터 (NEIS 연동) ──
// 급식(meal.json)·학사일정(schedule.json)은 GitHub Actions가 매일 자정(KST) 자동 생성/커밋.
// 아래 DATA_BASE 를 본인 GitHub Pages 주소로 바꾸면 실데이터가 로드됨. (못 받으면 아래 기본값 사용)
const DATA_BASE='https://ebag44868-svg.github.io/okya_data'  // 창녕옥야고 급식·학사일정 JSON (GitHub Pages)
// MEALS: { 'YYYY-MM-DD': { 조식:[...], 중식:[...], 석식:[...] } }
let MEALS={}
// SCHEDULE: [{date:'YYYY-MM-DD', label:'...'}]  (연동 실패 시 기본값)
let SCHEDULE=[
  {date:'2026-07-25',label:'기말고사 시작'},
  {date:'2026-08-01',label:'여름방학 시작'},
  {date:'2026-09-01',label:'2학기 개학'},
]
const todayKey=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function mealsOf(dateKey){return MEALS[dateKey]||null}
// 급식 카드 HTML(조·중·석 한 화면). m: {조식,중식,석식} 또는 null
function mealCardsHTML(m){
  const slots=['조식','중식','석식']
  const has=m&&slots.some(k=>(m[k]||[]).length)
  if(!has)return`<div class="card-list"><div style="padding:18px;font-size:14px;color:var(--muted);text-align:center">급식 정보가 없어요</div></div>`
  return`<div style="display:flex;flex-direction:column;gap:10px">${slots.map((k,si)=>{
    const items=(m[k]||[]).filter(Boolean)
    if(!items.length)return''
    return`<div class="meal-card" style="animation-delay:${si*60}ms"><div class="meal-slot">${k}</div><ul class="meal-list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`
  }).join('')}</div>`
}
// ── 급식 슬롯 토글 / 출석 / 달력 (신규) ──
const ICO_GIFT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><path d="M12 8S10.5 3 8 3 5 6 5 6s2 2 7 2z"/></svg>'
const ICO_CAL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>'
const MEAL_SLOTS=[['조식','오전 8:00'],['중식','오후 12:30'],['석식','오후 6:00']]
function defaultMealSlot(){const n=new Date(),m=n.getHours()*60+n.getMinutes();if(m<510)return'조식';if(m<810)return'중식';return'석식'}
let HOME_MEAL=null
function mealPanelHTML(dateKey,slot){
  const m=mealsOf(dateKey)||{}
  const items=(m[slot]||[]).filter(Boolean)
  const time=(MEAL_SLOTS.find(s=>s[0]===slot)||[])[1]||''
  const seg=MEAL_SLOTS.map(([k])=>`<button data-slot="${k}" style="flex:1;padding:8px 0;border:none;border-radius:11px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;background:${k===slot?'var(--primary)':'transparent'};color:${k===slot?'#fff':'var(--muted)'}">${k}</button>`).join('')
  const body=items.length
    ?`<div style="display:flex;flex-direction:column;gap:10px">${items.map(x=>`<div style="display:flex;align-items:center;gap:10px;font-size:15px;font-weight:500;color:var(--ink)"><span style="width:5px;height:5px;border-radius:50%;background:var(--primary);opacity:.5;flex:none"></span>${esc(x)}</div>`).join('')}</div>`
    :`<div style="padding:10px 0;font-size:14px;color:var(--muted);text-align:center">급식 정보가 없어요</div>`
  return`<div style="background:var(--card);border-radius:18px;box-shadow:var(--sh);padding:14px 16px 16px">
    <div style="display:flex;gap:5px;background:var(--bg);padding:4px;border-radius:13px;margin-bottom:14px">${seg}</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--line)">
      <div style="width:34px;height:34px;border-radius:11px;background:var(--primary-tint);color:var(--primary);display:flex;align-items:center;justify-content:center">${I.food}</div>
      <div><div style="font-size:14px;font-weight:700;color:var(--ink)">${slot}</div><div style="font-size:11px;color:var(--muted)">${time}</div></div>
    </div>
    ${body}</div>`
}
function bindMealSeg(){document.querySelectorAll('#home-meal [data-slot]').forEach(b=>{b.onclick=()=>{HOME_MEAL=b.dataset.slot;const c=document.getElementById('home-meal');if(c){c.innerHTML=mealPanelHTML(todayKey(),HOME_MEAL);bindMealSeg()}}})}
// preview 스타일 홈 급식 렌더 (#home-meal-seg 필/#home-meal 리스트)
function renderHomeMeal(slot){
  HOME_MEAL=slot
  const seg=document.getElementById('home-meal-seg'),ul=document.getElementById('home-meal')
  if(!seg||!ul)return
  seg.innerHTML=MEAL_SLOTS.map(([k])=>`<button class="ppill${k===slot?' on':''}" data-slot="${k}">${k}</button>`).join('')
  const items=((mealsOf(todayKey())||{})[slot]||[]).filter(Boolean)
  ul.innerHTML=items.length?items.map(x=>`<li>${esc(x)}</li>`).join(''):`<div style="padding:6px 0;font-size:13.5px;color:var(--sub)">급식 정보가 없어요</div>`
  ul.classList.remove('swap');void ul.offsetWidth;ul.classList.add('swap')
  seg.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>renderHomeMeal(b.dataset.slot))
}
// 출석 체크 (+20옥, 하루 1회) — 타임존 안전(로컬 날짜로 비교)
function dayKeyOf(iso){const d=new Date(iso);if(isNaN(d))return(iso||'').slice(0,10);const p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
function attDoneToday(txs){const t=todayKey();return txs.some(x=>x.type==='출석'&&x.to===SESSION.id&&dayKeyOf(x.at)===t)}
async function doAttendance(){
  const b=document.getElementById('att-btn');if(b){if(b.disabled)return;b.disabled=true;b.textContent='...'}
  const txs=await getAllTx()
  if(attDoneToday(txs)){toast('오늘은 이미 출석했어요');if(b){b.disabled=false;b.textContent='받기'}return}
  const wk=attWeek(txs),isFri=new Date().getDay()===5,bonus=isFri&&wk[0]&&wk[1]&&wk[2]&&wk[3]
  const amt=bonus?40:20
  const ok=await addTx({from:'u_council',to:SESSION.id,amount:amt,type:'출석',reason:bonus?'출석(개근 보너스)':'출석 체크'})
  if(ok){celebrate(amt,bonus);await rHome();const on=app().querySelectorAll('#att-panel .dot.on');const last=on[on.length-1];if(last)last.classList.add('pop')}
}
// 출석 보상 축하 연출 (코인 스핀 + 콘페티 버스트 + 금액 팝업)
function celebrate(amount,bonus){
  const cols=['#7B6CFF','#CE7AFF','#FFD873','#5AD8A6','#FF7AA2','#6453FF']
  let conf=''
  for(let i=0;i<28;i++){
    const ang=Math.random()*Math.PI*2,dist=110+Math.random()*190
    const dx=Math.round(Math.cos(ang)*dist),dy=Math.round(Math.sin(ang)*dist*.85+40+Math.random()*140)
    const c=cols[i%cols.length],rot=Math.round(Math.random()*720-360)+'deg',delay=(Math.random()*.14).toFixed(2)
    conf+=`<span class="p" style="background:${c};--dx:calc(-50% + ${dx}px);--dy:calc(-50% + ${dy}px);--rot:${rot};animation-delay:${delay}s"></span>`
  }
  const ov=document.createElement('div')
  ov.className='celebrate'
  ov.innerHTML=`<div class="glow"></div>${conf}<div class="badge"><div class="coin">옥</div><div class="amt2">+${fmt(amount)}옥</div><div class="msg2">${bonus?'개근 달성! 🎉':'출석 완료! 🔥'}</div></div>`
  document.body.appendChild(ov)
  setTimeout(()=>ov.remove(),1650)
}
// 이스터에그: 배지 없는 짧은 색종이 터짐
function confettiBurst(){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return
  const cols=['#7B6CFF','#CE7AFF','#FFD873','#5AD8A6','#FF7AA2','#6453FF']
  let conf=''
  for(let i=0;i<24;i++){const ang=Math.random()*Math.PI*2,dist=90+Math.random()*180,dx=Math.round(Math.cos(ang)*dist),dy=Math.round(Math.sin(ang)*dist*.85+30+Math.random()*120),c=cols[i%cols.length],rot=Math.round(Math.random()*720-360)+'deg',delay=(Math.random()*.14).toFixed(2);conf+=`<span class="p" style="background:${c};--dx:calc(-50% + ${dx}px);--dy:calc(-50% + ${dy}px);--rot:${rot};animation-delay:${delay}s"></span>`}
  const ov=document.createElement('div');ov.className='celebrate';ov.innerHTML=conf;document.body.appendChild(ov);setTimeout(()=>ov.remove(),1500)
}
// 빠른 연속 탭 감지(1.5초 내 need회)
const _eggTap={}
function eggTap(key,need,cb){const t=Date.now(),s=_eggTap[key]||{n:0,last:0};if(t-s.last>1500)s.n=0;s.n++;s.last=t;_eggTap[key]=s;if(s.n>=need){s.n=0;cb()}}
function attWeek(txs){const now=new Date(),day=(now.getDay()+6)%7,mon=new Date(now);mon.setDate(now.getDate()-day);const pad=n=>String(n).padStart(2,'0');const res=[];for(let i=0;i<5;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);res.push(txs.some(x=>x.type==='출석'&&x.to===SESSION.id&&dayKeyOf(x.at)===`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`))}return res}
const ICO_CHECK_SM='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
const ICO_DEL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>'
// preview .att 스타일 (홈 전용). 기능(주간 출석/금요일 2배 보너스)은 doAttendance에서 유지
function attendancePanelHTML(txs){
  const wk=attWeek(txs),L=['월','화','수','목','금'],done=attDoneToday(txs)
  const dots=wk.map((on,i)=>`<div class="dot${on?' on':''}">${on?ICO_CHECK_SM:L[i]}</div>`).join('')
  const btn=done?`<button class="get" disabled>완료</button>`:`<button class="get" id="att-btn">받기</button>`
  return`<span class="t">매일 출석</span><div class="dots">${dots}</div>${btn}`
}
function countUp(el,to,dur=900){if(!el)return;const t0=performance.now();(function tk(now){const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(to*e));if(p<1)requestAnimationFrame(tk)})(t0)}
function yearPct(){const n=new Date(),y=n.getFullYear(),s=new Date(y,0,1),e=new Date(y+1,0,1);return Math.round((n-s)/(e-s)*100)}
// 게이지바+퍼센트를 JS로 직접 이징 애니메이션(CSS transition 배칭 이슈 회피). 무조건 재생됨.
function animateGauge(bar,pctEl,target,dur=1400,delay=280){
  if(!bar)return
  bar.style.transition='none';bar.style.width='0%'
  const t0=performance.now()+delay
  ;(function tk(now){
    const p=Math.max(0,Math.min(1,(now-t0)/dur)),e=1-Math.pow(1-p,3)
    if(now>=t0){bar.style.width=(target*e).toFixed(1)+'%';if(pctEl)pctEl.textContent=Math.round(target*e)}
    if(p<1)requestAnimationFrame(tk)
  })(performance.now())
}

// ===================== OKSS Motion System (JS) =====================
const OK_REDUCE=()=>matchMedia('(prefers-reduced-motion:reduce)').matches
// 스크롤 등장 리빌: 한 개의 영속 옵저버로 .ok-reveal 요소를 뷰포트 진입 시 노출
let _okRevealIO=null
function okRevealObserve(scope){
  if(OK_REDUCE())return
  if(!_okRevealIO){
    _okRevealIO=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');_okRevealIO.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'})
  }
  ;(scope||document).querySelectorAll('.ok-reveal:not(.in),.ok-reveal-img:not(.in)').forEach(el=>_okRevealIO.observe(el))
}
// 홈 바로가기 auto-carousel: 포커스가 한 칸씩 자동 이동, interaction 시 pause·재개, 오프스크린/백그라운드/reduced-motion 대응
let OK_HOME=null
function initShortcutCarousel(){
  if(OK_HOME&&OK_HOME.destroy)OK_HOME.destroy()
  const rail=document.getElementById('h2-grid');if(!rail)return
  const tiles=[...rail.querySelectorAll('.h2-sc')];if(tiles.length<2)return
  rail.classList.add('ok-focusmode')
  let idx=0,timer=null,paused=false,resumeT=null,raf=null,onScreen=true,dead=false
  const reduce=OK_REDUCE()
  const focusUpdate=()=>{
    const c=rail.scrollLeft+rail.clientWidth/2
    let best=0,bd=1e9
    tiles.forEach((t,i)=>{const tc=t.offsetLeft+t.offsetWidth/2,dd=Math.abs(tc-c);if(dd<bd){bd=dd;best=i}})
    tiles.forEach((t,i)=>t.classList.toggle('is-focus',i===best));idx=best
  }
  const go=i=>{idx=(i%tiles.length+tiles.length)%tiles.length;const t=tiles[idx];rail.scrollTo({left:Math.max(0,t.offsetLeft-(rail.clientWidth-t.offsetWidth)/2),behavior:'smooth'})}
  const tick=()=>{if(paused||!onScreen||document.hidden)return;go(idx+1)}
  const start=()=>{if(reduce||dead||timer)return;timer=setInterval(tick,5000)}
  const stop=()=>{clearInterval(timer);timer=null}
  const pause=()=>{paused=true;clearTimeout(resumeT);resumeT=setTimeout(()=>{paused=false},5200)}
  rail.addEventListener('scroll',()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=null;focusUpdate()})},{passive:true})
  ;['pointerdown','wheel','touchstart'].forEach(ev=>rail.addEventListener(ev,pause,{passive:true}))
  const io=new IntersectionObserver(es=>{es.forEach(e=>{onScreen=e.isIntersecting;onScreen?start():stop()})},{threshold:.35})
  io.observe(rail)
  const onVis=()=>{if(document.hidden)stop();else if(onScreen)start()}
  document.addEventListener('visibilitychange',onVis)
  focusUpdate()
  OK_HOME={destroy(){dead=true;stop();clearTimeout(resumeT);io.disconnect();document.removeEventListener('visibilitychange',onVis)}}
}

// 달력 그리드 (모듈 스코프라 인라인 onclick 대신 data-속성 사용)
function calGrid(y,mo,o){o=o||{}
  const first=new Date(y,mo,1).getDay(),days=new Date(y,mo+1,0).getDate(),wd=['일','월','화','수','목','금','토']
  let cells=wd.map((w,i)=>`<div style="text-align:center;font-size:11px;font-weight:600;color:${i===0?'#F0616B':'var(--muted)'};padding-bottom:6px">${w}</div>`).join('')
  for(let i=0;i<first;i++)cells+='<div></div>'
  for(let d=1;d<=days;d++){const dow=(first+d-1)%7,isT=o.today===d,isS=o.sel===d,mk=(o.events&&o.events[d])||(o.avail&&o.avail[d]);const bg=isT?'var(--primary)':isS?'var(--primary-tint)':'transparent';const col=isT?'#fff':isS?'var(--primary)':dow===0?'#F0616B':'var(--ink)';const dc=o.clickable?`data-day="${d}"`:''
    const dotc=isT?'#fff':((o.dotColors&&o.dotColors[d])||'var(--primary)')
    const rat=o.ratings&&o.ratings[d]
    const mark=rat?`<span style="position:absolute;bottom:3px;font-size:8.5px;font-weight:800;letter-spacing:-.3px;line-height:1;color:${isT?'#fff':'#E0930F'}">★${rat.toFixed(1)}</span>`:(mk?`<span style="position:absolute;bottom:5px;width:4px;height:4px;border-radius:50%;background:${dotc}"></span>`:'')
    cells+=`<div ${dc} style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;position:relative;font-size:13px;font-weight:${(isT||isS)?'700':'500'};border-radius:10px;background:${bg};color:${col};cursor:${o.clickable?'pointer':'default'}">${d}${mark}</div>`}
  const nav=o.nav?`<div style="display:flex;gap:4px"><button data-mcnav="-1" style="width:30px;height:30px;border:none;border-radius:9px;background:var(--bg);color:var(--ink2);cursor:pointer;font-size:16px">‹</button><button data-mcnav="1" style="width:30px;height:30px;border:none;border-radius:9px;background:var(--bg);color:var(--ink2);cursor:pointer;font-size:16px">›</button></div>`:''
  return`<div style="background:var(--card);border-radius:18px;box-shadow:var(--sh);padding:15px 13px"><div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px 12px"><div style="font-size:14px;font-weight:700">${y}년 ${mo+1}월</div>${nav}</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${cells}</div></div>`
}
function monthEvents(){const now=new Date(),y=now.getFullYear(),mo=now.getMonth(),map={};SCHEDULE.forEach(s=>{const d=new Date(s.date);if(d.getFullYear()===y&&d.getMonth()===mo)map[d.getDate()]=s.label});return map}
// 이번 달: {일: [라벨,...]} (일정 있는 날만 키 존재)
function monthEventsList(y,mo){const map={};SCHEDULE.forEach(s=>{const p=s.date.split('-');if(+p[0]===y&&+p[1]===mo+1){const dd=+p[2];(map[dd]=map[dd]||[]).push(s.label)}});return map}
// 월간 급식 달력 화면
let MC_OFF=0,MC_SEL=1,MC_SLOT='조식',MC_RATINGS={}
// 그 달 급식 별점을 날짜별 학생 평균(★)으로 집계(월별 캐시)
async function loadMonthRatings(y,mo){
  const mk=`${y}-${String(mo+1).padStart(2,'0')}`
  if(MC_RATINGS[mk])return MC_RATINGS[mk]
  const map={}
  try{const r=await wt(sb.from('okya_meal_ratings').select('date,score').like('date',mk+'-%'),5000);const agg={};(r.data||[]).forEach(x=>{const day=+((x.date||'').split('#')[0].split('-')[2]||0);if(!day)return;(agg[day]=agg[day]||{s:0,c:0});agg[day].s+=(x.score||0);agg[day].c++});Object.keys(agg).forEach(d=>map[d]=(agg[d].s/agg[d].c)/2)}catch{}
  MC_RATINGS[mk]=map;return map
}
function renderMealCalendar(){MC_OFF=0;MC_SEL=new Date().getDate();MC_SLOT=defaultMealSlot();drawMealCalendar()}
function mcNav(d){MC_OFF+=d;MC_SEL=1;drawMealCalendar()}
function mcPick(d){MC_SEL=d;drawMealCalendar()}
function mcSlot(s){MC_SLOT=s;drawMealCalendar()}
async function drawMealCalendar(){
  const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+MC_OFF);const y=base.getFullYear(),mo=base.getMonth()
  const pad=n=>String(n).padStart(2,'0'),key=`${y}-${pad(mo+1)}-${pad(MC_SEL)}`
  const avail={},dim=new Date(y,mo+1,0).getDate();for(let d=1;d<=dim;d++){if(mealsOf(`${y}-${pad(mo+1)}-${pad(d)}`))avail[d]=1}
  const today=(MC_OFF===0)?new Date().getDate():-1
  const items=((mealsOf(key)||{})[MC_SLOT]||[]).filter(Boolean)
  const ratings=await loadMonthRatings(y,mo)
  app().innerHTML=`<div class="screen no-nav fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">급식 달력</div><div style="width:34px"></div></div>
    <div class="pcard">${calGrid(y,mo,{today,sel:MC_SEL,avail,ratings,nav:true,clickable:true})}<div style="padding:10px 4px 0;font-size:11.5px;color:var(--sub)">★ 숫자는 학생들의 평균 별점이에요</div></div>
    <div class="pcard">
      <div class="chd"><div class="sec" style="margin:0">${mo+1}월 ${MC_SEL}일</div><div class="pills" id="mc-seg">${MEAL_SLOTS.map(([k])=>`<button class="ppill${k===MC_SLOT?' on':''}" data-slot="${k}">${k}</button>`).join('')}</div></div>
      <ul class="meal">${items.length?items.map(x=>`<li>${esc(x)}</li>`).join(''):`<div style="padding:8px 0;color:var(--sub);font-size:13.5px">급식 정보가 없어요</div>`}</ul>
    </div>
  </div>`
  document.getElementById('bk').onclick=pop
  document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>mcPick(+b.dataset.day))
  document.querySelectorAll('[data-mcnav]').forEach(b=>b.onclick=()=>mcNav(+b.dataset.mcnav))
  document.querySelectorAll('#mc-seg [data-slot]').forEach(b=>b.onclick=()=>mcSlot(b.dataset.slot))
}
// meal.json / schedule.json 로드 (실패해도 앱은 기본값으로 정상 동작)
async function loadSchoolData(){
  const grab=async(f)=>{try{const r=await fetch(`${DATA_BASE}/${f}?_=${Date.now()}`,{cache:'no-store'});if(!r.ok)return null;return await r.json()}catch{return null}}
  const[mj,sj]=await Promise.all([grab('meal.json'),grab('schedule.json')])
  if(mj&&mj.meals)MEALS=mj.meals
  if(sj&&Array.isArray(sj.events))SCHEDULE=sj.events
}
const NOTICES=[
  {id:'n1',cat:'학생회',title:'2학기 학생회 임원 선거 공고',at:'2026-07-10T00:00:00Z'},
  {id:'n2',cat:'학사',title:'기말고사 시험 범위 안내',at:'2026-07-08T00:00:00Z'},
]

const I={
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>',
  money:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 8.5h4a2 2 0 010 4H9m0-4v8m4-4h2.5"/></svg>',
  school:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M2 8v8m20-8v8"/><path d="M6 21v-7a6 6 0 0012 0v7"/></svg>',
  comm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  my:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  hist:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg>',
  recall:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>',
  print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M8 15h8v5H8z"/></svg>',
  video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3"/></svg>',
  petition:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.5h9a2 2 0 012 2V20H7a2 2 0 01-2-2V4.5z"/><path d="M16 7H7.5"/><path d="M16 11H7.5"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  food:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3z"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  timetable:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
  study:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
  notice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  library:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20"/></svg>',
  door:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M9 21V5a2 2 0 012-2h2a2 2 0 012 2v16"/><line x1="13" y1="12" x2="13" y2="12.5"/></svg>',
  bus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h3l3 3v5h-6V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  binding:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/><line x1="9" y1="2" x2="9" y2="22"/></svg>',
  lost:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="2.27 6.96 12 12.01 21.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  mapPin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  msg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H6l-4 4V6a2 2 0 012-2z"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>',
  image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  arcade:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><line x1="7" y1="10" x2="7" y2="14"/><line x1="5" y1="12" x2="9" y2="12"/><circle cx="16" cy="11" r="1"/><circle cx="18.5" cy="13.5" r="1"/></svg>',
}

let RAIL_COLLAPSED=false