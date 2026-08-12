'use strict';
// ── 메시지 탭 (검색 + 최근 대화, 클릭 시 전체화면 채팅) ──
async function rSearch(){
  TAB='search'
  const personRow=(u,sub,unread)=>`<div class="lrow" data-uid="${u.id}" style="cursor:pointer"><div class="chip ti-blue" style="border-radius:50%;overflow:hidden;font-weight:800">${u.photo?`<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">`:esc((u.name||'?').charAt(0))}</div><div class="body"><div class="ti">${esc(u.name)}${u.role==='admin'?' <span style="font-size:11px;color:var(--primary);font-weight:700">학생회</span>':''}</div><div class="su">${sub}</div></div>${unread?'<span class="dm-unread"></span>':`<span style="color:#c9cdd8;display:flex">${I.chev}</span>`}</div>`
  app().innerHTML=`<div class="screen fade-in p3">
    <div class="topbar"><div class="t">메시지</div><div style="width:34px"></div></div>
    <div style="padding:2px 18px 0"><div style="display:flex;align-items:center;gap:9px;background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:12px 15px"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--sub);fill:none;stroke-width:2;stroke-linecap:round;flex:none"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="srch-inp" placeholder="이름으로 검색해 새 대화 시작" style="flex:1;background:none;border:none;outline:none;font-size:14px;padding:0" autocomplete="off"></div></div>
    <div id="srch-res"></div>
    <div id="dm-hist"><div class="sec" style="margin:20px 20px 8px">최근 대화</div><div class="pcard"><div id="dm-hist-list"><div class="loader" style="min-height:80px"><div class="spin"></div></div></div></div></div>
  </div>${bnav()}`
  bindNav()

  const inp=document.getElementById('srch-inp')
  const res=document.getElementById('srch-res')
  const hist=document.getElementById('dm-hist')

  const showResults=q=>{
    const trimmed=q.trim()
    hist.style.display=trimmed?'none':'block'
    if(!trimmed){res.innerHTML='';return}
    const found=USERS.filter(u=>u.id!==SESSION.id&&u.name.includes(trimmed))
    res.innerHTML=found.length
      ?`<div class="sec" style="margin:16px 20px 8px">새 대화</div><div class="pcard">${found.map(u=>personRow(u,u.role==='admin'?'학생회':'학생')).join('')}</div>`
      :`<div class="empty">검색 결과가 없어요</div>`
    res.querySelectorAll('[data-uid]').forEach(el=>{el.onclick=()=>push(()=>rDmChat(el.dataset.uid))})
  }
  inp.oninput=()=>showResults(inp.value)

  // 최근 DM 로드
  let dms=[]
  try{
    const{data}=await wt(sb.from('okya_dm').select('*').or(`from_id.eq.${SESSION.id},to_id.eq.${SESSION.id}`).order('at',{ascending:false}),5000)
    const seen=new Set()
    dms=(data||[]).filter(dm=>{const other=dm.from_id===SESSION.id?dm.to_id:dm.from_id;if(seen.has(other))return false;seen.add(other);return true})
  }catch{}
  const histList=document.getElementById('dm-hist-list')
  if(!histList)return
  if(!dms.length){histList.innerHTML=`<div style="padding:22px 2px;text-align:center;color:var(--sub);font-size:13.5px">아직 대화가 없어요.<br>위에서 이름을 검색해 대화를 시작해보세요.</div>`;return}
  histList.innerHTML=dms.map(dm=>{
    const otherId=dm.from_id===SESSION.id?dm.to_id:dm.from_id
    const other=USERS.find(u=>u.id===otherId)||{id:otherId,name:'알 수 없음'}
    const mine=dm.from_id===SESSION.id
    const preview=(mine?'나: ':'')+(dm.text?dm.text.slice(0,22)+(dm.text.length>22?'…':''):'사진')
    return personRow(other,`${esc(preview)} · ${timeago(dm.at)}`)
  }).join('')
  histList.querySelectorAll('[data-uid]').forEach(el=>{el.onclick=()=>push(()=>rDmChat(el.dataset.uid))})
}

// ── 글로벌 검색(전체화면) ──
function getRecentSearch(){try{return JSON.parse(localStorage.getItem('okya-recent-search')||'[]')}catch{return[]}}
function pushRecentSearch(q){if(!q)return;try{let r=getRecentSearch().filter(x=>x!==q);r.unshift(q);localStorage.setItem('okya-recent-search',JSON.stringify(r.slice(0,8)))}catch{}}
async function rGlobalSearch(){
  app().innerHTML=`<div class="screen no-nav fade-in p3 gs-screen">
    <div class="gs-bar">
      <button class="bk" id="bk">${I.back}</button>
      <div class="gs-inputwrap"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="gs-inp" placeholder="급식·일정·청원·책·사람 검색" autocomplete="off" autocorrect="off"><button id="gs-clear" class="gs-clear" style="display:none">✕</button></div>
    </div>
    <div id="gs-body" class="gs-body"></div>
  </div>`
  document.getElementById('bk').onclick=pop
  const inp=document.getElementById('gs-inp'),body=document.getElementById('gs-body'),clr=document.getElementById('gs-clear')
  // DB 소스 로드(메모리 소스는 즉시)
  let books=[],petis=[],meetings=[],prints=[]
  const[a,b,c,d]=await Promise.allSettled([wt(sb.from('okya_books').select('*')),wt(sb.from('okya_petitions').select('*')),wt(sb.from('okya_meetings').select('*')),wt(sb.from('okya_prints').select('*'))])
  books=a.status==='fulfilled'?(a.value.data||[]):[];petis=b.status==='fulfilled'?(b.value.data||[]):[];meetings=c.status==='fulfilled'?(c.value.data||[]):[];prints=d.status==='fulfilled'?(d.value.data||[]):[]
  if(!document.getElementById('gs-body'))return
  const navDetail=fn=>{pop();push(fn)},navTab=t=>{STACK.length=0;TAB=t;routeTab()}
  const hit=(t,q)=>(t||'').toLowerCase().includes(q)
  const recentView=()=>{
    const r=getRecentSearch()
    body.innerHTML=r.length
      ?`<div class="gs-recent-head"><span>최근 검색</span><button id="gs-rclear">전체 삭제</button></div><div class="gs-chips">${r.map(q=>`<button class="gs-chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>`
      :emptyHTML({icon:'🔎',title:'무엇이든 검색해보세요',desc:'급식 · 학사일정 · 공지 · 회의록 · 청원 · 책 · 제본 · 사람'})
    body.querySelectorAll('[data-q]').forEach(el=>el.onclick=()=>{inp.value=el.dataset.q;clr.style.display='';runSearch(el.dataset.q)})
    const rc=document.getElementById('gs-rclear');if(rc)rc.onclick=()=>{localStorage.removeItem('okya-recent-search');recentView()}
  }
  const runSearch=raw=>{
    const q=(raw||'').trim().toLowerCase()
    if(!q){recentView();return}
    const groups=[]
    const us=USERS.filter(u=>u.id!==SESSION.id&&hit(u.name,q)).slice(0,6)
    if(us.length)groups.push({t:'사람',items:us.map(u=>({ic:'👤',title:u.name,sub:u.role==='admin'?'학생회':'학생',act:()=>navDetail(()=>rDmChat(u.id))}))})
    const bs=books.filter(x=>hit(x.title,q)||hit(x.want,q)).slice(0,6)
    if(bs.length)groups.push({t:'책 교환',items:bs.map(x=>({ic:'📚',title:x.title,sub:`${x.kind||'교환'} · ${x.owner_name||''}`,act:()=>navDetail(()=>rBookDetail(x.id))}))})
    const ps=petis.filter(p=>p.status==='approved'&&(hit(p.title,q)||hit(p.txt,q)||hit(p.content,q)||hit(p.purpose,q))).slice(0,6)
    if(ps.length)groups.push({t:'청원',items:ps.map(p=>({ic:'📝',title:p.title||p.txt||'청원',sub:p.category||'',act:()=>navDetail(()=>rPetitionDetail(p.id))}))})
    const ms=meetings.filter(m=>hit(m.title,q)).slice(0,6)
    if(ms.length)groups.push({t:'회의록',items:ms.map(m=>({ic:'🎬',title:m.title,sub:fmtDate(m.at),act:()=>navTab('school')}))})
    const ns=NOTICES.filter(n=>hit(n.title,q)||hit(n.cat,q)).slice(0,6)
    if(ns.length)groups.push({t:'공지',items:ns.map(n=>({ic:'📢',title:n.title,sub:n.cat,act:()=>navTab('home')}))})
    const scs=SCHEDULE.filter(s=>hit(s.label,q)).slice(0,6)
    if(scs.length)groups.push({t:'학사일정',items:scs.map(s=>({ic:'📅',title:s.label,sub:fmtDate(s.date),act:()=>navTab('school')}))})
    const meals=[];Object.keys(MEALS).forEach(dk=>{const m=MEALS[dk]||{};['조식','중식','석식'].forEach(sl=>{if((m[sl]||[]).some(x=>hit(x,q)))meals.push({dk,sl,items:(m[sl]||[]).filter(x=>hit(x,q))})})})
    if(meals.length)groups.push({t:'급식',items:meals.slice(0,6).map(x=>({ic:'🍚',title:`${x.dk} ${x.sl}`,sub:x.items.join(' · '),act:()=>navTab('school')}))})
    const prs=prints.filter(p=>hit(p.title,q)).slice(0,6)
    if(prs.length)groups.push({t:'제본소',items:prs.map(p=>({ic:'📄',title:p.title,sub:p.at?fmtDate(p.at):'',act:()=>navDetail(rPrint)}))})
    if(!groups.length){body.innerHTML=emptyHTML({icon:'🫥',title:'검색 결과가 없어요',desc:`'${esc(raw.trim())}'에 대한 결과를 찾지 못했어요`});return}
    body.innerHTML=groups.map((g,gi)=>`<div class="gs-group"><div class="gs-gt">${g.t} <span>${g.items.length}</span></div>${g.items.map((it,ii)=>`<div class="gs-row" data-gi="${gi}" data-ii="${ii}"><span class="gs-ic">${it.ic}</span><div class="gs-info"><div class="gs-rt">${esc(it.title)}</div>${it.sub?`<div class="gs-rs">${esc(it.sub)}</div>`:''}</div><span class="gs-chev">${I.chev}</span></div>`).join('')}</div>`).join('')
    body.querySelectorAll('.gs-row').forEach(el=>el.onclick=()=>{pushRecentSearch(inp.value.trim());const it=groups[+el.dataset.gi].items[+el.dataset.ii];if(it&&it.act)it.act()})
  }
  inp.oninput=()=>{clr.style.display=inp.value?'':'none';runSearch(inp.value)}
  clr.onclick=()=>{inp.value='';clr.style.display='none';inp.focus();recentView()}
  recentView()
  setTimeout(()=>inp.focus(),80)
}
function rUserProfile(userId){
  const user=USERS.find(u=>u.id===userId)
  if(!user){toast('사용자를 찾을 수 없어요');return}
  const isMe=userId===SESSION.id,name=user.name
  app().innerHTML=`<div class="screen no-nav fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">프로필</div><div style="width:34px"></div></div>
    <div class="prof" style="padding:24px 0 6px">
      <div class="av">${user.photo?`<img src="${user.photo}">`:esc(name.charAt(0))}</div>
      <div class="nm">${esc(name)}</div>
      <div class="cl">창녕옥야고등학교 · ${user.role==='admin'?'학생회':'학생'}</div>
    </div>
    ${!isMe?`<div style="padding:18px"><button class="pbtn pri" id="dm-btn">메시지 보내기</button></div>`:`<div style="padding:24px;text-align:center;color:var(--sub);font-size:14px">내 프로필이에요</div>`}
  </div>`
  document.getElementById('bk').onclick=pop
  if(!isMe)document.getElementById('dm-btn').onclick=()=>push(()=>rDmChat(userId))
}

async function rDmChat(userId){
  const user=USERS.find(u=>u.id===userId)
  const name=user?.name||'알 수 없음'
  const myId=SESSION.id
  app().innerHTML=`<div class="screen p3 dm-screen">
    <div class="dm-panel">
    <div class="phdr" style="flex:none">
      <button class="bk" id="bk">${I.back}</button>
      <div class="ttl" style="display:flex;align-items:center;gap:8px;font-size:16px">
        <div style="width:30px;height:30px;border-radius:50%;background:var(--primary-tint);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--primary);overflow:hidden;flex:none">${user?.photo?`<img src="${user.photo}" style="width:30px;height:30px;border-radius:50%;object-fit:cover">`:esc(name.charAt(0))}</div>
        ${esc(name)}
      </div>
      <div style="width:34px"></div>
    </div>
    <div id="dm-feed" style="flex:1;overflow-y:auto;padding:10px 0 4px;background:#fff">
      <div class="loader" style="min-height:200px"><div class="spin"></div></div>
    </div>
    <div style="flex:none;background:#fff;border-top:1px solid var(--line);padding:8px 12px calc(12px + env(safe-area-inset-bottom))">
      <div class="dm-inputbar">
        <textarea id="dm-txt" rows="1" placeholder="메시지를 입력하세요..." style="flex:1;background:none;border:none;outline:none;font-size:14px;color:var(--ink);caret-color:var(--primary);resize:none;max-height:80px;line-height:1.45;font-family:inherit;padding:6px 2px;min-height:20px"></textarea>
        <button id="dm-snd" style="width:36px;height:36px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;flex:none;color:#fff;border:none;cursor:pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
      </div>
    </div>
    </div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  const dmtxt=document.getElementById('dm-txt')
  dmtxt.oninput=function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,80)+'px'}
  // 사용자가 최신 메시지 근처에 있는지 판단(과거 메시지 읽는 중이면 자동 스크롤로 위치를 뺏지 않음)
  const nearBottom=f=>!f||(f.scrollHeight-f.scrollTop-f.clientHeight)<90
  // 키보드가 실제로 뷰포트를 줄일 때만 화면을 '보이는 영역'에 고정 → 헤더는 위, 입력바는 키보드 바로 위, 메시지 목록만 부드럽게 줄어듦.
  // (데스크톱/하드웨어 키보드처럼 뷰포트가 안 줄면 레이아웃을 건드리지 않아 배경이 튀지 않음. .dm-screen의 rail padding-left는 CSS가 그대로 유지)
  const vv=window.visualViewport
  if(vv){
    const scr=document.querySelector('.dm-screen')
    const clear=()=>{if(!scr)return;['position','left','right','width','top','height','zIndex'].forEach(p=>scr.style[p]='')}
    const fit=()=>{
      if(!scr||!document.body.contains(scr)){vv.removeEventListener('resize',fit);vv.removeEventListener('scroll',fit);return}
      if((window.innerHeight-vv.height)>90){
        scr.style.position='fixed';scr.style.left='0';scr.style.right='0';scr.style.width='100%';scr.style.zIndex='60'
        scr.style.top=vv.offsetTop+'px';scr.style.height=vv.height+'px'
        const f=document.getElementById('dm-feed');if(f&&nearBottom(f))f.scrollTop=f.scrollHeight
      }else clear()
    }
    fit();vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)
    dmtxt.addEventListener('focus',()=>setTimeout(fit,300))
    dmtxt.addEventListener('blur',()=>setTimeout(fit,100))
  }
  const send=async()=>{
    const text=dmtxt.value.trim();if(!text)return
    const btn=document.getElementById('dm-snd');btn.disabled=true
    try{
      await wt(sb.from('okya_dm').insert({id:uid('dm'),from_id:myId,to_id:userId,text,at:nowISO()}))
      notify(userId,'dm','새 메시지',`${nameOf(myId)}님: ${text.length>30?text.slice(0,30)+'…':text}`,myId)
      dmtxt.value='';dmtxt.style.height='auto'
      await loadDms(true)
    }catch{toast('전송 실패')}
    finally{btn.disabled=false;dmtxt.focus()}
  }
  document.getElementById('dm-snd').onclick=send
  // Enter=전송, Shift+Enter=줄바꿈 (모바일 IME 조합 중엔 무시)
  dmtxt.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}})
  async function loadDms(force){
    // 재렌더 전에 사용자가 최신 근처에 있었는지 기억 → 과거 읽는 중엔 위치 유지
    const stick=force||nearBottom(document.getElementById('dm-feed'))
    let msgs=[]
    try{const{data}=await wt(sb.from('okya_dm').select('*').or(`and(from_id.eq.${myId},to_id.eq.${userId}),and(from_id.eq.${userId},to_id.eq.${myId})`).order('at',{ascending:true}));msgs=data||[]}catch{}
    const feed=document.getElementById('dm-feed');if(!feed)return
    if(!msgs.length){feed.innerHTML=`<div style="padding:60px 20px;text-align:center;color:var(--muted);font-size:14px">${esc(name)}님에게 첫 메시지를 보내보세요</div>`;return}
    feed.innerHTML=msgs.map((m,i,a)=>{
      const isMe=m.from_id===myId
      const showHdr=!isMe&&(i===0||a[i-1].from_id!==m.from_id)
      const isLast=i===a.length-1||a[i+1].from_id!==m.from_id
      const rad=isLast?(isMe?'22px 22px 8px 22px':'8px 22px 22px 22px'):'22px'
      if(isMe){return`<div class="dm-msg me" style="display:flex;justify-content:flex-end;padding:1px 14px;margin-bottom:${isLast?8:2}px"><div style="max-width:74%"><div style="background:var(--primary-tint);color:var(--primary);border-radius:${rad};padding:11px 15px;font-size:14px;line-height:1.55;word-break:break-word">${esc(m.text)}</div>${isLast?`<div style="font-size:10px;color:var(--muted);text-align:right;margin-top:4px">${timeago(m.at)}</div>`:''}</div></div>`}
      return`<div class="dm-msg" style="display:flex;align-items:flex-start;gap:8px;padding:${showHdr?7:1}px 14px 1px;margin-bottom:${isLast?8:2}px"><div style="width:34px;flex:none">${showHdr?avatarHTML(userId,34):''}</div><div style="max-width:74%">${showHdr?`<div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">${esc(name)}</div>`:''}<div style="background:var(--soft);color:var(--ink);border-radius:${rad};padding:11px 15px;font-size:14px;line-height:1.55;word-break:break-word">${esc(m.text)}</div>${isLast?`<div style="font-size:10px;color:var(--muted);margin-top:4px">${timeago(m.at)}</div>`:''}</div></div>`
    }).join('')
    if(stick)feed.scrollTop=feed.scrollHeight
  }
  await loadDms(true)
}


const _cbPage=(title)=>{app().innerHTML=`<div class="screen no-nav fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">${title}</div><div style="width:34px"></div></div><div id="cb"><div class="loader" style="min-height:160px"><div class="spin"></div></div></div></div>`;document.getElementById('bk').onclick=pop}