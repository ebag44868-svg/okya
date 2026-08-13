'use strict';

const sb=window.supabase.createClient(
  'https://rzajmazztaarzrqqkezr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YWptYXp6dGFhcnpycXFrZXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODk0NzQsImV4cCI6MjA5ODc2NTQ3NH0.IDk1fSv_B76wbzYouKS8TP4TObso2nA50rpo9qj96MU',
  {auth:{flowType:'pkce'}}
)

const uid=p=>(p||'x')+'_'+Math.random().toString(36).slice(2,9)
const fmt=n=>Number(n).toLocaleString('ko-KR')
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const nowISO=()=>new Date().toISOString()
const timeago=iso=>{if(!iso)return'';const s=Math.floor((Date.now()-new Date(iso))/1000);if(s<60)return'방금';if(s<3600)return Math.floor(s/60)+'분 전';if(s<86400)return Math.floor(s/3600)+'시간 전';const d=new Date(iso);return(d.getMonth()+1)+'월 '+d.getDate()+'일'}
const fmtDate=iso=>{if(!iso)return'상시';const d=new Date(iso);return(d.getMonth()+1)+'월 '+d.getDate()+'일'}
const isExpired=e=>e.deadline&&new Date(e.deadline)<new Date()
function readImg(file,maxW=900,q=0.6){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(w>maxW){h=Math.round(h*maxW/w);w=maxW}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);res(c.toDataURL('image/jpeg',q))};img.src=r.result};r.readAsDataURL(file)})}
// 압축한 이미지를 Blob으로 반환 (Storage 업로드용)
function compressImg(file,maxW=900,q=0.6){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(w>maxW){h=Math.round(h*maxW/w);w=maxW}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);c.toBlob(b=>res(b),'image/jpeg',q)};img.src=r.result};r.readAsDataURL(file)})}
// 사진을 Supabase Storage('photos' 버킷)에 올리고 공개 URL 반환. 실패 시 null.
async function uploadImg(file,folder='misc',maxW=900,q=0.6){
  try{
    const blob=await compressImg(file,maxW,q)
    const path=`${folder}/${uid('img')}.jpg`
    const{error}=await wt(sb.storage.from('photos').upload(path,blob,{contentType:'image/jpeg',upsert:false}),15000)
    if(error){console.warn('사진 업로드 실패:',error.message);toast('사진 업로드 실패');return null}
    return sb.storage.from('photos').getPublicUrl(path).data.publicUrl
  }catch(e){console.warn(e);toast('사진 처리 실패');return null}
}

// 모든 DB 쿼리에 타임아웃 적용
function wt(p,ms=7000){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))])}

let SESSION=null,USERS=[],TAB='home',STACK=[],commTab='challenge'
const openBooks=new Set()
const app=()=>document.getElementById('app')
// 타입별 토스트: toast(m) / toast(m,'success'|'error'|'info'|'loading')
function toast(m,type){const t=document.getElementById('toast');if(!t)return;
  const ic={success:'✓',error:'!',info:'i'}[type]||'';
  t.className='toast'+(type?' t-'+type:'');
  t.innerHTML=ic?`<span class="toast-ic">${ic}</span><span>${esc(m)}</span>`:esc(m);
  t.classList.add('on');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),type==='error'?3200:2500)}
// 무언가 올렸을 때 화면 중앙 하단에 톡 떠오르는 알림
function popMsg(text,emoji){const el=document.createElement('div');el.className='popmsg';el.innerHTML=`${emoji?`<span class="pm-ic">${emoji}</span>`:''}<span>${esc(text)}</span>`;document.body.appendChild(el);setTimeout(()=>el.classList.add('out'),1500);setTimeout(()=>el.remove(),1980)}

// ── Phase 2: 재사용 Bottom Sheet / Modal / Skeleton / Empty ──
let SHEET_OPEN=null,MODAL_OPEN=null
function lockScroll(on){const sc=app().querySelector('.screen');if(sc)sc.style.overflow=on?'hidden':''}
function openSheet({title='',body='',actions='',onMount}={}){
  closeSheet(true)
  const bd=document.createElement('div');bd.className='sheet-backdrop'
  const sh=document.createElement('div');sh.className='sheet'
  sh.innerHTML=`<div class="sheet-handle"></div>${title?`<div class="sheet-head"><div class="sheet-title">${esc(title)}</div></div>`:''}<div class="sheet-body">${body}</div>${actions?`<div class="sheet-actions">${actions}</div>`:''}`
  document.body.appendChild(bd);document.body.appendChild(sh)
  requestAnimationFrame(()=>{bd.classList.add('on');sh.classList.add('on')})
  lockScroll(true)
  const close=()=>closeSheet()
  bd.addEventListener('click',close)
  // 아래로 스와이프하면 닫힘 (본문 맨 위에서만)
  const bodyEl=sh.querySelector('.sheet-body');let sy=null,dy=0
  sh.addEventListener('touchstart',e=>{if(bodyEl.scrollTop>2){sy=null;return}sy=e.touches[0].clientY;dy=0},{passive:true})
  sh.addEventListener('touchmove',e=>{if(sy==null)return;dy=e.touches[0].clientY-sy;if(dy>0){sh.style.transition='none';sh.style.transform=`translateY(${dy}px)`}},{passive:true})
  sh.addEventListener('touchend',()=>{if(sy==null)return;sh.style.transition='';if(dy>110)close();else sh.style.transform='';sy=null})
  SHEET_OPEN={bd,sh}
  if(onMount)onMount(sh)
  return{close,el:sh}
}
function closeSheet(instant){
  if(!SHEET_OPEN)return
  const{bd,sh}=SHEET_OPEN;SHEET_OPEN=null;lockScroll(false)
  if(instant){bd.remove();sh.remove();return}
  bd.classList.remove('on');sh.classList.remove('on');sh.style.transform=''
  setTimeout(()=>{bd.remove();sh.remove()},280)
}
function openModal({title='',body='',actions='',onMount}={}){
  closeModal(true)
  const bd=document.createElement('div');bd.className='sheet-backdrop'
  const md=document.createElement('div');md.className='modal'
  md.innerHTML=`${title?`<div class="modal-title">${esc(title)}</div>`:''}${body?`<div class="modal-body">${body}</div>`:''}${actions?`<div class="modal-actions">${actions}</div>`:''}`
  document.body.appendChild(bd);document.body.appendChild(md)
  requestAnimationFrame(()=>{bd.classList.add('on');md.classList.add('on')})
  const close=()=>closeModal();bd.addEventListener('click',close)
  MODAL_OPEN={bd,md}
  if(onMount)onMount(md)
  return{close,el:md}
}
function closeModal(instant){
  if(!MODAL_OPEN)return
  const{bd,md}=MODAL_OPEN;MODAL_OPEN=null
  if(instant){bd.remove();md.remove();return}
  bd.classList.remove('on');md.classList.remove('on')
  setTimeout(()=>{bd.remove();md.remove()},280)
}
// 확인 다이얼로그: confirmDialog('삭제할까요?','되돌릴 수 없어요',()=>{...},{okText,danger})
function confirmDialog(title,msg,onOk,opt={}){
  const{okText='확인',cancelText='취소',danger=false}=opt
  const{close,el}=openModal({title,body:msg,
    actions:`<button class="pbtn" id="md-cancel" style="background:var(--surface-2);color:var(--text-2)">${esc(cancelText)}</button><button class="pbtn ${danger?'':'pri'}" id="md-ok" ${danger?'style="background:var(--danger);color:#fff"':''}>${esc(okText)}</button>`})
  el.querySelector('#md-cancel').onclick=close
  el.querySelector('#md-ok').onclick=()=>{close();onOk&&onOk()}
}
// Skeleton 헬퍼
const skelLines=(n=3,w=[92,80,66])=>Array.from({length:n},(_,i)=>`<div class="skeleton skel-line" style="width:${w[i%w.length]}%"></div>`).join('')
const skelBlock=()=>`<div style="padding:6px 2px"><div class="skeleton skel-title"></div>${skelLines(3)}</div>`
// Empty state 헬퍼
function emptyHTML({icon='📭',title='',desc='',action=''}={}){return`<div class="empty-state"><div class="empty-ic">${icon}</div><div class="empty-title">${esc(title)}</div>${desc?`<div class="empty-desc">${esc(desc)}</div>`:''}${action?`<div class="empty-action">${action}</div>`:''}</div>`}
const nameOf=id=>(USERS.find(u=>u.id===id)||{name:'학생회'}).name
const photoOf=id=>{const u=id===(SESSION&&SESSION.id)?SESSION:USERS.find(u=>u.id===id);return u&&u.photo||null}
// 공통 아바타: 프로필 사진 있으면 원형 이미지, 없으면 이니셜 (메시지·송금·프로필 등에서 재사용)
function avatarHTML(id,size=34){const p=photoOf(id),nm=nameOf(id)||'?';const s=size+'px';return p?`<img src="${esc(p)}" style="width:${s};height:${s};border-radius:50%;object-fit:cover;flex:none">`:`<div style="width:${s};height:${s};border-radius:50%;background:var(--primary-tint);display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.4)}px;font-weight:700;color:var(--primary);flex:none">${esc(nm.charAt(0))}</div>`}

// ── 알림 (okya_notifications). 테이블 없으면 조용히 무시(앱 흐름 방해 X) ──
let NOTIFS=[]
async function notify(userId,type,title,body,link){
  if(!userId||userId===(SESSION&&SESSION.id))return   // 자기 자신에겐 알림 안 만듦
  try{await wt(sb.from('okya_notifications').insert({id:uid('nt'),user_id:userId,type,title,body:body||'',link:link||'',read:false,at:nowISO()}),5000)}catch{}
}
// 여러 명에게 한 번에 알림. opts.includeAdmin=true면 학생회 임원도 포함
async function notifyMany(ids,type,title,body,link){for(const id of new Set(ids))await notify(id,type,title,body,link)}
async function notifyStudents(type,title,body,link){await notifyMany(USERS.filter(u=>u.role!=='admin').map(u=>u.id),type,title,body,link)}
async function notifyAdmins(type,title,body,link){await notifyMany(USERS.filter(u=>u.role==='admin').map(u=>u.id),type,title,body,link)}
async function loadNotifs(){try{const{data}=await wt(sb.from('okya_notifications').select('*').eq('user_id',SESSION.id).order('at',{ascending:false}).limit(50),5000);NOTIFS=data||[]}catch{NOTIFS=[]}updateAppBadge();return NOTIFS}
function unreadCount(){return NOTIFS.filter(n=>!n.read).length}
// 앱 아이콘 배지(패드 홈화면 우측 상단). 미지원 브라우저는 조용히 무시
function updateAppBadge(){try{const c=unreadCount();if('setAppBadge'in navigator){c>0?navigator.setAppBadge(c):navigator.clearAppBadge()}}catch{}}
async function markNotifsRead(){const uns=NOTIFS.filter(n=>!n.read);if(!uns.length){updateAppBadge();return}uns.forEach(n=>n.read=true);updateAppBadge();try{await wt(sb.from('okya_notifications').update({read:true}).eq('user_id',SESSION.id).eq('read',false),5000)}catch{}}
// 벨 버튼([data-bell])에 클릭·배지 반영
function wireBell(){updateAppBadge();document.querySelectorAll('[data-bell]').forEach(b=>{
  b.onclick=()=>{if(OK_OV)closeOverlay();else openNotifOverlay()}
  const old=b.querySelector('.nbadge');if(old)old.remove()
  const c=unreadCount();if(c>0){const s=document.createElement('span');s.className='nbadge';s.textContent=c>9?'9+':c;b.appendChild(s)}
})}
// 알림 종류 → 좌측 레일 위치
const NAV_TYPE={challenge:'challenge',petition:'petition',book:'book',binding:'print'}
// 미읽음 알림을 좌측 레일 버튼/서브버튼에 뱃지로 표시
function applyRailBadges(){
  const cnt={},bump=k=>cnt[k]=(cnt[k]||0)+1
  NOTIFS.filter(n=>!n.read).forEach(n=>{
    if(n.type==='dm')bump('search')
    else if(n.type==='money')bump('money')
    else if(n.type==='challenge'){bump('comm');bump('comm:challenge')}
    else if(n.type==='petition'){bump('comm');bump('comm:petition')}
    else if(n.type==='book'){bump('comm');bump('comm:book')}
    else if(n.type==='print'){bump('comm');bump('comm:binding')}
  })
  document.querySelectorAll('.rail-badge').forEach(b=>b.remove())
  const add=(btn,c)=>{if(!btn||!c)return;const s=document.createElement('span');s.className='nbadge rail-badge';s.textContent=c>9?'9+':c;const host=(RAIL_COLLAPSED?btn:(btn.querySelector('span')||btn));host.appendChild(s)}
  document.querySelectorAll('.bnav [data-tab]').forEach(b=>add(b,cnt[b.dataset.tab]))
  document.querySelectorAll('.bnav [data-nav]').forEach(b=>add(b,cnt[b.dataset.nav]))
}
// 특정 종류 알림 읽음 처리(해당 화면 진입 시)
async function markTypeRead(types){
  const set=new Set(types),uns=NOTIFS.filter(n=>!n.read&&set.has(n.type))
  if(!uns.length)return
  uns.forEach(n=>n.read=true);updateAppBadge();applyRailBadges();wireBell()
  try{for(const t of types)await wt(sb.from('okya_notifications').update({read:true}).eq('user_id',SESSION.id).eq('type',t).eq('read',false),5000)}catch{}
}
// 백그라운드로 알림 갱신(실시간 느낌) — 로그인 후 1회 시작
let NOTIF_TIMER=null
function startNotifPolling(){if(NOTIF_TIMER||!SESSION)return;NOTIF_TIMER=setInterval(async()=>{if(!SESSION)return;await loadNotifs();wireBell();applyRailBadges()},15000)}
// Enter로 확인/전송: 한 줄 input에서 같은 줄 버튼→화면 주요버튼 순으로 클릭 (textarea·조합중 제외)
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.shiftKey||e.isComposing)return
  const t=e.target;if(!t||t.tagName!=='INPUT')return
  const ty=(t.getAttribute('type')||'text').toLowerCase()
  if(['checkbox','radio','range','file','button','submit'].includes(ty))return
  let btn=t.parentElement&&t.parentElement.querySelector('button.minibtn:not([disabled]),button.pbtn:not([disabled])')
  const scr=app()
  if(!btn&&scr)btn=scr.querySelector('.pbtn.pri:not([disabled])')||scr.querySelector('.pr-subbtn:not([disabled])')
  if(btn){e.preventDefault();btn.click()}
})
// ESC → 열린 시트/모달 닫기
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(MODAL_OPEN){closeModal()}else if(SHEET_OPEN){closeSheet()}})

async function getAllTx(){try{const{data}=await wt(sb.from('okya_tx').select('*').order('at',{ascending:false}));return data||[]}catch{return[]}}
function balOf(id,txs){return txs.filter(t=>t.to===id).reduce((s,t)=>s+t.amount,0)-txs.filter(t=>t.from===id).reduce((s,t)=>s+t.amount,0)}
// 내 거래목록(최신순)에서 각 거래 직후의 잔액을 {거래id: 잔액}으로. curBal=현재 총잔액.
function runningBal(mine,curBal){const map={};let run=curBal;for(const t of mine){map[t.id]=run;run-=(t.to===SESSION.id?t.amount:-t.amount)}return map}
async function addTx(tx,opts={}){try{const{error}=await wt(sb.from('okya_tx').insert({id:uid('tx'),at:nowISO(),...tx}));if(error){toast('오류: '+error.message);return false}
  // 거래 알림(받는 사람에게). opts.silent면 알림 생략(예: 아케이드 보상)
  if(opts.silent){return true}
  if(tx.type==='송금'&&tx.to)notify(tx.to,'money','옥야머니 받음',`${nameOf(tx.from)}님이 ${fmt(tx.amount)}옥을 보냈어요`+(tx.reason?` · ${tx.reason}`:''))
  else if(tx.type==='발행'&&tx.to)notify(tx.to,'money','옥야머니 발행',`학생회가 ${fmt(tx.amount)}옥을 발행했어요`)
  else if(tx.type==='회수'&&tx.from)notify(tx.from,'money','옥야머니 회수',`학생회가 ${fmt(tx.amount)}옥을 회수했어요`)
  return true
}catch{toast('네트워크 오류');return false}}

const LOGO=(document.querySelector('link[rel="apple-touch-icon"]')||{}).href||''
;(()=>{const sl=document.getElementById('splash-logo');if(sl)sl.src=LOGO})()
const FACTS=['창녕옥야고등학교는 경남 창녕에 있는 기숙형 사립고등학교입니다.','옥야의 영문 표기는 OKYA High School입니다.','옥야 학생들은 대부분 기숙사에서 함께 생활합니다.','이 앱은 옥야 학생회를 위해 만들어진 서비스입니다.','옥야머니는 실제 돈이 아니라 학생회 활동 포인트입니다.','오늘도 옥야에서 좋은 하루 보내세요!']
function cheer(){const m=new Date().getMonth()+1;return{3:'새 학기, 모두 화이팅!',4:'수행평가 시즌, 힘내요!',5:'중간고사 화이팅!',6:'기말고사 화이팅!',7:'방학이 코앞이에요!',9:'2학기도 화이팅!',10:'수행평가 시즌, 힘내요!',11:'기말·수능 화이팅!',12:'기말고사 화이팅!'}[m]||'오늘도 옥야, 화이팅!'}
