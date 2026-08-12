'use strict';
// [Phase 2] 아케이드 메인 (2×2 게임 타일)
function rArcade(){
  TAB='arcade'
  const dailyKey=arcDailyGameKey()
  const tiles=ARCADE_GAMES.map(g=>{
    const thumb=arcArt(g.key,'thumbnail')
    const artStyle=thumb?`background-image:url('${thumb}')`:`background:${g.grad}`
    const isDaily=g.key===dailyKey
    const done=arcGameDone(g.key)
    return`<button class="arc-tile" data-game="${g.key}">
      <div class="arc-tile-art" style="${artStyle}" data-asset="arcade/${g.key}/thumbnail">
        ${thumb?'':`<span class="arc-tile-emoji">${g.emoji}</span>`}
        ${isDaily?'<span class="arc-tile-badge">오늘의 게임</span>':''}
        ${done?'<span class="arc-tile-done">오늘 완료</span>':''}
      </div>
      <div class="arc-tile-meta">
        <div class="arc-tile-name">${esc(g.name)}</div>
        <div class="arc-tile-desc">${esc(g.desc)}</div>
      </div>
      <span class="arc-tile-go">${I.chev}</span>
    </button>`
  }).join('')
  app().innerHTML=`<div class="screen fade-in p3 arcade"><div class="arc-wrap">
    <div class="arc-head">
      <div class="arc-eyebrow">OKYA</div>
      <h1 class="arc-title">ARCADE</h1>
      <p class="arc-sub">옥야머니를 모으는 작은 게임들</p>
    </div>
    <div class="arc-grid">${tiles}</div>
  </div></div>${bnav()}`
  bindNav()
  document.querySelectorAll('.arcade [data-game]').forEach(b=>b.onclick=()=>{const g=arcGame(b.dataset.game);if(g)push(g.route)})
}

// 게임 상세 공통 셸(뒤로가기 헤더 + 컨텐츠). 게임은 각 Phase에서 채운다.
function arcShell(title,inner,extraClass=''){
  app().innerHTML=`<div class="screen fade-in p3 arcade ${extraClass}"><div class="phdr"><button class="bk" id="arc-bk">${I.back}</button><div class="ttl">${esc(title)}</div><div style="width:34px"></div></div><div class="arc-wrap arc-game-wrap">${inner}</div></div>${bnav()}`
  bindNav();const bk=document.getElementById('arc-bk');if(bk)bk.onclick=()=>pop()
}