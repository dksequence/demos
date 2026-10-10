// skyline.js — 늘린 높이를 '세상의 크기'로 보여주는 스케일 타워.
// 규율: draw call 2개(하늘 1 + 랜드마크 병합 1) · 프레임당 힙 할당 0 · 텍스처는 런타임 캔버스(파일 0바이트)
import * as THREE from './vendor/three.module.js';

// 랜드마크 = 실제 사물의 실제 높이(cm). 라벨은 i18n 키.
// draw: 512x512 타일에 흰 실루엣을 그리는 함수. 바닥이 y=512에 닿게 그린다.
export const MARKS = [
  { cm: 100,     key: 'mkChair',   w: 0.62, e: '💺' },
  { cm: 170,     key: 'mkPerson',  w: 0.34, e: '🚶' },
  { cm: 250,     key: 'mkCar',     w: 1.85, e: '🚗' },
  { cm: 400,     key: 'mkTree',    w: 0.85, e: '🌳' },
  { cm: 600,     key: 'mkHouse',   w: 1.55, e: '🏠' },
  { cm: 900,     key: 'mkLamp',    w: 0.42, e: '💡' },
  { cm: 1400,    key: 'mkPole',    w: 0.55, e: '🗼' },
  { cm: 2000,    key: 'mkBridge',  w: 2.30, e: '🌉' },
  { cm: 3000,    key: 'mkBuild',   w: 1.05, e: '🏢' },
  { cm: 5000,    key: 'mkTowerA',  w: 0.78, e: '🏙️' },
  { cm: 9000,    key: 'mkWheel',   w: 1.00, e: '🎡' },
  { cm: 15000,   key: 'mkTowerB',  w: 0.50, e: '🗼' },
  { cm: 30000,   key: 'mkMount',   w: 2.60, e: '⛰️' },
  { cm: 60000,   key: 'mkBalloon', w: 0.80, e: '🎈' },
  { cm: 120000,  key: 'mkCloud',   w: 2.20, e: '☁️' },
  { cm: 400000,  key: 'mkSpace',   w: 0.70, e: '🚀' },
];

// ---------- 실루엣 아틀라스 (4x4 x 512px) ----------
const TILE = 512, COLS = 4;
function drawTile(g, i) {
  g.save(); g.translate((i % COLS) * TILE, Math.floor(i / COLS) * TILE);
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  const B = 500;                                   // 바닥선
  const box = (x, y, w, h) => g.fillRect(x, y, w, h);
  switch (i) {
    case 0:   // 의자
      box(150, 300, 30, 200); box(330, 300, 30, 200);
      box(140, 280, 230, 30); box(140, 120, 30, 170); box(340, 120, 30, 170); box(140, 120, 230, 26);
      break;
    case 1:   // 사람
      g.beginPath(); g.arc(256, 110, 52, 0, 6.284); g.fill();
      box(230, 168, 52, 170);
      g.lineWidth = 30; g.beginPath(); g.moveTo(240, 340); g.lineTo(210, B); g.moveTo(272, 340); g.lineTo(302, B); g.stroke();
      g.beginPath(); g.moveTo(232, 200); g.lineTo(180, 300); g.moveTo(280, 200); g.lineTo(332, 300); g.stroke();
      break;
    case 2:   // 자동차
      g.beginPath();
      g.moveTo(40, B - 40); g.lineTo(52, 330); g.lineTo(150, 330); g.lineTo(200, 232);
      g.lineTo(330, 232); g.lineTo(378, 330); g.lineTo(470, 336); g.lineTo(478, B - 40);
      g.closePath(); g.fill();
      g.beginPath(); g.arc(140, B - 40, 56, 0, 6.284); g.arc(378, B - 40, 56, 0, 6.284); g.fill();
      break;
    case 3:   // 나무
      box(238, 320, 36, 180);
      g.beginPath(); g.arc(256, 210, 132, 0, 6.284); g.arc(160, 268, 84, 0, 6.284); g.arc(350, 264, 88, 0, 6.284); g.fill();
      break;
    case 4:   // 2층집
      g.beginPath(); g.moveTo(60, 210); g.lineTo(256, 70); g.lineTo(452, 210); g.closePath(); g.fill();
      box(96, 205, 320, 295);
      box(330, 96, 42, 96);
      break;
    case 5:   // 가로등
      box(240, 150, 30, 350);
      g.beginPath(); g.moveTo(255, 150); g.quadraticCurveTo(255, 74, 350, 74); g.lineWidth = 28; g.stroke();
      g.beginPath(); g.ellipse(352, 104, 50, 30, 0, 0, 6.284); g.fill();
      break;
    case 6:   // 전봇대
      box(238, 40, 36, 460);
      box(120, 110, 272, 20); box(140, 190, 232, 18);
      break;
    case 7:   // 교각
      box(30, 250, 452, 34);
      box(120, 284, 40, 216); box(352, 284, 40, 216);
      g.lineWidth = 16;
      g.beginPath(); g.moveTo(140, 250); g.quadraticCurveTo(256, 90, 372, 250); g.stroke();
      for (let k = 0; k < 5; k++) { const x = 160 + k * 48; g.beginPath(); g.moveTo(x, 250); g.lineTo(x, 150 + Math.abs(k - 2) * 24); g.stroke(); }
      break;
    case 8:   // 빌딩
      box(120, 60, 272, 440);
      g.globalCompositeOperation = 'destination-out';
      for (let r = 0; r < 8; r++) for (let cc = 0; cc < 4; cc++) box(150 + cc * 60, 100 + r * 50, 34, 30);
      g.globalCompositeOperation = 'source-over';
      break;
    case 9:   // 마천루
      box(160, 120, 192, 380); box(196, 40, 120, 84); box(246, 0, 20, 44);
      g.globalCompositeOperation = 'destination-out';
      for (let r = 0; r < 7; r++) for (let cc = 0; cc < 3; cc++) box(186 + cc * 56, 156 + r * 48, 30, 26);
      g.globalCompositeOperation = 'source-over';
      break;
    case 10:  // 관람차
      g.lineWidth = 22; g.beginPath(); g.arc(256, 220, 190, 0, 6.284); g.stroke();
      g.lineWidth = 12;
      for (let k = 0; k < 8; k++) { const a = k * 0.7854; g.beginPath(); g.moveTo(256, 220); g.lineTo(256 + Math.cos(a) * 190, 220 + Math.sin(a) * 190); g.stroke(); }
      g.lineWidth = 24; g.beginPath(); g.moveTo(180, B); g.lineTo(256, 220); g.lineTo(332, B); g.stroke();
      break;
    case 11:  // 송신탑
      g.lineWidth = 18;
      g.beginPath(); g.moveTo(150, B); g.lineTo(238, 120); g.moveTo(362, B); g.lineTo(274, 120); g.stroke();
      for (let k = 0; k < 6; k++) { const y = 160 + k * 58, w = 24 + k * 21; g.lineWidth = 11; g.beginPath(); g.moveTo(256 - w, y); g.lineTo(256 + w, y); g.stroke(); }
      box(246, 20, 20, 110);
      g.beginPath(); g.ellipse(256, 150, 74, 26, 0, 0, 6.284); g.fill();
      break;
    case 12:  // 산
      g.beginPath(); g.moveTo(0, B); g.lineTo(170, 130); g.lineTo(250, 250); g.lineTo(330, 90); g.lineTo(512, B); g.closePath(); g.fill();
      break;
    case 13:  // 열기구
      g.beginPath(); g.moveTo(256, 60); g.bezierCurveTo(400, 90, 400, 250, 256, 330); g.bezierCurveTo(112, 250, 112, 90, 256, 60); g.fill();
      g.lineWidth = 8; g.beginPath(); g.moveTo(210, 320); g.lineTo(226, 410); g.moveTo(302, 320); g.lineTo(286, 410); g.stroke();
      box(216, 408, 80, 62);
      break;
    case 14:  // 구름
      g.beginPath();
      g.arc(160, 300, 92, 0, 6.284); g.arc(256, 240, 120, 0, 6.284);
      g.arc(370, 296, 86, 0, 6.284); g.fill();
      box(160, 300, 214, 84);
      break;
    default:  // 로켓/우주
      g.beginPath(); g.moveTo(256, 30); g.quadraticCurveTo(330, 200, 322, 380); g.lineTo(190, 380); g.quadraticCurveTo(182, 200, 256, 30); g.fill();
      g.beginPath(); g.moveTo(190, 330); g.lineTo(120, 450); g.lineTo(190, 420); g.closePath();
      g.moveTo(322, 330); g.lineTo(392, 450); g.lineTo(322, 420); g.closePath(); g.fill();
      g.globalCompositeOperation = 'destination-out';
      g.beginPath(); g.arc(256, 190, 40, 0, 6.284); g.fill();
      g.globalCompositeOperation = 'source-over';
      break;
  }
  g.restore();
}
function buildAtlas() {
  const cv = document.createElement('canvas');
  cv.width = TILE * COLS; cv.height = TILE * Math.ceil(MARKS.length / COLS);
  const g = cv.getContext('2d');
  for (let i = 0; i < MARKS.length; i++) drawTile(g, i);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.minFilter = THREE.LinearMipmapLinearFilter; tx.generateMipmaps = true;
  return tx;
}

// ---------- 하늘: 높이에 따라 색이 바뀌는 세로 그라디언트 ----------
// 실내(따뜻한 갈색) -> 거리 -> 하늘 -> 상공 -> 성층권 -> 우주(검정+별)
// 고도(m) -> 하늘색. 실제 도달 범위(1~12m)에 맞춰 압축한다 —
// 현실 고도를 그대로 쓰면 플레이 대부분이 '실내 갈색'으로 끝난다.
const SKY = [
  [0,    '#f2dcc0'], [0.8,  '#f6e2c6'], [1.6,  '#f3e6cf'],
  [2.4,  '#e9ecd9'], [3.2,  '#dbeaf0'], [4.5,  '#c6e4f7'],
  [7,    '#a9d8f6'], [11,   '#8ec9f2'], [18,   '#6fb6ea'],
  [30,   '#4f9ada'], [55,   '#3576c0'], [110,  '#1d4a92'],
  [260,  '#0b1f4d'],
];
function buildSky() {
  // 세로 그라디언트는 '모양'만 담당(위가 살짝 짙은 하늘). 실제 색조는 고도에 따라 코드가 정한다.
  const H = 256;
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = H;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, H, 0, 0);
  grd.addColorStop(0, '#ffffff'); grd.addColorStop(1, '#ccd6e4');   // 위쪽을 덜 눌러 밝은 하늘을 유지
  g.fillStyle = grd; g.fillRect(0, 0, 4, H);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}
// 별 — 높은 고도에서만 떠오른다
function buildStars() {
  const S = 256;
  const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 220; i++) {
    const a2 = 0.25 + rnd() * 0.75;
    g.fillStyle = 'rgba(255,255,255,' + a2.toFixed(2) + ')';
    const r = rnd() < 0.12 ? 2 : 1;
    g.fillRect(rnd() * S, rnd() * S, r, r);
  }
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  return tx;
}
// 고도(m) -> 하늘색. 실내 갈색 -> 거리 -> 파랑 -> 짙은 파랑 -> 우주 검정
function skyColorAt(m, out) {
  const S = SKY;
  let i = 0;
  while (i < S.length - 1 && m >= S[i + 1][0]) i++;
  if (i >= S.length - 1) { out.set(S[S.length - 1][1]); return out; }
  const a0 = S[i][0], a1 = S[i + 1][0];
  const u = clamp01((m - a0) / (a1 - a0));
  out.set(S[i][1]);
  TMPC.set(S[i + 1][1]);
  return out.lerp(TMPC, u);
}
function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
const TMPC = new THREE.Color();

// cm -> 월드 y(m). 물리와 같은 축.
const cm2m = (cm) => cm * 0.01;

export function createSkyline(scene, cam) {
  // 1) 하늘 — 화면을 채우고, 색만 고도로 바뀐다. (plane 을 실제로 세우면 UV 가 선형이라 저고도가 뭉개진다)
  const skyTex = buildSky();
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, depthWrite: false, depthTest: false, toneMapped: false });
  const skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), skyMat);
  skyMesh.renderOrder = -30; skyMesh.frustumCulled = false;
  skyMesh.position.set(0, 0, -7);
  cam.add(skyMesh);

  // 2) 별 — 높이 올라가면 떠오른다
  const starTex = buildStars();
  const starMat = new THREE.MeshBasicMaterial({ map: starTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false, blending: THREE.AdditiveBlending });
  const starMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), starMat);
  starMesh.renderOrder = -28; starMesh.frustumCulled = false; starMesh.visible = false;
  starMesh.position.set(0, 0, -6.9);
  cam.add(starMesh);

  // 3) 랜드마크 — 하나의 지오메트리(draw call 1). 위치는 매 프레임 갱신한다.
  //    실제 크기 그대로 선형 배치하면 고도가 오르는 즉시 실루엣이 화면보다 커져 밖으로 밀려난다.
  //    그래서 '로그 고도'로 배치한다 — 다음 표지까지의 간격이 늘 비슷해, 계속 지나가는 느낌이 유지된다.
  const atlas = buildAtlas();
  const n = MARKS.length;
  const pos = new Float32Array(n * 4 * 3);
  const uv = new Float32Array(n * 4 * 2);
  const idx = new Uint16Array(n * 6);
  const rows = Math.ceil(n / COLS);
  const SIDE = [-1, 1, -1, 1, 1, -1, 1, -1, -1, 1, -1, 1, 1, -1, -1, 1];
  for (let i = 0; i < n; i++) {
    const cxT = (i % COLS) / COLS, cyT = 1 - (Math.floor(i / COLS) + 1) / rows;
    const uw = 1 / COLS, uh = 1 / rows, p = i * 8;
    uv[p] = cxT; uv[p + 1] = cyT;
    uv[p + 2] = cxT + uw; uv[p + 3] = cyT;
    uv[p + 4] = cxT + uw; uv[p + 5] = cyT + uh;
    uv[p + 6] = cxT; uv[p + 7] = cyT + uh;
    const q = i * 6, v = i * 4;
    idx[q] = v; idx[q + 1] = v + 1; idx[q + 2] = v + 2;
    idx[q + 3] = v; idx[q + 4] = v + 2; idx[q + 5] = v + 3;
  }
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const mat = new THREE.MeshBasicMaterial({ map: atlas, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, opacity: 0.55, color: 0x222b42 });
  const marks = new THREE.Mesh(geo, mat);
  marks.renderOrder = -25; marks.frustumCulled = false;
  marks.position.z = -6.8;
  scene.add(marks);

  const col = new THREE.Color();
  const LOG0 = Math.log(MARKS[0].cm);          // 첫 표지(의자 100cm)를 로그 원점으로
  const SPAN = 0.62;                           // 로그 한 단계가 차지하는 화면 비율

  return {
    skyMesh, skyMat, marks, markMat: mat, starMesh,
    // virtY = 지금까지 늘인 총 길이(m). 가닥은 이어붙일 때 리셋되지만 세상은 계속 올라간다.
    update(camY, virtY, viewH, aspect) {
      const hw = viewH * aspect * 0.5, hh = viewH * 0.5;
      skyMesh.scale.set(hw * 2.2, hh * 2.2, 1);
      starMesh.scale.set(hw * 2.2, hh * 2.2, 1);
      skyMat.color.copy(skyColorAt(virtY, col));

      // 현재 고도의 로그 좌표. 이 값이 커질수록 표지들이 아래로 흐른다.
      const curLog = Math.log(Math.max(virtY * 100, MARKS[0].cm * 0.25));
      const K = viewH / SPAN;                  // 로그 1단계 = 화면의 SPAN 배
      const size = viewH * 0.235;               // 표지 크기는 거의 고정 — 안 그러면 곧 화면을 넘는다
      for (let i = 0; i < n; i++) {
        const m = MARKS[i];
        const dy = (Math.log(m.cm) - curLog) * K * 0.19;   // 촘촘히 = '저 위에 뭐가 남았는지'가 보인다
        const o = i * 12;
        // 화면에서 충분히 벗어난 표지는 축퇴시켜 그리지 않는다(정점만 접는다 = draw call 그대로)
        if (dy < -hh * 2.0 || dy > hh * 2.6) {
          for (let k = 0; k < 12; k++) pos[o + k] = 0;
          continue;
        }
        const h = size, w = h * m.w;
        const cx = SIDE[i % SIDE.length] * (hw * 0.60 + w * 0.22);   // 가운데(치즈)를 비운다
        const x0 = cx - w * 0.5, x1 = cx + w * 0.5;
        const y0 = camY + dy, y1 = y0 + h;
        pos[o] = x0; pos[o + 1] = y0; pos[o + 2] = 0;
        pos[o + 3] = x1; pos[o + 4] = y0; pos[o + 5] = 0;
        pos[o + 6] = x1; pos[o + 7] = y1; pos[o + 8] = 0;
        pos[o + 9] = x0; pos[o + 10] = y1; pos[o + 11] = 0;
      }
      posAttr.needsUpdate = true;

      const night = clamp01((virtY - 14) / 60);
      // 밝은 하늘에서는 옅은 청회색 실루엣이 자연스럽다. 밤이 될수록만 짙어진다.
      mat.color.setRGB(0.44 - 0.34 * night, 0.52 - 0.40 * night, 0.62 - 0.46 * night);
      mat.opacity = 0.34 + 0.36 * night;
      starMat.opacity = night * 0.85;
      starMesh.visible = night > 0.02;
      starTex.repeat.set(Math.max(1, aspect * 2), 2);
      starTex.offset.y = -virtY * 0.004;
    },
    dispose() { atlas.dispose(); skyTex.dispose(); starTex.dispose(); geo.dispose(); mat.dispose(); skyMat.dispose(); starMat.dispose(); skyMesh.geometry.dispose(); starMesh.geometry.dispose(); }
  };
}

// 지금 높이가 어느 랜드마크를 넘었나 (통과 연출용)
export function markIndexFor(cm) {
  let k = -1;
  for (let i = 0; i < MARKS.length; i++) if (cm >= MARKS[i].cm) k = i;
  return k;
}
// UI(결과 화면)에서도 같은 하늘색을 쓴다 — 게임 화면과 결과가 어긋나면 '어디까지 갔나'가 흐려진다.
const _c = new THREE.Color();
export function skyHexAt(m) { return '#' + skyColorAt(m, _c).getHexString(); }
