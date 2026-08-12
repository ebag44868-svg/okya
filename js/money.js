'use strict';
// 거래 1건 → preview .lrow. bal 지정 시(학생) 거래 직후 잔액 표시
function txRow(t,admin,bal){
  const inc=admin?(t.type!=='회수'):(t.to===SESSION.id)
  let tint='gray',icon=I.money
  if(t.type==='출석'){tint='green';icon=ICO_CHECK_SM}
  else if(t.type==='송금'){tint=inc?'green':'blue';icon=inc?I.recall:I.send}
  else if(t.type==='발행'){tint='green';icon=I.recall}
  else if(t.type==='회수'){tint='org';icon=I.send}
  const title=admin?(t.type==='회수'?nameOf(t.from):nameOf(t.to)):(t.reason||t.type)
  const sub=admin?(t.type+' · '+fmtDate(t.at)):((t.to===SESSION.id?nameOf(t.from):'→ '+nameOf(t.to))+' · '+fmtDate(t.at))
  const balHTML=(!admin&&bal!=null)?`<div class="trbal">잔액 ${fmt(bal)}옥</div>`:''
  return`<div class="lrow lrow-tap" data-txid="${t.id}"><div class="chip ti-${tint}">${icon}</div><div class="body"><div class="ti">${esc(title)}</div><div class="su">${esc(sub)}</div></div><div class="tramt"><div class="tr ${inc?'pos':'neg'}">${inc?'+':'−'}${fmt(t.amount)}옥</div>${balHTML}</div></div>`
}
function fmtFull(iso){if(!iso)return'';const d=new Date(iso);const w=['일','월','화','수','목','금','토'][d.getDay()];return`${d.getMonth()+1}월 ${d.getDate()}일 ${w}요일`}

async function rMoney(){
  TAB='money'
  app().innerHTML=`<div class="screen fade-in p3"><div class="topbar"><div class="t">옥야머니</div><div style="width:34px"></div></div><div class="loader" style="min-height:200px"><div class="spin"></div></div></div>${bnav()}`
  bindNav()
  const admin=SESSION.role==='admin'
  const txs=await getAllTx()
  const bal=balOf(SESSION.id,txs)
  const issued=txs.filter(t=>t.type==='발행').reduce((s,t)=>s+t.amount,0)
  const ym=new Date().toISOString().slice(0,7)
  const mine=txs.filter(t=>t.to===SESSION.id||t.from===SESSION.id)
  const gotM=mine.filter(t=>t.to===SESSION.id&&(t.at||'').slice(0,7)===ym).reduce((s,t)=>s+t.amount,0)
  const useM=mine.filter(t=>t.from===SESSION.id&&(t.at||'').slice(0,7)===ym).reduce((s,t)=>s+t.amount,0)
  const rbal=admin?{}:runningBal(mine,bal)
  const baseList=admin?txs.filter(t=>t.type==='발행'||t.type==='회수'):mine
  const cats=admin?['전체','발행','회수','챌린지']:['전체','출석','송금','챌린지','발행']
  const catMatch=(t,cat)=>{if(cat==='전체')return true;if(cat==='챌린지')return t.type==='발행'&&/챌린지|인증/.test(t.reason||'');if(cat==='발행')return t.type==='발행'&&!/챌린지|인증/.test(t.reason||'');return t.type===cat}
  const rowsFor=cat=>{const l=baseList.filter(t=>catMatch(t,cat)).slice(0,20);return{l,html:l.length?l.map(t=>txRow(t,admin,rbal[t.id])).join(''):'<div class="empty" style="padding:30px 20px">해당 거래가 없어요.</div>'}}
  const first=rowsFor('전체')

  app().innerHTML=`<div class="screen fade-in p3 money2">
    <div class="topbar"><div class="t">옥야머니</div><div style="width:34px"></div></div>
    <section class="m2-hero">
      <div class="m2-hero-l">
        <div class="m2-lbl">${admin?'학생회 총 발행량':'내 잔액'}</div>
        <div class="m2-bal"><span id="mbalnum">0</span><small>옥</small></div>
        ${admin?'':`<div class="m2-month"><span>이번 달 <b>+${fmt(gotM)}</b> 받음</span><span class="m2-dot"></span><span><b>-${fmt(useM)}</b> 사용</span></div>`}
      </div>
      <div class="m2-actions">
        <button class="m2-act pri" id="m-act">${I.send}<span>${admin?'발행':'송금'}</span></button>
        ${admin?`<button class="m2-act" id="m-recall">${I.recall}<span>회수</span></button>`:''}
        <button class="m2-act" id="m-hist">${I.hist}<span>내역</span></button>
      </div>
    </section>
    <section class="m2-sec">
      <div class="m2-sec-head"><h2 class="m2-sec-t">${admin?'발행 내역':'최근 거래'}</h2><button class="m2-more" id="m-all">전체보기 ${I.chev}</button></div>
      <div class="m2-cats" id="m2-cats">${cats.map((c,i)=>`<button class="m2-cat${i===0?' on':''}" data-cat="${c}">${c}</button>`).join('')}</div>
      <div class="m2-txlist" id="m2-txlist">${first.html}</div>
    </section>
  </div>${bnav()}`
  bindNav()
  document.getElementById('m-act').onclick=()=>push(()=>fTransfer(admin?'발행':'송금'))
  if(admin)document.getElementById('m-recall').onclick=()=>push(()=>fTransfer('회수'))
  document.getElementById('m-hist').onclick=()=>openHistoryOverlay()
  document.getElementById('m-all').onclick=()=>openHistoryOverlay()
  countUp(document.getElementById('mbalnum'),admin?issued:bal)
  wireTxRows(first.l)
  document.querySelectorAll('#m2-cats [data-cat]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#m2-cats [data-cat]').forEach(x=>x.classList.toggle('on',x===b))
    const r=rowsFor(b.dataset.cat),el=document.getElementById('m2-txlist')
    if(el){el.innerHTML=r.html;wireTxRows(r.l)}
  })
}
// 거래 행 탭 → 상세 바텀시트
function wireTxRows(list){document.querySelectorAll('.lrow-tap[data-txid]').forEach(el=>el.onclick=()=>{const t=(list||[]).find(x=>x.id===el.dataset.txid);if(t)txDetailSheet(t)})}
function txDetailSheet(t){
  const admin=SESSION.role==='admin'
  const inc=admin?(t.type!=='회수'):(t.to===SESSION.id)
  const other=t.to===SESSION.id?nameOf(t.from):nameOf(t.to)
  const d=new Date(t.at),w=['일','월','화','수','목','금','토'][d.getDay()]
  const dstr=`${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()} (${w}) ${d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}`
  const rows=[['종류',t.type],[t.type==='회수'?'회수 대상':(t.to===SESSION.id?'보낸 사람':'받는 사람'),other],t.reason?['메모',t.reason]:null,['일시',dstr],['거래번호',t.id]].filter(Boolean)
  openSheet({title:'거래 상세',body:`
    <div class="txd-amt ${inc?'pos':'neg'}"><span class="t-num">${inc?'+':'−'}${fmt(t.amount)}<span class="unit">옥</span></span></div>
    <div class="txd-rows">${rows.map(([k,v])=>`<div class="txd-row"><span class="txd-k">${esc(k)}</span><span class="txd-v">${esc(v)}</span></div>`).join('')}</div>`})
}

// ── 오버레이 시스템: 뒤 화면 유지 + 한 번에 하나만 (알림=우측상단 / 내역=중앙) ──
let OK_OV=null
function openOverlay({variant,title,bodyHTML}){
  closeOverlay()
  const bd=document.createElement('div');bd.className='ov-backdrop'
  const pn=document.createElement('div');pn.className='ov-panel p3 '+(variant==='center'?'ov-center':'ov-tr')
  pn.innerHTML=`<div class="ov-head"><span class="ov-t">${esc(title)}</span><button class="ov-x" aria-label="닫기">✕</button></div>${bodyHTML||''}`
  document.body.appendChild(bd);document.body.appendChild(pn)
  bd.onclick=closeOverlay
  pn.querySelector('.ov-x').onclick=closeOverlay
  const onKey=e=>{if(e.key==='Escape')closeOverlay()}
  document.addEventListener('keydown',onKey)
  OK_OV={bd,pn,onKey}
  requestAnimationFrame(()=>{bd.classList.add('in');pn.classList.add('in')})
  return pn
}
function closeOverlay(){
  if(!OK_OV)return
  const{bd,pn,onKey}=OK_OV;OK_OV=null
  document.removeEventListener('keydown',onKey)
  bd.classList.remove('in');pn.classList.remove('in')
  setTimeout(()=>{bd.remove();pn.remove()},260)
}
// KST(UTC+9) 기준 날짜 키 — 이른 새벽 거래가 하루 밀리지 않도록
const kstDateKey=iso=>iso?new Date(new Date(iso).getTime()+324e5).toISOString().slice(0,10):''
const kstToday=()=>new Date(Date.now()+324e5).toISOString().slice(0,10)
// 거래 내역 → 중앙 카드 오버레이 (필터 전체/받기/송금/출석 + 날짜, 내부 스크롤)
async function openHistoryOverlay(){
  const admin=SESSION.role==='admin'
  const pn=openOverlay({variant:'center',title:admin?'발행 내역':'거래 내역',bodyHTML:'<div class="ov-body" id="ovh-load"><div class="loader" style="min-height:180px"><div class="spin"></div></div></div>'})
  const txs=await getAllTx()
  if(!OK_OV||OK_OV.pn!==pn)return
  const data=admin?txs.filter(t=>t.type==='발행'||t.type==='회수'):txs.filter(t=>t.to===SESSION.id||t.from===SESSION.id)
  const rbal=admin?{}:runningBal(data,balOf(SESSION.id,txs))
  const filters=admin?['전체','발행','회수']:['전체','받기','송금','출석']
  let cur='전체',dateSel=''
  const matchCat=t=>cur==='전체'?true:cur==='발행'?t.type==='발행':cur==='회수'?t.type==='회수':cur==='받기'?t.to===SESSION.id:cur==='송금'?(t.type==='송금'&&t.from===SESSION.id):cur==='출석'?t.type==='출석':true
  const load=pn.querySelector('#ovh-load');if(load)load.remove()
  pn.querySelector('.ov-head').insertAdjacentHTML('afterend',`
    <div class="ov-cats" id="ovh-cats">${filters.map((f,i)=>`<button class="ov-cat${i===0?' on':''}" data-f="${f}">${f}</button>`).join('')}<button class="ov-cat" id="ovh-datebtn">날짜</button></div>
    <div class="ov-datebar" id="ovh-datebar" style="display:none"><input type="date" id="ovh-date" max="${kstToday()}"><button class="ov-dclear" id="ovh-dclear">전체 날짜</button></div>
    <div class="ov-body" id="ovh-body"></div>`)
  const body=pn.querySelector('#ovh-body'),datebar=pn.querySelector('#ovh-datebar'),dateInput=pn.querySelector('#ovh-date')
  const setCats=()=>pn.querySelectorAll('#ovh-cats [data-f]').forEach(x=>x.classList.toggle('on',x.dataset.f===cur))
  const setDateBtn=()=>pn.querySelector('#ovh-datebtn').classList.toggle('on',!!dateSel)
  const render=()=>{
    const fl=data.filter(t=>matchCat(t)&&(!dateSel||kstDateKey(t.at)===dateSel)),groups={}
    fl.forEach(t=>{const d=kstDateKey(t.at);(groups[d]=groups[d]||[]).push(t)})
    const keys=Object.keys(groups).sort().reverse()
    body.innerHTML=keys.length?keys.map(d=>`<div class="hist2-datehd">${fmtFull(d)}</div><div class="hist2-group">${groups[d].map(t=>txRow(t,admin,rbal[t.id])).join('')}</div>`).join(''):`<div class="empty" style="padding:40px 20px">${dateSel?'그 날의 내역이 없어요.':'내역이 없어요.'}</div>`
    wireTxRows(fl)
  }
  pn.querySelectorAll('#ovh-cats [data-f]').forEach(el=>el.onclick=()=>{cur=el.dataset.f;setCats();render()})
  pn.querySelector('#ovh-datebtn').onclick=()=>{const open=datebar.style.display==='none';datebar.style.display=open?'flex':'none';if(open&&!dateInput.value){dateInput.value=kstToday()}}
  dateInput.onchange=()=>{dateSel=dateInput.value;setCats();setDateBtn();render()}
  pn.querySelector('#ovh-dclear').onclick=()=>{dateSel='';dateInput.value='';datebar.style.display='none';setCats();setDateBtn();render()}
  render()
}
function rHistory(){openHistoryOverlay()}
// 알림 → 우측 상단 오버레이 (Home 뒤에 유지)
async function openNotifOverlay(){
  const pn=openOverlay({variant:'tr',title:'알림',bodyHTML:'<div class="ov-body" id="ntov-body"><div class="loader" style="min-height:120px"><div class="spin"></div></div></div>'})
  await loadNotifs()
  if(!OK_OV||OK_OV.pn!==pn)return
  const body=pn.querySelector('#ntov-body')
  const rowHTML=n=>{const m=NT_META[n.type]||{ic:'bell',tint:'gray'};return`<div class="lrow ntrow${n.read?'':' unread'}" data-nid="${n.id}"><div class="chip ti-${m.tint}">${I[m.ic]||I.bell}</div><div class="body"><div class="ti">${esc(n.title)}</div><div class="su">${esc(n.body)}${n.body?' · ':''}${timeago(n.at)}</div></div>${n.read?`<span class="ntchev">${I.chev}</span>`:'<span class="ntdot"></span>'}</div>`}
  if(!NOTIFS.length)body.innerHTML=emptyHTML({icon:'🔔',title:'아직 알림이 없어요',desc:'새 소식이 오면 여기에서 알려줄게요.'})
  else{
    const order=['오늘','어제','이번 주','이전'],groups={}
    NOTIFS.forEach(n=>{(groups[notifBucket(n.at)]=groups[notifBucket(n.at)]||[]).push(n)})
    body.innerHTML=order.filter(k=>groups[k]).map(k=>`<div class="hist2-datehd">${k}</div><div class="hist2-group">${groups[k].map(rowHTML).join('')}</div>`).join('')
    body.querySelectorAll('[data-nid]').forEach(el=>el.onclick=()=>{const n=NOTIFS.find(x=>x.id===el.dataset.nid);if(n)openNotif(n)})
  }
  markNotifsRead()
}

// 알림 센터
const NT_META={money:{ic:'money',tint:'green'},dm:{ic:'send',tint:'blue'},petition:{ic:'notice',tint:'org'},notice:{ic:'notice',tint:'blue'},book:{ic:'book',tint:'blue'},print:{ic:'print',tint:'org'},challenge:{ic:'star',tint:'green'}}
// 알림 → 날짜 버킷(오늘/어제/이번 주/이전)
function notifBucket(at){const d=new Date(at).getTime(),now=new Date(),s=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),D=86400000;return d>=s?'오늘':d>=s-D?'어제':d>=s-7*D?'이번 주':'이전'}
// 알림 클릭 → 해당 기능/상세로 딥링크. link 필드에 id가 있으면 상세로, 없으면 목록으로
function openNotif(n){
  const lk=(n.link||'').trim()
  const leave=()=>{if(OK_OV)closeOverlay();else pop()}
  const go=fn=>{leave();push(fn)}
  switch(n.type){
    case'dm':if(lk){go(()=>rDmChat(lk))}else{leave();TAB='search';routeTab()}break
    case'petition':go(lk?()=>rPetitionDetail(lk):rPetitionPage);break
    case'book':go(lk?()=>rBookDetail(lk):rBookPage);break
    case'challenge':go(rChallengePage);break
    case'binding':case'print':go(rPrint);break
    case'money':leave();openHistoryOverlay();break
    default:break
  }
}
async function rNotifications(){
  app().innerHTML=`<div class="screen no-nav fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">알림</div><button id="nt-clear" style="font-size:12.5px;font-weight:700;color:var(--primary);background:none">모두 읽음</button></div>
    <div id="nt-body"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div>
    <div style="height:12px"></div>
  </div>`
  document.getElementById('bk').onclick=pop
  await loadNotifs()
  const rowHTML=n=>{
    const m=NT_META[n.type]||{ic:'bell',tint:'gray'}
    return`<div class="lrow ntrow${n.read?'':' unread'}" data-nid="${n.id}"><div class="chip ti-${m.tint}">${I[m.ic]||I.bell}</div><div class="body"><div class="ti">${esc(n.title)}</div><div class="su">${esc(n.body)}${n.body?' · ':''}${timeago(n.at)}</div></div>${n.read?`<span class="ntchev">${I.chev}</span>`:'<span class="ntdot"></span>'}</div>`
  }
  const render=()=>{
    const b=document.getElementById('nt-body');if(!b)return
    if(!NOTIFS.length){b.innerHTML=emptyHTML({icon:'🔔',title:'아직 알림이 없어요',desc:'새 소식이 오면 여기에서 알려줄게요.'});return}
    const order=['오늘','어제','이번 주','이전'],groups={}
    NOTIFS.forEach(n=>{(groups[notifBucket(n.at)]=groups[notifBucket(n.at)]||[]).push(n)})
    b.innerHTML=order.filter(k=>groups[k]).map(k=>`<div class="hist2-datehd">${k}</div><div class="hist2-group">${groups[k].map(rowHTML).join('')}</div>`).join('')
    b.querySelectorAll('[data-nid]').forEach(el=>el.onclick=()=>{const n=NOTIFS.find(x=>x.id===el.dataset.nid);if(n)openNotif(n)})
  }
  render()
  markNotifsRead()   // 화면 열면 읽음 처리
  document.getElementById('nt-clear').onclick=async()=>{await markNotifsRead();render()}
}

async function fTransfer(mode){
  // 단계 1: 받는 사람 검색 (preview 3)
  const isRecall=mode==='회수'
  const others=USERS.filter(u=>u.id!==SESSION.id&&!((mode==='송금'||isRecall)&&u.role==='admin'))
  let rtxs=null
  if(isRecall){
    app().innerHTML=`<div class="screen p3 mflow"><div class="loader" style="min-height:300px"><div class="spin"></div></div></div>`
    rtxs=await getAllTx()
  }
  let sel=null
  const title=mode==='발행'?'옥야머니 발행':(isRecall?'옥야머니 회수':'송금')
  const buildList=(q='')=>{
    const fl=q?others.filter(u=>u.name.includes(q)):others
    if(!fl.length)return`<div class="empty">검색 결과가 없어요</div>`
    return fl.map(u=>{
      const on=sel===u.id
      const sub=isRecall?('잔액 '+fmt(balOf(u.id,rtxs))+'옥'):(u.role==='admin'?'학생회 임원':'학생')
      return`<div class="lrow tf-user${on?' on':''}" data-uid="${u.id}"><div class="chip ti-blue" style="border-radius:50%;overflow:hidden;${on&&!u.photo?'background:var(--grad);color:#fff':''}">${u.photo?`<img src="${esc(u.photo)}" style="width:100%;height:100%;object-fit:cover">`:esc(u.name.charAt(0))}</div><div class="body"><div class="ti">${esc(u.name)}</div><div class="su">${sub}</div></div><span style="color:${on?'var(--primary)':'#c9cdd8'};display:flex">${on?ICO_CHECK_SM:I.chev}</span></div>`
    }).join('')
  }
  app().innerHTML=`<div class="screen fade-in p3 mflow" style="display:flex;flex-direction:column">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">${title}</div><button id="tf-cancel" style="font-size:13px;font-weight:600;color:var(--sub);background:none">취소</button></div>
    <div style="padding:2px 18px 0"><div style="display:flex;align-items:center;gap:9px;background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:12px 15px"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--sub);fill:none;stroke-width:2;stroke-linecap:round;flex:none"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="tf-q" placeholder="이름으로 검색" style="flex:1;background:none;border:none;outline:none;font-size:14px;padding:0" autocomplete="off" autocorrect="off"></div></div>
    <div class="pcard" id="tf-list" style="flex:1;overflow:auto;min-height:0">${buildList()}</div>
    <div style="padding:8px 18px calc(14px + env(safe-area-inset-bottom))"><button class="pbtn pri" id="tf-next" disabled style="opacity:.4">다음</button></div>
  </div>${bnav()}`
  bindNav()
  const syncNext=()=>{const b=document.getElementById('tf-next');b.disabled=!sel;b.style.opacity=sel?'1':'.4'}
  const bind=()=>document.querySelectorAll('.tf-user').forEach(el=>el.onclick=()=>{
    sel=el.dataset.uid
    document.getElementById('tf-list').innerHTML=buildList(document.getElementById('tf-q').value)
    bind();syncNext()
  })
  bind();syncNext()
  document.getElementById('bk').onclick=pop
  document.getElementById('tf-cancel').onclick=()=>{STACK.length=0;routeTab()}
  document.getElementById('tf-q').oninput=e=>{document.getElementById('tf-list').innerHTML=buildList(e.target.value);bind();syncNext()}
  document.getElementById('tf-next').onclick=()=>{if(sel)push(()=>fTransferAmt(mode,USERS.find(u=>u.id===sel)))}
}

async function fTransferAmt(mode,toUser){
  // 단계 2: 금액 입력 (preview 4) — 흰 배경, 숫자만 키패드
  app().innerHTML=`<div class="screen p3 mflow"><div class="loader" style="min-height:300px"><div class="spin"></div></div></div>`
  const txs=await getAllTx()
  const myBal=balOf(SESSION.id,txs)
  const isRecall=mode==='회수'
  const availBal=isRecall?balOf(toUser.id,txs):myBal
  const limited=mode==='송금'||isRecall
  const title=mode==='발행'?'발행':(isRecall?'회수':'송금')
  let amtStr='0'
  const upd=()=>{
    const n=parseInt(amtStr)||0
    const el=document.getElementById('kp-amt')
    if(el){el.innerHTML=(n>0?`${fmt(n)}`:`<span class="cur">0</span>`)+`<small>옥</small>`;el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse')}
    const nb=document.getElementById('kp-next');if(nb)nb.disabled=!(n>0&&(!limited||n<=availBal))
    const bw=document.getElementById('kp-warn');if(bw)bw.style.display=(limited&&n>availBal)?'block':'none'
  }
  app().innerHTML=`<div class="screen fade-in p3 mflow" style="display:flex;flex-direction:column">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">${title}</div><button id="tf-cancel" style="font-size:13px;font-weight:600;color:var(--sub);background:none">취소</button></div>
    <div class="kpwrap">
      <div class="kpto"><div class="av" style="overflow:hidden">${toUser.photo?`<img src="${esc(toUser.photo)}" style="width:100%;height:100%;object-fit:cover">`:esc(toUser.name.charAt(0))}</div><div><div class="n">${esc(toUser.name)}</div><div class="b">${mode==='발행'?'발행 대상':(isRecall?'회수 대상':'창녕옥야고등학교')}</div></div></div>
      <div style="margin:auto 0;text-align:center">
        <div class="kp-amt" id="kp-amt" style="margin:0"><span class="cur">0</span><small>옥</small></div>
        <div id="kp-bal" style="font-size:12px;color:var(--sub);opacity:.8;font-weight:600;margin-top:10px">${mode==='발행'?'학생회에서 발행':(isRecall?esc(toUser.name)+'님 보유 '+fmt(availBal)+'옥':'보유 '+fmt(availBal)+'옥')}</div>
      </div>
      <div id="kp-warn" style="display:none;text-align:center;color:var(--danger);font-size:12px;font-weight:700;margin-bottom:8px">${isRecall?'보유 잔액보다 많아요':'잔액이 부족해요'}</div>
      <div class="kpquick">${['+100','+500','+1,000','전액'].map(q=>`<span data-q="${q}">${q}</span>`).join('')}</div>
      <div style="display:flex;align-items:center;gap:8px;background:var(--soft);border:1px solid var(--line);border-radius:13px;padding:11px 14px;margin-bottom:10px"><span class="kpmsgic">${I.msg}</span><input id="tf-reason" placeholder="메시지 (선택)" style="flex:1;background:none;border:none;outline:none;font-size:13.5px;padding:0"></div>
      <div class="keypad">${['1','2','3','4','5','6','7','8','9','00','0','del'].map(k=>`<div class="key" data-k="${k}">${k==='del'?ICO_DEL:k}</div>`).join('')}</div>
      <button class="kpnext" id="kp-next" disabled>다음</button>
    </div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  document.getElementById('tf-cancel').onclick=()=>{STACK.length=0;routeTab()}
  document.querySelectorAll('.kpquick [data-q]').forEach(el=>el.onclick=()=>{
    const q=el.dataset.q;let n=parseInt(amtStr)||0
    if(q==='전액'){n=limited?availBal:n}else{n+=parseInt(q.replace(/[+,]/g,''))}
    if(limited)n=Math.min(n,availBal)
    amtStr=String(n);upd()
  })
  document.querySelector('.keypad').onclick=e=>{
    const k=e.target.closest('[data-k]')?.dataset.k;if(!k)return
    if(k==='del')amtStr=amtStr.length>1?amtStr.slice(0,-1):'0'
    else if(k==='00'){if(amtStr!=='0'&&amtStr.length<7)amtStr+='00'}
    else{if(amtStr==='0')amtStr=k;else if(amtStr.length<7)amtStr+=k}
    upd()
  }
  document.getElementById('kp-next').onclick=()=>{
    const amount=parseInt(amtStr)||0;if(amount<=0)return
    fTransferConfirm(mode,toUser,amount,document.getElementById('tf-reason').value.trim(),myBal)
  }
}

function fTransferConfirm(mode,toUser,amount,reason,myBal){
  // 단계 3: 확인 바텀시트 → 완료 화면
  const ov=document.createElement('div')
  ov.className='p3sheet-ov'
  ov.innerHTML=`<div class="p3sheet">
    <div class="grab"></div>
    <div style="text-align:center;margin-bottom:26px">
      ${toUser.photo?`<img src="${esc(toUser.photo)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 16px;box-shadow:var(--sh-blue)">`:`<div style="width:64px;height:64px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:25px;font-weight:800;color:#fff;box-shadow:var(--sh-blue)">${esc(toUser.name.charAt(0))}</div>`}
      <div style="font-size:11px;font-weight:700;color:var(--sub);letter-spacing:.05em;margin-bottom:8px">${mode==='발행'?'발행 확인':(mode==='회수'?'회수 확인':'송금 확인')}</div>
      <div style="font-size:20px;font-weight:800;color:var(--ink);line-height:1.5">${esc(toUser.name)}님${mode==='회수'?'에게서':'에게'}<br><span style="color:var(--primary)">${fmt(amount)}옥</span> ${mode==='발행'?'발행':(mode==='회수'?'회수':'송금')}할까요?</div>
      ${reason?`<div style="margin-top:10px;font-size:13px;color:var(--sub)">"${esc(reason)}"</div>`:''}
    </div>
    <div style="display:flex;gap:10px">
      <button id="tf-cc" style="flex:1;padding:16px;border-radius:14px;background:var(--soft);border:none;font-size:15px;font-weight:700;color:var(--ink2);cursor:pointer">취소</button>
      <button id="tf-ok" style="flex:2;padding:16px;border-radius:14px;background:var(--grad);border:none;font-size:15px;font-weight:700;color:#fff;cursor:pointer;box-shadow:var(--sh-blue)">${mode==='발행'?'발행하기':(mode==='회수'?'회수하기':'보내기')}</button>
    </div>
  </div>`
  document.body.appendChild(ov)
  requestAnimationFrame(()=>ov.classList.add('show'))
  const closeSheet=()=>{ov.classList.remove('show');setTimeout(()=>ov.remove(),300)}
  ov.onclick=e=>{if(e.target===ov)closeSheet()}
  ov.querySelector('#tf-cc').onclick=closeSheet
  ov.querySelector('#tf-ok').onclick=async()=>{
    const btn=ov.querySelector('#tf-ok')
    btn.disabled=true;btn.textContent=mode==='발행'?'발행 중…':(mode==='회수'?'회수 중…':'보내는 중…')
    const ok=await addTx(mode==='회수'
      ?{from:toUser.id,to:'u_council',amount,type:'회수',reason}
      :{from:mode==='발행'?'u_council':SESSION.id,to:toUser.id,amount,type:mode==='발행'?'발행':'송금',reason})
    ov.remove()
    if(ok){
      STACK.length=0
      const verb=mode==='발행'?'에게 발행했어요':(mode==='회수'?'에게서 회수했어요':'에게 보냈어요')
      const remain=mode==='송금'?`남은 잔액 ${fmt(Math.max(0,(myBal||0)-amount))}옥 · `:''
      const tm=new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})
      app().innerHTML=`<div class="screen fade-in p3 mflow">
        <div class="succ">
          <svg class="ring2" viewBox="0 0 100 100" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle class="bgc" cx="50" cy="50" r="42"/><circle class="arc" cx="50" cy="50" r="42" transform="rotate(-90 50 50)"/><path class="chk" d="M33 51l12 12 22-24"/></svg>
          <h2>${fmt(amount)}옥을<br>${esc(toUser.name)}님${verb}</h2>
          <p>${remain}${tm}${reason?` · "${esc(reason)}"`:''}</p>
          <div class="btns">
            <button class="pbtn out" id="tf-home">홈으로</button>
            <button class="pbtn pri" id="tf-hist">내역 보기</button>
          </div>
        </div>
      </div>${bnav()}`
      bindNav()
      document.getElementById('tf-home').onclick=()=>{TAB='money';STACK=[];rMoney()}
      document.getElementById('tf-hist').onclick=()=>{TAB='money';STACK=[];rMoney();openHistoryOverlay()}
    }else{
      toast('처리 중 오류가 발생했어요')
    }
  }
}
