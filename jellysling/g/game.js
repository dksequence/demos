'use strict';
const cv=document.getElementById('cv'), ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
let LW=200, LH=440, DPR=1, SCALE=1;
// WebView 로드시 innerWidth/Height 0 가능 → 폴백(캔버스 0/SCALE0 방지).
function _vw(){ return window.innerWidth||document.documentElement.clientWidth||cv.clientWidth||(window.screen&&window.screen.width)||360; }
function _adH(){ try{ return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ad-h'))||0; }catch(_){ return 0; } } // 하단 배너 높이(monetize.js)
function _vh(){ return Math.max(1,(window.innerHeight||document.documentElement.clientHeight||cv.clientHeight||(window.screen&&window.screen.height)||640)-_adH()); }
function resize(){ const w=_vw(),h=_vh(); DPR=Math.min(window.devicePixelRatio||1,3); LW=200; LH=Math.round(200*h/w);
  cv.width=Math.round(w*DPR); cv.height=Math.round(h*DPR); cv.style.width='100%'; cv.style.height='calc(100% - var(--ad-h,0px))'; SCALE=cv.width/LW; }
addEventListener('resize',resize);
addEventListener('orientationchange',resize);
if(window.visualViewport) visualViewport.addEventListener('resize',resize);
resize();
requestAnimationFrame(()=>{ if(Math.abs(_vw()*Math.min(window.devicePixelRatio||1,3)-cv.width)>2) resize(); });

// ── 상수(손맛 튜닝) ──
const G=0.42, MAXPULL=58, MAXSPEED=13, SPEEDK=MAXSPEED/MAXPULL;
const JR=9.5;               // 젤리 반경
const SNAP_R=16;            // 펙 캐치 반경
const PEG_GAP=96;           // 펙 수직 간격
const FLOOD_V=0.16;         // 상승 데스라인 속도
const SLOWMO=0.32;

// ── 상태 ──
let state='menu';           // menu | attached | aim | fly | dead
let jelly={x:0,y:0,vx:0,vy:0};
let camY=0, floodY=0, startY=0, height=0, best=+(localStorage.getItem('js_best')||0);
let pegs=[], candies=[], saws=[], parts=[];
let curPeg=null, lastFromPeg=null, originCD=0;
let aiming=false, dragX=0, dragY=0;          // 월드 좌표(클램프 후)
let combo=0, bestCombo=0, candyN=0, jScale=1, flashG=0;
let bounceTimer=0;          // 바운시 자동발사
let comboFxT=0;
let spawnY=0, lastPegX=100, pegN=0;

// ── 바이옴(높이로 변신) ──
const BIOMES=[
  {t:'#e6c98a',b:'#caa15e',pat:'holes'},   // 타공판
  {t:'#8a6240',b:'#5f4226',pat:'holes'},   // 책장
  {t:'#46565e',b:'#283238',pat:'holes'},   // 캐비넷
  {t:'#a9cbe0',b:'#6f9ec4',pat:'none'},    // 아파트
  {t:'#cfeeff',b:'#7ec8ff',pat:'none'},    // 구름
  {t:'#3a2a6a',b:'#160f30',pat:'stars'},   // 우주
];
const BIOME_H=130;          // 바이옴당 높이(m)
function lerpC(a,b,f){ const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);
  const r=((pa>>16)&255)+(((pb>>16)&255)-((pa>>16)&255))*f, g=((pa>>8)&255)+(((pb>>8)&255)-((pa>>8)&255))*f, bl=(pa&255)+((pb&255)-(pa&255))*f;
  return 'rgb('+(r|0)+','+(g|0)+','+(bl|0)+')'; }
function biomeAt(h){ const x=Math.max(0,h/BIOME_H), i=Math.min(BIOMES.length-1,Math.floor(x)), j=Math.min(BIOMES.length-1,i+1), f=x-Math.floor(x);
  return { top:lerpC(BIOMES[i].t,BIOMES[j].t,f), bot:lerpC(BIOMES[i].b,BIOMES[j].b,f), pat:BIOMES[i].pat, idx:i }; }

// ── 펙 ──
const PEGCOL={static:'#f3e6c0', moving:'#7fc7ff', bouncy:'#ff8ad0', fade:'#9af0c0'};
function spawnPeg(){
  const dxMax=108; let x=lastPegX+(Math.random()*2-1)*dxMax; x=Math.max(26,Math.min(LW-26,x)); lastPegX=x;
  const r=Math.random(); let type='static';
  if(height>40){ if(r<0.22)type='moving'; else if(r<0.34)type='bouncy'; else if(r<0.44)type='fade'; }
  pegs.push({x, y:spawnY, type, baseX:x, ph:Math.random()*6.28, amp:18+Math.random()*16, op:1});
  pegN++;
  const cx=x+(Math.random()*2-1)*26, cy=spawnY+PEG_GAP*0.5;
  if(pegN<=3 || Math.random()<0.26) candies.push({x:cx, y:cy, got:false, kind:'grow'});   // 초반 3펙 보장 + 이후 자주
  else if(Math.random()<0.5) candies.push({x:cx, y:cy, got:false, kind:'star'});
  if(height>120 && Math.random()<0.16) saws.push({x:Math.max(30,Math.min(LW-30,x+(Math.random()<0.5?-40:40))), y:spawnY+PEG_GAP*0.4, ang:0});
  spawnY-=PEG_GAP;
}

// ── 게임 흐름 ──
function startGame(){ AC(); if(actx.resume)actx.resume();
  menuDemo=false; $('hud').style.visibility=''; state='attached'; pegs=[]; candies=[]; saws=[]; parts=[]; combo=0; candyN=0; comboFxT=0; jScale=1; flashG=0;
  startY=0; jelly={x:LW/2,y:0,vx:0,vy:0}; curPeg={x:LW/2,y:0,type:'static',baseX:LW/2,ph:0,amp:0,op:1}; pegs.push(curPeg);
  lastFromPeg=null; originCD=0; lastPegX=LW/2; spawnY=-PEG_GAP; height=0; pegN=0;
  camY=jelly.y-LH*0.6; floodY=jelly.y+LH*0.55;
  for(let i=0;i<8;i++) spawnPeg();
  $('startScreen').style.display='none'; $('overScreen').style.display='none'; jq=0; jqv=0; wob=0;
}
function die(){ if(state==='dead')return; state='dead'; $('combo').style.opacity='0'; sDie(); if(navigator.vibrate)navigator.vibrate(80);
  for(let i=0;i<16;i++) parts.push({x:jelly.x,y:jelly.y,vx:(Math.random()*2-1)*3,vy:(Math.random()*2-1)*3-1,life:1,col:'255,140,200'});
  if(height>best){ best=height; localStorage.setItem('js_best',best);
    if(window.Rv) Rv.moment(); } // 최고 높이 갱신 = 좋은 순간
  $('finalH').textContent=height; $('finalC').textContent=candyN; $('bestH').textContent=best; $('bestCombo').textContent=bestCombo;
  const rb=$('retryBtn'); rb.disabled=true; setTimeout(()=>{ rb.disabled=false; },700);   // 게임오버 직후 오탭 방지(0.7초)
  $('overScreen').style.display='flex'; }
$('startBtn').addEventListener('click',startGame);
if(best>0){ $('bestT').textContent=best; $('bestRow').style.display=''; }
$('retryBtn').addEventListener('click',startGame);

// ── 입력 ──
function toWorld(e){ const lx=(e.clientX/innerWidth)*LW, ly=(e.clientY/_vh())*LH; return {x:lx, y:ly+camY}; }
// 2026-10-07 광고 겹침 감사: 화면 어디를 눌러도 새총을 당긴다 — 배너 바로 위 8px 는 받침 띠(adGuard)가 받아 조준을 시작하지 않는다(배너 오클릭 방지).
(function(){ const g=document.createElement('div'); g.id='adGuard'; g.style.cssText='position:fixed;left:0;right:0;bottom:var(--ad-h,0px);height:8px;z-index:9;'; document.body.appendChild(g); })();
function pdown(e){ if(e.target.closest('button'))return; if(e.target.id==='adGuard')return; if(state!=='attached')return; aiming=true; state='aim'; updateDrag(e); }
function updateDrag(e){ const w=toWorld(e); let dx=w.x-curPeg.x, dy=w.y-curPeg.y; const d=Math.hypot(dx,dy);
  if(d>MAXPULL){ dx=dx/d*MAXPULL; dy=dy/d*MAXPULL; } dragX=curPeg.x+dx; dragY=curPeg.y+dy; }
function pmove(e){ if(aiming) updateDrag(e); }
function pup(e){ if(!aiming)return; aiming=false;
  const dvx=dragX-curPeg.x, dvy=dragY-curPeg.y, d=Math.hypot(dvx,dvy);
  if(d<7){ state='attached'; return; }                       // 너무 살짝 = 취소
  jelly.x=dragX; jelly.y=dragY; jelly.vx=-dvx*SPEEDK*jScale; jelly.vy=-dvy*SPEEDK*jScale;
  lastFromPeg=curPeg; curPeg=null; originCD=16; state='fly'; jq=0.28; jqv=0; wob=0.25; sBoing(Math.min(1,d/MAXPULL)); }
addEventListener('pointerdown',pdown); addEventListener('pointermove',pmove); addEventListener('pointerup',pup); addEventListener('pointercancel',pup);

// ── 젤리 변형(스프링) ──
let jq=0, jqv=0, wob=0;
function springJelly(){ jqv += (-jq)*0.55 - jqv*0.11; jq += jqv*0.5; wob*=0.9; if(flashG>0.02)flashG*=0.9; else flashG=0; }   // 낮은 감쇠=여러 번 통통

function doCatch(p){ state='attached'; curPeg=p; jelly.x=p.x; jelly.y=p.y; jelly.vx=0; jelly.vy=0;
  jq=-0.5; jqv=0; wob=0.5; combo++; if(combo>bestCombo)bestCombo=combo; comboFxT=40;
  ringPulse(p.x,p.y); sCatch(combo);
  if(p.type==='bouncy') bounceTimer=9;
}
function ringPulse(x,y){ parts.push({ring:1,x,y,r:SNAP_R,life:1,col:'255,255,255'}); }

// ── 업데이트 ──
// 광고가 화면을 덮었거나, 앱이 뒤로 갔거나, 설정 창이 열려 있으면 판을 멈춘다(입력 없이 홍수에 잠기는 일 방지)
function paused(){ if(document.hidden) return true; if(window.Monetize&&Monetize.adCovering) return true;
  const ov=document.getElementById('mzOv'); return !!(ov&&ov.classList.contains('on')); }
function update(){
  if(state!=='menu'&&state!=='dead'&&paused()) return;
  if(state==='menu'||state==='dead'){ for(const p of parts){ p.x+=p.vx||0; p.y+=p.vy||0; if(p.vy!=null)p.vy+=0.12; if(p.ring)p.r+=2.5; p.life-=0.04; } parts=parts.filter(p=>p.life>0); return; }
  const ts = (state==='aim')?SLOWMO:1;

  // 펙 이동/페이드
  const t=performance.now()/1000;
  for(const p of pegs){ if(p.type==='moving') p.x=p.baseX+Math.sin(t*1.6+p.ph)*p.amp; if(p.type==='fade') p.op=0.35+0.65*(0.5+0.5*Math.sin(t*1.8+p.ph)); }
  for(const s of saws) s.ang+=0.14*ts;

  if(state==='attached'){ jelly.x=curPeg.x; jelly.y=curPeg.y;
    if(bounceTimer>0){ bounceTimer-=ts; if(bounceTimer<=0){ jelly.vx=(Math.random()*2-1)*2.5; jelly.vy=-11; lastFromPeg=curPeg; curPeg=null; originCD=16; state='fly'; jq=0.3; wob=0.3; sBoing(0.8); } }
  }
  if(state==='fly'){
    jelly.vy+=G*ts; jelly.x+=jelly.vx*ts; jelly.y+=jelly.vy*ts;
    const r=JR*jScale; if(jelly.x<r){ jelly.x=r; jelly.vx=Math.abs(jelly.vx)*0.7; } if(jelly.x>LW-r){ jelly.x=LW-r; jelly.vx=-Math.abs(jelly.vx)*0.7; }
    if(originCD>0) originCD-=ts;
    for(const p of pegs){ if(p===lastFromPeg && originCD>0) continue; if(p.type==='fade'&&p.op<0.55) continue;
      if(Math.hypot(jelly.x-p.x,jelly.y-p.y)<SNAP_R+(jScale-1)*JR*0.7){ doCatch(p); break; } }
    for(const s of saws){ if(Math.hypot(jelly.x-s.x,jelly.y-s.y)<11){ die(); return; } }
  }
  // 별사탕
  for(const c of candies){ if(!c.got && Math.hypot(jelly.x-c.x,jelly.y-c.y)<13+(jScale-1)*JR*0.7){ c.got=true;
    if(c.kind==='grow'){ jScale=Math.min(2.6,jScale+0.2); jq=-0.45; jqv=0; wob=0.55; flashG=1; sGrow();
      for(let k=0;k<12;k++) parts.push({x:c.x,y:c.y,vx:(Math.random()*2-1)*2.4,vy:(Math.random()*2-1)*2.4,life:1,col:'255,120,230'}); }
    else { candyN++; sCandy(); parts.push({x:c.x,y:c.y,vx:0,vy:-1,life:1,col:'255,225,80'}); } } }

  // 카메라(위로만)
  const target=jelly.y-LH*0.6; if(target<camY) camY+=(target-camY)*0.18;
  // 상승 데스라인
  floodY-=FLOOD_V*ts; if(floodY>camY+LH+50) floodY=camY+LH+50;
  if(jelly.y>=floodY){ die(); return; }
  // 스폰/컬링
  while(spawnY > camY-60) spawnPeg();
  pegs=pegs.filter(p=>p.y<camY+LH+80); candies=candies.filter(c=>!c.got && c.y<camY+LH+80); saws=saws.filter(s=>s.y<camY+LH+80);
  // 높이/HUD
  height=Math.max(height,Math.round((startY-jelly.y)/8));
  springJelly();
  for(const p of parts){ p.x+=p.vx||0; p.y+=p.vy||0; if(p.vy!=null)p.vy+=0.12; if(p.ring)p.r+=2.5; p.life-=0.04; } parts=parts.filter(p=>p.life>0);
  if(comboFxT>0)comboFxT--;
  $('height').textContent=height+' m'; $('candy').textContent='⭐ '+candyN;
  const cE=$('combo'); if(combo>=2 && comboFxT>0){ cE.textContent='COMBO ×'+combo; cE.style.opacity='1'; } else cE.style.opacity='0';
}

// ── 오디오 ──
let actx=null,mg=null;
function AC(){ if(!actx){ actx=new (window.AudioContext||window.webkitAudioContext)(); mg=actx.createGain(); mg.gain.value=0.5; mg.connect(actx.destination);} return actx; }
function tone(f,type,t,dur,vol,bend){ const c=AC(),o=c.createOscillator(),g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(bend)o.frequency.exponentialRampToValueAtTime(bend,t+dur);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g).connect(mg); o.start(t); o.stop(t+dur+0.02); }
function noise(t,dur,vol,lp){ const c=AC(),n=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0); for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource(); s.buffer=b; const g=c.createGain(); g.gain.value=vol; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp||1200; s.connect(f); f.connect(g); g.connect(mg); s.start(t); }
function nf(m){ return 440*Math.pow(2,(m-69)/12); }
const SCALE_NOTES=[60,62,64,67,69,72,74,76,79,81,84];
function sBoing(p){ try{ const t=AC().currentTime; tone(260+p*120,'sine',t,0.18,0.3, 120); tone(180,'triangle',t,0.14,0.12);}catch(_){}}
function sCatch(c){ try{ const t=AC().currentTime; noise(t,0.05,0.18,1800); const n=SCALE_NOTES[Math.min(c-1,SCALE_NOTES.length-1)]; tone(nf(n),'sine',t+0.01,0.16,0.26);}catch(_){}}
function sCandy(){ try{ const t=AC().currentTime; tone(nf(88),'square',t,0.05,0.2); tone(nf(93),'square',t+0.05,0.09,0.2);}catch(_){}}
function sGrow(){ try{ const t=AC().currentTime; [60,67,72,76,79].forEach((m,i)=>tone(nf(m),'sine',t+i*0.06,0.2,0.24)); tone(180,'triangle',t,0.34,0.16,440);}catch(_){}}
function sDie(){ try{ const t=AC().currentTime; [69,64,60,55].forEach((m,i)=>tone(nf(m),'sawtooth',t+i*0.08,0.14,0.22, nf(m)*0.6)); noise(t,0.3,0.16,700);}catch(_){}}

// ── 렌더 ──
function rrp(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function drawBG(){ const h=Math.max(height, Math.round((startY-camY-LH*0.6)/8)); const bi=biomeAt(h);
  const g=ctx.createLinearGradient(0,0,0,LH); g.addColorStop(0,bi.top); g.addColorStop(1,bi.bot); ctx.fillStyle=g; ctx.fillRect(0,0,LW,LH);
  // 패턴(패럴랙스)
  const off=((-camY*0.5)%28+28)%28;
  if(bi.pat==='holes'){ for(let yy=-28+off; yy<LH+28; yy+=28) for(let xx=14; xx<LW; xx+=28){
      ctx.fillStyle='rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.arc(xx+0.5,yy+0.7,3.3,0,7); ctx.fill();      // 아래쪽 모서리 빛(뚫린 판 두께)
      ctx.fillStyle='rgba(40,20,10,0.30)'; ctx.beginPath(); ctx.arc(xx,yy,3.1,0,7); ctx.fill();                 // 구멍 안 그늘
      ctx.fillStyle='rgba(20,8,4,0.22)'; ctx.beginPath(); ctx.arc(xx-0.4,yy-0.5,2.2,0,7); ctx.fill(); } }
  else if(bi.pat==='stars'){ ctx.fillStyle='rgba(255,255,255,0.7)'; for(let i=0;i<26;i++){ const sx=(i*71)%LW, sy=((i*53 - camY*0.4)%LH+LH)%LH; ctx.globalAlpha=0.3+0.5*Math.abs(Math.sin(i+performance.now()/600)); ctx.fillRect(sx,sy,1.6,1.6);} ctx.globalAlpha=1; }
  // 위쪽 따뜻한 조명(깊이)
  const lt=ctx.createRadialGradient(LW*0.5,-LH*0.05,4,LW*0.5,-LH*0.05,LH*0.75); lt.addColorStop(0,'rgba(255,244,214,0.34)'); lt.addColorStop(1,'rgba(255,244,214,0)'); ctx.fillStyle=lt; ctx.fillRect(0,0,LW,LH);
  // 좌우 비네트
  const v=ctx.createLinearGradient(0,0,LW,0); v.addColorStop(0,'rgba(40,10,30,0.30)'); v.addColorStop(0.14,'rgba(0,0,0,0)'); v.addColorStop(0.86,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(40,10,30,0.30)'); ctx.fillStyle=v; ctx.fillRect(0,0,LW,LH);
}
function drawPeg(p){ const sy=p.y-camY; const col=PEGCOL[p.type]; ctx.globalAlpha=p.type==='fade'?p.op:1;
  const hl=ctx.createRadialGradient(p.x,sy,6,p.x,sy,17); hl.addColorStop(0,col+'88'); hl.addColorStop(1,col+'00'); ctx.fillStyle=hl; ctx.beginPath(); ctx.arc(p.x,sy,17,0,7); ctx.fill();   // 종류 색 후광
  ctx.fillStyle='rgba(50,20,30,0.30)'; ctx.beginPath(); ctx.arc(p.x+1.2,sy+3,8.8,0,7); ctx.fill();           // 그림자
  ctx.fillStyle='#3a2f44'; ctx.beginPath(); ctx.arc(p.x,sy,8.5,0,7); ctx.fill();                          // 외륜
  ctx.fillStyle=col; ctx.beginPath(); ctx.arc(p.x,sy,6.5,0,7); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(p.x-2,sy-2.2,2.2,0,7); ctx.fill();      // 하이라이트
  if(p.type==='bouncy'){ ctx.strokeStyle='#fff'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(p.x,sy,3,0.3,5.2); ctx.stroke(); }
  if(p.type==='moving'){ ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(p.x-3,sy-0.7,6,1.4); }
  ctx.globalAlpha=1; }
function drawCandy(c){ const sy=c.y-camY; const t=performance.now()/300; ctx.save(); ctx.translate(c.x,sy+Math.sin(t+c.x)*1.6);
  if(c.kind==='grow'){ ctx.globalCompositeOperation='lighter'; const gl=ctx.createRadialGradient(0,0,0,0,0,14); gl.addColorStop(0,'rgba(255,120,235,0.75)'); gl.addColorStop(1,'rgba(255,120,235,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,14,0,7); ctx.fill(); ctx.globalCompositeOperation='source-over';
    const pp=1+Math.sin(t*2)*0.08; ctx.scale(pp,pp); ctx.rotate(t); ctx.fillStyle='#ff5fd0'; star(0,0,6,7,3); ctx.fill(); ctx.fillStyle='#fff'; star(0,0,6,3.4,1.7); ctx.fill();
    ctx.rotate(-t); ctx.fillStyle='#7a1858'; ctx.beginPath(); ctx.arc(0,0,1.5,0,7); ctx.fill(); }
  else { ctx.rotate(t*0.6); ctx.fillStyle='#ffd23f'; star(0,0,5,5.5,2.6); ctx.fill(); ctx.fillStyle='rgba(255,255,255,0.7)'; star(0,0,5,2.6,1.2); ctx.fill(); }
  ctx.restore(); }
function star(cx,cy,n,ro,ri){ ctx.beginPath(); for(let i=0;i<n*2;i++){ const a=Math.PI*i/n - Math.PI/2, r=i%2?ri:ro; const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.closePath(); }
function drawSaw(s){ const sy=s.y-camY; ctx.save(); ctx.translate(s.x,sy); ctx.rotate(s.ang);
  ctx.fillStyle='#cfd6df'; const teeth=8; ctx.beginPath(); for(let i=0;i<teeth*2;i++){ const a=Math.PI*i/teeth, r=i%2?7:11; const x=Math.cos(a)*r,y=Math.sin(a)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.closePath(); ctx.fill();
  ctx.fillStyle='#8a929e'; ctx.beginPath(); ctx.arc(0,0,4,0,7); ctx.fill(); ctx.fillStyle='#ff7043'; ctx.beginPath(); ctx.arc(0,0,2,0,7); ctx.fill(); ctx.restore(); }
function blob(r,w,ph){ ctx.beginPath(); const N=22;
  for(let i=0;i<=N;i++){ const a=i/N*6.2832, rr=r*(1+w*(Math.sin(a*3+ph)*0.5+Math.sin(a*2-ph*0.8)*0.5));
    const px=Math.cos(a)*rr, py=Math.sin(a)*rr; i?ctx.lineTo(px,py):ctx.moveTo(px,py); } ctx.closePath(); }
function drawJelly(){ let x=jelly.x, y=jelly.y-camY, ang=0, stretch=0; const R=JR*jScale;
  if(state==='aim'){ x=dragX; y=dragY-camY; const dx=dragX-curPeg.x, dy=dragY-curPeg.y; ang=Math.atan2(dy,dx); stretch=Math.min(0.6,Math.hypot(dx,dy)/MAXPULL*0.65); }
  else if(state==='fly'){ const s=Math.hypot(jelly.vx,jelly.vy); ang=Math.atan2(jelly.vy,jelly.vx); stretch=Math.min(0.5,s*0.03); }
  const ph=performance.now()/120;
  ctx.save(); ctx.translate(x,y);
  if(state==='attached'){ const br=Math.sin(performance.now()/280)*0.04; ctx.scale(1-jq*0.65-br, 1+jq+br); }                 // 캐치 스쿼시+숨쉬기(얼굴 포함)
  else { ctx.rotate(ang); ctx.scale(1+stretch, 1-stretch*0.55); ctx.rotate(-ang); }                                          // 방향 축 스케일 → 몸+얼굴 같이 늘어남
  // 판 위 그림자
  ctx.save(); ctx.translate(R*0.16,R*0.32); ctx.fillStyle='rgba(70,20,50,0.28)'; blob(R*1.02,wob,ph); ctx.fill(); ctx.restore();
  // 몸체
  const g=ctx.createRadialGradient(-R*0.3,-R*0.4,1,0,0,R+2); g.addColorStop(0,'rgba(255,205,238,0.98)'); g.addColorStop(0.55,'rgba(255,120,200,0.95)'); g.addColorStop(1,'rgba(214,66,158,0.92)');
  ctx.fillStyle=g; blob(R,wob,ph); ctx.fill(); ctx.strokeStyle='rgba(180,40,120,0.45)'; ctx.lineWidth=1; ctx.stroke();
  // 얼굴 — 같은 늘어남 프레임 안(=얼굴도 늘어남), 크기는 jScale
  ctx.scale(jScale,jScale);
  ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(-JR*0.3,-JR*0.4,2.4,1.5,-0.5,0,7); ctx.fill();
  ctx.fillStyle='#3a1430'; ctx.beginPath(); ctx.arc(-2.7,-0.4,1.4,0,7); ctx.arc(2.7,-0.4,1.4,0,7); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(-2.2,-0.9,0.55,0,7); ctx.arc(3.2,-0.9,0.55,0,7); ctx.fill();
  ctx.strokeStyle='#3a1430'; ctx.lineWidth=1; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(0,1.9,2,0.12*Math.PI,0.88*Math.PI); ctx.stroke(); ctx.lineCap='butt';
  ctx.restore(); }
function drawSling(){ if(state!=='aim')return; const px=curPeg.x, py=curPeg.y-camY, jx=dragX, jy=dragY-camY;
  const ax=jx-px, ay=jy-py, len=Math.hypot(ax,ay)||1, nx=-ay/len, ny=ax/len, f=Math.min(1,len/MAXPULL);
  // 말랑이 몸체가 고무줄처럼 늘어남(핑크 taffy, 당길수록 가늘어짐)
  const wHead=JR*jScale*0.82*(1-0.18*f), wPeg=Math.max(2.5, JR*jScale*0.42*(1-0.6*f));
  const g=ctx.createLinearGradient(px,py,jx,jy); g.addColorStop(0,'rgba(232,90,175,0.92)'); g.addColorStop(1,'rgba(255,140,205,0.95)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(px+nx*wPeg,py+ny*wPeg); ctx.lineTo(jx+nx*wHead,jy+ny*wHead); ctx.lineTo(jx-nx*wHead,jy-ny*wHead); ctx.lineTo(px-nx*wPeg,py-ny*wPeg); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(px,py,wPeg,0,7); ctx.fill();                                      // 펙쪽 앵커
  ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(jx,jy); ctx.stroke();
  // 궤적(발사 방향=위, 크기 반영)
  let tvx=-(dragX-curPeg.x)*SPEEDK*jScale, tvy=-(dragY-curPeg.y)*SPEEDK*jScale, sx=jx, sy=jy; ctx.fillStyle='#fff';
  for(let i=0;i<14;i++){ tvy+=G; sx+=tvx; sy+=tvy; ctx.globalAlpha=0.85*(1-i/14); ctx.beginPath(); ctx.arc(sx,sy,2.4,0,7); ctx.fill(); }
  ctx.globalAlpha=1; }
function drawFlood(){ const sy=floodY-camY;
  if(sy>LH-6){ const k=Math.max(0.28,Math.min(1,1-(sy-LH)/120)); const wg=ctx.createLinearGradient(0,LH-46,0,LH); wg.addColorStop(0,'rgba(255,70,120,0)'); wg.addColorStop(1,'rgba(255,70,120,'+(0.42*k).toFixed(3)+')'); ctx.fillStyle=wg; ctx.fillRect(0,LH-46,LW,46); }
  if(sy>LH+20)return;
  const g=ctx.createLinearGradient(0,sy-10,0,LH); g.addColorStop(0,'rgba(255,60,90,0)'); g.addColorStop(0.3,'rgba(255,70,110,0.55)'); g.addColorStop(1,'rgba(200,20,60,0.8)'); ctx.fillStyle=g; ctx.fillRect(0,sy-10,LW,LH-(sy-10)+12);
  ctx.fillStyle='rgba(255,180,190,0.9)'; for(let x=0;x<LW;x+=14){ ctx.beginPath(); ctx.arc(x+ (performance.now()/200%14), sy+Math.sin(x+performance.now()/200)*2,2.2,0,7); ctx.fill(); } }
function drawParts(){ for(const p of parts){ ctx.globalAlpha=Math.max(0,p.life); if(p.ring){ ctx.strokeStyle='rgba('+p.col+','+p.life+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p.x,p.y-camY,p.r,0,7); ctx.stroke(); }
  else { ctx.fillStyle='rgb('+p.col+')'; ctx.beginPath(); ctx.arc(p.x,p.y-camY,2.4,0,7); ctx.fill(); } } ctx.globalAlpha=1; }

// ── 타이틀 장면(메뉴 동안 실제 게임 그림으로 첫 화면을 채움) ──
let menuDemo=true; const MZ=1.4;
function menuScene(){ pegs=[]; candies=[]; saws=[]; parts=[];
  const P=[[100,0,'static'],[113,-38,'static'],[40,-14,'fade'],[48,52,'bouncy'],[164,26,'moving']];
  for(const [x,y,type] of P) pegs.push({x,y,type,baseX:x,ph:0,amp:0,op:type==='fade'?0.75:1});
  candies.push({x:104,y:-12,got:false,kind:'star'},{x:156,y:-24,got:false,kind:'grow'},{x:72,y:-40,got:false,kind:'star'});
  curPeg=pegs[0]; jelly={x:100,y:0,vx:0,vy:0}; jScale=1.5; wob=0.12; height=0; startY=0; }
menuScene(); $('hud').style.visibility='hidden';   // 타이틀에선 0 m·별 숫자 숨김
function draw(){ ctx.setTransform(SCALE,0,0,SCALE,0,0); ctx.imageSmoothingEnabled=true;
  if(state==='menu'&&menuDemo){ const vh=LH/MZ, t=performance.now()/1000, k=0.82+0.18*Math.sin(t*2.4);
    camY=-0.5*vh; floodY=camY+0.95*vh; dragX=curPeg.x-7*k; dragY=curPeg.y+36*k;
    ctx.setTransform(SCALE*MZ,0,0,SCALE*MZ,SCALE*LW/2*(1-MZ),0);
    drawBG(); for(const c of candies) drawCandy(c); for(const p of pegs) drawPeg(p);
    state='aim'; drawSling(); drawJelly(); state='menu'; drawFlood(); drawParts(); return; }
  drawBG();
  for(const c of candies) if(!c.got) drawCandy(c);
  for(const p of pegs) drawPeg(p);
  for(const s of saws) drawSaw(s);
  drawSling();
  drawParts();
  if(state!=='menu') drawJelly();
  drawFlood();
  if(flashG>0.02){ ctx.fillStyle='rgba(255,140,230,'+(flashG*0.28).toFixed(3)+')'; ctx.fillRect(0,0,LW,LH); }
}
function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();
