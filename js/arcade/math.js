'use strict';
// [Phase 8] 오늘의 수학 — 직접 입력, 정답 시 보상. 오답이면 다시 도전 가능.
const mathNorm=s=>String(s).trim().toLowerCase().replace(/[\s,]/g,'')
function mathSolvedHTML(q){return`<div class="math-result"><div class="math-res-t">CORRECT · +${q.reward}옥</div><div class="math-res-a">정답: ${esc(q.answer)}</div><div class="math-res-ex">${esc(q.explanation).replace(/\n/g,'<br>')}</div><div class="quiz-again">내일 새 문제로 다시 만나요</div></div>`}
function rMathDaily(){
  const q=mathToday(),done=arcDoneToday('math'),res=arcGet('math_result')
  const solved=done&&res&&res.date===todayKey()&&res.id===q.id
  const qHTML=esc(q.question).replace(/\n/g,'<br>')
  const body=solved?mathSolvedHTML(q)
    :`<div class="math-input-row"><input id="math-ans" type="text" placeholder="정답을 입력하세요" autocomplete="off" autocapitalize="off"><button class="math-submit" id="math-submit">제출</button></div><div id="math-fb"></div>`
  arcShell('오늘의 수학',`<div class="math-card"><div class="math-eyebrow">오늘의 수학</div><div class="math-q">${qHTML}</div></div><div class="math-body">${body}</div>`)
  if(solved)return
  const input=document.getElementById('math-ans'),btn=document.getElementById('math-submit'),fb=document.getElementById('math-fb')
  async function submit(){
    if(btn.disabled)return
    const val=input.value
    if(!mathNorm(val)){toast('정답을 입력해줘');return}
    if(mathNorm(val)===mathNorm(q.answer)){
      btn.disabled=true;input.disabled=true
      arcMarkToday('math');arcSet('math_result',{date:todayKey(),id:q.id,correct:true})
      confettiBurst();popMsg(`정답! +${q.reward}옥`,'🎉');await arcadeReward(q.reward,'오늘의 수학')
      const be=document.querySelector('.math-body');if(be)be.innerHTML=mathSolvedHTML(q)
    }else{
      fb.innerHTML=`<div class="math-fb-wrong">INCORRECT · 다시 도전해봐요</div>`
      input.classList.add('err');input.focus();input.select();setTimeout(()=>input.classList.remove('err'),600)
    }
  }
  btn.onclick=submit
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}})
}
