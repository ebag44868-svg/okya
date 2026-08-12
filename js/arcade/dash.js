'use strict';
// [Phase 7] 옥야 DASH — 횡스크롤 러너(점프/장애물/점수/최고점수). 캐릭터는 asset(dash/player)로 교체 가능.
function rDash(){
  const best0init=arcGet('dash_best',0)||0
  arcShell('옥야 DASH',`<div class="dash-wrap">
    <div class="dash-hud"><span class="dash-score" id="dash-score">0</span><span class="dash-best" id="dash-best">최고 ${best0init}</span></div>
    <div class="dash-stage" id="dash-stage"><canvas id="dash-canvas"></canvas>
      <div class="dash-overlay" id="dash-ov"></div>
    </div>
    <div class="dash-hint">Space · 화면 탭 · 클릭으로 점프</div>
  </div>`,'dash-screen')
  const stage=document.getElementById('dash-stage'),canvas=document.getElementById('dash-canvas'),ctx=canvas.getContext('2d')
  const ov=document.getElementById('dash-ov'),scoreEl=document.getElementById('dash-score'),bestEl=document.getElementById('dash-best')
  let W=0,H=0;const dpr=Math.min(2,window.devicePixelRatio||1)
  function resize(){W=stage.clientWidth;H=stage.clientHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
  resize()
  // 교체 가능한 asset(있으면 이미지, 없으면 placeholder)
  const imgs={};['player','obstacle','background','ground'].forEach(k=>{const u=arcArt('dash',k);if(u){const im=new Image();im.src=u;imgs[k]=im}})
  const groundH=26,pw=40,ph=40,gravity=2300,jumpV=-760,baseSpeed=290
  let state='idle',px=54,py=0,vy=0,speed=baseSpeed,obstacles=[],spawnDist=0,dist=0,score=0,best0=best0init,last=0,raf=0,alive=true
  const groundY=()=>H-groundH
  function reset(){px=54;py=groundY()-ph;vy=0;obstacles=[];spawnDist=Math.max(W*0.55,180);dist=0;score=0;speed=baseSpeed;last=performance.now();state='run';ov.classList.add('hide')}
  function jump(){if(state==='run'){if(py>=groundY()-ph-1){vy=jumpV}}else reset()}
  function showStart(){ov.innerHTML=`<div class="dash-ov-emoji">🐱</div><div class="dash-ov-t">옥야 DASH</div><div class="dash-ov-s">스페이스 · 화면 탭으로 점프</div><button class="dash-start" id="dash-start">시작하기</button>`;ov.classList.remove('hide');bindStart()}
  function showOver(){ov.innerHTML=`<div class="dash-ov-t">GAME OVER</div><div class="dash-ov-score"><div><span>SCORE</span><b>${score}</b></div><div><span>BEST</span><b>${best0}</b></div></div><button class="dash-start" id="dash-start">다시 하기</button>`;ov.classList.remove('hide');bindStart()}
  function bindStart(){const b=document.getElementById('dash-start');if(b)b.onclick=e=>{e.stopPropagation();reset()}}
  function end(){state='over';if(score>best0){best0=score;arcSet('dash_best',score);bestEl.textContent='최고 '+score}showOver()}
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function draw(){
    ctx.clearRect(0,0,W,H)
    if(imgs.background&&imgs.background.complete&&imgs.background.naturalWidth)ctx.drawImage(imgs.background,0,0,W,H)
    else{const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#EAF4FF');g.addColorStop(1,'#DCEBF7');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
    const gy=groundY()
    if(imgs.ground&&imgs.ground.complete&&imgs.ground.naturalWidth)ctx.drawImage(imgs.ground,0,gy,W,groundH)
    else{ctx.fillStyle='#CFE0EE';ctx.fillRect(0,gy,W,groundH);ctx.strokeStyle='#B4CADD';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,gy+1);ctx.lineTo(W,gy+1);ctx.stroke()}
    for(const o of obstacles){const oy=gy-o.h;if(imgs.obstacle&&imgs.obstacle.complete&&imgs.obstacle.naturalWidth)ctx.drawImage(imgs.obstacle,o.x,oy,o.w,o.h);else{ctx.fillStyle='#7B6CFF';roundRect(o.x,oy,o.w,o.h,5);ctx.fill()}}
    if(imgs.player&&imgs.player.complete&&imgs.player.naturalWidth)ctx.drawImage(imgs.player,px,py,pw,ph)
    else{ctx.font=`${ph}px sans-serif`;ctx.textBaseline='top';ctx.fillText('🐱',px,py)}
  }
  function frame(now){
    if(!alive||!document.body.contains(canvas)){cleanup();return}
    raf=requestAnimationFrame(frame)
    const dt=Math.min(0.045,(now-last)/1000);last=now
    if(state==='run'){
      dist+=speed*dt;score=Math.floor(dist/26);scoreEl.textContent=score
      speed=baseSpeed+Math.min(260,dist/55)
      vy+=gravity*dt;py+=vy*dt;const gy=groundY()-ph;if(py>gy){py=gy;vy=0}
      spawnDist-=speed*dt;if(spawnDist<=0){const h=22+Math.random()*30,w=16+Math.random()*16;obstacles.push({x:W+8,w,h});spawnDist=Math.max(speed*0.92,170)+Math.random()*150}
      for(const o of obstacles)o.x-=speed*dt
      obstacles=obstacles.filter(o=>o.x+o.w>-12)
      const gy2=groundY()
      for(const o of obstacles){const oy=gy2-o.h;if(px+pw-7>o.x&&px+7<o.x+o.w&&py+ph-5>oy){end();break}}
    }
    draw()
  }
  function onResize(){resize()}
  function cleanup(){alive=false;cancelAnimationFrame(raf);window.removeEventListener('keydown',onKey);window.removeEventListener('resize',onResize)}
  function onKey(e){if(e.code==='Space'||e.key===' '||e.key==='ArrowUp'){e.preventDefault();jump()}}
  window.addEventListener('keydown',onKey)
  window.addEventListener('resize',onResize)
  stage.addEventListener('pointerdown',()=>{if(state==='run')jump()})
  py=groundY()-ph;showStart();raf=requestAnimationFrame(frame)
}