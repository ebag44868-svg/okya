'use strict';
// [Phase 6] 옥야 퀴즈 — 하루 한 문제, 정답 시 보상
function quizFeedbackHTML(q,correct){return`<div class="quiz-feedback ${correct?'correct':'wrong'}"><div class="quiz-fb-t">${correct?`정답이에요! +${q.reward}옥`:'아쉬워요, 오답이에요'}</div><div class="quiz-fb-ex">${esc(q.explanation)}</div><div class="quiz-again">내일 새 문제로 다시 만나요</div></div>`}
function rQuiz(){
  const q=quizToday(),done=arcDoneToday('quiz'),res=arcGet('quiz_result')
  const revealed=done&&res&&res.date===todayKey()&&res.qid===q.id
  const opts=q.options.map((o,i)=>{
    let cls='quiz-opt'
    if(revealed){cls+=' revealed';if(i===q.answer)cls+=' correct';else if(i===res.picked)cls+=' wrong'}
    return`<button class="${cls}" data-i="${i}"${done?' disabled':''}><span class="quiz-opt-k">${String.fromCharCode(65+i)}</span><span class="quiz-opt-t">${esc(o)}</span></button>`
  }).join('')
  const fb=revealed?quizFeedbackHTML(q,res.correct):''
  arcShell('옥야 퀴즈',`<div class="quiz-card"><div class="quiz-eyebrow">오늘의 퀴즈</div><div class="quiz-q">${esc(q.question)}</div><div class="quiz-opts" id="quiz-opts">${opts}</div></div><div id="quiz-fb">${fb}</div>`)
  if(done)return
  document.querySelectorAll('#quiz-opts .quiz-opt').forEach(b=>b.onclick=async()=>{
    const box=document.getElementById('quiz-opts');if(box.dataset.locked)return;box.dataset.locked='1'
    const i=+b.dataset.i,correct=i===q.answer
    document.querySelectorAll('#quiz-opts .quiz-opt').forEach(o=>{o.disabled=true;o.classList.add('revealed');const oi=+o.dataset.i;if(oi===q.answer)o.classList.add('correct');else if(oi===i)o.classList.add('wrong')})
    arcMarkToday('quiz');arcSet('quiz_result',{date:todayKey(),qid:q.id,picked:i,correct})
    if(correct){confettiBurst();popMsg(`정답! +${q.reward}옥`,'🎉');await arcadeReward(q.reward,'옥야 퀴즈')}
    else popMsg('오답이에요','😅')
    const el=document.getElementById('quiz-fb');if(el)el.innerHTML=quizFeedbackHTML(q,correct)
  })
}