'use strict';
// ── 학교 탭: 한 화면씩 슬라이드로 넘기는 덱(급식/학사일정/자습감독표/회의록) ──
const SCHOOL_SECTS=['급식','학사일정','자습감독표','회의록']
function rSchool(idx){
  TAB='school'
  const start=Math.max(0,Math.min(3,idx|0))
  app().innerHTML=`<div class="screen p3 school-screen">
    <div class="topbar" style="flex:none"><div class="t">학교</div><div style="width:34px"></div></div>
    <div class="school-tabs" id="sc-tabs">${SCHOOL_SECTS.map((s,i)=>`<button class="school-tab${i===start?' on':''}" data-si="${i}">${s}</button>`).join('')}</div>
    <div class="school-deck" id="sc-deck">
      <section class="school-slide" id="slide-0"></section>
      <section class="school-slide" id="slide-1"></section>
      <section class="school-slide" id="slide-2"></section>
      <section class="school-slide" id="slide-3"></section>
    </div>
  </div>${bnav()}`
  bindNav()
  const deck=document.getElementById('sc-deck')
  const tabs=[...document.querySelectorAll('#sc-tabs .school-tab')]
  const go=i=>{const s=document.getElementById('slide-'+i);if(s)deck.scrollTo({left:s.offsetLeft,behavior:'smooth'})}
  tabs.forEach(t=>t.onclick=()=>go(+t.dataset.si))
  let raf
  deck.onscroll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const i=Math.round(deck.scrollLeft/Math.max(1,deck.clientWidth));tabs.forEach((t,k)=>t.classList.toggle('on',k===i))})}
  schoolFoodSlide(document.getElementById('slide-0'))
  schoolCalSlide(document.getElementById('slide-1'))
  document.getElementById('slide-2').innerHTML=`<div class="sc-inner"><div class="sc-empty">🗒️<div class="sc-empty-t">자습감독표</div><div class="sc-empty-s">준비 중이에요.<br>곧 자습 감독 일정이 여기에 올라와요.</div></div></div>`
  schoolMeetSlide(document.getElementById('slide-3'))
  if(start)requestAnimationFrame(()=>{const s=document.getElementById('slide-'+start);if(s)deck.scrollLeft=s.offsetLeft})
}
// 급식 슬라이드(재설계): "오늘 급식"을 1초 안에 확인 → 날짜 이동 → 달력은 보조 도구
// 구조 = 날짜 네비 + 끼니 세그 + 큰 메뉴(히어로) + 나머지 끼니 미리보기 + 평가 + 달력 버튼
function schoolFoodSlide(el){
  if(!el)return
  const pad=n=>String(n).padStart(2,'0')
  const keyOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const DOWL=['일요일','월요일','화요일','수요일','목요일','금요일','토요일']
  const SLOTS=['조식','중식','석식'],TIME={조식:'오전 8:00',중식:'오후 12:30',석식:'오후 6:00'}
  const t0=new Date();t0.setHours(0,0,0,0)
  // 급식이 실제로 존재하는 날짜(정렬) — 방학 등 빈 날 점프에 사용
  const avail=Object.keys(MEALS).filter(k=>{const m=MEALS[k];return m&&SLOTS.some(s=>(m[s]||[]).length)}).sort()
  let cur=new Date(t0),slot=defaultMealSlot()
  const draw=()=>{
    const dk=keyOf(cur),m=mealsOf(dk)
    const diff=Math.round((cur-t0)/86400000)
    const rel=diff===0?'오늘':diff===1?'내일':diff===-1?'어제':diff>1?`D-${diff}`:diff<-1?`${-diff}일 전`:''
    const have=SLOTS.filter(s=>m&&(m[s]||[]).length)
    if(have.length&&!have.includes(slot))slot=have.includes(defaultMealSlot())?defaultMealSlot():have[0]
    const items=(m&&(m[slot]||[]).filter(Boolean))||[]
    const seg=SLOTS.map(s=>`<button class="mseg-b${s===slot?' on':''}${have.includes(s)?'':' dim'}" data-slot="${s}">${s}</button>`).join('')
    let hero
    if(items.length){
      hero=`<div class="mmenu-wrap"><div class="mmenu-head"><span class="mmenu-slot">${slot}</span><span class="mmenu-time">${TIME[slot]}</span></div><ul class="mmenu">${items.map((x,i)=>`<li style="animation-delay:${i*40}ms">${esc(x)}</li>`).join('')}</ul></div>`
    }else{
      const next=avail.find(k=>k>=dk)||avail.filter(k=>k<dk).pop()
      let jump=''
      if(next&&next!==dk){const nd=new Date(next+'T00:00:00');jump=`<button class="mjump" data-jump="${next}">${nd.getMonth()+1}월 ${nd.getDate()}일 급식 보기 →</button>`}
      hero=`<div class="mmenu-wrap mempty"><div class="mempty-emoji">${diff>0?'📅':'🍽️'}</div><div class="mempty-t">${diff===0?'오늘은 급식이 없어요':'급식 정보가 없어요'}</div><div class="mempty-s">방학이거나 급식이 없는 날이에요</div>${jump}</div>`
    }
    const others=have.filter(s=>s!==slot)
    const otherHTML=others.length?`<div class="mother">${others.map(s=>{const it=(m[s]||[]).filter(Boolean);return`<button class="mother-row" data-slot="${s}"><span class="mother-slot">${s}</span><span class="mother-menu">${esc(it.slice(0,4).join(' · '))}${it.length>4?' …':''}</span><span class="mother-chev">›</span></button>`}).join('')}</div>`:''
    el.innerHTML=`<div class="sc-inner mfeed">
      <div class="mday">
        <button class="mday-arrow" data-dnav="-1" aria-label="이전 날">‹</button>
        <div class="mday-center">
          <div class="mday-big">${cur.getMonth()+1}월 ${cur.getDate()}일 <span class="mday-dow">${DOWL[cur.getDay()]}</span></div>
          <div class="mday-rel">${rel?`<span class="mrel-badge${diff===0?' today':''}">${rel}</span>`:''}${diff!==0?`<button class="mday-home" data-jump="${keyOf(t0)}">오늘로</button>`:''}</div>
        </div>
        <button class="mday-arrow" data-dnav="1" aria-label="다음 날">›</button>
      </div>
      <div class="mseg">${seg}</div>
      <div class="mhero">${hero}</div>
      ${otherHTML}
      <div id="meal-rate"></div>
      <button class="mcal-open" id="m-calopen">${ICO_CAL} 달력에서 날짜 고르기</button>
    </div>`
    el.querySelectorAll('[data-dnav]').forEach(b=>b.onclick=()=>{cur.setDate(cur.getDate()+(+b.dataset.dnav));draw()})
    el.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{cur=new Date(b.dataset.jump+'T00:00:00');draw()})
    el.querySelectorAll('.mseg-b[data-slot],.mother-row[data-slot]').forEach(b=>b.onclick=()=>{const s=b.dataset.slot;if(!have.includes(s))return;slot=s;draw()})
    const co=el.querySelector('#m-calopen');if(co)co.onclick=()=>push(()=>renderMealCalendar())
    renderMealRate(dk)
  }
  draw()
}
// 급식 평점: 조·중·석 각각 별 5점 평가 → 평균 ★. 슬롯별 1회, 테이블 없으면 조용히 숨김
// date 컬럼에 "2026-08-11#중식" 형태 복합키로 저장(스키마 변경 없이 슬롯 분리)
async function renderMealRate(dateKey){
  const box=document.getElementById('meal-rate');if(!box)return
  const m=mealsOf(dateKey)
  if(!m){box.innerHTML='';return}  // 메뉴가 있는 날이면 언제든 평가 가능(방학·개학 대비 미래 제한 제거)
  const slots=['조식','중식','석식'].filter(k=>(m[k]||[]).some(Boolean))
  if(!slots.length){box.innerHTML='';return}
  let rows=null
  try{const r=await wt(sb.from('okya_meal_ratings').select('*').like('date',dateKey+'#%'),5000);rows=r.data}catch{box.innerHTML='';return}
  if(rows===null){box.innerHTML='';return}
  const cur=document.getElementById('meal-rate');if(!cur)return
  // score는 반개 단위 정수(1~10). 별 개수 = score/2. 슬롯별 사용자당 1행(고정 id)이라 밀 때마다 덮어씀(재평가)
  const starsHTML=val=>[1,2,3,4,5].map(i=>{
    const f=val>=i?1:(val>=i-0.5?0.5:0)
    return`<span class="star-slot"><span class="star-bg">☆</span><span class="star-clip" style="width:${f*100}%"><span class="star-fg">★</span></span></span>`
  }).join('')
  cur.innerHTML=`<div class="mrate"><div class="mrate-q">오늘 급식 어땠어?<span class="mrate-hint">별을 눌러 평가 · 밀어도 돼요</span></div><div class="mrate-rows">${slots.map(k=>{
    const key=dateKey+'#'+k
    const rs=rows.filter(x=>x.date===key)
    const mine=rs.find(x=>x.uid===SESSION.id)
    const avgHalf=rs.length?rs.reduce((s,x)=>s+(x.score||0),0)/rs.length:0
    const myVal=mine?mine.score/2:0
    return`<div class="mrate-row"><span class="mrate-slot">${k}</span><span class="mrate-stars" data-key="${key}">${starsHTML(myVal)}</span><span class="mrate-avg${rs.length?'':' none'}" data-avg="${key}">${rs.length?`★ ${(avgHalf/2).toFixed(1)}·${rs.length}`:'첫 평가'}</span></div>`
  }).join('')}</div></div>`
  // 별 위 드래그(포인터) → 반개 단위 실시간 채움, 손 떼면 저장
  const paint=(el,val)=>el.querySelectorAll('.star-slot').forEach((s,idx)=>{const i=idx+1,f=val>=i?1:(val>=i-0.5?0.5:0);const c=s.querySelector('.star-clip');if(c)c.style.width=(f*100)+'%'})
  cur.querySelectorAll('.mrate-stars').forEach(el=>{
    const key=el.dataset.key
    let rect=null
    const valFromX=cx=>{const r=rect||el.getBoundingClientRect();return Math.max(0.5,Math.min(5,Math.ceil((cx-r.left)/r.width*10)/2))}
    let dragging=false,pending=0
    const move=e=>{pending=valFromX(e.clientX);paint(el,pending)}
    el.addEventListener('pointerdown',e=>{e.preventDefault();rect=el.getBoundingClientRect();dragging=true;el.classList.add('dragging');try{el.setPointerCapture(e.pointerId)}catch{}move(e)})
    el.addEventListener('pointermove',e=>{if(dragging)move(e)})
    const end=async e=>{
      if(!dragging)return
      dragging=false;el.classList.remove('dragging');try{el.releasePointerCapture(e.pointerId)}catch{}
      const score=Math.round(pending*2)
      // 내 기존 평가(랜덤 id 포함) 제거 후 재삽입 → 슬롯당 1행 보장, 재평가 가능
      await wt(sb.from('okya_meal_ratings').delete().eq('date',key).eq('uid',SESSION.id)).catch(()=>{})
      const{error}=await wt(sb.from('okya_meal_ratings').insert({id:'mr_'+key+'_'+SESSION.id,date:key,uid:SESSION.id,score,at:nowISO()})).catch(er=>({error:er}))
      if(error){toast('평가 저장 실패 · 다시 시도해줘','error');return}
      popMsg('평가 완료','⭐');renderMealRate(dateKey)
    }
    el.addEventListener('pointerup',end)
    el.addEventListener('pointercancel',end)
  })
}
// 학사일정 고정 일정(전국 공통 일정 위주 · 학교 세부일정은 확인 후 보정)
const SCHOOL_FIXED=[
  {date:'2026-09-02',label:'9월 모의평가',type:'mock'},
  {date:'2026-10-13',label:'전국연합 학력평가',type:'mock'},
  {date:'2026-10-15',label:'2학기 중간고사',type:'exam'},
  {date:'2026-10-16',label:'2학기 중간고사',type:'exam'},
  {date:'2026-11-19',label:'2027 수능',type:'exam'},
  {date:'2026-12-16',label:'2학기 기말고사',type:'exam'},
  {date:'2026-12-17',label:'2학기 기말고사',type:'exam'},
  {date:'2026-12-18',label:'2학기 기말고사',type:'exam'},
]
// 학사일정(귀가/등교 + 고정일정) 데이터
function schoolEvents(){
  const ev=[{date:'2026-08-29',label:'귀가 (집)',type:'home'}]
  const pad=n=>String(n).padStart(2,'0')
  const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  // 첫 정규 금요일 귀가는 3주 예외(9/18), 이후 2주 간격 금요일 귀가·일요일 등교
  let g=new Date(2026,8,18)
  const end=new Date(2026,11,31)
  while(g<=end){
    const b=new Date(g);b.setDate(b.getDate()+2)
    ev.push({date:key(g),label:'귀가 (집)',type:'home'})
    ev.push({date:key(b),label:'등교',type:'school'})
    g.setDate(g.getDate()+14)
  }
  SCHOOL_FIXED.forEach(s=>ev.push({...s}))
  ;(SCHEDULE||[]).forEach(s=>{if(s.date>='2026-09-01')ev.push({date:s.date,label:s.label,type:s.type||'event'})})
  return ev
}
// 학사일정 전용 달력(칸에 일정명 기재, 점 크게)
function acalGrid(vy,vm,evMap,todayStr){
  const first=new Date(vy,vm,1).getDay(),days=new Date(vy,vm+1,0).getDate(),wd=['일','월','화','수','목','금','토']
  const pad=n=>String(n).padStart(2,'0')
  let head=wd.map((w,i)=>`<div class="acal-dow${i===0?' sun':i===6?' sat':''}">${w}</div>`).join('')
  let cells=''
  for(let i=0;i<first;i++)cells+=`<div class="acal-cell empty"></div>`
  for(let d=1;d<=days;d++){
    const dow=(first+d-1)%7
    const ds=`${vy}-${pad(vm+1)}-${pad(d)}`
    const isT=ds===todayStr
    const evs=evMap[d]||[]
    const chips=evs.slice(0,2).map(s=>`<span class="acal-ev ${s.type}">${esc(s.label)}</span>`).join('')+(evs.length>2?`<span class="acal-more">+${evs.length-2}</span>`:'')
    cells+=`<div class="acal-cell${isT?' today':''}"><span class="acal-num${dow===0?' sun':dow===6?' sat':''}">${d}</span>${chips}</div>`
  }
  return`<div class="acal"><div class="acal-top"><div class="acal-mon">${vy}년 ${vm+1}월</div><div style="display:flex;gap:4px"><button data-mcnav="-1" class="acal-nav">‹</button><button data-mcnav="1" class="acal-nav">›</button></div></div><div class="acal-head">${head}</div><div class="acal-grid">${cells}</div></div>`
}
// 학사일정 슬라이드: 달력 + 이번 달 일정 리스트
function schoolCalSlide(el){
  if(!el)return
  const ALL=schoolEvents()
  const now=new Date();let vy=now.getFullYear(),vm=now.getMonth()
  const todayStr=todayKey()
  const dotColor=t=>t==='home'?'var(--danger)':t==='school'?'#16A34A':t==='exam'?'#E0424D':t==='mock'?'#E0930F':'var(--primary)'
  const draw=()=>{
    const pad=n=>String(n).padStart(2,'0')
    const mStr=`${vy}-${pad(vm+1)}`
    const evMap={}
    ALL.filter(s=>s.date.startsWith(mStr)).forEach(s=>{const d=+s.date.split('-')[2];(evMap[d]=evMap[d]||[]).push(s)})
    const today=(vy===now.getFullYear()&&vm===now.getMonth())?now.getDate():-1
    const monthEvs=ALL.filter(s=>s.date.startsWith(mStr)).sort((a,b)=>a.date<b.date?-1:1)
    // 다가오는 일정(달월 무관, 가까운 순 5개) — 달력보다 먼저, 가장 크게
    const up=ALL.filter(s=>s.date>=todayStr).sort((a,b)=>a.date<b.date?-1:1).slice(0,5)
    const upHTML=up.length?`<div class="sc2-sec"><h2 class="sc2-t">다가오는 일정</h2>${up.map((s,i)=>{const dd=Math.ceil((new Date(s.date)-new Date(todayStr))/86400000);const tag=dd===0?'오늘':`D-${dd}`;const dw=['일','월','화','수','목','금','토'][new Date(s.date).getDay()];const p=s.date.split('-');return`<div class="srow" style="animation:fadeUp .35s var(--ease) both;animation-delay:${i*35}ms"><span class="sc-evdot" style="background:${dotColor(s.type)}"></span><div class="l"><div class="t">${esc(s.label)}</div><div class="d">${+p[1]}월 ${+p[2]}일 (${dw})</div></div><span class="dday">${tag}</span></div>`}).join('')}</div>`:''
    el.innerHTML=`<div class="sc-inner">
      ${upHTML}
      <div class="sec" style="margin:24px 20px 8px;color:var(--text-3);font-size:13px;font-weight:700">달력에서 날짜별로 보기</div>
      <div style="margin:6px 20px 4px">${acalGrid(vy,vm,evMap,todayStr)}</div>
      <div style="margin:12px 20px 2px"><div class="cal-legend"><span><i style="background:var(--danger)"></i>귀가</span><span><i style="background:#16A34A"></i>등교</span><span><i style="background:#E0424D"></i>시험</span><span><i style="background:#E0930F"></i>모의고사</span></div></div>
      ${monthEvs.length?`<div class="sc2-sec"><h2 class="sc2-t">${vm+1}월 일정</h2>${monthEvs.map((s,i)=>{const dd=Math.ceil((new Date(s.date)-new Date(todayStr))/86400000);const tag=dd===0?'오늘':dd>0?`D-${dd}`:s.date.slice(5).replace('-','/');const dw=['일','월','화','수','목','금','토'][new Date(s.date).getDay()];return`<div class="srow" style="animation:fadeUp .35s var(--ease) both;animation-delay:${i*35}ms"><span class="sc-evdot" style="background:${dotColor(s.type)}"></span><div class="l"><div class="t">${esc(s.label)}</div><div class="d">${s.date.slice(5).replace('-','/')} (${dw})</div></div><span class="dday">${tag}</span></div>`}).join('')}</div>`:'<div class="empty">이번 달 일정이 없어요</div>'}
    </div>`
    el.querySelectorAll('[data-mcnav]').forEach(b=>b.onclick=()=>{vm+=(+b.dataset.mcnav);if(vm<0){vm=11;vy--}if(vm>11){vm=0;vy++}draw()})
  }
  draw()
}
// 회의록 슬라이드
async function schoolMeetSlide(el){
  if(!el)return
  const admin=SESSION.role==='admin'
  el.innerHTML=`<div class="sc-inner"><div class="loader" style="min-height:160px"><div class="spin"></div></div></div>`
  let ms=[]
  try{const r=await wt(sb.from('okya_meetings').select('*').order('at',{ascending:false}));ms=r.data||[]}catch{}
  const ytId=u=>{const m=(u||'').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);return m?m[1]:''}
  const play='<svg viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M8 5v14l11-7z"/></svg>'
  const list=ms.length?`<div class="yt-list">${ms.map(m=>{
    const id=ytId(m.url),thumb=id?`https://img.youtube.com/vi/${id}/hqdefault.jpg`:''
    return`<div class="yt-item" data-url="${esc(m.url)}"><div class="yt-thumb">${thumb?`<img src="${thumb}" loading="lazy" alt="">`:'<div class="yt-thumb-ph">📹</div>'}<span class="yt-play">${play}</span></div>
      <div class="yt-meta"><div class="yt-logo"><img src="${LOGO}" alt=""></div><div class="yt-info"><div class="yt-title">${esc(m.title)}</div><div class="yt-sub">옥야 학생회 · ${fmtDate(m.at)}</div></div>${admin?`<button class="yt-del" data-mdel="${m.id}">삭제</button>`:''}</div>
    </div>`}).join('')}</div>`:'<div class="empty" style="padding:44px 20px">등록된 회의 영상이 없어요.</div>'
  el.innerHTML=`<div class="sc-inner">
    <div class="sc2-sec"><h2 class="sc2-t">대의원회 회의록</h2><div class="sc2-note">📹 학생회 회의 영상을 다시 볼 수 있어요</div></div>
    ${list}
    ${admin?`<div class="pcard" style="margin-top:18px"><div class="sec">영상 등록</div><div class="field"><label>제목</label><input id="sm-t" placeholder="예: 2학기 2차 대의원회"></div><div class="field"><label>유튜브 링크</label><input id="sm-u" placeholder="https://youtube.com/..."></div><button class="pbtn pri" id="sm-add">등록</button></div>`:''}
  </div>`
  el.querySelectorAll('[data-url]').forEach(r=>r.onclick=e=>{if(e.target.closest('.yt-del'))return;const u=r.dataset.url;if(u)window.open(u,'_blank')})
  if(admin){
    const add=el.querySelector('#sm-add');if(add)add.onclick=async()=>{const t=el.querySelector('#sm-t').value.trim(),u=el.querySelector('#sm-u').value.trim();if(!t||!u){toast('제목과 링크를 입력해줘');return}try{await wt(sb.from('okya_meetings').insert({id:uid('mt'),title:t,url:u,at:nowISO()}))}catch{toast('등록 실패');return}toast('등록 완료');schoolMeetSlide(el)}
    el.querySelectorAll('[data-mdel]').forEach(b=>b.onclick=async()=>{try{await wt(sb.from('okya_meetings').delete().eq('id',b.dataset.mdel))}catch{};schoolMeetSlide(el)})
  }
}

function rSchoolFood(){
  const draw=(slot)=>{
    const items=((mealsOf(todayKey())||{})[slot]||[]).filter(Boolean)
    document.getElementById('sf-seg').innerHTML=MEAL_SLOTS.map(([k])=>`<button class="ppill${k===slot?' on':''}" data-slot="${k}">${k}</button>`).join('')
    document.getElementById('sf-list').innerHTML=items.length?items.map(x=>`<li>${esc(x)}</li>`).join(''):`<div style="padding:8px 0;color:var(--sub);font-size:13.5px">급식 정보가 없어요</div>`
    document.querySelectorAll('#sf-seg [data-slot]').forEach(b=>b.onclick=()=>draw(b.dataset.slot))
  }
  app().innerHTML=`<div class="screen no-nav fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">급식</div><button class="bk" id="sf-cal">${ICO_CAL}</button></div>
    <div style="padding:2px 18px 0;font-size:13px;color:var(--sub);font-weight:600">${new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})}</div>
    <div class="pcard"><div class="chd"><div class="pills" id="sf-seg"></div></div><ul class="meal" id="sf-list"></ul></div>
    <div style="padding:14px 18px 0;font-size:12px;color:var(--sub);text-align:center">창녕옥야고 급식 · NEIS 제공</div>
  </div>`
  document.getElementById('bk').onclick=pop
  document.getElementById('sf-cal').onclick=()=>push(()=>renderMealCalendar())
  draw(defaultMealSlot())
}

function rSchoolCal(){
  const ALL=SCHEDULE
  const now=new Date()
  let vy=now.getFullYear(),vm=now.getMonth()
  const todayStr=now.toISOString().slice(0,10)
  const render=()=>{
    const first=new Date(vy,vm,1),last=new Date(vy,vm+1,0)
    const startDow=first.getDay(),days=last.getDate()
    const mStr=`${vy}-${String(vm+1).padStart(2,'0')}`
    const evMap={}
    ALL.filter(s=>s.date.startsWith(mStr)).forEach(s=>{
      const d=parseInt(s.date.split('-')[2])
      if(!evMap[d])evMap[d]=[]
      evMap[d].push(s.label)
    })
    const cells=[]
    for(let i=0;i<startDow;i++)cells.push(null)
    for(let d=1;d<=days;d++)cells.push(d)
    while(cells.length%7)cells.push(null)
    const monthEvs=ALL.filter(s=>s.date.startsWith(mStr)).sort((a,b)=>a.date>b.date?1:-1)
    app().innerHTML=`<div class="screen no-nav fade-in p3">
      <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">학사일정</div><div style="width:34px"></div></div>
      <div class="pcard">
        <div class="chd" style="margin-bottom:10px">
          <button id="prev-m" class="bk" style="width:30px;height:30px;background:none">${I.back}</button>
          <div style="font-size:15px;font-weight:800">${vy}년 ${vm+1}월</div>
          <button id="next-m" class="bk" style="width:30px;height:30px;background:none">${I.chev}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:6px">
          ${['일','월','화','수','목','금','토'].map((d,i)=>`<div style="text-align:center;font-size:10.5px;font-weight:700;padding:4px 0;color:${i===0?'var(--danger)':i===6?'var(--primary)':'var(--sub)'}">${d}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);row-gap:2px">
          ${cells.map((d,i)=>{
            if(!d)return'<div></div>'
            const dow=i%7
            const ds=`${vy}-${String(vm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const isToday=ds===todayStr
            const hasEv=(evMap[d]||[]).length>0
            return`<div style="display:flex;flex-direction:column;align-items:center;padding:2px 0">
              <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${isToday?'var(--grad)':'transparent'};font-size:13px;font-weight:${isToday||hasEv?800:500};color:${isToday?'#fff':dow===0?'var(--danger)':dow===6?'var(--primary)':'var(--ink)'}">${d}</div>
              ${hasEv?`<div style="width:5px;height:5px;border-radius:50%;background:${isToday?'#fff':'var(--primary)'};margin-top:1px"></div>`:'<div style="height:6px"></div>'}
            </div>`
          }).join('')}
        </div>
      </div>
      ${monthEvs.length?`<div class="pcard"><div class="sec">이번 달 일정</div>${monthEvs.map(s=>{const dd=Math.ceil((new Date(s.date)-new Date(todayStr))/86400000);const tag=dd>=0?`D-${dd}`:s.date.slice(5).replace('-','/');return`<div class="srow"><div class="l"><div class="t">${esc(s.label)}</div><div class="d">${s.date.slice(5).replace('-','/')}</div></div><span class="dday">${tag}</span></div>`}).join('')}</div>`:`<div class="empty">이번 달 등록된 일정이 없어요</div>`}
    </div>`
    document.getElementById('bk').onclick=pop
    document.getElementById('prev-m').onclick=()=>{vm--;if(vm<0){vm=11;vy--}render()}
    document.getElementById('next-m').onclick=()=>{vm++;if(vm>11){vm=0;vy++}render()}
  }
  render()
}

function rSchoolTT(){
  const days=['월','화','수','목','금']
  const todayIdx=(new Date().getDay()+6)%7 // 0=월
  const subjects=[['국어','수학','영어','과학','체육','자습'],['수학','영어','사회','국어','음악','자습'],['영어','과학','수학','체육','국어','자습'],['사회','국어','수학','영어','미술','자습'],['체육','수학','영어','국어','과학','자습']]
  let grade=2
  const render=()=>{
    document.getElementById('tt-body').innerHTML=`
      <table class="tt">
        <tr><th class="pn"></th>${days.map((d,i)=>`<th class="${i===todayIdx?'on':''}">${d}</th>`).join('')}</tr>
        ${[0,1,2,3,4,5].map(r=>`<tr><td class="pn">${r+1}교시</td>${days.map((_,c)=>`<td class="${c===todayIdx?'on':''}">${subjects[c][r]}</td>`).join('')}</tr>`).join('')}
      </table>`
    document.querySelectorAll('#tt-grade [data-g]').forEach(b=>b.classList.toggle('on',+b.dataset.g===grade))
  }
  app().innerHTML=`<div class="screen no-nav fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">시간표</div><div style="width:34px"></div></div>
    <div style="padding:2px 18px 0"><div class="pills" id="tt-grade">${[1,2,3].map(g=>`<button class="ppill${g===grade?' on':''}" data-g="${g}">${g}학년</button>`).join('')}</div></div>
    <div class="pcard" id="tt-body"></div>
    <div style="padding:12px 18px 0;font-size:12px;color:var(--sub);text-align:center">예시 시간표 — 실제 시간표는 추후 연동 예정</div>
  </div>`
  document.getElementById('bk').onclick=pop
  document.querySelectorAll('#tt-grade [data-g]').forEach(b=>b.onclick=()=>{grade=+b.dataset.g;render()})
  render()
}

// 시험대비자료 (preview 12) — 과목별 자료 (백엔드 연동 전 목록형)
function rStudy(){
  const subs=[['국어','blue'],['영어','green'],['수학','pink'],['사회','org'],['과학','sky'],['한국사','org'],['기타','gray']]
  app().innerHTML=`<div class="screen no-nav fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">시험대비자료</div><div style="width:34px"></div></div>
    <div class="pcard" style="padding:4px 16px">
      ${subs.map(([s,t])=>`<div class="lrow" data-subj="${s}" style="cursor:pointer"><div class="chip ti-${t}">${I.book}</div><div class="body"><div class="ti">${s}</div><div class="su">자료 준비 중</div></div><span style="color:#c9cdd8;display:flex">${I.chev}</span></div>`).join('')}
    </div>
    <div style="padding:12px 18px 0;font-size:12px;color:var(--sub);text-align:center">과목별 학습 자료 · 곧 업로드 기능이 추가돼요</div>
  </div>`
  document.getElementById('bk').onclick=pop
  document.querySelectorAll('[data-subj]').forEach(el=>el.onclick=()=>toast(`${el.dataset.subj} 자료는 준비 중이에요`))
}

// 교실예약 (자습실 시간대) — 월~금: 야자1·2 / 토·일: 오전1·2 오후1·2·3 야자1·2 (중복 선택)
async function rRoom(){
  const dow2slots=dow=>(dow===0||dow===6)?['오전1','오전2','오후1','오후2','오후3','야자1','야자2']:['야자1','야자2']
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const WD=['일','월','화','수','목','금','토']
  let off=0
  const render=async()=>{
    app().innerHTML=`<div class="screen no-nav fade-in p3"><div class="phdr"><button class="bk" id="bk0">${I.back}</button><div class="ttl">교실예약</div><div style="width:34px"></div></div><div class="loader" style="min-height:200px"><div class="spin"></div></div></div>`
    document.getElementById('bk0').onclick=pop
    const d=new Date();d.setDate(d.getDate()+off);const ds=iso(d),dow=d.getDay()
    const slots=dow2slots(dow)
    let rows=[];try{const r=await wt(sb.from('okya_reservations').select('*').eq('date',ds));rows=r.data||[]}catch{}
    const sel=new Set(rows.filter(x=>x.user_id===SESSION.id).map(x=>x.slot))
    const byMe=new Set(sel)
    const drawSlots=()=>document.getElementById('rm-slots').innerHTML=slots.map(s=>{
      const who=rows.filter(x=>x.slot===s).map(x=>x.user_name)
      const on=sel.has(s)
      const sr=who.length?`예약 ${who.length}명 · ${who.slice(0,3).join(', ')}${who.length>3?' 외':''}`:'예약 없음'
      return`<div class="slot${on?' on':''}" data-slot="${s}"><div class="sbody"><div class="sn">${s}</div><div class="sr">${esc(sr)}</div></div><div class="chk">${ICO_CHECK_SM}</div></div>`
    }).join('')
    app().innerHTML=`<div class="screen no-nav fade-in p3">
      <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">교실예약</div><div style="width:34px"></div></div>
      <div class="daynav">
        <button class="dn" id="rm-prev">${I.back}</button>
        <div class="dl">${d.getMonth()+1}월 ${d.getDate()}일<small>${WD[dow]}요일${off===0?' · 오늘':''}</small></div>
        <button class="dn" id="rm-next">${I.chev}</button>
      </div>
      <div class="pcard"><div class="sec">시간대 선택 <span style="font-size:12px;font-weight:600;color:var(--sub)">(중복 가능)</span></div><div id="rm-slots"></div></div>
      <div style="padding:10px 18px calc(16px + env(safe-area-inset-bottom))"><button class="pbtn pri" id="rm-save">예약 저장</button></div>
    </div>`
    document.getElementById('bk').onclick=pop
    document.getElementById('rm-prev').onclick=()=>{off--;render()}
    document.getElementById('rm-next').onclick=()=>{off++;render()}
    drawSlots()
    document.getElementById('rm-slots').onclick=e=>{
      const el=e.target.closest('[data-slot]');if(!el)return
      const s=el.dataset.slot;sel.has(s)?sel.delete(s):sel.add(s)
      el.classList.toggle('on')
    }
    document.getElementById('rm-save').onclick=async()=>{
      const btn=document.getElementById('rm-save');btn.disabled=true;btn.textContent='저장 중...'
      const add=[...sel].filter(s=>!byMe.has(s)),del=[...byMe].filter(s=>!sel.has(s))
      try{
        if(add.length)await wt(sb.from('okya_reservations').insert(add.map(s=>({id:uid('rv'),date:ds,slot:s,user_id:SESSION.id,user_name:SESSION.name,at:nowISO()}))))
        for(const s of del)await wt(sb.from('okya_reservations').delete().eq('date',ds).eq('slot',s).eq('user_id',SESSION.id))
        toast('예약을 저장했어요')
      }catch{toast('저장 실패 — 잠시 후 다시')}
      render()
    }
  }
  render()
}

const BIND_OPTS=[['spring','스프링 제본 (일반)',500],['cover','표지 제본',1000]]
const PR_STATUS=['접수','제작중','완료']
function bindLabel(k){const f=BIND_OPTS.find(x=>x[0]===k);return f?f[1]:'스프링 제본 (일반)'}
function bindFee(k){const f=BIND_OPTS.find(x=>x[0]===k);return f?f[2]:500}
function printCost(copies,bind){return bindFee(bind)*(copies||1)}
function prSteps(si){return`<div class="pet-steps pr-steps">${PR_STATUS.map((s,i)=>`<div class="pet-step${i<=si?' done':''}${i===si?' cur':''}"><div class="pet-step-dot">${i<si?'✓':i+1}</div><div class="pet-step-l">${s}</div></div>`).join('<div class="pet-step-line"></div>')}</div>`}
function printCover(p){const si=Math.max(0,PR_STATUS.indexOf(p.status||'접수'));const grad=BOOK_COVERS[((p.title||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)+3)%BOOK_COVERS.length];return`<div class="book-cover"${p.file?'':` style="background:${grad}"`}>${p.file?`<img src="${esc(p.file)}">`:`<div class="bc-title">${esc(p.title||'')}</div>`}<span class="book-badge pr-badge s${si}">${PR_STATUS[si]}</span></div>`}
async function rPrint(){
  const admin=SESSION.role==='admin'
  app().innerHTML=`<div class="screen fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">옥야제본소</div>${admin?'<div style="width:34px"></div>':`<button id="pr-new" style="font-size:13px;font-weight:800;color:var(--primary);background:none">＋ 신청</button>`}</div>${featHero('🖨️','옥야제본소','인쇄물을 가져오면 학생회가 제본해 드려요','print')}<div id="cb"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div></div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  const nb=document.getElementById('pr-new');if(nb)nb.onclick=()=>push(rPrintNew)
  await iPrint()
}
async function iPrint(){
  const admin=SESSION.role==='admin'
  let data=[]
  try{const r=await wt(sb.from('okya_prints').select('*').order('at',{ascending:false}));data=r.data||[]}catch{}
  const prs=admin?data:data.filter(p=>p.owner===SESSION.id)
  const cb=document.getElementById('cb');if(!cb)return
  const help=`<div class="book-help">🖨️ <b>옥야제본소</b> · 인쇄물을 직접 가져오면 학생회가 <b>제본만</b> 떠드려요. 책 표지를 누르면 <b>진행현황</b>을 볼 수 있어요. (접수 → 제작중 → 완료)</div>`
  const addTile=admin?'':`<div class="book-item book-add" id="pr-add"><div class="book-cover book-addcover"><span>＋</span></div><div class="book-label"><div class="bl-title">새 제본 신청</div></div></div>`
  const items=prs.map(p=>`<div class="book-item" data-open="${p.id}">${printCover(p)}<div class="book-label"><div class="bl-title">${esc(p.title)}</div><div class="bl-meta">${admin?esc(p.owner_name||'')+' · ':''}${bindLabel(p.bind)} · ${p.copies||1}부</div></div></div>`).join('')
  const emptyNote=(!prs.length&&admin)?'<div class="empty">아직 신청이 없어요.</div>':''
  cb.innerHTML=`${help}<div class="book-shelf">${addTile}${items}</div>${emptyNote}<div style="height:16px"></div>`
  const at=document.getElementById('pr-add');if(at)at.onclick=()=>push(rPrintNew)
  cb.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>push(()=>rPrintDetail(el.dataset.open)))
}
async function rPrintDetail(id){
  const admin=SESSION.role==='admin'
  app().innerHTML=`<div class="screen fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">제본 진행현황</div><div style="width:34px"></div></div><div id="cb"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div></div>${bnav()}`
  bindNav();document.getElementById('bk').onclick=pop
  let p=null
  try{const r=await wt(sb.from('okya_prints').select('*').eq('id',id).single());p=r.data}catch{}
  const cb=document.getElementById('cb');if(!cb)return
  if(!p){cb.innerHTML='<div class="empty">신청을 찾을 수 없어요.</div>';return}
  const si=Math.max(0,PR_STATUS.indexOf(p.status||'접수'))
  const msg=['접수됐어요. 학생회가 곧 제본을 시작해요.','학생회가 제본을 만들고 있어요.','제본이 완료됐어요! 학생회에서 받아가세요.'][si]
  const row=(k,v)=>`<div class="pet-row"><div class="pet-k">${k}</div><div class="pet-v">${v}</div></div>`
  const adminAct=admin?`<div style="display:flex;gap:8px;margin-top:14px">${si<2?`<button class="pbtn pri" id="pd-next" style="flex:1">${PR_STATUS[si+1]}(으)로 변경</button>`:'<div class="empty" style="flex:1;padding:12px">완료된 신청이에요</div>'}<button class="minibtn danger" id="pd-del">삭제</button></div>`:''
  cb.innerHTML=`<div class="chal-detail">
    <div class="pcard pr-detail-hero">
      <div class="pr-pill s${si}" style="align-self:flex-start">${PR_STATUS[si]}</div>
      <div class="ti" style="font-size:20px;white-space:normal;margin-top:10px">${esc(p.title)}</div>
      <div class="su" style="margin-top:4px">${msg}</div>
      ${prSteps(si)}
    </div>
    ${p.file?`<div class="pcard" style="padding:10px"><img src="${esc(p.file)}" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px"></div>`:''}
    <div class="pcard pet-sheet">
      ${row('제본 방식',esc(bindLabel(p.bind)))}
      ${row('부수',`${p.copies||1}부`)}
      ${p.pages?row('장수',`${p.pages}장`):''}
      ${admin?row('신청인',esc(p.owner_name||'')):''}
      ${row('신청일',fmtDate(p.at))}
      ${row('사용 옥야머니',`<b style="color:var(--primary)">${fmt(p.cost||0)}옥</b>`)}
      ${adminAct}
    </div>
    <div style="height:12px"></div>
  </div>`
  if(admin){
    const nx=document.getElementById('pd-next');if(nx)nx.onclick=async()=>{const ns=PR_STATUS[Math.min(2,si+1)];try{await wt(sb.from('okya_prints').update({status:ns}).eq('id',id))}catch{};if(ns==='제작중')notify(p.owner,'print','제본 제작중',`'${p.title}' 제본을 만들고 있어요`);if(ns==='완료')notify(p.owner,'print','제본 완료 🎉',`'${p.title}' 제본이 완료됐어요. 받아가세요!`);toast(ns+'(으)로 변경');rPrintDetail(id)}
    const dl=document.getElementById('pd-del');if(dl)dl.onclick=async()=>{try{await wt(sb.from('okya_prints').delete().eq('id',id))}catch{};toast('삭제');pop()}
  }
}
function rPrintNew(){
  let file=null,bind='spring'
  const calc=()=>{const copies=parseInt((document.getElementById('pr-copies')||{}).value,10)||1;const c=printCost(copies,bind);const el=document.getElementById('pr-cost');if(el)el.textContent=fmt(c)+'옥';return c}
  app().innerHTML=`<div class="screen fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">제본 신청</div><div style="width:34px"></div></div>
    <div class="chal-detail form2 tone-print">
      <div class="pcard">
        <div class="field"><label>제목</label><input id="pr-title" placeholder="예: 미적분 오답노트"></div>
        <div style="display:flex;gap:10px"><div class="field" style="flex:1"><label>장수 (선택)</label><input id="pr-pages" type="number" inputmode="numeric" placeholder="24"></div><div class="field" style="flex:1"><label>부수</label><input id="pr-copies" type="number" inputmode="numeric" value="1"></div></div>
        <div class="field"><label>제본 방식</label><div class="pet-catsel" id="pr-bind">${BIND_OPTS.map((o,i)=>`<button type="button" class="pet-chip${i===0?' on':''}" data-bind="${o[0]}">${o[1]} · ${o[2]}옥</button>`).join('')}</div></div>
        <div class="field" style="margin-bottom:0"><label>자료 사진 (선택)</label><label for="pr-file" class="upload" id="pr-fl">${I.image}<span>표지·자료 사진 추가</span></label><input id="pr-file" type="file" accept="image/*" style="display:none"></div>
      </div>
      <div class="pcard" style="display:flex;align-items:center;justify-content:space-between"><div class="sec" style="margin:0">예상 비용</div><div class="pet-agree-big" id="pr-cost">0옥</div></div>
      <div style="padding:0 18px"><button class="pbtn pri pr-subbtn" id="pr-sub">＋ 제본 신청하기</button><p style="font-size:12px;color:var(--sub);margin:14px 2px 0;text-align:center">인쇄물은 직접 가져오시고, 제본만 신청하는 화면이에요.<br>신청 시 예상 비용만큼 옥야머니가 사용돼요.</p></div>
    </div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  document.querySelectorAll('#pr-bind .pet-chip').forEach(b=>b.onclick=()=>{bind=b.dataset.bind;document.querySelectorAll('#pr-bind .pet-chip').forEach(x=>x.classList.toggle('on',x===b));calc()})
  document.getElementById('pr-copies').oninput=calc
  calc()
  document.getElementById('pr-file').onchange=e=>{const f=e.target.files[0];if(f){file=f;const l=document.getElementById('pr-fl');l.classList.add('has');l.innerHTML=`<img src="${URL.createObjectURL(f)}">`}}
  document.getElementById('pr-sub').onclick=async()=>{
    const title=document.getElementById('pr-title').value.trim();if(!title){toast('제목을 입력해줘');return}
    const pages=parseInt(document.getElementById('pr-pages').value,10)||0
    const copies=parseInt(document.getElementById('pr-copies').value,10)||1
    const cost=printCost(copies,bind)
    const txs=await getAllTx();if(balOf(SESSION.id,txs)<cost){toast('옥야머니가 부족해요');return}
    const btn=document.getElementById('pr-sub');btn.disabled=true;btn.textContent='신청 중...'
    let fileUrl=null
    if(file){toast('파일 업로드 중...');fileUrl=await uploadImg(file,'print');if(!fileUrl){btn.disabled=false;btn.textContent='＋ 제본 신청하기';return}}
    await addTx({from:SESSION.id,to:'u_council',amount:cost,type:'사용',reason:'제본소: '+title})
    let insErr=null
    try{const{error}=await wt(sb.from('okya_prints').insert({id:uid('pr'),title,pages,copies,bind,cost,file:fileUrl,status:'접수',owner:SESSION.id,owner_name:SESSION.name,at:nowISO()}));insErr=error}catch(e){insErr=e}
    if(insErr){toast('신청 실패: '+(insErr.message||'okya_prints 테이블/컬럼을 확인해줘'));btn.disabled=false;btn.textContent='＋ 제본 신청하기';return}
    notifyAdmins('print','새 제본 신청',`${SESSION.name}님이 '${title}' 제본을 신청했어요`)
    popMsg('제본 신청 완료 · '+fmt(cost)+'옥','🖨️');pop()
  }
}

async function rMeeting(){
  const admin=SESSION.role==='admin'
  app().innerHTML=`<div class="screen no-nav fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">회의록</div><div style="width:34px"></div></div><div class="loader" style="min-height:160px"><div class="spin"></div></div></div>`
  document.getElementById('bk').onclick=pop
  let ms=[]
  try{const r=await wt(sb.from('okya_meetings').select('*').order('at',{ascending:false}));ms=r.data||[]}catch{}
  const play='<svg viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M8 5v14l11-7z"/></svg>'
  const list=ms.length?ms.map(m=>`<div class="lrow" data-url="${esc(m.url)}" style="cursor:pointer"><div class="vthumb">${play}</div><div class="body"><div class="ti">${esc(m.title)}</div><div class="su">${fmtDate(m.at)} 게시</div></div>${admin?`<button class="pbtn out" data-del="${m.id}" style="width:auto;padding:7px 12px;font-size:12px">삭제</button>`:`<span style="color:#c9cdd8;display:flex">${I.chev}</span>`}</div>`).join(''):'<div class="empty">등록된 영상이 없어요.</div>'
  app().innerHTML=`<div class="screen no-nav fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">회의록</div><div style="width:34px"></div></div>
    ${admin?`<div class="pcard"><div class="sec">영상 등록</div><div class="field"><label>제목</label><input id="mt" placeholder="예: 2학기 2차 대의원회"></div><div class="field"><label>유튜브 링크</label><input id="mu" placeholder="https://youtube.com/..."></div><button class="pbtn pri" id="madd">등록</button></div>`:''}
    <div class="pcard"><div class="sec">회의 영상</div>${list}</div>
  </div>`
  document.getElementById('bk').onclick=pop
  document.querySelectorAll('[data-url]').forEach(el=>el.onclick=()=>{const u=el.dataset.url;if(u)window.open(u,'_blank')})
  const a=document.getElementById('madd')
  if(a)a.onclick=async()=>{
    const title=document.getElementById('mt').value.trim();if(!title){toast('제목을 입력해줘');return}
    try{await wt(sb.from('okya_meetings').insert({id:uid('m'),title,url:document.getElementById('mu').value.trim()||'https://youtube.com/',at:nowISO()}))}catch{}
    rMeeting()
  }
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=async(e)=>{e.stopPropagation();try{await wt(sb.from('okya_meetings').delete().eq('id',b.dataset.del))}catch{};toast('삭제');rMeeting()})
}
