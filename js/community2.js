'use strict';
// ===== 챌린지 (전체화면 포스터 갤러리 → 공모전형 상세 → 인증 → 전원 지급) =====
// 세부탭 2.0 공용 헤더: 이미지 대신 탭별 색 밴드(제목행 전체를 색으로)
function featHero(emoji,title,sub,tone){
  return`<section class="feat-hero tone-${tone||'chal'}"><h1 class="feat-title">${emoji} ${title}</h1></section>`
}
async function rChallengePage(){
  const admin=SESSION.role==='admin'
  app().innerHTML=`<div class="screen fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">챌린지</div>${admin?`<button id="ch-new" style="font-size:13px;font-weight:800;color:var(--primary);background:none">＋ 발행</button>`:`<div style="width:34px"></div>`}</div>
    ${featHero('🔥','챌린지','참여하고 인증하면 옥야머니를 받아요','chal')}
    <div id="cb"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  if(admin)document.getElementById('ch-new').onclick=()=>push(rChallengeNew)
  await iChallengeGallery()
}
async function iChallengeGallery(){
  const admin=SESSION.role==='admin'
  let evs=[]
  try{const r=await wt(sb.from('okya_events').select('*').order('at',{ascending:false}));evs=r.data||[]}catch{}
  evs=evs.filter(e=>!isExpired(e))
  const cb=document.getElementById('cb');if(!cb)return
  cb.innerHTML=(evs.length?`<div class="chal-grid">${evs.map(e=>`<div class="chal-card" data-open="${e.id}"><div class="chal-poster">${e.poster?`<img src="${esc(e.poster)}">`:`<span class="chal-ph">${I.image}포스터 준비 중</span>`}</div><div class="chal-name">${esc(e.title)}</div><div class="chal-intro">${esc(e.descr||'')}</div></div>`).join('')}</div>`:`<div class="empty">진행 중인 챌린지가 없습니다.${admin?'<br><br>우측 상단 <b style="color:var(--primary)">＋ 발행</b>으로 새 챌린지를 만들어보세요.':'<br><br>새로운 챌린지가 곧 올라올 거예요!'}</div>`)+'<div style="height:16px"></div>'
  cb.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>push(()=>rChallengeDetail(el.dataset.open)))
}
function rChallengeNew(){
  let posterFile=null
  app().innerHTML=`<div class="screen fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">새 챌린지</div><div style="width:34px"></div></div>
    <div class="chal-detail form2 tone-chal">
      <div class="pcard">
        <div class="field"><label>포스터(팜플렛)</label>
          <label for="cnf" class="upload" id="cnfl">${I.image}<span>포스터 이미지 추가</span></label>
          <input id="cnf" type="file" accept="image/*" style="display:none">
        </div>
        <div class="field"><label>제목</label><input id="cnt" placeholder="예: 아침 독서 챌린지"></div>
        <div style="display:flex;gap:10px"><div class="field" style="flex:1"><label>보상(옥)</label><input id="cnr" type="number" placeholder="100"></div><div class="field" style="flex:1"><label>마감일</label><input id="cndd" type="date"></div></div>
        <div class="field" style="margin-bottom:0"><label>설명 (학생회 글)</label><textarea id="cndesc" rows="4" placeholder="챌린지 소개·참여 방법 등을 적어주세요" style="resize:none"></textarea></div>
        <button class="pbtn pri" id="cnsub" style="margin-top:14px">등록</button>
      </div>
    </div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  document.getElementById('cnf').onchange=e=>{const f=e.target.files[0];if(f){posterFile=f;const l=document.getElementById('cnfl');l.classList.add('has');l.innerHTML=`<img src="${URL.createObjectURL(f)}">`}}
  document.getElementById('cnsub').onclick=async()=>{
    const title=document.getElementById('cnt').value.trim();if(!title){toast('제목을 입력해줘');return}
    const btn=document.getElementById('cnsub');btn.disabled=true;btn.textContent='등록 중...'
    let poster=null
    if(posterFile){toast('포스터 업로드 중...');poster=await uploadImg(posterFile,'challenge_poster',900,0.72);if(!poster){btn.disabled=false;btn.textContent='등록';return}}
    const dd=document.getElementById('cndd').value
    const rw=parseInt(document.getElementById('cnr').value,10)||0
    try{await wt(sb.from('okya_events').insert({id:uid('e'),title,poster,reward:rw,descr:document.getElementById('cndesc').value.trim(),deadline:dd?new Date(dd+'T23:59:59').toISOString():null,at:nowISO()}))}catch{toast('등록 실패 · okya_events에 poster 열이 필요해요');btn.disabled=false;btn.textContent='등록';return}
    notifyStudents('challenge','새 챌린지 🔥',`'${title}' — 인증하면 ${fmt(rw)}옥`)
    popMsg('챌린지가 발행됐어요','🔥');pop()
  }
}
async function _payChalSubs(e,list){
  let cnt=0
  for(const s of list){
    if(s.paid)continue
    const ids=new Set()
    if(s.by_id)ids.add(s.by_id);(s.names||'').split(/[,\s·]+/).map(x=>x.trim()).filter(Boolean).forEach(nm=>{const u=USERS.find(u=>u.role!=='admin'&&u.name===nm);if(u)ids.add(u.id)})
    for(const id of ids)await addTx({from:'u_council',to:id,amount:e.reward,type:'발행',reason:'['+e.title+'] 챌린지 인증'})
    try{await wt(sb.from('okya_event_subs').update({paid:true}).eq('id',s.id))}catch{}
    s.paid=true;cnt+=ids.size
  }
  return cnt
}
async function rChallengeDetail(eid){
  const admin=SESSION.role==='admin'
  app().innerHTML=`<div class="screen fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">챌린지</div>${admin?`<button id="ch-del" style="font-size:12px;font-weight:700;color:var(--danger);background:none">삭제</button>`:`<div style="width:34px"></div>`}</div><div id="cb"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div></div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  let e=null,subs=[]
  try{const[r1,r2]=await Promise.allSettled([wt(sb.from('okya_events').select('*').eq('id',eid).single()),wt(sb.from('okya_event_subs').select('*').eq('event_id',eid).order('at',{ascending:false}))]);e=r1.status==='fulfilled'?r1.value.data:null;subs=r2.status==='fulfilled'?(r2.value.data||[]):[]}catch{}
  const cb=document.getElementById('cb');if(!cb)return
  if(!e){cb.innerHTML='<div class="empty">챌린지를 찾을 수 없어요.</div>';return}
  const ddTxt=e.deadline?`~${fmtDate(e.deadline)} 마감`:'상시 진행'
  const subCards=subs.length?subs.map(s=>`<div class="sub-card${s.paid?' paid':''}"><div class="sc-top"><div style="min-width:0"><div class="sc-name">${esc(s.names||s.by_name||'-')}</div><div class="sc-meta">제출 ${esc(s.by_name||'')} · ${fmtDate(s.at)}</div></div>${admin?(s.paid?`<span class="paid-badge">✓ 지급됨</span>`:`<div style="display:flex;gap:6px;flex-shrink:0"><button class="minibtn soft" data-pay="${s.id}">지급</button><button class="minibtn danger" data-sdel="${s.id}">삭제</button></div>`):(s.paid?`<span class="paid-badge">✓ 지급됨</span>`:'')}</div>${s.photo?`<img class="sc-photo" src="${esc(s.photo)}">`:''}${s.note?`<div class="sc-note">${esc(s.note)}</div>`:''}</div>`).join(''):'<div class="empty" style="padding:26px 20px">아직 인증이 없어요.</div>'
  const unpaid=subs.filter(s=>!s.paid).length
  cb.innerHTML=`
    <div class="chal-detail">
      <div class="chal-hero">${e.poster?`<img src="${esc(e.poster)}">`:`<span class="chal-ph">${I.image}포스터 준비 중</span>`}</div>
      <div class="pcard" style="margin-top:14px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
          <div style="min-width:0"><div class="ti" style="font-size:18px;white-space:normal">${esc(e.title)}</div><div class="su" style="margin-top:3px">${ddTxt}</div></div>
          <div class="reward">${fmt(e.reward)}<small>옥</small></div>
        </div>
        ${e.descr?`<div style="font-size:14px;line-height:1.7;color:var(--ink2);white-space:pre-wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">${esc(e.descr)}</div>`:''}
      </div>
      ${admin?'':`<div style="padding:0 18px;margin-top:14px"><button class="pbtn pri" id="ch-verify">인증하기</button></div>`}
      <div class="sec" style="margin:18px 20px 10px;display:flex;align-items:center;justify-content:space-between">
        <span>인증 <span style="color:var(--primary)">${subs.length}</span>${admin&&subs.length-unpaid>0?` · <span style="color:#16A34A;font-size:12px">지급 ${subs.length-unpaid}</span>`:''}</span>
        ${admin&&unpaid>0?`<button id="ch-payall" style="font-size:12.5px;font-weight:800;color:var(--primary);background:none">전원 지급 ›</button>`:''}
      </div>
      ${subCards}
      <div style="height:12px"></div>
    </div>`
  if(admin){
    document.getElementById('ch-del').onclick=async()=>{await Promise.allSettled([wt(sb.from('okya_event_subs').delete().eq('event_id',eid)).catch(()=>{}),wt(sb.from('okya_events').delete().eq('id',eid)).catch(()=>{})]);toast('챌린지 삭제');pop()}
    const pa=document.getElementById('ch-payall')
    if(pa)pa.onclick=async()=>{
      if(!subs.length){toast('인증한 학생이 없어요');return}
      pa.textContent='지급 중...'
      const n=await _payChalSubs(e,subs)
      toast(n+'명에게 지급 완료 🎉');rChallengeDetail(eid)
    }
    document.querySelectorAll('[data-pay]').forEach(b=>b.onclick=async()=>{
      const s=subs.find(x=>x.id===b.dataset.pay);if(!s)return
      b.textContent='지급중';b.disabled=true
      const n=await _payChalSubs(e,[s])
      toast((n||0)+'명 지급 완료 🎉');rChallengeDetail(eid)
    })
    document.querySelectorAll('[data-sdel]').forEach(b=>b.onclick=async()=>{try{await wt(sb.from('okya_event_subs').delete().eq('id',b.dataset.sdel))}catch{};rChallengeDetail(eid)})
  }else{
    document.getElementById('ch-verify').onclick=()=>push(()=>rVerify(eid))
  }
}
const BOOK_COVERS=['linear-gradient(150deg,#7B6CFF,#9C8BFF)','linear-gradient(150deg,#FF7A8A,#FFA37E)','linear-gradient(150deg,#2FB4A6,#6FE0C6)','linear-gradient(150deg,#4E7BFF,#84AAFF)','linear-gradient(150deg,#F5A623,#FFCF6B)','linear-gradient(150deg,#B06CFF,#E08BFF)','linear-gradient(150deg,#EC5F8B,#FF9AB0)','linear-gradient(150deg,#3AA0FF,#7FD0FF)']
function bookCover(b){const s=(b.title||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0);return BOOK_COVERS[s%BOOK_COVERS.length]}
function bookCoverEl(b,big){const badge=b.status==='matched'?'<span class="book-badge done">교환완료</span>':`<span class="book-badge ${b.kind==='나눔'?'give':'swap'}">${esc(b.kind||'교환')}</span>`;return`<div class="book-cover${big?' big':''}" style="${b.photo?'':`background:${bookCover(b)}`}">${b.photo?`<img src="${esc(b.photo)}">`:`<div class="bc-title">${esc(b.title||'')}</div>`}${badge}</div>`}
async function rBookPage(){
  app().innerHTML=`<div class="screen fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">책 교환</div><button id="bk-new" style="font-size:13px;font-weight:800;color:var(--primary);background:none">＋ 등록</button></div>
    ${featHero('📚','책 교환','교재를 나누고 필요한 책과 교환해요','book')}
    <div id="cb"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  document.getElementById('bk-new').onclick=()=>push(rBookNew)
  await iBook()
}
function rBookNew(){
  let photoFile=null
  app().innerHTML=`<div class="screen fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">책 등록</div><div style="width:34px"></div></div>
    <div class="chal-detail form2 tone-book">
      <div class="pcard">
        <div class="field"><label>교재명</label><input id="bt" placeholder="예: 통합사회1 (비상)"></div>
        <div style="display:flex;gap:10px"><div class="field" style="flex:1"><label>학년</label><select id="bg"><option>1학년</option><option>2학년</option><option>3학년</option></select></div><div class="field" style="flex:1"><label>구분</label><select id="bk2"><option>나눔</option><option>교환</option></select></div></div>
        <div class="field" id="want-field" style="display:none"><label>받고 싶은 책</label><input id="bwant" placeholder="예: 통합사회2 (미래엔)"><p style="font-size:11.5px;color:var(--sub);margin:6px 2px 0">교환으로 받고 싶은 교재를 적어주세요.</p></div>
        <div class="field" style="margin-bottom:0"><label>책 표지 사진 (선택)</label><label for="bf" class="upload book-up" id="bfl">${I.image}<span>사진 추가하기</span></label><input id="bf" type="file" accept="image/*" style="display:none"></div>
      </div>
      <div style="padding:0 18px"><button class="pbtn pri" id="badd" style="margin:4px auto 0;max-width:240px">등록하기</button><p style="font-size:12px;color:var(--sub);margin:12px 2px 0;text-align:center">사진이 없으면 표지가 자동 생성돼요.</p></div>
    </div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  document.getElementById('bf').onchange=e2=>{const f=e2.target.files[0];if(f){photoFile=f;const l=document.getElementById('bfl');l.classList.add('has');l.innerHTML=`<img src="${URL.createObjectURL(f)}">`}}
  document.getElementById('bk2').onchange=e2=>{document.getElementById('want-field').style.display=e2.target.value==='교환'?'':'none'}
  document.getElementById('badd').onclick=async()=>{
    const title=document.getElementById('bt').value.trim();if(!title){toast('교재명을 입력해줘');return}
    const kind=document.getElementById('bk2').value
    const want=kind==='교환'?document.getElementById('bwant').value.trim():null
    if(kind==='교환'&&!want){toast('받고 싶은 책을 적어줘');return}
    const btn=document.getElementById('badd');btn.disabled=true;btn.textContent='등록 중...'
    let photo=null
    if(photoFile){toast('사진 업로드 중...');photo=await uploadImg(photoFile,'book');if(!photo){btn.disabled=false;btn.textContent='등록하기';return}}
    const row={id:uid('b'),title,grade:document.getElementById('bg').value,kind,want,photo,owner:SESSION.id,owner_name:SESSION.name,status:'open',applicants:[],comments:[],at:nowISO()}
    let{error}=await wt(sb.from('okya_books').insert(row)).catch(e=>({error:e}))
    // 스키마에 없는 컬럼이 있으면 해당 컬럼만 빼고 재시도(최대 4회) — 예: photo/want 컬럼 미존재 대응
    for(let i=0;error&&i<4;i++){
      const col=(error.message||'').match(/'([^']+)' column/)?.[1]
      if(!col||!(col in row))break
      delete row[col]
      ;({error}=await wt(sb.from('okya_books').insert(row)).catch(e=>({error:e})))
    }
    if(error){toast('등록 실패 · '+(error.message||'okya_books 컬럼 확인'));btn.disabled=false;btn.textContent='등록하기';return}
    notifyStudents('book',`새 ${kind} 책`,`'${title}' 책이 올라왔어요`)
    popMsg('책이 등록됐어요','📚');pop()
  }
}
const PET_CATS=['교실','기숙사','급식','체육관','학교 시스템','기타']
const PET_PHASES=['청원진행','회의 회부','심사중']
const PET_GOAL=100  // 기본 목표(청원별 goal 미설정 시)
function petGoal(p){const g=+((p||{}).goal);return g>0?g:PET_GOAL}
function petAgrees(p){return Object.keys(p.reacts||{}).length}
// 청원 상태(데이터에서 파생): 검토중→동의 진행중→마감 임박→목표 달성/마감→답변 완료
function petStatus(p){
  const agrees=petAgrees(p),goal=petGoal(p),left=petDaysLeft(p)
  if(p.status==='pending')return{label:'검토중',tone:'review'}
  if(p.answer)return{label:'답변 완료',tone:'done'}
  if(agrees>=goal)return{label:'목표 달성',tone:'success'}
  if(left<0)return{label:'마감',tone:'closed'}
  if(left<=3)return{label:'마감 임박',tone:'urgent'}
  return{label:'동의 진행중',tone:'active'}
}
// 청원 생애주기 단계 인덱스(제출·검토·공개·동의 진행·종료·결과)
const PET_LIFE=['제출','검토','공개','동의 진행','종료','결과']
function petStage(p){
  const agrees=petAgrees(p),goal=petGoal(p),left=petDaysLeft(p)
  if(p.status==='pending')return 1
  if(p.answer)return 5
  if(agrees>=goal||left<0)return 4
  return 3
}
function petStart(p){return p.approved_at||p.at}
function petDeadline(p){const d=new Date(petStart(p));d.setDate(d.getDate()+30);return d}
function petDaysLeft(p){return Math.ceil((petDeadline(p)-new Date())/86400000)}
async function rPetitionPage(){
  app().innerHTML=`<div class="screen fade-in p3 pet2">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">청원</div><button id="pet-new2" style="font-size:13px;font-weight:800;color:var(--primary);background:none">＋ 작성</button></div>
    ${featHero('📢','청원',null,'peti')}
    <div id="cb"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  document.getElementById('pet-new2').onclick=()=>push(rPetitionNew)
  await iPetition()
}
// 청원 작성 위저드: ①기본 정보 → ②청원 작성 → ③미리보기·제출 (단계별 검증)
function rPetitionNew(){
  const data={title:'',cat:PET_CATS[0],goal:100,purpose:'',content:''}
  const STEPS=['기본 정보','청원 작성','미리보기']
  let step=0
  const render=()=>{
    app().innerHTML=`<div class="screen fade-in p3">
      <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">청원 올리기</div><div style="width:34px"></div></div>
      <div class="pw-steps">${STEPS.map((s,i)=>`<div class="pw-step${i===step?' on':''}${i<step?' done':''}"><span class="pw-num">${i<step?'✓':i+1}</span><span class="pw-l">${s}</span></div>`).join('<span class="pw-line"></span>')}</div>
      <div class="chal-detail" id="pw-body"></div>
    </div>${bnav()}`
    bindNav()
    document.getElementById('bk').onclick=()=>{if(step>0){step--;render()}else pop()}
    const body=document.getElementById('pw-body')
    if(step===0){
      body.innerHTML=`<div class="pcard">
        <div class="field" id="f-title"><label>청원 제목 <span class="req">*</span></label><input id="pn-title" placeholder="예: 급식에 디저트를 늘려주세요" value="${esc(data.title)}"><p class="field-help err" id="e-title" style="display:none">제목을 입력해줘</p></div>
        <div class="field"><label>청원 분야</label><div class="pet-catsel" id="pn-cats">${PET_CATS.map(c=>`<button type="button" class="pet-chip${c===data.cat?' on':''}" data-cat="${c}">${c}</button>`).join('')}</div></div>
        <div class="field" style="margin-bottom:0"><label>목표 참여 수</label>
          <div class="pet-goalsel" id="pn-goalsel">${[50,100,200,300].map(g=>`<button type="button" class="pet-chip${g===data.goal?' on':''}" data-goal="${g}">${g}명</button>`).join('')}</div>
          <input id="pn-goal" type="number" inputmode="numeric" min="1" value="${data.goal}" placeholder="직접 입력" style="margin-top:9px">
          <p style="font-size:11.5px;color:var(--sub);margin:6px 2px 0">이 인원이 동의하면 목표 달성이에요.</p></div>
      </div>
      <div style="padding:0 18px"><button class="pbtn pri" id="pw-next">다음</button></div>`
      document.querySelectorAll('#pn-cats .pet-chip').forEach(b=>b.onclick=()=>{data.cat=b.dataset.cat;document.querySelectorAll('#pn-cats .pet-chip').forEach(x=>x.classList.toggle('on',x===b))})
      const gi=document.getElementById('pn-goal')
      document.querySelectorAll('#pn-goalsel .pet-chip').forEach(b=>b.onclick=()=>{gi.value=b.dataset.goal;data.goal=+b.dataset.goal;document.querySelectorAll('#pn-goalsel .pet-chip').forEach(x=>x.classList.toggle('on',x===b))})
      gi.oninput=()=>{data.goal=Math.max(1,parseInt(gi.value,10)||100);document.querySelectorAll('#pn-goalsel .pet-chip').forEach(x=>x.classList.toggle('on',x.dataset.goal===gi.value))}
      document.getElementById('pn-title').oninput=e=>{data.title=e.target.value;if(e.target.value.trim()){document.getElementById('f-title').classList.remove('has-error');document.getElementById('e-title').style.display='none'}}
      document.getElementById('pw-next').onclick=()=>{
        data.title=document.getElementById('pn-title').value.trim()
        if(!data.title){document.getElementById('f-title').classList.add('has-error');document.getElementById('e-title').style.display='block';return}
        step=1;render()
      }
    }else if(step===1){
      body.innerHTML=`<div class="pcard">
        <div class="field"><label>청원의 취지</label><textarea id="pn-purpose" rows="3" placeholder="무엇을 바꾸고 싶은지 한 줄로 적어주세요" style="resize:none">${esc(data.purpose)}</textarea></div>
        <div class="field" id="f-content" style="margin-bottom:0"><label>청원의 내용 <span class="req">*</span></label><textarea id="pn-content" rows="7" placeholder="구체적인 이유와 내용을 자유롭게 작성해주세요" style="resize:none">${esc(data.content)}</textarea><p class="field-help err" id="e-content" style="display:none">내용을 입력해줘</p></div>
      </div>
      <div style="padding:0 18px;display:flex;gap:10px"><button class="pbtn out" id="pw-back" style="flex:1">이전</button><button class="pbtn pri" id="pw-next" style="flex:2">미리보기</button></div>`
      document.getElementById('pn-content').oninput=e=>{data.content=e.target.value;if(e.target.value.trim()){document.getElementById('f-content').classList.remove('has-error');document.getElementById('e-content').style.display='none'}}
      const save=()=>{data.purpose=document.getElementById('pn-purpose').value;data.content=document.getElementById('pn-content').value}
      document.getElementById('pw-back').onclick=()=>{save();step=0;render()}
      document.getElementById('pw-next').onclick=()=>{
        save();data.purpose=data.purpose.trim();data.content=data.content.trim()
        if(!data.content){document.getElementById('f-content').classList.add('has-error');document.getElementById('e-content').style.display='block';return}
        step=2;render()
      }
    }else{
      body.innerHTML=`<div class="pcard pet-sheet">
        <div class="pet-title-row"><span class="pet-doc">${I.petition}</span><div class="pet-d-title">${esc(data.title)}</div></div>
        <div class="pet-row"><div class="k">청원분야</div><div class="v"><span class="pet-cat">${esc(data.cat)}</span></div></div>
        <div class="pet-row"><div class="k">목표 참여</div><div class="v" style="font-weight:800">${fmt(data.goal)}명</div></div>
        <div class="pet-row col"><div class="k">청원의 취지</div><div class="v pet-body">${esc(data.purpose||'-')}</div></div>
        <div class="pet-row col"><div class="k">청원의 내용</div><div class="v pet-body">${esc(data.content||'-')}</div></div>
      </div>
      <div style="padding:0 18px"><p style="font-size:12px;color:var(--sub);margin:0 2px 12px;text-align:center">익명으로 접수되며, 학생회 검토 후 공개됩니다.</p><div style="display:flex;gap:10px"><button class="pbtn out" id="pw-back" style="flex:1">이전</button><button class="pbtn pri" id="pn-sub" style="flex:2">청원 제출</button></div></div>`
      document.getElementById('pw-back').onclick=()=>{step=1;render()}
      document.getElementById('pn-sub').onclick=async()=>{
        const btn=document.getElementById('pn-sub');btn.disabled=true;btn.textContent='제출 중...'
        const row={id:uid('p'),title:data.title,category:data.cat,purpose:data.purpose,content:data.content,txt:data.title,status:'pending',phase:'청원진행',goal:data.goal,by_id:SESSION.id,at:nowISO(),reacts:{}}
        let{error}=await wt(sb.from('okya_petitions').insert(row)).catch(e=>({error:e}))
        // 스키마에 없는 컬럼이 있으면 해당 컬럼만 빼고 재시도(최대 5회) — 책 등록과 동일한 방어책
        for(let i=0;error&&i<5;i++){
          const col=(error.message||'').match(/'([^']+)' column/)?.[1]
          if(!col||!(col in row))break
          delete row[col]
          ;({error}=await wt(sb.from('okya_petitions').insert(row)).catch(e=>({error:e})))
        }
        if(error){toast('제출 실패 · '+(error.message||'okya_petitions 컬럼 확인'));btn.disabled=false;btn.textContent='청원 제출';return}
        notifyAdmins('petition','새 청원 검토 요청',`익명 청원 '${data.title}'이 접수됐어요`)
        popMsg('청원이 접수됐어요 · 검토 후 공개','📝');pop()
      }
    }
  }
  render()
}
async function rPetitionDetail(pid){
  const admin=SESSION.role==='admin'
  app().innerHTML=`<div class="screen fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">청원</div>${admin?`<button id="pd-del" style="font-size:12px;font-weight:700;color:var(--danger);background:none">삭제</button>`:'<div style="width:34px"></div>'}</div><div id="cb"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div></div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  let p=null
  try{const r=await wt(sb.from('okya_petitions').select('*').eq('id',pid).single());p=r.data}catch{}
  const cb=document.getElementById('cb');if(!cb)return
  if(!p){cb.innerHTML='<div class="empty">청원을 찾을 수 없어요.</div>';return}
  const agrees=petAgrees(p),mine=(p.reacts||{})[SESSION.id]
  const start=petStart(p),dl=petDeadline(p),left=petDaysLeft(p)
  const phase=p.phase||'청원진행',curIdx=PET_PHASES.indexOf(phase)
  const goal=petGoal(p),pct=Math.min(100,Math.round(agrees/goal*100))
  const st=petStatus(p),stage=petStage(p)
  // 생애주기 스테퍼(데이터 파생): 제출→검토→공개→동의 진행→종료→결과
  const stepper=`<div class="pet-steps">${PET_LIFE.map((s,i)=>`<div class="pet-step${i<=stage?' done':''}${i===stage?' cur':''}"><div class="pet-step-dot">${i<stage?'✓':i+1}</div><div class="pet-step-l">${s}</div></div>`).join('<div class="pet-step-line"></div>')}</div>`
  const adminPanel=admin?`<div class="pcard"><div class="sec">학생회 · 진행단계 변경</div><div class="pet-phasebtns">${PET_PHASES.map(ph=>`<button class="pet-chip${ph===phase?' on':''}" data-phase="${ph}">${ph}</button>`).join('')}</div>
      <div class="sec" style="margin-top:18px">학생회 답변</div>
      <textarea id="pd-answer" rows="3" placeholder="이 청원에 대한 학생회 답변을 남겨주세요" style="resize:none">${esc(p.answer||'')}</textarea>
      <button class="minibtn soft" id="pd-answer-save" style="margin-top:9px">답변 저장</button></div>`:''
  const resultCard=p.answer
    ?`<div class="pcard pet-answer"><div class="pet-ans-head">💬 학생회 답변 · 처리 결과</div><div class="pet-ans-body">${esc(p.answer)}</div></div>`
    :(stage>=4?`<div class="pcard"><div class="sec">처리 결과</div><div class="pet-result-empty">아직 처리 결과가 등록되지 않았어요.</div></div>`:'')
  cb.innerHTML=`<div class="chal-detail">
    <div class="pet-status-row"><span class="pet-badge lg st-${st.tone}">${st.label}</span><span class="pet-status-dday">${left>=0?'D-'+left:'마감됨'}</span></div>
    <div class="pcard pet-sheet">
      <div class="pet-title-row"><span class="pet-doc">${I.petition}</span><div class="pet-d-title">${esc(p.title||p.txt||'제목 없음')}</div></div>
      ${stepper}
      <div class="pet-row"><div class="k">청원분야</div><div class="v"><span class="pet-cat">${esc(p.category||'기타')}</span></div></div>
      <div class="pet-row"><div class="k">진행단계</div><div class="v" style="font-weight:800;color:var(--primary)">${esc(phase)}</div></div>
      <div class="pet-row"><div class="k">동의기간</div><div class="v">${fmtDate(start)} ~ ${fmtDate(dl)}<div class="pet-note">청원 공개 이후 30일 이내 · ${left>=0?left+'일 남음':'마감됨'}</div></div></div>
      <div class="pet-row"><div class="k">동의수</div><div class="v"><div class="pet-agree-line"><span class="pet-agree-big">${fmt(agrees)}명</span><span class="pet-pct">${pct}%</span></div><div class="pet-prog"><i style="width:${pct}%"></i></div><div class="pet-note">목표 ${fmt(goal)}명</div></div></div>
      <div class="pet-row"><div class="k">청원인</div><div class="v" style="display:flex;align-items:center;gap:9px"><span id="pet-author">익명</span>${admin?`<button class="minibtn out" id="pd-reveal" style="padding:4px 10px;font-size:11.5px">🔒 확인</button>`:''}</div></div>
      <div class="pet-row col"><div class="k">청원의 취지</div><div class="v pet-body">${esc(p.purpose||'-')}</div></div>
      <div class="pet-row col"><div class="k">청원의 내용</div><div class="v pet-body">${esc(p.content||p.txt||'-')}</div></div>
    </div>
    ${resultCard}
    ${adminPanel}
    <div class="pet-cta"><button class="pbtn pri pet-agree-btn${mine?' agreed':''}" id="pd-agree">${mine?'✓ 동의 완료':left<0?'동의 기간 마감':'동의하기'}</button>
      <button class="pbtn out" id="pd-share" style="margin-top:10px">청원 공유하기</button></div>
    <div style="height:10px"></div>
  </div>`
  const shareBtn=document.getElementById('pd-share');if(shareBtn)shareBtn.onclick=async()=>{
    const txt=`[옥야 청원] ${p.title||p.txt||'청원'}\n현재 ${fmt(agrees)}명 참여 (목표 ${fmt(goal)}명)\n옥야 앱에서 동의해주세요!`
    try{if(navigator.share){await navigator.share({title:'옥야 청원',text:txt})}else{await navigator.clipboard.writeText(txt);toast('청원 내용을 복사했어요','success')}}catch{}
  }
  document.getElementById('pd-agree').onclick=async()=>{
    if(left<0){toast('동의 기간이 마감되었어요');return}
    let reacts={}
    try{const r=await wt(sb.from('okya_petitions').select('reacts').eq('id',pid).single());reacts={...(r.data?.reacts||{})}}catch{}
    if(reacts[SESSION.id])delete reacts[SESSION.id];else reacts[SESSION.id]=1
    try{await wt(sb.from('okya_petitions').update({reacts}).eq('id',pid))}catch{}
    rPetitionDetail(pid)
  }
  if(admin){
    document.getElementById('pd-del').onclick=async()=>{try{await wt(sb.from('okya_petitions').delete().eq('id',pid))}catch{};toast('청원 삭제');pop()}
    document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=async()=>{try{await wt(sb.from('okya_petitions').update({phase:b.dataset.phase}).eq('id',pid))}catch{};rPetitionDetail(pid)})
    document.getElementById('pd-answer-save').onclick=async()=>{
      const val=document.getElementById('pd-answer').value.trim()
      const{error}=await wt(sb.from('okya_petitions').update({answer:val}).eq('id',pid)).catch(e=>({error:e}))
      if(error){toast('저장 실패 · okya_petitions에 answer 열이 필요해요','error');return}
      if(val)notifyStudents('petition','청원 답변 등록',`'${p.title||p.txt||'청원'}'에 학생회 답변이 달렸어요`)
      popMsg('답변 저장됨','💬');rPetitionDetail(pid)
    }
    let rstep=0
    const rb=document.getElementById('pd-reveal')
    rb.onclick=()=>{
      if(rstep===0){rstep=1;rb.textContent='🔓 한 번 더';rb.classList.remove('out');rb.classList.add('danger');return}
      const u=USERS.find(x=>x.id===p.by_id)
      const au=document.getElementById('pet-author');if(au){au.textContent=(u?u.name:(p.by_id||'알 수 없음'));au.style.fontWeight='800';au.style.color='var(--ink)'}
      rb.style.display='none'
    }
  }
}
async function rBoardPage(){_cbPage('게시판');await rBoard()}

// 익명 자유게시판 (DC 느낌)
async function rBoard(){
  const admin=SESSION.role==='admin'
  let posts=[]
  try{const r=await wt(sb.from('okya_board').select('*').order('at',{ascending:false}));posts=r.data||[]}catch{}
  const list=posts.length?posts.map(p=>{
    const ups=Object.keys(p.ups||{}).length,mine=(p.ups||{})[SESSION.id]
    const canDel=admin||p.by_id===SESSION.id
    return`<div class="post"><div class="pmeta"><span class="pnick">${esc(p.nick||'ㅇㅇ')}</span><span>·</span><span>${timeago(p.at)}</span></div><div class="pbody">${esc(p.body)}</div><div class="pfoot"><button class="upbtn${mine?' on':''}" data-up="${p.id}">▲ 추천 ${ups}</button>${canDel?`<button class="upbtn" data-bdel="${p.id}">삭제</button>`:''}</div></div>`
  }).join(''):'<div class="empty">아직 글이 없어요. 첫 글을 남겨보세요.</div>'
  document.getElementById('cb').innerHTML=`
    <div class="pcard"><div class="sec">글쓰기 <span style="font-size:12px;font-weight:600;color:var(--sub)">· 익명</span></div>
      <div class="field"><input id="bd-nick" maxlength="12" placeholder="닉네임 (선택 · 기본 ㅇㅇ)"></div>
      <div class="field" style="margin-bottom:0"><textarea id="bd-body" rows="3" placeholder="자유롭게 남겨보세요" style="resize:none"></textarea></div>
      <button class="pbtn pri" id="bd-sub" style="margin-top:12px">등록</button>
    </div>
    <div class="pcard">${list}</div>
    <div style="height:8px"></div>`
  document.getElementById('bd-sub').onclick=async()=>{
    const body=document.getElementById('bd-body').value.trim();if(!body){toast('내용을 입력해줘');return}
    const nick=document.getElementById('bd-nick').value.trim()||'ㅇㅇ'
    try{await wt(sb.from('okya_board').insert({id:uid('bd'),nick,body,by_id:SESSION.id,ups:{},at:nowISO()}))}catch{toast('등록 실패 · okya_board 테이블이 필요해요');return}
    rBoard()
  }
  document.querySelectorAll('[data-up]').forEach(b=>b.onclick=async()=>{const id=b.dataset.up;try{const r=await wt(sb.from('okya_board').select('ups').eq('id',id).single());const ups={...(r.data?.ups||{})};if(ups[SESSION.id])delete ups[SESSION.id];else ups[SESSION.id]=1;await wt(sb.from('okya_board').update({ups}).eq('id',id))}catch{};rBoard()})
  document.querySelectorAll('[data-bdel]').forEach(b=>b.onclick=async()=>{try{await wt(sb.from('okya_board').delete().eq('id',b.dataset.bdel))}catch{};toast('삭제');rBoard()})
}

async function iChallenge(){
  const admin=SESSION.role==='admin'
  let evs=[],subs=[]
  try{const r=await wt(sb.from('okya_events').select('*').order('at',{ascending:false}));evs=r.data||[]}catch{}
  const expired=evs.filter(isExpired)
  if(expired.length){
    await Promise.allSettled(expired.flatMap(e=>[wt(sb.from('okya_events').delete().eq('id',e.id)).catch(()=>{}),wt(sb.from('okya_event_subs').delete().eq('event_id',e.id)).catch(()=>{})]))
    evs=evs.filter(e=>!isExpired(e))
  }
  try{const r=await wt(sb.from('okya_event_subs').select('id,event_id'));subs=r.data||[]}catch{}
  function ddTag(dl){if(!dl)return'';const d=Math.ceil((new Date(dl)-new Date())/86400000);const red=d<=1;return`<span style="font-size:11px;font-weight:700;color:${red?'var(--danger)':'var(--muted)'};background:${red?'#FEF0F1':'var(--line)'};padding:2px 7px;border-radius:6px">${red?'D-day':'D-'+d}</span>`}
  const cards=evs.length?evs.map(e=>{const cnt=subs.filter(s=>s.event_id===e.id).length;return`<div class="pcard"><div style="display:flex;gap:10px;align-items:flex-start"><div class="chip ti-org">${I.star}</div><div style="flex:1;min-width:0"><div class="ti" style="font-size:15px;white-space:normal">${esc(e.title)}</div>${e.descr?`<div class="su" style="font-size:13px;line-height:1.5;white-space:normal;margin-top:3px">${esc(e.descr)}</div>`:''}${e.deadline?`<div style="margin-top:6px;display:flex;align-items:center;gap:6px"><span class="tag off" style="padding:3px 9px;font-size:11px">~${fmtDate(e.deadline)}</span>${ddTag(e.deadline)}</div>`:''}</div><div class="reward">${fmt(e.reward)}<small>옥</small></div></div><div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid var(--line)"><button class="minibtn soft" data-gallery="${e.id}">🔥 ${cnt}명 참여</button>${admin?`<button class="minibtn danger" data-cancel="${e.id}">취소</button>`:`<button class="minibtn out" data-verify="${e.id}">인증하기</button>`}</div></div>`}).join(''):emptyHTML({icon:'⭐',title:'진행 중인 챌린지가 없어요',desc:admin?'아래에서 새 챌린지를 만들어보세요.':'곧 새로운 챌린지가 올라와요.'})
  const aform=admin?`<div class="pcard"><div class="sec">새 챌린지 만들기</div><div class="field"><label>제목</label><input id="et" placeholder="예: 등교 스트레칭 챌린지"></div><div style="display:flex;gap:10px"><div class="field" style="flex:1"><label>보상(옥)</label><input id="er" type="number" placeholder="100"></div><div class="field" style="flex:1"><label>마감일</label><input id="edd" type="date"></div></div><div class="field" style="margin-bottom:0"><label>설명</label><input id="edesc" placeholder="간단 설명"></div><button class="pbtn pri" id="eadd" style="margin-top:12px">등록</button></div>`:''
  document.getElementById('cb').innerHTML=`${aform}${cards}<div style="height:8px"></div>`
  const add=document.getElementById('eadd')
  if(add)add.onclick=async()=>{
    const title=document.getElementById('et').value.trim();if(!title){toast('제목을 입력해줘');return}
    try{await wt(sb.from('okya_events').insert({id:uid('e'),title,reward:parseInt(document.getElementById('er').value,10)||0,descr:document.getElementById('edesc').value.trim(),deadline:document.getElementById('edd').value?new Date(document.getElementById('edd').value+'T23:59:59').toISOString():null,at:nowISO()}))}catch{toast('등록 실패');return}
    iChallenge()
  }
  document.querySelectorAll('[data-verify]').forEach(b=>b.onclick=()=>push(()=>rVerify(b.dataset.verify)))
  document.querySelectorAll('[data-gallery]').forEach(b=>b.onclick=()=>push(()=>rGallery(b.dataset.gallery)))
  document.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=async()=>{
    await Promise.allSettled([wt(sb.from('okya_event_subs').delete().eq('event_id',b.dataset.cancel)).catch(()=>{}),wt(sb.from('okya_events').delete().eq('id',b.dataset.cancel)).catch(()=>{})])
    toast('챌린지 취소');iChallenge()
  })
}

async function rVerify(eid){
  let e=null
  try{const r=await wt(sb.from('okya_events').select('*').eq('id',eid).single());e=r.data}catch{}
  if(!e){toast('챌린지를 찾을 수 없어요');return}
  app().innerHTML=`<div class="screen fade-in p3">
    <div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">챌린지 인증</div><div style="width:34px"></div></div>
    <div class="chal-detail form2 tone-chal">
    <div class="pcard"><div style="display:flex;gap:10px;align-items:center"><div class="chip ti-org">${I.star}</div><div style="flex:1"><div class="ti">${esc(e.title)}</div><div class="su">보상 ${fmt(e.reward)}옥 · ${fmtDate(e.deadline)}</div></div></div></div>
    <div class="pcard">
      <div class="field"><label>참여 학생 이름</label><input id="vn" placeholder="예: 박은찬, 김옥야"></div>
      <div class="field"><label>인증 사진</label>
        <label for="vf" class="upload" id="vfl">${I.image}<span>사진 추가하기</span></label>
        <input id="vf" type="file" accept="image/*" style="display:none">
      </div>
      <div class="field" style="margin-bottom:0"><label>한마디 (선택)</label><textarea id="vnote" rows="3" placeholder="인증에 대한 설명을 적어주세요"></textarea></div>
      <button class="pbtn pri" id="vsub" style="margin-top:14px">인증 제출</button>
      <p style="font-size:12px;color:var(--sub);margin-top:12px;text-align:center">학생회가 확인하고 옥야머니를 지급해요.</p>
    </div>
    </div>
  </div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  document.getElementById('vf').onchange=e2=>{const f=e2.target.files[0];if(f){const l=document.getElementById('vfl');l.classList.add('has');l.innerHTML=`<img src="${URL.createObjectURL(f)}">`}}
  document.getElementById('vsub').onclick=async()=>{
    const names=document.getElementById('vn').value.trim()
    const note=document.getElementById('vnote').value.trim()
    const f=document.getElementById('vf').files[0];let photo=null
    if(f){toast('사진 업로드 중...');photo=await uploadImg(f,'challenge');if(!photo)return}
    try{await wt(sb.from('okya_event_subs').insert({id:uid('s'),event_id:eid,by_id:SESSION.id,by_name:SESSION.name,names,note,photo,paid:false,at:nowISO()}),12000)}catch{toast('제출 실패');return}
    popMsg('인증 제출 완료','✅');pop()
  }
}

async function rGallery(eid){
  app().innerHTML=`<div class="screen no-nav fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">인증 사진</div><div style="width:34px"></div></div><div class="loader" style="min-height:160px"><div class="spin"></div></div></div>`
  document.getElementById('bk').onclick=pop
  const admin=SESSION.role==='admin'
  let subs=[],ev=null
  try{const[r1,r2]=await Promise.allSettled([wt(sb.from('okya_event_subs').select('*').eq('event_id',eid).order('at',{ascending:false})),wt(sb.from('okya_events').select('title,reward').eq('id',eid).single())]);subs=r1.status==='fulfilled'?(r1.value.data||[]):[];ev=r2.status==='fulfilled'?r2.value.data:null}catch{}
  const title=ev?ev.title:'인증 사진'
  const cards=subs.length?subs.map(s=>{const reacts=s.reactions||{};const hearts=Object.values(reacts).filter(v=>v==='heart').length;const tears=Object.values(reacts).filter(v=>v==='tear').length;const my=reacts[SESSION.id];return`<div class="pcard"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px"><div><div class="ti">${esc(s.names||s.by_name)}</div><div class="su">${fmtDate(s.at)}</div></div>${admin?`<button class="minibtn soft" data-award="${s.id}">지급</button>`:''}</div>${s.photo?`<img src="${s.photo}" style="width:100%;border-radius:14px;display:block">`:''}<div class="reacts" style="margin-top:10px"><button class="react-btn${my==='heart'?' on-r':''}" data-pr="${s.id}::heart">❤️ ${hearts}</button><button class="react-btn${my==='tear'?' on-b':''}" data-pr="${s.id}::tear">😢 ${tears}</button></div></div>`}).join(''):'<div class="empty">아직 인증 사진이 없어요.</div>'
  app().innerHTML=`<div class="screen no-nav fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">${esc(title)}</div><div style="width:34px"></div></div>${cards}<div style="height:12px"></div></div>`
  document.getElementById('bk').onclick=pop
  document.querySelectorAll('[data-pr]').forEach(b=>b.onclick=async()=>{
    const[id,t]=b.dataset.pr.split('::');let reacts={}
    try{const r=await wt(sb.from('okya_event_subs').select('reactions').eq('id',id).single());reacts={...(r.data?.reactions||{})}}catch{}
    if(reacts[SESSION.id]===t)delete reacts[SESSION.id];else reacts[SESSION.id]=t
    try{await wt(sb.from('okya_event_subs').update({reactions:reacts}).eq('id',id))}catch{}
    rGallery(eid)
  })
  if(admin)document.querySelectorAll('[data-award]').forEach(b=>b.onclick=()=>push(()=>rAward(b.dataset.award)))
}

async function rAward(subId){
  let s=null,ev=null
  try{const[r1,r2]=await Promise.allSettled([wt(sb.from('okya_event_subs').select('*').eq('id',subId).single()),wt(sb.from('okya_events').select('*'))]);s=r1.status==='fulfilled'?r1.value.data:null;if(s&&r2.status==='fulfilled')ev=(r2.value.data||[]).find(e=>e.id===s.event_id)}catch{}
  if(!s){pop();return}
  ev=ev||{reward:0,title:''}
  const students=USERS.filter(u=>u.role!=='admin')
  app().innerHTML=`<div class="screen no-nav fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">옥야머니 지급</div><div style="width:34px"></div></div><div class="pcard"><div style="display:flex;gap:10px;align-items:center"><div class="chip ti-org">${I.star}</div><div style="flex:1"><div class="ti">${esc(ev.title)}</div><div class="su">보상 ${fmt(ev.reward)}옥 · 제출자 ${esc(s.names||'-')}</div></div></div>${s.photo?`<img src="${s.photo}" style="width:100%;border-radius:14px;display:block;margin-top:12px">`:''}</div><div class="pcard"><div class="sec">지급할 학생 선택</div><div style="display:flex;flex-direction:column;gap:8px">${students.map(u=>`<label class="check-item"><input type="checkbox" value="${u.id}" ${u.id===s.by_id?'checked':''}>${esc(u.name)}</label>`).join('')}</div><button class="pbtn pri" id="pay" style="margin-top:14px">${fmt(ev.reward)}옥 지급</button></div></div>`
  document.getElementById('bk').onclick=pop
  document.getElementById('pay').onclick=async()=>{
    const ids=[...document.querySelectorAll('.check-item input:checked')].map(i=>i.value)
    if(!ids.length){toast('지급할 학생을 선택해줘');return}
    for(const id of ids)await addTx({from:'u_council',to:id,amount:ev.reward,type:'발행',reason:'['+ev.title+'] 인증'})
    try{await wt(sb.from('okya_event_subs').delete().eq('id',subId))}catch{}
    toast(ids.length+'명 지급 완료');pop();pop()
  }
}

async function iBook(){
  let books=[]
  try{const r=await wt(sb.from('okya_books').select('*').order('at',{ascending:false}));books=r.data||[]}catch{}
  const cb=document.getElementById('cb');if(!cb)return
  // 신청되면 남들 화면에선 내려감(중복 신청 방지). 주인·신청자에게만 보임
  const visible=books.filter(b=>{
    if(b.owner===SESSION.id)return true
    if((b.applicants||[]).some(a=>a.id===SESSION.id))return true
    if(b.status==='matched')return false
    return (b.applicants||[]).length===0
  })
  const help=`<div class="book-help">📚 <b>이용 방법</b> · ＋ 로 책을 등록하고, 카드를 눌러 <b>나눔/교환 신청</b>하세요. 신청하면 그 책은 다른 사람 화면에서 내려가고, <b>취소하면 다시 올라와요.</b> 댓글은 <b>책 주인과 작성자만</b> 볼 수 있어요.</div>`
  const addTile=`<button class="bmk-add" id="book-add">＋ 책 등록하기</button>`
  const items=visible.map(b=>{
    const st=b.status==='matched'?`<span class="book-kind grade">확정</span>`:''
    const want=b.kind==='교환'&&b.want?`<span class="bmk-want">🔁 <b>${esc(b.want)}</b></span>`:''
    return`<div class="bmk-card" data-open="${b.id}">
      <div class="bmk-thumb" style="${b.photo?'':'background:'+bookCover(b)}">${b.photo?`<img src="${esc(b.photo)}">`:`<span>${esc((b.title||'책').slice(0,8))}</span>`}</div>
      <div class="bmk-info"><div class="bmk-title">${esc(b.title)}</div><div class="bmk-sub">${esc(b.grade||'')} · ${esc(b.owner_name||'')} · ${timeago(b.at)}</div><div class="bmk-tags"><span class="book-kind ${b.kind==='나눔'?'give':'swap'}">${esc(b.kind||'교환')}</span>${st}${want}</div></div>
      <span class="bmk-chev">${I.chev}</span>
    </div>`
  }).join('')
  const listBody=visible.length?items:emptyHTML({icon:'📚',title:'아직 등록된 책이 없어요',desc:'필요 없는 교재를 나눔하거나 교환해보세요.'})
  cb.innerHTML=`${help}<div class="bmk-list">${addTile}${listBody}</div><div style="height:16px"></div>`
  document.getElementById('book-add').onclick=()=>push(rBookNew)
  cb.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>push(()=>rBookDetail(el.dataset.open)))
}
async function rBookDetail(id){
  app().innerHTML=`<div class="screen fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">책 교환</div><div style="width:34px"></div></div><div id="cb"><div class="loader" style="min-height:200px"><div class="spin"></div></div></div></div>${bnav()}`
  bindNav()
  document.getElementById('bk').onclick=pop
  let b=null
  try{const r=await wt(sb.from('okya_books').select('*').eq('id',id).single());b=r.data}catch{}
  const cb=document.getElementById('cb');if(!cb)return
  if(!b){cb.innerHTML='<div class="empty">책을 찾을 수 없어요.</div>';return}
  const mine=b.owner===SESSION.id,applied=(b.applicants||[]).some(a=>a.id===SESSION.id),cs=b.comments||[]
  let act=''
  if(b.status==='open'){
    if(mine)act=(b.applicants&&b.applicants.length)?`<button class="pbtn pri" id="bd-confirm">신청자 확정하기 (${b.applicants.length})</button>`:`<button class="pbtn" id="bd-wait" disabled style="background:var(--soft);color:var(--sub)">신청 대기중</button>`
    else act=applied?`<button class="pbtn" id="bd-unapply" style="background:var(--primary-tint);color:var(--primary)">신청 취소</button>`:`<button class="pbtn pri" id="bd-apply">${b.kind==='나눔'?'나눔 신청하기':'교환 신청하기'}</button>`
  }else if(b.status==='matched'){
    if(b.recipient===SESSION.id)act=`<button class="pbtn pri" id="bd-complete">교환 완료</button>`
    else act=`<div class="empty" style="padding:14px">${esc(b.recipient_name)}님과 교환 확정됨</div>`
  }
  const apps=(mine&&b.status==='open'&&b.applicants?.length)?`<div class="pet-note" style="margin-top:8px">신청: ${b.applicants.map(a=>esc(a.name)).join(', ')}</div>`:''
  // 댓글은 책 주인 또는 그 댓글 작성자에게만 보임
  const visCs=cs.filter(c=>mine||c.by===SESSION.id)
  const comments=visCs.length?visCs.map(c=>`<div class="bc-item"><div class="bc-head"><span class="bc-by">${esc(c.byName)}${c.by===b.owner?' · 책 주인':''}</span><span class="bc-at">${timeago(c.at)}</span></div><div class="bc-txt">${esc(c.text)}</div></div>`).join(''):'<div style="font-size:13px;color:var(--sub);padding:10px 0">아직 댓글이 없어요. 궁금한 점을 남겨보세요.</div>'
  cb.innerHTML=`<div class="chal-detail">
    <div class="book-hero">${bookCoverEl(b,true)}</div>
    <div class="pcard" style="margin-top:16px">
      <div style="display:flex;gap:7px;margin-bottom:9px"><span class="book-kind ${b.kind==='나눔'?'give':'swap'}">${esc(b.kind||'교환')}</span><span class="book-kind grade">${esc(b.grade||'')}</span></div>
      <div class="ti" style="font-size:19px;white-space:normal">${esc(b.title)}</div>
      <div class="su" style="margin-top:4px">${esc(b.owner_name)} · ${timeago(b.at)}</div>
      ${b.kind==='교환'&&b.want?`<div class="book-want">🔁 받고 싶은 책 · <b>${esc(b.want)}</b></div>`:''}
      ${apps}
      <div style="margin-top:14px">${act}</div>
    </div>
    <div class="pcard"><div class="sec">댓글 <span style="color:var(--primary)">${visCs.length}</span></div><div class="pet-note" style="margin:-4px 0 8px">🔒 책 주인과 작성자만 볼 수 있는 비공개 댓글이에요.</div>${comments}<div style="display:flex;gap:8px;margin-top:10px"><input id="bd-cinput" placeholder="댓글 입력" style="flex:1;padding:11px 13px;font-size:14px"><button class="minibtn soft" id="bd-csend">등록</button></div></div>
    <div style="height:10px"></div>
  </div>`
  const ap=document.getElementById('bd-apply');if(ap)ap.onclick=async()=>{try{const r=await wt(sb.from('okya_books').select('applicants').eq('id',id).single());const apps=[...(r.data?.applicants||[])];if(apps.length&&!apps.some(a=>a.id===SESSION.id)){toast('이미 다른 학생이 신청했어요');rBookDetail(id);return}if(!apps.some(a=>a.id===SESSION.id))apps.push({id:SESSION.id,name:SESSION.name,at:nowISO()});await wt(sb.from('okya_books').update({applicants:apps}).eq('id',id))}catch{toast('오류');return};notify(b.owner,'book',`새 ${b.kind||'교환'} 신청`,`${SESSION.name}님이 '${b.title}' 책을 신청했어요`);popMsg('신청했어요','✋');rBookDetail(id)}
  const un=document.getElementById('bd-unapply');if(un)un.onclick=async()=>{try{const r=await wt(sb.from('okya_books').select('applicants').eq('id',id).single());await wt(sb.from('okya_books').update({applicants:(r.data?.applicants||[]).filter(a=>a.id!==SESSION.id)}).eq('id',id))}catch{};rBookDetail(id)}
  const cf=document.getElementById('bd-confirm');if(cf)cf.onclick=()=>push(()=>rConfirmBook(id))
  const cp=document.getElementById('bd-complete');if(cp)cp.onclick=async()=>{try{await wt(sb.from('okya_books').delete().eq('id',id))}catch{};toast('교환 완료 🎉');pop()}
  document.getElementById('bd-csend').onclick=async()=>{const inp=document.getElementById('bd-cinput'),text=inp?.value.trim();if(!text)return;try{const r=await wt(sb.from('okya_books').select('comments').eq('id',id).single());const comments=[...(r.data?.comments||[]),{by:SESSION.id,byName:SESSION.name,text,at:nowISO()}];await wt(sb.from('okya_books').update({comments}).eq('id',id))}catch{};rBookDetail(id)}
}

async function rConfirmBook(id){
  let b=null;try{const r=await wt(sb.from('okya_books').select('*').eq('id',id).single());b=r.data}catch{}
  if(!b){pop();return}
  app().innerHTML=`<div class="screen no-nav fade-in p3"><div class="phdr"><button class="bk" id="bk">${I.back}</button><div class="ttl">${b.kind} 확정</div><div style="width:34px"></div></div><div class="pcard"><div class="sec" style="margin-bottom:4px">${esc(b.title)}</div><div style="font-size:12px;color:var(--sub);margin-bottom:14px">누구와 ${b.kind}할까요?</div><div style="display:flex;flex-direction:column;gap:8px">${(b.applicants||[]).map(a=>`<label class="check-item"><input type="radio" name="rc" value="${a.id}" data-name="${esc(a.name)}">${esc(a.name)}</label>`).join('')||'<div class="empty">신청자가 없어요</div>'}</div><button class="pbtn pri" id="cf" style="margin-top:14px">확정하기</button></div></div>`
  document.getElementById('bk').onclick=pop
  document.getElementById('cf').onclick=async()=>{const sel=document.querySelector('input[name="rc"]:checked');if(!sel){toast('상대를 선택해줘');return};try{await wt(sb.from('okya_books').update({status:'matched',recipient:sel.value,recipient_name:sel.dataset.name}).eq('id',id))}catch{};notify(sel.value,'book',`${b.kind} 확정 🎉`,`'${b.title}' — ${SESSION.name}님과 ${b.kind}이 확정됐어요`);toast('확정했어요');pop()}
}

async function iPetition(){
  const admin=SESSION.role==='admin'
  let ps=[]
  try{const r=await wt(sb.from('okya_petitions').select('*').order('at',{ascending:false}));ps=r.data||[]}catch{}
  const pub=ps.filter(p=>p.status==='approved'),pend=ps.filter(p=>p.status==='pending')
  const cb=document.getElementById('cb');if(!cb)return
  const ptitle=p=>esc(p.title||p.txt||'제목 없음')
  const pctOf=p=>Math.min(100,Math.round(petAgrees(p)/petGoal(p)*100))
  const ddayTxt=p=>{const d=petDaysLeft(p);return d>0?`D-${d}`:d===0?'오늘 마감':'마감'}
  const top=[...pub].sort((a,b)=>petAgrees(b)-petAgrees(a))[0]
  // 대표 청원: 참여자·목표·진행률·마감을 한눈에 (장식보다 정보 우선)
  const banner=top?`<button class="pet-hero" data-open="${top.id}">
    <div class="pet-hero-tag">🔥 지금 가장 주목받는 청원</div>
    <div class="pet-hero-title">${ptitle(top)}</div>
    <div class="pet-hero-stats"><span class="pet-hero-n"><b>${fmt(petAgrees(top))}</b>명 참여</span><span class="pet-hero-goal">목표 ${fmt(petGoal(top))}명</span></div>
    <div class="pet-bar"><i style="width:${pctOf(top)}%"></i></div>
    <div class="pet-hero-foot"><span class="pet-hero-pct">${pctOf(top)}%</span><span class="pet-hero-dday">${ddayTxt(top)}</span></div>
  </button>`:''
  const pendSec=admin&&pend.length?`<div class="pcard"><div class="sec">검토 대기 (${pend.length})</div>${pend.map(p=>`<div class="post"><div class="pbody" style="font-weight:800">${ptitle(p)}</div><div class="pmeta" style="margin:4px 0 8px">${esc(p.category||'기타')} · 접수 ${timeago(p.at)}</div><div style="display:flex;gap:8px"><button class="minibtn soft" data-ap="${p.id}">공개</button><button class="minibtn danger" data-rj="${p.id}">반려</button></div></div>`).join('')}</div>`:''
  // 일반 사용자: 본인이 올린 검토중 청원을 확인할 수 있게(관리자 승인 게이트는 유지)
  const myPend=!admin?pend.filter(p=>p.by_id===SESSION.id):[]
  const myPendSec=myPend.length?`<div class="pcard"><div class="sec">내 청원 · 검토중 (${myPend.length})</div>${myPend.map(p=>`<div class="post"><div class="pbody" style="font-weight:800">${ptitle(p)}</div><div class="pmeta" style="margin:4px 0 0"><span class="pet-badge st-review">검토중</span> · 접수 ${timeago(p.at)} · 학생회 검토 후 공개돼요</div></div>`).join('')}</div>`:''
  // 필터(상태)·정렬(인기/최신) 상태
  const STF=['전체','진행중','마감임박','목표달성','마감']
  const matchStatus=(p,f)=>{if(f==='전체')return true;const t=petStatus(p).tone;if(f==='진행중')return t==='active'||t==='urgent';if(f==='마감임박')return t==='urgent';if(f==='목표달성')return t==='success'||t==='done';if(f==='마감')return t==='closed';return true}
  let fstat='전체',sort='인기'
  const listHTML=()=>{
    let arr=pub.filter(p=>matchStatus(p,fstat))
    arr=arr.slice().sort(sort==='인기'?(a,b)=>petAgrees(b)-petAgrees(a):(a,b)=>petStart(a)<petStart(b)?1:-1)
    if(!arr.length)return'<div class="empty" style="padding:40px 20px">해당하는 청원이 없어요.</div>'
    return`<div class="pet-list">${arr.map(p=>{const st=petStatus(p);return`<button class="pet-item" data-open="${p.id}">
      <div class="pet-item-top"><span class="pet-badge st-${st.tone}">${st.label}</span><span class="pet-item-dday">${esc(p.category||'기타')} · ${ddayTxt(p)}</span></div>
      <div class="pet-item-title">${ptitle(p)}</div>
      <div class="pet-item-prog"><div class="pet-bar sm"><i style="width:${pctOf(p)}%"></i></div><span class="pet-item-n"><b>${fmt(petAgrees(p))}</b> / ${fmt(petGoal(p))}</span></div>
    </button>`}).join('')}</div>`
  }
  const empty='<div class="empty">아직 공개된 청원이 없습니다.<br><br>우측 상단 <b style="color:var(--primary)">＋ 청원</b>으로 첫 청원을 올려보세요.</div>'
  cb.innerHTML=`${banner}${pendSec}${myPendSec}
    <div class="pet-secrow"><div class="sec2">전체 청원 <span class="pet-cnt">${pub.length}</span></div>${pub.length?`<button class="pet-sort" id="pet-sort">${sort}순 ⇅</button>`:''}</div>
    ${pub.length?`<div class="pet-cats" id="pet-stats">${STF.map(c=>`<button class="pet-chip2${c===fstat?' on':''}" data-fs="${c}">${c}</button>`).join('')}</div>`:''}
    <div id="pet-listwrap">${pub.length?listHTML():empty}</div><div style="height:16px"></div>`
  const bindOpen=()=>cb.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>push(()=>rPetitionDetail(el.dataset.open)))
  const rerender=()=>{const w=document.getElementById('pet-listwrap');if(w){w.innerHTML=listHTML();bindOpen()}}
  bindOpen()
  cb.querySelectorAll('#pet-stats [data-fs]').forEach(b=>b.onclick=()=>{fstat=b.dataset.fs;cb.querySelectorAll('#pet-stats [data-fs]').forEach(x=>x.classList.toggle('on',x===b));rerender()})
  const sb2=document.getElementById('pet-sort');if(sb2)sb2.onclick=()=>{sort=sort==='인기'?'최신':'인기';sb2.textContent=sort+'순 ⇅';rerender()}
  document.querySelectorAll('[data-ap]').forEach(b=>b.onclick=async()=>{const pt=pend.find(x=>x.id===b.dataset.ap);try{await wt(sb.from('okya_petitions').update({status:'approved',approved_at:nowISO()}).eq('id',b.dataset.ap))}catch{};if(pt)notifyStudents('petition','새 청원 공개',`'${ptitle(pt)}' 청원에 동의해보세요`);iPetition()})
  document.querySelectorAll('[data-rj]').forEach(b=>b.onclick=async()=>{try{await wt(sb.from('okya_petitions').delete().eq('id',b.dataset.rj))}catch{};iPetition()})
}
