// game.js — 치즈 쭈욱 버티컬 슬라이스 (three r160 오소그래픽 2.5D)
// 규율: 프레임당 힙 할당 0 · WebGL 컨텍스트 1개 · 오버레이는 전부 HTML
import * as THREE from './vendor/three.module.js';
import { makeSim, resetSim, simFrame, lambdaBreak, clamp, CHEESES } from './cheese.js';
import * as ui from './ui.js';
import * as store from './store.js';
import * as ads from './ads.js';
import { makeLevel, judge, TOTAL } from './levels.js';
import { initLocale, t } from './i18n.js';
import { E, tween, updateTweens, Burst, Popup, squash } from './fx.js';
import * as A from './audio.js';
import { createSkyline, MARKS, markIndexFor } from './skyline.js';

const Q = new URLSearchParams(location.search);
const AUTO = Q.has('auto');
const FAST = Q.has('fast');
const DEBUG = Q.has('dbg');
const VY = parseFloat(Q.get('vy') || '0') || 0;   // 검수 전용: 세상 고도를 강제로 올려 고고도 배경을 눈으로 본다

// ---------- DOM ----------
const wrap = document.getElementById('wrap');
const elLen = document.getElementById('len');
const elBest = document.getElementById('best');
const elMsg = document.getElementById('msg');
const elTip = document.getElementById('tip');
const elWarn = document.getElementById('warn');
const elFlash = document.getElementById('flash');
const elDbg = document.getElementById('dbg');
const elGoalBar = document.getElementById('goalbar');
const elGoalFill = document.getElementById('goalfill');
const elHint = document.getElementById('hint');
const popup = new Popup(document.getElementById('pops'), 6);
const elChain = document.getElementById('chain');
const elKeep = document.getElementById('btnKeep');
elKeep.addEventListener('click', (e) => { e.stopPropagation(); A.play('ui'); finishRun(false); });
elKeep.addEventListener('pointerdown', (e) => e.stopPropagation());
if (DEBUG) elDbg.classList.remove('hidden');

// ---------- 캔버스 크기 (제로사이즈 방어: 0106/0075 계보 함정) ----------
function viewport() {
  const w = window.innerWidth || document.documentElement.clientWidth || screen.width || 360;
  const h = window.innerHeight || document.documentElement.clientHeight || screen.height || 640;
  return { w: Math.max(1, w), h: Math.max(1, h) };
}

// ---------- 렌더러 (부팅 시 1회 생성, 절대 재생성 금지) ----------
let TIER = 3;                      // 3=고 / 1=저 / 0=최저
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setClearColor(0xf3e3c8, 1);      // 밝은 주방 톤
wrap.appendChild(renderer.domElement);

const scene = new THREE.Scene();
let skyline = null;   // cam 생성 뒤에 만든다
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -20, 20)   // far 를 넓혀 스카이라인(z-8)까지 담는다;
scene.add(cam);

const BG_PARA = 0.30;      // 배경 띠가 흐르는 속도. 멀리 있으므로 천천히 — 띠 하나로 넓은 고도를 덮는다.
const BG_ASPECT = 9.109;   // bg_*.jpg 세로/가로 (640 x 5830) — 실내·창문·거리·2층·지붕·상층·구름·하늘 8단
let bgH = 2;
const VIEW_MAX = 3.2;               // 이 높이를 넘으면 줌아웃 대신 카메라가 따라 올라간다
let VIEW_H = 0.9;                  // 월드 세로 가시 범위(m)
let camX = 0, camY = 0.35;

function applySize() {
  const v = viewport();
  const dpr = Math.min(window.devicePixelRatio || 1, TIER >= 3 ? 2 : 1.3);
  renderer.setPixelRatio(dpr);
  renderer.setSize(v.w, v.h, true);
  const aspect = v.w / v.h;
  const hh = VIEW_H * 0.5, hw = hh * aspect;
  cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh;
  cam.updateProjectionMatrix();
}
window.addEventListener('resize', applySize);
window.addEventListener('orientationchange', () => setTimeout(applySize, 60));
if (window.visualViewport) window.visualViewport.addEventListener('resize', applySize);
applySize();

// 컨텍스트 로스트 대응: 시뮬 상태는 Float64Array라 렌더와 분리되어 판이 살아남는다
renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); paused = true; });
renderer.domElement.addEventListener('webglcontextrestored', () => { paused = false; applySize(); });

// ---------- 치즈 리본 ----------
const RN_HI = 96, RN_LO = 64;
const R_VIS = 0.072;      // 시각 기준 반경 (물리 r0=0.011 을 화면에서 과장)
const R_POW = 1.85;       // 가늘어짐 곡선 완화 지수 (넥킹은 보이되 실이 되지 않게)
let RN = RN_HI;
const MAXRN = RN_HI;
const ribbonPos = new Float32Array(MAXRN * 2 * 3);
const ribbonUv = new Float32Array(MAXRN * 2 * 2);
const ribbonStr = new Float32Array(MAXRN * 2);
const ribbonIdx = new Uint16Array((MAXRN - 1) * 6);
for (let i = 0; i < MAXRN - 1; i++) {
  const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3, o = i * 6;
  ribbonIdx[o] = a; ribbonIdx[o + 1] = b; ribbonIdx[o + 2] = c;
  ribbonIdx[o + 3] = b; ribbonIdx[o + 4] = d; ribbonIdx[o + 5] = c;
}
for (let i = 0; i < MAXRN; i++) {
  ribbonUv[i * 4] = 0; ribbonUv[i * 4 + 1] = i / (MAXRN - 1);
  ribbonUv[i * 4 + 2] = 1; ribbonUv[i * 4 + 3] = i / (MAXRN - 1);
}

const ribbonGeo = new THREE.BufferGeometry();
const attrPos = new THREE.BufferAttribute(ribbonPos, 3); attrPos.setUsage(THREE.DynamicDrawUsage);
const attrStr = new THREE.BufferAttribute(ribbonStr, 1); attrStr.setUsage(THREE.DynamicDrawUsage);
ribbonGeo.setAttribute('position', attrPos);
ribbonGeo.setAttribute('uv', new THREE.BufferAttribute(ribbonUv, 2));
ribbonGeo.setAttribute('aStrain', attrStr);
ribbonGeo.setIndex(new THREE.BufferAttribute(ribbonIdx, 1));
ribbonGeo.setDrawRange(0, (RN - 1) * 6);

const cheeseMat = new THREE.ShaderMaterial({
  uniforms: {
    uTop: { value: new THREE.Color(0xffea63) },   // 밝은 부분 = 맑은 노랑
    uDeep: { value: new THREE.Color(0xffc226) },  // 심부 = 호박색(갈색기를 빼야 탁하지 않다)
    uRim: { value: new THREE.Color(0xffd75e) },   // 림 = 밝은 금빛
    uHot: { value: 1.0 },
    uDanger: { value: 0.0 },
    uRate: { value: 0.0 },      // 인장 속도(0=최적 저속, 1=과속). 손이 잘하고 있는지를 가닥 자체가 말한다.
    uGood: { value: 0.0 },      // 최적 구간 체류 — 금빛 결이 위로 흐른다
    uTime: { value: 0.0 },
  },
  vertexShader: `
    attribute float aStrain;
    varying vec2 vUv; varying float vS;
    void main(){ vUv = uv; vS = aStrain;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    precision mediump float;
    uniform vec3 uTop; uniform vec3 uDeep; uniform vec3 uRim; uniform float uHot; uniform float uDanger;
    uniform float uRate; uniform float uGood; uniform float uTime;
    varying vec2 vUv; varying float vS;
    void main(){
      float x = vUv.x * 2.0 - 1.0;                       // 폭 방향 -1..1
      float nz = sqrt(max(0.0, 1.0 - x*x));              // 가짜 원통 노멀
      vec3 N = normalize(vec3(x, 0.0, nz));
      vec3 L = normalize(vec3(-0.42, 0.46, 0.78));
      vec3 V = vec3(0.0, 0.0, 1.0);
      float diff = max(dot(N, L), 0.0);
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(N, H), 0.0), 46.0);
      float fres = pow(1.0 - nz, 2.4);
      vec3 cold = vec3(0.97, 0.93, 0.76);                // 식은 치즈 = 창백한 크림
      vec3 warm = mix(uDeep, uTop, 0.35 + 0.65 * uHot);
      warm = mix(cold, warm, 0.30 + 0.70 * uHot);        // 색존: 온도로 채도·색온도 이동
      warm = mix(warm, vec3(1.0, 0.55, 0.38), uDanger * 0.34);   // 위험할수록 붉게 달아오른다
      vec3 col = mix(warm * 0.82, warm, diff);
      // 투과광 — 치즈는 반투명이라 얇은 가장자리에서 빛이 새어 나온다.
      //   이 항이 '영롱함'을 만든다. 없으면 그냥 노란 플라스틱 막대가 된다.
      float sss = pow(1.0 - nz, 1.15);
      col += uTop * sss * (0.20 + 0.26 * uHot);
      // 치즈 섬유질 — 늘어난 방향으로 흐르는 결. '물성'을 만든다
      float fib = sin(vUv.x * 21.0 + vUv.y * 4.5) * 0.5 + 0.5;
      float fib2 = sin(vUv.x * 47.0 - vUv.y * 2.0) * 0.5 + 0.5;
      col *= 0.945 + fib * 0.075 + fib2 * 0.025;
      // 흐르는 하이라이트 — 늘어날수록 위로 밀려 올라간다
      float flow = smoothstep(0.24, 0.0, abs(vUv.x - 0.32 + sin(vUv.y * 2.6) * 0.05));
      col += vec3(1.0, 0.99, 0.86) * flow * 0.34 * (0.5 + 0.5 * uHot);
      col += spec * 0.62 * (1.0 - 0.55 * uRate);        // 급하게 당기면 광택이 죽는다
      // 최적 속도로 당기는 동안 금빛 결이 가닥을 타고 올라간다 = '지금 잘하고 있다'
      float band = fract(vUv.y * 3.0 - uTime * 0.55);
      float glow = smoothstep(0.86, 1.0, band) * smoothstep(1.0, 0.90, band);
      col += vec3(1.0, 0.82, 0.42) * glow * uGood * 0.42;
      col += uRim * fres * 0.34;                    // 림라이트 = 배경에서 분리(명료성)
      col = mix(col, vec3(1.0, 0.96, 0.90), clamp(vS, 0.0, 1.0) * 0.78);
      // 응력 백화 — 고분자를 빠르게 당기면 실제로 하얗게 뜬다. 과속의 대가가 눈에 보인다.
      col = mix(col, vec3(0.93, 0.92, 0.90), uRate * 0.46);  // 최박점 백화
      // 채도 보정: 밝은 배경 위에서는 같은 색도 탁해 보인다(동시대비)
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lum), col, 1.14);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
const ribbon = new THREE.Mesh(ribbonGeo, cheeseMat);
ribbon.frustumCulled = false;
// 배경(투명)보다 반드시 뒤에 그려지도록 같은 그룹으로 올린다 — 안 그러면 배경이 가닥을 덮는다
cheeseMat.transparent = true;
ribbon.renderOrder = 4;
scene.add(ribbon);

// 잔가닥(wisp) — '고무줄이 아니라 치즈'로 보이게 하는 4요소 중 하나
const WISPN = 22;
const wisps = [];
for (let k = 0; k < 2; k++) {
  const p = new Float32Array(WISPN * 3);
  const g = new THREE.BufferGeometry();
  const a = new THREE.BufferAttribute(p, 3); a.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', a);
  const m = new THREE.LineBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.72 });
  const line = new THREE.Line(g, m);
  line.frustumCulled = false;
  scene.add(line);
  wisps.push({ p, a, line, seed: 1.7 + k * 2.3 });
}

// ---------- 가게 배경 (ComfyUI 생성) ----------
const bgTexLoader = new THREE.TextureLoader();
const bgMat = new THREE.MeshBasicMaterial({ color: 0xf2ece0, depthWrite: false, depthTest: false, toneMapped: false, transparent: true });
const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bgMat);
bgMesh.renderOrder = -10;
bgMesh.position.set(0, 0.16, -6); bgMesh.frustumCulled = false;
scene.add(bgMesh);   // 카메라에 붙여두면 영원히 안 움직인다. 월드에 놓아야 아래로 흘러간다.
skyline = createSkyline(scene, cam);
const bgCache = {};
function setShopBg(key) {
  const k = key || 'street';
  if (bgCache[k] === 'fail') return;
  if (bgCache[k]) { bgMat.map = bgCache[k]; bgMat.color.setHex(0xffffff); bgMat.needsUpdate = true; return; }
  bgTexLoader.load('./assets/bg_' + k + '.jpg',
    (tx) => {
      tx.colorSpace = THREE.SRGBColorSpace;
      bgCache[k] = tx; bgMat.map = tx; bgMat.color.setHex(0xffffff); bgMat.needsUpdate = true;
    },
    undefined,
    () => { bgCache[k] = 'fail'; });
}
// 배경 위에 어두운 베일 — 치즈 가닥의 대비를 지킨다(가독성이 분위기를 이긴다)
// ---------- 배경(그레이박스): 접시 + 피자 조각 + 손 ----------
// ---------- 전경 아트 (3단계 아트웍) ----------
// 도형 플레이스홀더 -> ComfyUI 생성 + rembg 알파 스프라이트. 로드 실패 시 도형 폴백을 남긴다.
const texLoader = new THREE.TextureLoader();
function spriteOf(file, w, h, z, fallbackColor) {
  const mat = new THREE.MeshBasicMaterial({
    color: fallbackColor, transparent: true, depthWrite: false, opacity: fallbackColor ? 1 : 0,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.z = z; m.frustumCulled = false;
  texLoader.load('./assets/' + file,
    (tx) => { tx.colorSpace = THREE.SRGBColorSpace; mat.map = tx; mat.color.setHex(0xffffff); mat.opacity = 1; mat.needsUpdate = true; },
    undefined,
    () => { /* 폴백 도형 유지 */ });
  scene.add(m);
  return m;
}
// 피자 — 치즈가 솟아오르는 뿌리. 살짝 눌린 원근으로 깔린다.
const pizza = spriteOf('prop_pizza.png', 0.50, 0.41, -0.72, 0xd9a05a);
pizza.scale.set(1, 0.42, 1);
const PIZZA_Y = -0.058, SHADOW_Y = -0.030, DESK_Y = -0.105;   // 지상 기준선 — 카메라가 올라가면 이만큼 아래로 남는다
pizza.position.set(0, PIZZA_Y, -0.72);
// 뿌리에 고인 치즈(피자와 가닥을 잇는 접합부)
const pool = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24),
  new THREE.MeshBasicMaterial({ color: 0xffd94e, transparent: true, opacity: 0.95 }));
pool.position.set(0, -0.004, -0.6); pool.scale.set(1, 0.34, 1); scene.add(pool);
// 포크 — 손가락 결함 리스크를 피하고 '집어 올린다'가 즉시 읽히는 실루엣
const fork = spriteOf('prop_fork.png', 0.038, 0.20, -0.5, null);
fork.position.set(0, 0.2, -0.5);

// 데스크 — 피자가 놓인 자리. 뿌리 밑이 허공이면 '덩그러니' 떠 보인다.
const desk = spriteOf('prop_desk.png', 0.52, 0.22, -0.80, 0xffffff);   // 줄자·인형·화분이 놓인 팬시한 데스크
desk.position.set(0, DESK_Y, -0.80);

// 파티클 버스트 — 사건마다 '겹쳐' 넣는다(juice 3종 의무)
const fxCheese = new Burst(scene, 18, 0xffe24e, 9, true);    // 파단: 치즈 파편
const fxOil = new Burst(scene, 12, 0xfff0c0, 5, true);       // 파단: 기름 튐
const fxStar = new Burst(scene, 16, 0xaef5c0, 7, true);      // 성공/신기록: 반짝임

// 토핑 — 가닥에 얹힌 재료. 위험 구간에 놓이면 미끄러져 떨어진다(safe 주문의 3성 조건)
const TOPS = 4;
const topPos = new Float32Array(TOPS * 3);
for (let i = 0; i < TOPS; i++) topPos[i * 3 + 1] = -999;
const topGeo = new THREE.BufferGeometry();
const topAttr = new THREE.BufferAttribute(topPos, 3); topAttr.setUsage(THREE.DynamicDrawUsage);
topGeo.setAttribute('position', topAttr);
const topMat = new THREE.PointsMaterial({ color: 0xd94b32, size: 13, sizeAttenuation: false, transparent: true });
const topPts = new THREE.Points(topGeo, topMat);
topPts.frustumCulled = false; topPts.visible = false; topPts.renderOrder = 4; scene.add(topPts);
const tops = [];
for (let i = 0; i < TOPS; i++) tops.push({ node: 0, alive: false, vy: 0, y: 0, x: 0 });

// 잔해(permanence) — 사라지는 것보다 남는 흔적(정본 §2 ⑥). 다음 판까지 유지된다.
const SCARN = 12;
const scarPos = new Float32Array(SCARN * 3);
for (let i = 0; i < SCARN; i++) scarPos[i * 3 + 1] = -999;
const scarGeo = new THREE.BufferGeometry();
const scarAttr = new THREE.BufferAttribute(scarPos, 3); scarAttr.setUsage(THREE.DynamicDrawUsage);
scarGeo.setAttribute('position', scarAttr);
const scarMat = new THREE.PointsMaterial({ color: 0xe6b455, size: 10, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false });
const scarPts = new THREE.Points(scarGeo, scarMat);
scarPts.frustumCulled = false; scarPts.visible = false; scarPts.renderOrder = 3; scene.add(scarPts);
let scarN = 0, scarSeed = 7;
function addScar(x, y) {
  for (let k = 0; k < 3; k++) {
    scarSeed = (scarSeed * 1103515245 + 12345) & 0x7fffffff;
    const r = scarSeed / 0x7fffffff;
    const i = scarN % SCARN;
    scarPos[i * 3] = x + (r - 0.5) * 0.10;
    scarPos[i * 3 + 1] = -0.012 + (r - 0.5) * 0.012;
    scarPos[i * 3 + 2] = 0.15;
    scarN++;
  }
  scarAttr.needsUpdate = true;
  scarPts.visible = true;
}

// 소프트 섀도(접지) — 리얼 그림자보다 싸고 안정적(02 문서)
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.095, 24),
  new THREE.MeshBasicMaterial({ color: 0x6b4a24, transparent: true, opacity: 0.30, depthWrite: false }));
shadow.position.set(0, SHADOW_Y, -0.75); shadow.scale.set(1, 0.30, 1); scene.add(shadow);

// ---------- 오디오 (audio.js = CC0 파일 기반 + 절차 인장음) ----------
function vibrate(pat) {
  if (!userGesture || !navigator.vibrate || !store.get().haptic) return;
  try { navigator.vibrate(pat); } catch (e) { }
}
let userGesture = false;
function sndSnap() { A.play('snap', { vol: 1.0 }); A.play('fail', { vol: 0.45, delay: 0.12 }); }
function sndTick() { A.play('tick', { vol: 0.55, rate: 1 + Math.min(0.35, sim.lamRatio * 0.3) }); }
function sndBank() { A.play('bank', { vol: 0.9 }); }
function sndRecord() { A.play('record', { vol: 0.85 }); }
function sndGrab() { A.play('grab', { vol: 0.8 }); }
function sndDrop() { A.play('drop', { vol: 0.7 }); }
function sndClear() { A.play('clear', { vol: 0.9 }); }

// ---------- 상태 ----------
const sim = makeSim();
let MODE = 'endless';          // endless | order | daily
let LV = null;                 // 현재 주문(order/daily)
let redEnters = 0, dropped = 0, wasInRed = false;
let banked = 0, anchors = 0, carryTemp = 1;   // 이어붙이기: 누적 길이·횟수·이어받는 온도
let best = 0;
let state = 'idle';            // idle | ready | pull | result
let targetY = 0, handStartY = 0, dragStartPx = 0;
let resultT = 0, recordHit = false, lastTickT = 0;
let hitStop = 0, slowmo = 0, timeScale = 1, shake = 0, trauma = 0, paused = false;
let hsT = 0, hsDur = 0;   // 히트스톱 3단 램프(정본 §2 ④)
let squashKick = 0, handKick = 0, redPopped = false, goalShown = 0, goalHit = false;
let msgT = 0;
const PULL_SCALE = 1.6;        // 화면 높이 1개 드래그 = 1.6 m (줌과 무관하게 고정 = 조작 일관성)

function armRun(mode, idx) {
  MODE = mode;
  LV = (mode === 'order') ? makeLevel(idx)
    : (mode === 'daily' ? makeLevel(store.dailySeed() % TOTAL) : null);
  const setup = LV
    ? { cheese: LV.cheese, temp0: LV.temp0, coolMul: LV.coolMul }
    : { cheese: 'mozzarella', temp0: 1, coolMul: 1 };
  resetSim(sim, setup);
  resetTower();
  best = (mode === 'endless') ? store.get().best : 0;
  redEnters = 0; dropped = 0; wasInRed = false; recordHit = false; resultT = 0;
  banked = 0; anchors = 0; carryTemp = (LV ? LV.temp0 : 1);
  redPopped = false; squashKick = 0; handKick = 0; goalShown = 0; goalHit = false;
  elGoalFill.style.background = 'linear-gradient(90deg,var(--cheese2),var(--cheese))';
  targetY = sim.anchorY; handStartY = sim.anchorY;
  state = 'ready';
  armToppings(LV ? LV.toppings : 0);
  setShopBg(LV ? LV.shop : 'street');
  elTip.style.opacity = '.85';
  elTip.textContent = t('tipPull');
  elHint.classList.remove('hidden');
  showMsg('', 0);
  elGoalBar.style.opacity = LV ? '1' : '0';
  elChain.style.opacity = '0';
  elKeep.style.display = 'none';
  elKeep.textContent = t('keep');
  ads.hideBanner();
  ui.showGame();
}
function armToppings(n) {
  for (let i = 0; i < TOPS; i++) {
    const a = tops[i];
    a.alive = i < n;
    a.node = 4 + Math.floor((sim.N - 8) * (i + 1) / (n + 1));
    a.vy = 0;
    if (!a.alive) topPos[i * 3 + 1] = -999;
  }
  topPts.visible = n > 0;
  topAttr.needsUpdate = true;
}
function startPull(py) {
  A.resume();
  A.startStretch();
  A.setAmbience(true);
  A.bgm(LV ? LV.bgm : 'warm');
  sndGrab();
  targetY = sim.anchorY; handStartY = sim.anchorY; dragStartPx = py;
  state = 'pull';
  elTip.style.opacity = '0';
  elHint.classList.add('hidden');
}
// 손을 떼면 그 구간이 '확정'되고 이어서 늘인다. 대신 뗄 때마다 치즈가 식는다.
// 이 한 줄이 천장을 연다 — 실력이 있으면 몇 배를 더 간다(시뮬 실측 28.7배 폭).
const ANCHOR_COOL = 0.82;      // 떼는 순간 온도 페널티
function anchorSegment() {
  if (state !== 'pull') return;
  const seg = Math.round(sim.arcPeak * 100);
  if (seg < 6) { state = 'ready'; return; }          // 손만 스친 경우는 무시
  banked += sim.arcPeak;
  anchors++;
  carryTemp = sim.T * ANCHOR_COOL;
  A.play('bank', { vol: 0.75, rate: 1 + Math.min(0.25, anchors * 0.04) });   // 이을수록 피치 상승
  vibrate([0, 12, 34, 12]);
  tween(1.15, 0, 0.38, E.outElastic, (v) => { squashKick = v * 0.8; }, () => { squashKick = 0; });
  const hx = sim.px[sim.N - 1], hy = sim.py[sim.N - 1];
  fxStar.fire(hx, hy, 12, 0.8, 1.2, 0.3);
  popup.fire('+' + seg + t('cm'), 50, 44, 'gain');
  if (carryTemp < 0.12) { finishRun(true); return; }  // 다 식으면 자동 종료
  // 새 구간 — 온도만 이어받고 가닥은 처음부터
  const setup = LV
    ? { cheese: LV.cheese, temp0: carryTemp, coolMul: LV.coolMul }
    : { cheese: 'mozzarella', temp0: carryTemp, coolMul: 1 };
  resetSim(sim, setup);
  targetY = sim.anchorY; handStartY = sim.anchorY;
  redPopped = false; wasInRed = false;
  state = 'ready';
  elTip.style.opacity = '.85';
  elTip.textContent = t('tipAgain');
}
// '담기' = 판을 끝내고 누적 기록을 확정
function finishRun(auto) {
  if (state !== 'pull' && state !== 'ready') return;
  const total = banked + (state === 'pull' ? sim.arcPeak : 0);
  state = 'result'; resultT = FAST ? 0.2 : 1.15;
  sndBank();
  vibrate([0, 14, 40, 14]);
  popup.fire(Math.round(total * 100) + t('cm'), 50, 40, 'gain');
  showMsg(t('banked', { n: Math.round(total * 100) }));
  finish(true, total);
}
function finish(ok, totalM) {
  const cm = (totalM != null ? totalM : (banked + sim.arcPeak)) * 100;
  store.bumpPlays();
  let stars = null, isRecord = false, sub = '';
  if (MODE === 'order' && LV) {
    stars = judge(LV, { cm: cm, banked: ok, redEnters: redEnters, dropped: dropped });
    if (stars > 0) { store.recordStars(LV.idx, stars); sndClear(); }
    sub = t('goal') + ' ' + LV.goal + t('cm');
  } else if (MODE === 'endless') {
    isRecord = store.setBest(cm);
    sub = isRecord ? t('recordNew') : (t('best') + ' ' + Math.round(store.get().best) + t('cm'));
  } else if (MODE === 'daily') {
    store.recordDaily(cm);
    sub = t('dailyTitle');
  }
  pendResult = { cm: cm, stars: stars, sub: sub, isRecord: isRecord, anchors: anchors,
    goal: (MODE === 'order' && LV) ? LV.goal : null, best: store.get().best,
    hasNext: (MODE === 'order' && LV && stars > 0 && LV.idx + 1 < TOTAL) };
}
let pendResult = null;
async function flushResult() {
  const r = pendResult; pendResult = null;
  if (!r) return;
  ui.showResult(r);
  await ads.showBanner();
  // 전면은 여기서 띄우지 않는다 — 판정·미리 받기만 하고, 결과 화면의 떠나는 버튼(ui.leaveResult)에서 보여 준다
  ads.armInterstitial({ wasRecord: r.isRecord, wasDaily: MODE === 'daily' });
}
function onBreak() {
  hsDur = 0.30; hsT = 0; slowmo = 0.34; trauma = 0.92;
  elFlash.style.opacity = '0.22'; setTimeout(() => { elFlash.style.opacity = '0'; }, 90);
  sndSnap(); vibrate([0, 18, 30, 55]);
  spawnDrops();
  state = 'result'; resultT = FAST ? 0.25 : 1.35;
  const why = sim.anchorSpeed > 0.9 ? t('whyFast') : (sim.T < 0.55 ? t('whyCold') : t('whyLimit'));
  popup.fire(t('snap'), 50, 40, 'loss');
  tween(1.2, 0, 0.5, E.outElastic, (v) => { squashKick = v * 0.7; }, () => { squashKick = 0; });
  showMsg(t('snap') + ' ' + why);
  finish(false);   // 끊기면 누적 전액 몰수(푸시유어럭)
}
function showMsg(t, hold) {
  elMsg.textContent = t;
  elMsg.style.opacity = t ? '1' : '0';
  elMsg.style.transform = t ? 'scale(1)' : 'scale(.9)';
  msgT = t ? (hold != null ? hold : 1.2) : 0;
}
function spawnDrops() {
  const k = sim.breakIdx, x = sim.px[k], y = sim.py[k];
  fxCheese.fire(x, y, 14, 1.15, 0.9, 0.35);   // 충돌 지점에 정확히
  fxOil.fire(x, y, 10, 0.75, 1.4, 0.55);
  addScar(sim.rootX, sim.rootY);
}

// ---------- 입력 ----------
function px2world(dyPx) { return dyPx / viewport().h * PULL_SCALE; }
function onDown(e) {
  userGesture = true;
  if (ui.current() !== 'game') return;
  if (state === 'ready') startPull(e.clientY);
}
function onMove(e) {
  if (state !== 'pull') return;
  targetY = handStartY + px2world(dragStartPx - e.clientY);
}
function onUp() { if (state === 'pull') anchorSegment(); }
const dom = renderer.domElement;
dom.addEventListener('pointerdown', onDown, { passive: false });
dom.addEventListener('pointermove', onMove, { passive: false });
window.addEventListener('pointerup', onUp, { passive: false });
window.addEventListener('pointercancel', onUp, { passive: false });
dom.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

// ---------- 리본 갱신 ----------
function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
function updateRibbon() {
  const N = sim.N, S = sim.S, seg = RN - 1;
  const lamB = lambdaBreak(sim);
  const minPx = VIEW_H / viewport().h * 3.5;        // 최소 3.5px (하한이 넥킹을 뭉개지 않게)
  // 굵기 과장은 '늘어난 가닥'을 위한 값이다. 갓 이어붙인 짧은 가닥에 그대로 쓰면
  //   화면 폭 40%짜리 사각 덩어리가 되어 치즈로 안 읽힌다. 길이에 따라 배율을 연다.
  const grow = clamp(0.24 + 0.76 * (sim.arc / 0.50), 0.24, 1);
  const bLo = sim.broken ? sim.breakIdx / (N - 1) : -1;
  const bHi = sim.broken ? (sim.breakIdx + 1) / (N - 1) : -1;
  for (let i = 0; i < RN; i++) {
    const t = i / seg;
    const f = t * (N - 1);
    let i1 = Math.floor(f); if (i1 > N - 2) i1 = N - 2;
    const lt = f - i1;
    const i0 = i1 > 0 ? i1 - 1 : 0, i2 = i1 + 1, i3 = i2 < N - 1 ? i2 + 1 : N - 1;
    const x = cr(sim.px[i0], sim.px[i1], sim.px[i2], sim.px[i3], lt);
    const y = cr(sim.py[i0], sim.py[i1], sim.py[i2], sim.py[i3], lt);
    let tx = sim.px[i2] - sim.px[i1], ty = sim.py[i2] - sim.py[i1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const si = i1 < S ? i1 : S - 1;
    let hw = R_VIS * grow * Math.pow(sim.segR[si] / (sim.c.r0 * sim.cheese.r), R_POW);
    if (hw < minPx) hw = minPx;
    if (sim.broken && t > bLo && t < bHi) hw = 0;   // 파단 구간은 폭 0 = 시각적 절단
    const nx = -ty * hw, ny = tx * hw;
    const o = i * 6;
    ribbonPos[o] = x + nx; ribbonPos[o + 1] = y + ny; ribbonPos[o + 2] = 0;
    ribbonPos[o + 3] = x - nx; ribbonPos[o + 4] = y - ny; ribbonPos[o + 5] = 0;
    const lam = sim.segL[si] / sim.segL0[si];
    const danger = clamp((lam / lamB - 0.82) / 0.18, 0, 1);
    ribbonStr[i * 2] = danger; ribbonStr[i * 2 + 1] = danger;
  }
  attrPos.needsUpdate = true; attrStr.needsUpdate = true;
  ribbonGeo.setDrawRange(0, (RN - 1) * 6);
  cheeseMat.uniforms.uHot.value = sim.T;
  const dangerRaw = clamp((sim.lamRatio - 0.62) / 0.38, 0, 1) * (sim.broken ? 0 : 1);
  // 레드존에서 맥동(glow pulse) — 흔한 상태엔 단순하게, 위험할수록 강하게
  const pulse = dangerRaw > 0.5 ? (0.85 + 0.15 * Math.sin(sim.time * 14)) : 1;
  cheeseMat.uniforms.uDanger.value = dangerRaw * pulse;
  cheeseMat.uniforms.uRate.value = rateShown;
  cheeseMat.uniforms.uGood.value = goodShown;
  cheeseMat.uniforms.uTime.value = sim.time;

  // 스쿼시&스트레치 — 코어(늘어남)를 반향한다. 장력이 높을수록 뿌리가 눌리고 옆으로 퍼진다
  const tens = clamp(sim.lamRatio, 0, 1.1);
  const k = 1 - tens * 0.42 + squashKick;
  const inv = 1 / Math.sqrt(Math.max(0.05, k));
  pool.scale.set(inv * (1 + tens * 0.34), k * 0.30, 1);
  pool.position.y = -0.004 - tens * 0.004;

  // 손은 당김 강도만큼 세로로 늘어난다(볼륨 보존)
  const hk = 1 + clamp(sim.anchorSpeed * 0.16, 0, 0.35) + handKick * 0.6;
  fork.scale.set(1 / Math.sqrt(hk), hk, 1);
  // 접지 그림자 — 뿌리 폭을 따라간다
  shadow.scale.set((1 + tens * 0.55) * 1.0, 0.30, 1);
  shadow.material.opacity = 0.42 - tens * 0.14;
  // 피자도 장력에 반응한다(당기면 살짝 들리고 기운다) — 살아있는 화면
  pizza.position.y = -0.068 + tens * 0.010;
  pizza.rotation.z = Math.sin(sim.time * 1.7) * 0.012 * tens;
  // 포크는 당김 방향으로 미세하게 기운다
  fork.rotation.z = -clamp((sim.px[N - 1] - sim.rootX) * 1.6, -0.25, 0.25);
  // 손 위치
  // 포크는 가닥 끝을 물고 함께 올라간다(끝점보다 살짝 위)
  fork.position.set(sim.px[N - 1], sim.py[N - 1] + 0.022, -0.5);
  // 잔가닥
  if (false) {
    for (let k = 0; k < wisps.length; k++) {
      const w = wisps[k];
      for (let i = 0; i < WISPN; i++) {
        const t = i / (WISPN - 1);
        const f = t * (N - 1);
        let i1 = Math.floor(f); if (i1 > N - 2) i1 = N - 2;
        const lt = f - i1;
        const i0 = i1 > 0 ? i1 - 1 : 0, i2 = i1 + 1, i3 = i2 < N - 1 ? i2 + 1 : N - 1;
        const x = cr(sim.px[i0], sim.px[i1], sim.px[i2], sim.px[i3], lt);
        const y = cr(sim.py[i0], sim.py[i1], sim.py[i2], sim.py[i3], lt);
        const env = Math.sin(t * Math.PI);                     // 양끝은 본체에 붙고 중앙이 벌어진다
        const amp = R_VIS * 1.35 * env * env;
        const ph = t * 3.1 * w.seed + sim.time * 1.15;
        w.p[i * 3] = x + Math.sin(ph) * amp;
        w.p[i * 3 + 1] = y - Math.cos(ph * 0.7) * amp * 0.35;   // 본체보다 늦게 따라온다
        w.p[i * 3 + 2] = 0.05;
      }
      w.a.needsUpdate = true;
      w.line.visible = true;
    }
  } else { for (let k = 0; k < wisps.length; k++) wisps[k].line.visible = false; }
}
// ---------- 카메라 ----------
function applyFrustum() {
  const v = viewport();
  const aspect = v.w / v.h;
  const hh = VIEW_H * 0.5, hw = hh * aspect;
  cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh;
  cam.updateProjectionMatrix();
  // 세로 배경 띠(실내->창문->야외->하늘). 폭을 화면에 맞추고 높이는 텍스처 비율(1:3.586)을 지킨다.
  const bgW = hw * 2.30;
  bgH = bgW * BG_ASPECT;
  bgMesh.scale.set(bgW, bgH, 1);
}
function updateCam(dt) {
  let minY = 1e9, maxY = -1e9;
  for (let i = 0; i < sim.N; i++) { const y = sim.py[i]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  if (minY > -0.07) minY = -0.07;
  // 전부 화면에 담으려 들면 치즈가 실오라기가 된다.
  // 일정 높이부터는 '손을 따라 올라간다' — 배경이 아래로 흐르며 얼마나 왔는지가 보인다.
  const span = maxY - minY;
  const want = clamp(span * 1.38, 0.80, VIEW_MAX);
  const k = Math.min(1, dt * 6);
  VIEW_H += (want - VIEW_H) * k;
  const tgt = (span * 1.38 > VIEW_MAX)
    ? (maxY - VIEW_H * 0.30)
    : (((minY + maxY) * 0.5) - VIEW_H * 0.03);
  camY += (tgt - camY) * k;
  let sx = 0, sy = 0;
  if (trauma > 0) {
    trauma -= dt * 1.9; if (trauma < 0) trauma = 0;
    const amp = 0.014 * trauma * trauma;            // trauma^2 = 초반만 세게, 꼬리는 조용히
    const ph = sim.time * 96;
    sx = Math.sin(ph) * amp; sy = Math.cos(ph * 1.37) * amp;
    cam.rotation.z = Math.sin(ph * 0.7) * 0.012 * trauma * trauma;   // 회전 흔들림 곁들이기
  } else if (cam.rotation.z !== 0) cam.rotation.z = 0;
  cam.position.set(camX + sx, camY + sy, 5);
  cam.updateMatrixWorld();
  applyFrustum();
  const virtY = towerCm * 0.01 + VY;
  // 가게는 '사라지는' 게 아니라 '아래로 내려가는' 것이다.
  //   투명도로 지우면 유령처럼 흐려질 뿐이고, 위치로 내려야 위에서 하늘이 드러난다.
  // 띠의 아래끝이 지면(고도 0)에 오도록 놓고, 고도에 비례해 내려보낸다.
  bgMesh.position.y = (bgH * 0.5 - 0.30) - virtY * BG_PARA;
  bgMesh.visible = (bgMesh.position.y + bgH * 0.5) > (camY - VIEW_H * 0.5);
  bgMat.opacity = 1;
  skyline.update(camY, virtY, VIEW_H, viewport().w / viewport().h);
  // 피자는 '손 안의 대상'이라 항상 뿌리 밑에 있어야 한다.
  //   8차에 이걸 virtY 만큼 내렸더니 누적 35cm 만 넘어도 화면 밖으로 빠져,
  //   가닥이 허공에 뜬 것처럼 보였다(뿌리 견고함 상실). 올라가는 느낌은 배경이 맡는다.
  pizza.position.y = PIZZA_Y;
  shadow.position.y = SHADOW_Y;
  desk.position.y = DESK_Y;
}


// ---------- 스케일 타워 게이지 (좌측) ----------
// 늘린 길이를 '세상의 크기'로 환산해 보여준다. 로그 눈금이라 20cm와 4km가 한 화면에 들어간다.
const TW_MIN = 20, TW_MAX = 400000;
const LMIN = Math.log(TW_MIN), LSPAN = Math.log(TW_MAX) - LMIN;
const elTower = document.getElementById('tower');
const elTwFill = document.getElementById('towerFill');
const elTwPb = document.getElementById('towerPb');
const elTwNow = document.getElementById('towerNow');
const twTicks = [];
let passMark = -1, twShown = 0, towerCm = 0;
let goodShown = 0, rateShown = 0;
let tipShown = '';
function twPct(cm) { return clamp((Math.log(Math.max(cm, TW_MIN)) - LMIN) / LSPAN, 0, 1) * 100; }
function buildTower() {
  if (twTicks.length) return;
  for (let i = 0; i < MARKS.length; i++) {
    const d = document.createElement('div');
    d.className = 'tk'; d.textContent = MARKS[i].e;
    d.style.bottom = twPct(MARKS[i].cm).toFixed(2) + '%';
    elTower.appendChild(d); twTicks.push(d);
  }
}
function resetTower() {
  buildTower();
  passMark = -1; twShown = 0; towerCm = 0;
  for (const d of twTicks) d.className = 'tk';
  elTwFill.style.height = '0%';
  elTwNow.style.opacity = '0';
  const pb = (store.get().best || 0);
  elTwPb.style.opacity = pb > TW_MIN ? '1' : '0';
  elTwPb.style.bottom = twPct(pb).toFixed(2) + '%';
}
function updateTower(cm) {
  towerCm = cm;
  const want = twPct(cm);
  twShown += (want - twShown) * 0.16;                 // 게이지도 감쇠 = 차오르는 맛
  elTwFill.style.height = twShown.toFixed(2) + '%';
  const mi = markIndexFor(cm);
  if (mi >= 0) {
    elTwNow.style.opacity = '1';
    elTwNow.style.bottom = want.toFixed(2) + '%';
    elTwNow.textContent = MARKS[mi].e + ' ' + t(MARKS[mi].key);
  } else elTwNow.style.opacity = '0';
  if (mi > passMark) {
    for (let i = passMark + 1; i <= mi; i++) {
      if (twTicks[i]) twTicks[i].className = 'tk on';
      onPassMark(i);
    }
    passMark = mi;
  }
}
// 랜드마크를 넘는 순간 = 이 게임의 성취 단위
function onPassMark(i) {
  const m = MARKS[i];
  popup.fire(m.e + ' ' + t(m.key), 50, 30, 'gain');
  A.play('bank', { vol: 0.55, rate: 1.10 + Math.min(0.5, i * 0.05) });
  trauma = Math.min(1, trauma + 0.22);
  if (userGesture && navigator.vibrate) navigator.vibrate(18);
}

// ---------- HUD ----------
function updateHud() {
  const cur = (state === 'pull') ? sim.arc : (sim.broken ? sim.arcPeak : 0);
  const cm = (banked + cur) * 100;
  elLen.innerHTML = cm.toFixed(0) + '<small>' + t('cm') + '</small>';
  updateTower(cm);
  if (anchors > 0) {
    elChain.style.opacity = '1';
    // 스코어 판 안에서는 «이어붙임 n번 / 지금 n cm» 두 줄로(구분점에서 줄을 나눈다 — 가운데 점이 줄 머리에 오지 않게)
    elChain.textContent = t('chainInfo', { n: anchors, cm: Math.round(cur * 100) }).replace(/\s+[·・]\s+/, '\n');
  } else elChain.style.opacity = '0';
  const canKeep = (state === 'pull' || state === 'ready') && (banked > 0.02 || cur > 0.25);
  elKeep.style.display = canKeep ? 'block' : 'none';
  elKeep.style.opacity = canKeep ? '1' : '0';
  elBest.textContent = LV
    ? (t('goal') + ' ' + LV.goal + t('cm'))
    : (best > 0 ? (t('best') + ' ' + best.toFixed(0) + t('cm')) : '');
  if (LV) {
    const want = Math.min(100, cm * 100 / LV.goal);
    goalShown += (want - goalShown) * 0.18;          // 프레임 감쇠 = slow-out
    elGoalFill.style.width = goalShown.toFixed(1) + '%';
    if (!goalHit && cm >= LV.goal) {
      goalHit = true;
      elGoalFill.style.background = 'linear-gradient(90deg,#7fe39a,#c9f7a0)';
      popup.fire('✓', 50, 24, 'gain');
      sndBank();
    }
  }
  const dz = (state === 'pull' && !sim.broken) ? clamp((sim.lamRatio - 0.70) / 0.30, 0, 1) : 0;
  // '잘 당기고 있다'를 손이 알 수 있어야 실력이 는다. 위험(붉음)만 있고 칭찬이 없으면 배울 수 없다.
  const pulling = (state === 'pull' && !sim.broken);
  const rateN = pulling ? clamp(sim.vN, 0, 1) : 0;
  const goodN = pulling ? clamp(1 - sim.vN / 0.34, 0, 1) * clamp((sim.anchorSpeed - 0.03) / 0.06, 0, 1) : 0;
  goodShown += (goodN - goodShown) * 0.12;
  rateShown += (rateN - rateShown) * 0.18;
  elWarn.style.boxShadow = 'inset 0 0 22vw rgba(255,60,40,' + (dz * 0.38).toFixed(3) + ')'
    + ', inset 0 0 15vw rgba(255,196,90,' + (goodShown * 0.30).toFixed(3) + ')';
  elLen.style.color = sim.necking ? '#ff7a58' : ((best > 0 && cm > best) ? '#9df2ae' : '#ffffff');
  if (state === 'pull' && !sim.broken) {
    // 위험(떼라)과 과속(늦춰라)은 다른 말이다. 둘을 섞으면 무엇을 고쳐야 할지 배울 수 없다.
    const red = sim.lamRatio >= 0.86;
    const tooFast = !red && sim.vN > 0.55;
    const want = red ? 'tipRelease' : (tooFast ? 'tipSlow' : '');
    if (want !== tipShown) {
      tipShown = want;
      if (want) { elTip.textContent = t(want); elTip.style.opacity = red ? '.9' : '.72'; }
      else elTip.style.opacity = '0';
    }
  }
}

// ---------- 오디오 갱신 (연속 루프의 파라미터 변조 = 트리거 지연 0) ----------
function updateAudio() {
  const on = (state === 'pull' && !sim.broken);
  const st = clamp(sim.lamRatio, 0, 1.15);
  A.updateStretch(on, st, on ? clamp(sim.vN, 0, 1) : 0);
  if (on && st > 0.58) {                      // 가이거식 경고 — 위험할수록 촘촘해진다
    const iv = Math.max(0.11, 0.40 - (st - 0.58) * 0.72);
    if (sim.time - lastTickT > iv) { lastTickT = sim.time; sndTick(); }
  }
}

// ---------- 방울 ----------
function updateDrops(dt) {
  fxCheese.update(dt, 5.2);
  fxOil.update(dt, 3.4);
  fxStar.update(dt, 1.1);
}

// ---------- 토핑 ----------
function updateToppings(dt) {
  if (!topPts.visible) return;
  let any = false;
  for (let i = 0; i < TOPS; i++) {
    const a = tops[i];
    if (!a.alive) {
      if (a.vy !== 0) {                      // 떨어지는 중
        a.vy -= 9.8 * dt * 0.6; a.y += a.vy * dt;
        topPos[i * 3 + 1] = a.y;
        if (a.y < sim.rootY - 0.5) { a.vy = 0; topPos[i * 3 + 1] = -999; }
        else any = true;
      }
      continue;
    }
    any = true;
    const n = a.node;
    topPos[i * 3] = sim.px[n]; topPos[i * 3 + 1] = sim.py[n]; topPos[i * 3 + 2] = 0.25;
    a.x = sim.px[n]; a.y = sim.py[n];
    if (sim.lamRatio >= 0.86) {     // 위험 구간(레드존, 다른 연출과 동일 기준)에 놓인 토핑은 미끄러져 떨어진다
      a.alive = false; a.vy = -0.05; dropped++;
      sndDrop(); vibrate([0, 14]);
      fxOil.fire(sim.px[n], sim.py[n], 6, 0.5, 1.6, 0.1);
      popup.fire('-1', 50, 58, 'warn');
    }
  }
  topAttr.needsUpdate = true;
  if (!any) topPts.visible = false;
}

// ---------- 자동 플레이 (헤드리스 QA) ----------
const AUTO_V = [0.45, 0.90, 1.80];
let autoRun = 0;
function autoDrive(dt) {
  if (stats.done) return;
  if (state === 'idle') { armRun('endless'); return; }
  if (state === 'ready') { startPull(viewport().h * 0.8); return; }
  if (state === 'pull') targetY += AUTO_V[autoRun] * dt;
}
function autoNext() {
  stats.runs.push({ v: AUTO_V[autoRun], cm: +(sim.arcPeak * 100).toFixed(1), broke: sim.broken, T: +sim.T.toFixed(3) });
  autoRun++;
  if (autoRun >= AUTO_V.length) {
    stats.screens = ui.current();
    stats.done = true; stats.tier = TIER;
    stats.errs = (window.__errs || []).length;
    stats.calls = renderer.info.render.calls;
    stats.tris = renderer.info.render.triangles;
    stats.canvasW = renderer.domElement.width; stats.canvasH = renderer.domElement.height;
    stats.best = +best.toFixed(1);
    console.log('AUTO_RESULT ' + JSON.stringify(stats));
    return;
  }
  armRun('endless');
}

// ---------- 메인 루프 ----------
const stats = { runs: [], errs: 0, tier: TIER, fps: 0, done: false };
window.__stats = stats;
window.__sim = sim;
let last = performance.now(), fpsAcc = 0, fpsN = 0, lowT = 0, bootFrames = 0;

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.05) dt = 0.05;
  if (dt <= 0) dt = 1 / 60;
  if (paused) return;

  // 첫 60프레임 캔버스 크기 자가복구 (WebView 제로사이즈 함정)
  if (bootFrames < 60) {
    bootFrames++;
    const v = viewport();
    const need = Math.round(v.w * renderer.getPixelRatio());
    if (Math.abs(renderer.domElement.width - need) > 2) applySize();
  }

  if (msgT > 0) { msgT -= dt; if (msgT <= 0 && state === 'ready') showMsg(''); }
  if (resultT > 0) {
    resultT -= dt;
    if (resultT <= 0) {
      if (AUTO && !stats.done) autoNext();
      else flushResult();
    }
  }

  // 히트스톱 = 하드 정지가 아니라 3단 램프. 총 320ms 이내(정본 §2 ④)
  if (hsDur > 0) {
    hsT += dt;
    const r = hsT / hsDur;
    if (r >= 1) { hsDur = 0; hsT = 0; timeScale = 1; }
    else if (r < 0.20) timeScale = 1 - 0.95 * (r / 0.20);      // fade-in
    else if (r < 0.58) timeScale = 0.05;                        // hold
    else timeScale = 0.05 + 0.95 * ((r - 0.58) / 0.42);         // fade-out
  } else if (slowmo > 0) { slowmo -= dt; timeScale = 0.35; }
  else timeScale = 1;

  if (AUTO) autoDrive(dt);

  const sdt = dt * timeScale;
  if (sdt > 0 && (state === 'pull' || sim.broken)) {
    const ev = simFrame(sim, sdt, sim.rootX, targetY);
    if (ev.broke) onBreak();
    if (!recordHit && state === 'pull' && best > 0 && sim.arcPeak * 100 > best) {
      recordHit = true; sndRecord(); if (slowmo < 0.12) slowmo = 0.12; trauma = Math.max(trauma, 0.22);   // 셰이크 없음: 정밀 입력 중 반(反)손맛
      popup.fire(t('recordNew'), 50, 34, 'record');
      elFlash.style.background = '#ffd66a';
      elFlash.style.opacity = '0.30';
      setTimeout(() => { elFlash.style.opacity = '0'; setTimeout(() => { elFlash.style.background = '#fff'; }, 120); }, 90);
      fxStar.fire(sim.px[sim.N - 1], sim.py[sim.N - 1], 16, 0.7, 1.5, 0.5);
      tween(0.55, 0, 0.45, E.outElastic, (v) => { handKick = v; }, () => { handKick = 0; });
    }
    // 레드존 첫 진입 = 사건화(색 하나로는 부족하다는 규정)
    if (state === 'pull' && !sim.broken && !redPopped && sim.lamRatio >= 0.88) {
      redPopped = true;
      popup.fire('!', 50, 52, 'warn');
      vibrate([0, 22]);
    }
  }

  if (state === 'pull' && !sim.broken) {
    const inRed = sim.lamRatio >= 0.88;
    if (inRed && !wasInRed) redEnters++;
    wasInRed = inRed;
    updateToppings(dt);
  }
  updateTweens(dt); popup.update(dt);
  updateRibbon(); updateCam(dt); updateHud(); updateAudio(); updateDrops(dt);
  renderer.render(scene, cam);

  fpsAcc += dt; fpsN++;
  if (fpsAcc >= 1) {
    const fps = fpsN / fpsAcc; stats.fps = Math.round(fps);
    if (fps < 48) { lowT++; if (lowT >= 3 && TIER > 1) { TIER = 1; RN = RN_LO; applySize(); lowT = 0; } }
    else lowT = 0;
    fpsAcc = 0; fpsN = 0;
  }
  if (DEBUG) {
    elDbg.textContent = 'fps ' + stats.fps + ' tier ' + TIER + ' calls ' + renderer.info.render.calls
      + '\ntri ' + renderer.info.render.triangles + ' sub ' + sim.ev.subSteps
      + '\narc ' + (sim.arc * 100).toFixed(1) + ' peak ' + (sim.arcPeak * 100).toFixed(1)
      + '\nlam ' + sim.lamMax.toFixed(2) + '/' + lambdaBreak(sim).toFixed(2) + ' (' + (sim.lamRatio * 100).toFixed(0) + '%)'
      + '\nT ' + sim.T.toFixed(3) + ' minR ' + sim.minR.toFixed(3) + ' v ' + sim.anchorSpeed.toFixed(2)
      + '\nstate ' + state + (sim.necking ? ' NECK' : '') + (sim.broken ? ' BROKEN' : '');
  }
}
// ---------- 부팅 ----------
store.load();
A.init().then(() => { A.setMuted(store.get().sound === false); });
initLocale();
ui.applyTexts();
ui.bind();
ui.setHooks({
  startOrder: (i) => armRun('order', i),
  startEndless: () => armRun('endless'),
  startDaily: () => {
    if (store.dailyDone()) { ui.openSheet({ title: t('dailyTitle'), msg: t('dailyDone'), a: { label: t('back'), on: () => ui.closeSheet() } }); return; }
    armRun('daily');
  },
  retry: () => armRun(MODE, LV ? LV.idx : 0),
  next: () => { const n = (LV ? LV.idx : -1) + 1; if (n < TOTAL) armRun('order', n); else ui.show('scrTitle'); },
  // 방침 주소 = 스토어 등록 주소와 동일(구 github.io 주소는 404 — 2026-09-15 정책감사)
  openPrivacy: () => { try { window.open('https://dksequence.com/privacy/apps0136-cheesepull/', '_blank'); } catch (e) { } },
  beforeLeave: () => ads.fireInterstitial(),
  openUrl: (u) => { try { window.open(u, '_blank'); } catch (e) { } },
  onScreen: (n) => { if (n !== 'game') { state = 'idle'; A.setAmbience(false); A.bgmOff(); ads.showBanner(); } },
});
ui.show(AUTO ? 'scrTitle' : 'scrTitle');
ads.init().then((ok) => { if (ok && ui.current() !== 'game') ads.showBanner(); });   // 초기화 끝난 뒤 첫 화면 배너

requestAnimationFrame(frame);
console.log('cheesepull boot ok', CHEESES.mozzarella.name, Object.keys(CHEESES).length + ' cheeses');