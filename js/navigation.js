'use strict';
function bnav(){
  const tabs=[
    {k:'home',l:'홈',ic:I.home},
    {k:'money',l:'머니',ic:I.money},
    {k:'school',l:'학교',ic:I.school,subs:[['food','급식'],['cal','학사일정'],['jado','자습감독표'],['mt','회의록']]},
    {k:'comm',l:'커뮤',ic:I.comm,subs:[['challenge','챌린지'],['petition','청원'],['book','책 교환'],['binding','제본소']]},
    {k:'arcade',l:'아케이드',ic:I.arcade},
    {k:'search',l:'메시지',ic:I.msg},
    {k:'my',l:'MY',ic:I.my}
  ]
  return`<nav class="bnav${RAIL_COLLAPSED?' collapsed':''}"><button class="rail-burger" data-railtoggle aria-label="메뉴 접기/펼치기">${I.menu}</button>${tabs.map(t=>{
    const item=`<button class="bnav-item${TAB===t.k?' active':''}" data-tab="${t.k}">${t.ic}<span>${t.l}</span></button>`
    if(!t.subs)return item
    const arr='<svg class="subarr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5v7a3 3 0 003 3h7"/><path d="M14 12l4 3-4 3"/></svg>'
    return`<div class="bnav-group${TAB===t.k?' open':''}"><div class="bnav-row">${item}<button class="bnav-exp" data-exp="${t.k}">${I.chev}</button></div><div class="bnav-sub">${t.subs.map(([id,l])=>`<button class="bnav-subitem" data-nav="${t.k}:${id}">${arr}<span>${l}</span></button>`).join('')}</div></div>`
  }).join('')}</nav>`
}
const SUBROUTES={
  school:{food:()=>rSchool(0),cal:()=>rSchool(1),jado:()=>rSchool(2),mt:()=>rSchool(3)},
  comm:{challenge:()=>rChallengePage(),petition:()=>rPetitionPage(),book:()=>rBookPage(),binding:()=>rPrint()}
}
function bindNav(){
  document.body.classList.toggle('rail-collapsed',RAIL_COLLAPSED)
  document.querySelectorAll('[data-railtoggle]').forEach(b=>b.onclick=()=>{RAIL_COLLAPSED=!RAIL_COLLAPSED;document.body.classList.toggle('rail-collapsed',RAIL_COLLAPSED);document.querySelectorAll('.bnav').forEach(n=>n.classList.toggle('collapsed',RAIL_COLLAPSED));applyRailBadges()})
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{const t=b.dataset.tab;TAB=t;STACK=[];routeTab();if(t==='money')markTypeRead(['money']);else if(t==='search')markTypeRead(['dm'])})
  document.querySelectorAll('[data-exp]').forEach(b=>b.onclick=e=>{e.stopPropagation();const g=b.closest('.bnav-group');if(g)g.classList.toggle('open')})
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{const[tab,id]=b.dataset.nav.split(':');TAB=tab;STACK=[];routeTab();const fn=SUBROUTES[tab]&&SUBROUTES[tab][id];if(fn)push(fn);if(NAV_TYPE[id])markTypeRead([NAV_TYPE[id]])})
  applyRailBadges();startNotifPolling()
}
function routeTab(){({home:rHome,money:rMoney,school:rSchool,comm:rComm,arcade:rArcade,search:rSearch,my:rMy})[TAB]?.();if(!ENV_ON){ENV_ON=true;initEnv();setInterval(initEnv,20*60000)}}
// ── 환경 레이어: 날씨·계절(아주 은은하게, "눈치채면 예쁜 정도") ──
let ENV_ON=false
const ENV_LAT=35.5417,ENV_LON=128.4922   // 창녕(옥야고 인근)
function seasonOf(m){return(m<=1||m===11)?'winter':m<=4?'spring':m<=7?'summer':'autumn'}
function weatherKind(code){if(code==null)return'clear';if(code>=95)return'storm';if((code>=71&&code<=77)||code>=85)return'snow';if((code>=51&&code<=67)||(code>=80&&code<=82))return'rain';if(code>=45&&code<=48)return'fog';if(code>=1&&code<=3)return'cloud';return'clear'}
async function fetchWeather(){
  try{const c=JSON.parse(localStorage.getItem('okya-weather')||'null');if(c&&Date.now()-c.ts<15*60000)return c.data}catch{}
  try{
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${ENV_LAT}&longitude=${ENV_LON}&current=weather_code,is_day,temperature_2m`,{cache:'no-store'})
    const j=await r.json();const data={code:j.current?.weather_code??0,day:j.current?.is_day??1,temp:j.current?.temperature_2m}
    localStorage.setItem('okya-weather',JSON.stringify({ts:Date.now(),data}));return data
  }catch{return null}
}
async function initEnv(){
  let el=document.getElementById('env-layer')
  if(!el){el=document.createElement('div');el.id='env-layer';document.body.appendChild(el)}
  const season=seasonOf(new Date().getMonth())
  const w=await fetchWeather()
  const kind=w?weatherKind(w.code):'clear',day=w?w.day:1
  const fest=(()=>{try{return localStorage.getItem('okya-festival')==='1'}catch{return false}})()
  el.className=`season-${season} wx-${kind} ${day?'is-day':'is-night'}${fest?' festival':''}`
  let inner=''
  if(kind==='rain'||kind==='storm'){for(let i=0;i<16;i++)inner+=`<span class="wx-rain" style="left:${(Math.random()*100).toFixed(1)}%;animation-duration:${(0.5+Math.random()*0.5).toFixed(2)}s;animation-delay:${(Math.random()*2).toFixed(2)}s"></span>`}
  else if(kind==='snow'){for(let i=0;i<18;i++){const s=(2+Math.random()*3).toFixed(1);inner+=`<span class="wx-snow" style="left:${(Math.random()*100).toFixed(1)}%;width:${s}px;height:${s}px;animation-duration:${(4+Math.random()*4).toFixed(2)}s;animation-delay:${(Math.random()*5).toFixed(2)}s"></span>`}}
  else if(fest){for(let i=0;i<14;i++){const c=['#FF6B9D','#FFC24B','#7B6CFF','#4BC0A9','#5B9BFF'][i%5];inner+=`<span class="wx-confetti" style="left:${(Math.random()*100).toFixed(1)}%;background:${c};animation-duration:${(3+Math.random()*3).toFixed(2)}s;animation-delay:${(Math.random()*4).toFixed(2)}s"></span>`}}
  el.innerHTML=`<div class="env-glow"></div>${inner}`
}
function setFestival(on){try{on?localStorage.setItem('okya-festival','1'):localStorage.removeItem('okya-festival')}catch{};initEnv()}
function push(fn){STACK.push(fn);closeSheet(true);fn();const s=app().querySelector('.screen');if(s){s.classList.remove('fade-in');s.classList.add('pushin')}}
function pop(){STACK.pop();if(STACK.length)STACK[STACK.length-1]();else routeTab();const s=app().querySelector('.fade-in');if(s){s.classList.remove('fade-in');s.classList.add('slide-back')}}
