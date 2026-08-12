'use strict';
// [Phase 5] 오늘의 옥야 뽑기 — 5장 중 1장 당첨. 첫판 무료.
// ★ BETA: 무료 "다시하기" 버튼(LOT_BETA_RETRY) — 정식 배포 시 false로 끄거나 관련 블록 제거.
const LOT_BETA_RETRY=true
const lotBackHTML=(isWin)=>isWin?`<span class="lot-emoji">🎁</span><span class="lot-amt">+${ARCADE_REWARDS.lottery}옥</span>`:`<span class="lot-emoji">🍃</span><span class="lot-x">꽝</span>`
function rLottery(){
  let st=lotState()
  arcShell('오늘의 옥야 뽑기',`<div class="lot-hero"><div class="lot-hero-emoji">🎁</div><div class="lot-hero-t">오늘의 옥야 뽑기</div><div class="lot-hero-s">카드를 골라 옥야머니를 획득하세요</div></div><div id="lot-body"></div>`)
  const body=document.getElementById('lot-body')
  const cardHTML=(i,o={})=>{let cls='lot-card';if(o.flipped)cls+=' flipped';if(o.win)cls+=' win';if(o.pickedLose)cls+=' picked-lose';return`<button class="${cls}" data-i="${i}"${o.disabled?' disabled':''}><div class="lot-inner"><div class="lot-face lot-front"><span class="lot-q">?</span></div><div class="lot-face lot-back">${o.flipped?lotBackHTML(!!o.win):''}</div></div></button>`}
  function resultStatus(){
    const r=st.result
    const retry=LOT_BETA_RETRY?`<button class="lot-retry" id="lot-retry">다시하기</button>`:`<span class="lot-again">내일 다시 도전!</span>`
    const html=`<div class="lot-status ${r.win?'win':'lose'}">${r.win?`🎉 축하해요! +${r.amount}옥`:'아쉽게 꽝이에요 😅'}${retry}</div>`
    const cur=body.querySelector('.lot-status');if(cur)cur.outerHTML=html;else body.insertAdjacentHTML('beforeend',html)
    const rb=document.getElementById('lot-retry');if(rb)rb.onclick=()=>{st.result=null;saveLotState(st);showReady()}
  }
  function showReady(){
    const win=lotteryWinIndex(st.plays)
    body.innerHTML=`<div class="lot-grid" id="lot-grid">${[0,1,2,3,4].map(i=>cardHTML(i)).join('')}</div><div class="lot-status">${st.plays===0?'5장 중 한 곳에 옥야머니가 숨어 있어요':'재도전! 당첨 위치가 새로 바뀌었어요'}<span class="lot-again">신중하게 골라요</span></div>`
    const grid=document.getElementById('lot-grid')
    grid.querySelectorAll('.lot-card').forEach(c=>c.onclick=async()=>{
      if(grid.dataset.locked)return;grid.dataset.locked='1'
      const i=+c.dataset.i,isWin=i===win,amount=isWin?ARCADE_REWARDS.lottery:0
      c.querySelector('.lot-back').innerHTML=lotBackHTML(isWin);c.classList.add('flipped',isWin?'win':'picked-lose')
      grid.querySelectorAll('.lot-card').forEach(o=>{o.disabled=true;if(o!==c)o.classList.add('dim')})
      setTimeout(()=>grid.querySelectorAll('.lot-card').forEach(o=>{if(o===c)return;const oi=+o.dataset.i;o.querySelector('.lot-back').innerHTML=lotBackHTML(oi===win);o.classList.add('flipped');if(oi===win)o.classList.add('win')}),430)
      st.plays++;st.result={picked:i,win:isWin,amount,winIdx:win};saveLotState(st);arcMarkToday('lottery')
      if(isWin){confettiBurst();popMsg(`+${amount}옥 당첨!`,'🎉');await arcadeReward(amount,'오늘의 옥야 뽑기')}
      else popMsg('꽝! 다시 도전해봐요','🍃')
      resultStatus()
    })
  }
  function showResult(){
    const r=st.result
    body.innerHTML=`<div class="lot-grid">${[0,1,2,3,4].map(i=>cardHTML(i,{flipped:true,win:i===r.winIdx,pickedLose:i===r.picked&&!r.win,disabled:true})).join('')}</div>`
    resultStatus()
  }
  if(st.result)showResult();else showReady()
}