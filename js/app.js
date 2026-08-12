'use strict';
// ── 테마 ──
const THEMES=[
  {name:'파랑',primary:'#1A5CE6',d:'#1349C0',tint:'#EEF3FF'},
  {name:'보라',primary:'#7C3AED',d:'#6D28D9',tint:'#F3EEFF'},
  {name:'초록',primary:'#059669',d:'#047857',tint:'#EDFAF5'},
  {name:'주황',primary:'#D97706',d:'#B45309',tint:'#FFFAEB'},
  {name:'분홍',primary:'#DB2777',d:'#BE185D',tint:'#FCE7F3'},
  {name:'민트',primary:'#0D9488',d:'#0F766E',tint:'#CCFBF1'},
  {name:'레드',primary:'#DC2626',d:'#B91C1C',tint:'#FEE2E2'},
  {name:'하늘',primary:'#0891B2',d:'#0E7490',tint:'#E0F8FF'},
  {name:'라임',primary:'#65A30D',d:'#4D7C0F',tint:'#ECFCCB'},
  {name:'핫핑크',primary:'#EC4899',d:'#BE185D',tint:'#FDF2F8'},
]
function hexToHsl(hex){
  const n=parseInt(hex.replace('#',''),16),r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0,s=0,l=(mx+mn)/2
  if(d){s=l>0.5?d/(2-mx-mn):d/(mx+mn)
    h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}
  return[h,s,l]
}
function hslToHex(h,s,l){
  h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l))
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2
  let r=0,g=0,b=0
  if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}
  else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
  const to=v=>Math.round((v+m)*255).toString(16).padStart(2,'0')
  return '#'+to(r)+to(g)+to(b)
}
// primary 하나로 강한 2톤 그라데이션 파생: 색상 +32° 이동 + 명도/채도 대비
function deriveGrad(primary){
  const[h,s,l]=hexToHsl(primary)
  const ga=hslToHex(h,Math.min(s+0.06,1),Math.max(l-0.05,0.42))
  const gb=hslToHex(h+32,Math.min(s+0.10,1),Math.min(Math.max(l,0.55)+0.16,0.74))
  return[ga,gb]
}
function applyTheme(t){
  const r=document.documentElement.style
  const[dga,dgb]=deriveGrad(t.primary)
  const ga=t.ga||dga,gb=t.gb||dgb
  const[h,s,l]=hexToHsl(t.primary)
  const dcol=t.d||hslToHex(h,s,Math.max(l-0.12,0.30))
  const tint=t.tint||hslToHex(h,Math.min(s,0.85),0.94)
  r.setProperty('--primary',t.primary);r.setProperty('--primary-d',dcol);r.setProperty('--primary-tint',tint)
  // 2.0 UI가 쓰는 --accent* 도 함께 갱신 → 홈/학교/머니/MY 등 전체 통일(커뮤 tone 밴드는 --tone이라 고정)
  r.setProperty('--accent',t.primary);r.setProperty('--accent-d',dcol);r.setProperty('--accent-soft',tint)
  r.setProperty('--ga',ga)
  r.setProperty('--gb',gb)
  r.setProperty('--sh-blue',`0 16px 34px ${t.primary}52,-4px 5px 16px ${t.primary}22`)
  localStorage.setItem('okya-theme',JSON.stringify({...t,v:2}))
}
const DEFAULT_THEME={name:'바이올렛',primary:'#7B6CFF',v:2}

// ── 초기화 ──
;(async()=>{
  // 저장된 테마 적용 (v 없는 예전 저장값은 무시하고 바이올렛 기본 적용)
  try{const st=localStorage.getItem('okya-theme'),t=st&&JSON.parse(st);applyTheme(t&&t.v?t:DEFAULT_THEME)}catch{applyTheme(DEFAULT_THEME)}
  const _t0=Date.now()
  // 스플래시 최소 1.5초 표시 보장
  const holdSplash=()=>new Promise(r=>setTimeout(r,Math.max(0,1500-(Date.now()-_t0))))
  const fallback=setTimeout(()=>{if(app().querySelector('.splash-screen'))rLogin()},10000)
  try{
    // 급식·학사일정 로드 (실패해도 무시하고 진행)
    await Promise.race([loadSchoolData(),new Promise(r=>setTimeout(r,4000))])
    try{const r=await wt(sb.from('okya_users').select('id,name,role,photo'),6000);USERS=r.data||[]}catch{}
    const{data}=await wt(sb.auth.getSession(),6000)
    clearTimeout(fallback)
    await holdSplash()
    if(data?.session?.user)await handleUserUpsert(data.session.user)
    else rLogin()
    sb.auth.onAuthStateChange(async(event,s)=>{
      if((event==='SIGNED_IN'||event==='INITIAL_SESSION')&&s)await handleUserUpsert(s.user)
      else if(event==='SIGNED_OUT'){SESSION=null;USERS=[];rLogin()}
    })
  }catch{
    clearTimeout(fallback)
    await holdSplash()
    rLogin()
  }
})()