'use strict';
// 커뮤 배너 카드 HTML(실데이터). data-go로 상세 이동
function bcard(b){
  if(b.type==='petition')return`<div class="cbcard cb-peti" data-go="petition:${b.id}"><span class="cbtag">${b.tag}</span><div class="cb-petbody"><div class="cb-petitle">${esc(b.title)}</div></div><div class="cbmeta">${esc(b.meta||'')}</div></div>`
  const inner=b.img?`<img src="${esc(b.img)}">`:(b.type==='book'?`<div class="cb-bookph">${I.book}</div>`:`<span class="cbimg-ph">${I.image}이미지 준비 중</span>`)
  return`<div class="cbcard cb-img" data-go="${b.kind}:${b.id}"><span class="cbtag">${b.tag}</span><div class="cbimg${b.img?' has-img':''}">${inner}</div><div class="cbcap"><div class="cbcap-t">${esc(b.title)}</div><div class="cbcap-s">${esc(b.sub||'')}</div></div></div>`
}
// 최신 소식: 청원(동의 많은 순)·챌린지·책에서 실데이터로 배너 구성
async function commBannerItems(){
  const items=[]
  const q=(t,o)=>wt(sb.from(t).select('*'),6000).then(r=>r.data||[]).catch(()=>[])
  try{
    const[ev,pe,bk]=await Promise.all([q('okya_events'),q('okya_petitions'),q('okya_books')])
    const evs=ev.sort((a,b)=>(a.at<b.at?1:-1))
    const pes=pe.filter(p=>p.status==='approved').sort((a,b)=>petAgrees(b)-petAgrees(a))
    const bks=bk.filter(b=>b.status!=='matched'&&(b.applicants||[]).length===0).sort((a,b)=>(a.at<b.at?1:-1))
    if(pes[0])items.push({type:'petition',kind:'petition',id:pes[0].id,tag:'주목 청원',title:pes[0].title||pes[0].txt||'제목 없음',sub:pes[0].purpose||'',meta:`익명 · 동의 ${fmt(petAgrees(pes[0]))} · ${timeago(petStart(pes[0]))}`})
    evs.slice(0,2).forEach(e=>items.push({type:'challenge',kind:'challenge',id:e.id,tag:'챌린지',title:e.title,sub:`인증하면 ${fmt(e.reward||0)}옥`,img:e.poster}))
    bks.slice(0,2).forEach(b=>items.push({type:'book',kind:'book',id:b.id,tag:b.kind==='나눔'?'책 나눔':'책 교환',title:b.title,sub:b.kind==='교환'&&b.want?`↔ ${b.want}`:`${b.grade||''} · ${b.owner_name||''}`,img:b.photo}))
    if(pes[1])items.push({type:'petition',kind:'petition',id:pes[1].id,tag:'청원',title:pes[1].title||pes[1].txt||'제목 없음',sub:pes[1].purpose||'',meta:`익명 · 동의 ${fmt(petAgrees(pes[1]))}`})
  }catch{}
  return items
}
let COMM_TIMER=null,COMM_SIG=''
function renderCommBanner(items){
  const track=document.getElementById('cbtrack'),dots=document.getElementById('cbdots')
  if(!track)return
  if(!items.length){track.innerHTML=`<div class="cbcard cb-peti"><span class="cbtag">소식</span><div class="cb-petitle">아직 올라온 소식이 없어요</div><div class="cbmeta">첫 챌린지·청원·책을 올려보세요</div></div>`;if(dots)dots.innerHTML='';return}
  track.innerHTML=items.map(bcard).join('')
  if(dots)dots.innerHTML=items.map((_,i)=>`<i class="${i===0?'on':''}"></i>`).join('')
  initCarousel()
}
function startCommPoll(){clearInterval(COMM_TIMER);COMM_TIMER=setInterval(async()=>{
  if(TAB!=='comm'){clearInterval(COMM_TIMER);COMM_TIMER=null;return}
  const items=await commBannerItems();const sig=items.map(i=>i.kind+i.id).join('|')
  if(sig===COMM_SIG)return
  COMM_SIG=sig;renderCommBanner(items)
},8000)}
async function rComm(){
  TAB='comm'
  const CARDS=[
    {id:'challenge',ic:'star',    tint:'org', title:'챌린지',   desc:'옥야머니 이벤트'},
    {id:'book',     ic:'book',    tint:'green',title:'책 교환',  desc:'교재 나눔·교환'},
    {id:'petition', ic:'petition',tint:'blue',title:'청원',     desc:'학교에 건의하기'},
    {id:'binding',  ic:'binding', tint:'sky', title:'옥야제본소',desc:'제본 신청'},
  ]
  app().innerHTML=`<div class="screen fade-in p3">
    <div class="topbar"><div class="t">커뮤니티</div><div style="width:34px"></div></div>
    <div class="comm2-lead"><div class="comm2-lead-t">옥야의 오늘 이야기</div><div class="comm2-lead-s">지금 학교에서 일어나는 소식</div></div>
    <div class="cbanner">
      <div class="cbtrack" id="cbtrack"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div>
      <div class="cbdots" id="cbdots"></div>
    </div>
    <button class="comm-petcta" id="comm-pet">
      <div class="comm-petcta-ic">📢</div>
      <div class="comm-petcta-tx"><div class="comm-petcta-t">학교에 목소리를 내보세요</div><div class="comm-petcta-s">청원을 올리고 함께 참여하기</div></div>
      <span class="comm-petcta-go">${I.chev}</span>
    </button>
    <div class="sec" style="margin:22px 18px 10px">바로가기</div>
    <div class="qcol">
      ${CARDS.map((c,i)=>`<div class="qbtn" data-cid="${c.id}" style="animation:fadeUp .4s var(--ease) both;animation-delay:${i*55}ms"><div class="qic ti-${c.tint}">${I[c.ic]}</div><div class="qt">${c.title}</div><span class="qchev">${I.chev}</span></div>`).join('')}
    </div>
    <div style="height:8px"></div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('comm-pet').onclick=()=>push(rPetitionPage)
  document.querySelectorAll('[data-cid]').forEach(el=>el.onclick=()=>{
    const id=el.dataset.cid
    if(id==='challenge')push(rChallengePage)
    else if(id==='book')push(rBookPage)
    else if(id==='petition')push(rPetitionPage)
    else if(id==='binding')push(rPrint)
  })
  const items=await commBannerItems();COMM_SIG=items.map(i=>i.kind+i.id).join('|')
  if(TAB==='comm')renderCommBanner(items)
  startCommPoll()
}
// 배너 커버플로우: 3D로 겹쳐 뒤→앞으로 넘어오는 느낌 + 점 동기화 + 느린 자동(수동 시 타이머 리셋)
function initCarousel(){
  const stage=document.getElementById('cbtrack');if(!stage)return
  const dots=[...document.querySelectorAll('#cbdots i')]
  const cards=[...stage.querySelectorAll('.cbcard')];const n=cards.length;if(!n)return
  let active=0,timer=null,downX=null,moved=false
  const layout=()=>{
    const w=cards[0].offsetWidth||360
    cards.forEach((el,i)=>{
      let o=i-active
      if(o>n/2)o-=n; else if(o<-n/2)o+=n            // 최단 경로(돌아가는 느낌)
      const ao=Math.abs(o)
      el.style.transition=ao>=2?'none':''            // 멀리서 감싸는 카드는 순간 이동(중앙 가로지르기 방지)
      if(ao>2){el.style.opacity='0';el.style.pointerEvents='none';el.style.zIndex='0';el.style.transform='translate(-50%,-50%) scale(.5)';el.classList.remove('is-active');return}
      el.style.opacity=ao===0?'1':(ao===1?'.82':'.4')
      el.style.pointerEvents='auto'
      el.style.zIndex=String(30-ao)
      const x=o*w*0.46                               // 더 안쪽으로 겹침
      const z=-ao*170                                // 구 형태 깊이감(뒤로 밀기)
      const sc=ao===0?1:(ao===1?.66:.46)             // 중앙-양옆 크기차 크게(메인 강조)
      const rot=o*-33                                // 바깥을 보도록 더 꺾기
      el.style.transform=`translate(-50%,-50%) translate3d(${x}px,0,${z}px) rotateY(${rot}deg) scale(${sc})`
      el.classList.toggle('is-active',ao===0)
    })
    dots.forEach((d,j)=>d.classList.toggle('on',j===active))
  }
  const stopAuto=()=>{clearTimeout(timer)}
  const startAuto=()=>{stopAuto();timer=setTimeout(()=>{if(document.body.contains(stage))go(active+1)},9000)}
  const go=i=>{active=((i%n)+n)%n;layout();startAuto()}          // 이동할 때마다 타이머 리셋 → 동시 넘김 방지
  dots.forEach((d,i)=>d.onclick=()=>go(i))
  cards.forEach((el,i)=>el.onclick=()=>{if(moved){moved=false;return}if(i!==active){go(i);return}const gp=el.dataset.go;if(gp){const[k,id]=gp.split(':');if(k==='challenge')push(()=>rChallengeDetail(id));else if(k==='petition')push(()=>rPetitionDetail(id));else if(k==='book')push(()=>rBookDetail(id))}})
  // 스와이프(포인터 드래그) — 포인터 캡처로 화면 밖까지 인식, 리스너는 stage에만(누수 방지)
  stage.addEventListener('pointerdown',e=>{downX=e.clientX;moved=false;stopAuto();try{stage.setPointerCapture(e.pointerId)}catch(_){}})
  stage.addEventListener('pointermove',e=>{if(downX==null)return;if(Math.abs(e.clientX-downX)>8)moved=true})
  stage.addEventListener('pointerup',e=>{if(downX==null)return;const dx=e.clientX-downX;downX=null;if(dx<=-40)go(active+1);else if(dx>=40)go(active-1);else startAuto()})
  stage.addEventListener('pointercancel',()=>{downX=null;startAuto()})
  layout();startAuto()
}

async function rLost(){
  app().innerHTML=`<div class="screen no-nav p3" style="display:flex;flex-direction:column;height:100dvh">
    <div class="phdr" style="flex:none">
      <button class="bk" id="bk">${I.back}</button>
      <div class="ttl">분실물</div>
      <button id="lost-map" style="background:none;border:none;font-size:12px;font-weight:700;color:var(--primary);cursor:pointer;display:flex;align-items:center;gap:3px;padding:0 4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>지도</button>
    </div>
    <div id="lost-feed" style="flex:1;overflow-y:auto;padding:10px 0 4px;background:var(--bg)">
      <div class="loader" style="min-height:200px"><div class="spin"></div></div>
    </div>
    <div id="lp-attach" style="display:none;flex:none;background:#fff;border-top:1px solid var(--line);padding:16px 20px 12px">
      <div style="display:flex;gap:20px">
        <label for="lp-gallery" style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer">
          <div style="width:52px;height:52px;border-radius:14px;background:#EDFAF5;display:flex;align-items:center;justify-content:center;color:#059669"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
          <span style="font-size:11px;font-weight:600;color:var(--muted)">사진 선택</span>
        </label>
        <input id="lp-gallery" type="file" accept="image/*" style="display:none">
        <label for="lp-capture" style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer">
          <div style="width:52px;height:52px;border-radius:14px;background:var(--primary-tint);display:flex;align-items:center;justify-content:center;color:var(--primary)">${I.camera}</div>
          <span style="font-size:11px;font-weight:600;color:var(--muted)">사진 찍기</span>
        </label>
        <input id="lp-capture" type="file" accept="image/*" capture="environment" style="display:none">
      </div>
    </div>
    <div style="flex:none;background:var(--bg);padding:6px 12px calc(12px + env(safe-area-inset-bottom))">
      <div style="background:#fff;border-radius:20px;box-shadow:0 2px 16px rgba(0,0,0,.07);padding:8px 8px 8px 10px;display:flex;align-items:flex-end;gap:8px">
        <button id="lp-plus" style="width:34px;height:34px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;color:var(--muted);border:none">${I.plus}</button>
        <div style="flex:1;display:flex;align-items:flex-end;gap:6px">
          <textarea id="lp-txt" rows="1" placeholder="메시지를 입력하세요..." style="flex:1;background:none;border:none;outline:none;font-size:14px;color:var(--ink);resize:none;max-height:80px;line-height:1.45;font-family:inherit;padding:0;min-height:20px"></textarea>
          <img id="lp-thumb" style="display:none;width:24px;height:24px;border-radius:4px;object-fit:cover;flex:none">
        </div>
        <button id="lp-send" style="width:36px;height:36px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;flex:none;color:#fff;border:none;cursor:pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
      </div>
    </div>
  </div>`

  document.getElementById('bk').onclick=pop
  document.getElementById('lost-map').onclick=showLostMap

  let pendingPhoto=null   // 썸네일 미리보기용(dataURL)
  let pendingFile=null    // 실제 업로드할 원본 파일
  let attachOpen=false

  document.getElementById('lp-plus').onclick=()=>{
    attachOpen=!attachOpen
    document.getElementById('lp-attach').style.display=attachOpen?'block':'none'
  }

  const handlePhotoFile=async f=>{
    if(!f)return
    attachOpen=false
    document.getElementById('lp-attach').style.display='none'
    pendingFile=f
    pendingPhoto=await readImg(f,900,0.8)
    const th=document.getElementById('lp-thumb')
    if(th){th.src=pendingPhoto;th.style.display='block'}
  }
  document.getElementById('lp-gallery').onchange=async e=>handlePhotoFile(e.target.files[0])
  document.getElementById('lp-capture').onchange=async e=>handlePhotoFile(e.target.files[0])

  const lptxt=document.getElementById('lp-txt')
  lptxt.oninput=function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,80)+'px'}

  document.getElementById('lp-send').onclick=async()=>{
    const text=lptxt.value.trim()
    if(!text&&!pendingFile)return
    const btn=document.getElementById('lp-send')
    btn.disabled=true
    try{
      let photoUrl=null
      if(pendingFile){toast('사진 업로드 중...');photoUrl=await uploadImg(pendingFile,'lost',900,0.8);if(!photoUrl){btn.disabled=false;return}}
      await wt(sb.from('okya_lost').insert({id:uid('lost'),user_id:SESSION.id,photo:photoUrl,description:text||null,at:nowISO()}))
      lptxt.value='';lptxt.style.height='auto'
      pendingPhoto=null;pendingFile=null
      const th=document.getElementById('lp-thumb')
      if(th){th.style.display='none';th.src=''}
      await loadMsgs()
    }catch{toast('전송 실패')}
    finally{btn.disabled=false}
  }

  const nameOf2=uid2=>USERS.find(u=>u.id===uid2)?.name||'알 수 없음'

  async function loadMsgs(){
    let msgs=[]
    try{const{data}=await wt(sb.from('okya_lost').select('*').order('at',{ascending:true}));msgs=data||[]}catch{}
    const feed=document.getElementById('lost-feed')
    if(!feed)return
    if(!msgs.length){feed.innerHTML=`<div style="padding:60px 20px;text-align:center;color:var(--muted);font-size:14px">첫 번째 메시지를 남겨보세요</div>`;return}
    feed.innerHTML=msgs.map((m,i,a)=>{
      const isMe=m.user_id===SESSION.id
      const name=nameOf2(m.user_id)
      const showHdr=!isMe&&(i===0||a[i-1].user_id!==m.user_id)
      const isLast=i===a.length-1||a[i+1].user_id!==m.user_id
      if(isMe){return`<div style="display:flex;justify-content:flex-end;padding:2px 14px;margin-bottom:${isLast?8:2}px"><div style="max-width:72%">${m.photo?`<img src="${m.photo}" style="width:100%;border-radius:14px 14px 2px 14px;display:block;${m.description?'margin-bottom:4px':''}">`:''} ${m.description?`<div style="background:var(--primary-tint);color:var(--primary);border-radius:18px 18px 4px 18px;padding:10px 14px;font-size:14px;line-height:1.55;word-break:break-word">${esc(m.description)}</div>`:''}<div style="font-size:10px;color:var(--muted);text-align:right;margin-top:3px">${timeago(m.at)}</div></div></div>`}
      return`<div style="display:flex;align-items:flex-start;gap:8px;padding:${showHdr?8:2}px 14px;margin-bottom:${isLast?8:2}px"><div style="width:34px;flex:none">${showHdr?`<div class="lost-av" data-uid="${m.user_id}" style="width:34px;height:34px;border-radius:50%;background:var(--primary-tint);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--primary);cursor:pointer">${esc(name.charAt(0))}</div>`:''}</div><div style="max-width:72%">${showHdr?`<div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">${esc(name)}</div>`:''} ${m.photo?`<img src="${m.photo}" style="width:100%;border-radius:4px 14px 14px 14px;display:block;${m.description?'margin-bottom:4px':''}">`:''} ${m.description?`<div style="background:#fff;color:var(--ink);border-radius:4px 18px 18px 18px;padding:10px 14px;font-size:14px;line-height:1.55;word-break:break-word">${esc(m.description)}</div>`:''}<div style="font-size:10px;color:var(--muted);margin-top:3px">${timeago(m.at)}</div></div></div>`
    }).join('')
    feed.scrollTop=feed.scrollHeight
    feed.querySelectorAll('.lost-av').forEach(el=>{el.onclick=()=>push(()=>rUserProfile(el.dataset.uid))})
  }

  await loadMsgs()
}

function showLostMap(){
  const ov=document.createElement('div')
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px'
  ov.innerHTML=`<div style="background:#fff;border-radius:24px;width:100%;max-height:82dvh;overflow:hidden;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--line);flex:none">
      <div style="font-size:16px;font-weight:700">분실물 박스 위치</div>
      <button id="close-map" style="background:none;border:none;cursor:pointer;color:var(--muted);display:flex">${I.close}</button>
    </div>
    <div style="overflow-y:auto;padding:16px">
      <div style="background:var(--bg);border-radius:16px;aspect-ratio:4/3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;margin-bottom:16px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <div style="font-size:15px;font-weight:700;color:var(--ink)">지도 준비 중이에요</div>
        <div style="font-size:13px;color:var(--muted)">곧 실제 학교 평면도로 업데이트돼요</div>
      </div>
      <div class="sec-title" style="margin-bottom:8px">분실물 박스 위치 (B)</div>
      <div class="card-list">
        ${[
          {n:'1·2학년 복도 입구',d:'1-2교실과 2-1교실 사이 복도'},
          {n:'2·3학년 복도 입구',d:'2-2교실과 3-1교실 사이 복도'},
          {n:'행정실 앞 복도',d:'행정실 입구 복도 옆'},
        ].map((b,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 16px${i<2?';border-bottom:1px solid var(--line)':''}">
          <div style="width:30px;height:30px;border-radius:50%;background:var(--danger-tint);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--danger);flex:none">B</div>
          <div><div style="font-size:13px;font-weight:600">${b.n}</div><div style="font-size:11px;color:var(--muted);margin-top:1px">${b.d}</div></div>
        </div>`).join('')}
      </div>
      <div style="height:8px"></div>
    </div>
  </div>`
  document.body.appendChild(ov)
  ov.querySelector('#close-map').onclick=()=>ov.remove()
  ov.onclick=e=>{if(e.target===ov)ov.remove()}
}
