'use strict';
async function rMy(){
  TAB='my'
  const isAdmin=SESSION.role==='admin'
  app().innerHTML=`<div class="screen fade-in p3"><div class="topbar"><div class="t">MY</div><button id="my-bell" data-bell>${I.bell}</button></div><div class="loader" style="min-height:220px"><div class="spin"></div></div></div>${bnav()}`
  bindNav()

  const[txs]=await Promise.all([getAllTx(),loadNotifs()])
  const bal=balOf(SESSION.id,txs)
  const issued=txs.filter(t=>t.type==='발행').reduce((s,t)=>s+t.amount,0)
  const attend=txs.filter(t=>t.type==='출석'&&t.to===SESSION.id).length
  let chal=0;try{const r=await wt(sb.from('okya_event_subs').select('id').eq('by_id',SESSION.id));chal=(r.data||[]).length}catch{}
  // 나의 옥야 대시보드: 활동 통계·스트릭·레벨
  let bookCount=0;try{const r=await wt(sb.from('okya_books').select('id').eq('owner',SESSION.id));bookCount=(r.data||[]).length}catch{}
  let petiCount=0;try{const r=await wt(sb.from('okya_petitions').select('by_id,reacts'));petiCount=(r.data||[]).filter(p=>p.by_id===SESSION.id||(p.reacts&&p.reacts[SESSION.id])).length}catch{}
  const attDays=new Set(txs.filter(t=>t.type==='출석'&&t.to===SESSION.id).map(t=>dayKeyOf(t.at)))
  const streak=(()=>{let s=0;const d=new Date();if(!attDays.has(dayKeyOf(d)))d.setDate(d.getDate()-1);while(attDays.has(dayKeyOf(d))){s++;d.setDate(d.getDate()-1)}return s})()
  const pts=attend*10+chal*20+bookCount*15+petiCount*10
  const {lv,cur,need,pct}=(()=>{let lv=1,need=100,acc=0;while(pts>=acc+need){acc+=need;lv++;need=Math.round(need*1.4)}return{lv,cur:pts-acc,need,pct:Math.max(4,Math.round((pts-acc)/need*100))}})()

  const photoSrc=SESSION.photo||null,initials=esc(SESSION.name.charAt(0))
  let curPri='#7B6CFF';try{const st=JSON.parse(localStorage.getItem('okya-theme')||'null');if(st&&st.primary)curPri=st.primary}catch{}
  const PRESETS=[['바이올렛','#7B6CFF'],['블루','#5B9BFF'],['인디고','#6C6BFF'],['스카이','#38BDF8'],['민트','#2DD4BF'],['그린','#34D399'],['라임','#A3E635'],['앰버','#FBBF24'],['코랄','#FB923C'],['로즈','#FB7185'],['핑크','#F472B6'],['라벤더','#C084FC']]
  const grad=p=>{const[a,b]=deriveGrad(p);return`linear-gradient(135deg,${a},${b})`}
  const pfis=PRESETS.map(([n,p])=>{const on=p.toLowerCase()===curPri.toLowerCase();return`<div class="pfi${on?' on':''}" data-pri="${p}" data-name="${n}" style="background:${grad(p)}"><div class="pl">${n}</div></div>`}).join('')

  app().innerHTML=`<div class="screen fade-in p3 my2">
    <div class="topbar"><div class="t">MY</div><button id="my-bell" data-bell>${I.bell}</button></div>
    <section class="my2-prof">
      <div class="av">${photoSrc?`<img src="${photoSrc}">`:initials}<label class="camera" for="my-photo-input"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></label></div>
      <input id="my-photo-input" type="file" accept="image/*" style="display:none">
      <div class="my2-id"><div class="my2-name">${esc(SESSION.name)}</div><div class="my2-cl">창녕옥야고등학교 · ${isAdmin?'학생회':'학생'}</div></div>
      <div class="my2-lv">Lv.${lv}</div>
    </section>
    <section class="my2-block">
      <div class="my-lv-bar"><i style="width:0%"></i></div>
      <div class="my2-lvsub">활동점수 <b>${fmt(pts)}</b>p · 다음 레벨까지 ${fmt(Math.max(0,need-cur))}p · 🔥 ${streak}일 연속</div>
    </section>
    <div class="my2-stats">
      <div class="my2-stat"><div class="v">${fmt(isAdmin?issued:bal)}</div><div class="k">${isAdmin?'발행량':'옥야머니'}</div></div>
      <div class="my2-stat"><div class="v">${attend}</div><div class="k">출석</div></div>
      <div class="my2-stat"><div class="v">${chal}</div><div class="k">챌린지</div></div>
      <div class="my2-stat"><div class="v">${bookCount}</div><div class="k">등록 책</div></div>
      <div class="my2-stat"><div class="v">${petiCount}</div><div class="k">참여 청원</div></div>
    </div>
    <section class="my2-block">
      <div class="my2-menu">
        <button class="my2-row" id="mm-tx"><span class="mic">${I.hist}</span><span class="my2-row-l">거래 내역</span><span class="cev">${I.chev}</span></button>
        <button class="my2-row" id="mm-chal"><span class="mic">${I.star}</span><span class="my2-row-l">챌린지</span><span class="cev">${I.chev}</span></button>
        <button class="my2-row" id="mm-peti"><span class="mic">${I.petition}</span><span class="my2-row-l">청원</span><span class="cev">${I.chev}</span></button>
        <button class="my2-row" id="mm-noti"><span class="mic">${I.bell}</span><span class="my2-row-l">알림</span><span class="cev">${I.chev}</span></button>
        <button class="my2-row" id="mm-out"><span class="mic" style="color:var(--danger)">${I.logout}</span><span class="my2-row-l" style="color:var(--danger)">로그아웃</span></button>
      </div>
    </section>
    <section class="my2-block">
      <h2 class="my2-sec-t">개인 설정</h2>
      <div class="my2-theme-t">색상 테마</div>
      <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">스펙트럼 버튼을 눌러 색을 펼쳐보세요</div>
      <div class="palfan" id="palfan">
        <button class="palfan-btn" id="palfan-btn"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
        ${pfis}
        <label class="pfi pick" data-custom="1"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><input type="color" id="my-color" value="${curPri}" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer"></label>
      </div>
    </section>
    <div class="ver">옥야 v1.0 · 창녕옥야고 학생회</div>
  </div>${bnav()}`
  bindNav()
  requestAnimationFrame(()=>{const bar=document.querySelector('.my-lv-bar i');if(bar)bar.style.width=pct+'%'})
  const av=document.querySelector('.my2-prof .av');if(av)av.addEventListener('click',()=>eggTap('av',5,()=>{av.classList.remove('egg-wobble');void av.offsetWidth;av.classList.add('egg-wobble');confettiBurst();popMsg('숨은 옥야 발견!','🥚')}))

  document.getElementById('my-photo-input').onchange=async(e)=>{
    const f=e.target.files[0];if(!f)return
    toast('사진 업로드 중...')
    const url=await uploadImg(f,'profile',400,0.7)
    if(!url)return
    SESSION.photo=url
    const meU=USERS.find(u=>u.id===SESSION.id);if(meU)meU.photo=url  // 같은 세션 내 다른 화면(메시지/송금 등)에도 즉시 반영
    try{await wt(sb.from('okya_users').update({photo:url}).eq('id',SESSION.id))}catch{}
    rMy()
  }
  // 스펙트럼 팔레트: 원형 배치
  const fan=document.getElementById('palfan')
  const items=[...fan.querySelectorAll('.pfi')]
  const R=96,N=items.length
  items.forEach((el,i)=>{const ang=(-90+i*(360/N))*Math.PI/180;el.style.setProperty('--tx',(Math.cos(ang)*R).toFixed(1)+'px');el.style.setProperty('--ty',(Math.sin(ang)*R).toFixed(1)+'px');el.style.transitionDelay=(i*20)+'ms'})
  document.getElementById('palfan-btn').onclick=()=>fan.classList.toggle('open')
  document.querySelectorAll('[data-pri]').forEach(el=>el.onclick=()=>{applyTheme({name:el.dataset.name,primary:el.dataset.pri,v:2});rMy()})
  document.getElementById('my-color').onchange=e=>{applyTheme({name:'커스텀',primary:e.target.value,v:2});rMy()}
  wireBell()
  document.getElementById('mm-tx').onclick=()=>push(()=>rHistory())
  document.getElementById('mm-chal').onclick=()=>push(rChallengePage)
  document.getElementById('mm-peti').onclick=()=>push(rPetitionPage)
  document.getElementById('mm-noti').onclick=()=>push(()=>rNotifications())
  document.getElementById('mm-out').onclick=async()=>{try{await sb.auth.signOut()}catch{};SESSION=null;USERS=[];rLogin()}
}

function rLogin(){
  app().innerHTML=`
  <div class="screen p3 login-p3">
    <div class="lg-top">
      <div class="lg-logo"><img src="${LOGO}" alt="옥야"></div>
      <div class="lg-mark">okya</div>
      <div class="lg-ko">옥야</div>
      <div class="lg-sch">창녕옥야고등학교 학생회</div>
    </div>
    <div class="lg-card">
      <h3>로그인</h3>
      <div class="lg-desc">학교 구글 계정으로 로그인하면<br>옥야 서비스를 이용할 수 있어요.</div>
      <button id="gg" class="lg-gg">
        <svg width="19" height="19" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Google 계정으로 계속하기
      </button>
      <p class="lg-note">처음 로그인하면 자동으로 계정이 만들어져요.</p>
    </div>
  </div>`
  const gg=document.getElementById('gg')
  gg.onclick=async()=>{
    gg.disabled=true
    const{error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+window.location.pathname,queryParams:{prompt:'select_account'}}})
    if(error){toast('로그인 실패: '+error.message);gg.disabled=false}
  }
}

async function handleUserUpsert(authUser){
  const name=authUser.user_metadata?.full_name||authUser.user_metadata?.name||(authUser.email||'').split('@')[0]||'학생'
  // 기존 사용자인지 확인 (role은 DB 값을 그대로 신뢰, 클라이언트가 절대 덮어쓰지 않음)
  let role='student',exists=false
  try{const r=await wt(sb.from('okya_users').select('role').eq('id',authUser.id).maybeSingle());if(r.data){exists=true;role=r.data.role||'student'}}catch{}
  try{
    if(exists){
      // 기존 사용자: 이름만 갱신, role은 손대지 않음 → Supabase에서 설정한 admin이 유지됨
      const r=await wt(sb.from('okya_users').update({name}).eq('id',authUser.id).select().single());SESSION=r.data||{id:authUser.id,name,role}
    }else{
      // 신규 사용자만 최초 1회 student로 생성
      const r=await wt(sb.from('okya_users').insert({id:authUser.id,name,role:'student'}).select().single());SESSION=r.data||{id:authUser.id,name,role:'student'}
    }
  }catch{SESSION={id:authUser.id,name,role}}
  try{const r=await wt(sb.from('okya_users').select('id,name,role,photo'));USERS=r.data||[]}catch{}
  STACK=[];routeTab()
}
