// cheese.js — 치즈 스트랜드 물리 코어 (순수 ESM · DOM/THREE 의존 0)
// 모델: 소(小)서브스텝 위치기반(PBD/Verlet) + 소성 신장(rest-length creep)
//       + 부피보존 굵기(r = r0*sqrt(L0/L)) + 넥킹 파단(Considere 불안정)
// 단위: m, s. y+ = 위. 노드0 = 피자(고정), 노드N-1 = 손(스프링 추종).
// 결정론: 난수 0. 동일 입력 테이프 -> 동일 상태(Float64).

export const CFG = {
  N: 24,              // 시뮬 노드 수
  L0: 0.18,           // 초기 총 rest length (m)
  r0: 0.011,          // 초기 반경 (m)
  k0: 0.75,           // PBD 기준 강성
  kHard: 1.1,         // 변형경화 계수
  creep: 45.0,        // 소성 유동 계수 (1/s) — 손 속도를 따라잡아야 '고무줄'이 아닌 '치즈'가 된다
  creepEps: 0.10,     // 소성 개시 탄성변형률 (자중만으로는 안 늘어나게)
  creepMax: 0.02,     // 서브스텝당 dL/L 상한 (240Hz -> 최대 480%/s)
  epsBreak: 0.58,     // 파단 기준 = '순간' 탄성 변형률 (누적 λ 가 아니다 — 그건 천장을 잠근다)
  relaxRate: 2.6,     // 응력 완화 계수 — 손을 멈추면 rest length 가 현재 거리로 수렴
  relaxGate: 0.22,    // 완화가 걸리는 앵커 속도 상한(그 이하 = 쉬는 중)
  lambdaBase: 11.0,   // (구) 신장비 상한 — 파단 판정에서 제외, 경고 표시용으로만 남김
  tempTau: 18.0,      // 냉각 시정수 (s) — 이어붙이기가 성립할 만큼 온기가 남아야 한다
  tempFloor: 0.35,    // 냉각 완료시 파단계수 하한
  tempSpan: 0.65,
  rateK: 0.62,        // 인장속도 페널티 계수 — '확 당기면 뚝'
  rateRef: 1.8,       // 페널티 기준 속도 (m/s)
  neckMin: 0.16,      // r_min/r0 강제파단 임계 (치즈별로 갈린다 — 아래 neckSpread)
  neckSpread: 0.5,    // 치즈 lambda 가 넥킹 한계를 밀거나 당기는 폭
  grav: 9.8,
  damp: 0.998,        // 서브스텝 속도감쇠
  anchorOmega: 22,    // 손 앵커 임계감쇠 스프링 (rad/s)
  anchorMaxStep: 0.06,// 프레임당 앵커 이동 상한 (m)
  h: 1 / 240,         // 고정 서브스텝
  subMax: 8,          // 프레임당 서브스텝 상한
  sweeps: 6,          // 서브스텝당 제약 스윕 (N/2=12 전파깊이를 2서브스텝에 확보)
  snapV: 5.5,         // 파단 자유단 초기속도 (m/s)
  snapShrink: 0.55,   // 파단 후 rest length 수축 배율
  snapTau: 0.16,      // 수축 시정수 (s)
  snapDamp: 0.90,     // 파단 직후 감쇠
  snapDampT: 0.15,    // 강감쇠 지속 (s)
  maxCorr: 0.30,      // 서브스텝당 제약 보정 이동 상한 (세그먼트 rest length 비율)
  breakK: 0.35,       // 파단 후 강성 배율 (힘없이 말린다)
  warnLo: 0.82,       // 경고 밴드 시작 (lambda/lambdaBreak)
  epsCap: 0.32,       // 탄성 신장 상한 (초과분 즉시 소성 전환)
  neckEpsBonus: 0.28, // 네킹 유예 중 탄성 상한 가산
  creepVMin: 0.02,    // 소성 유동 개시 앵커속도 (m/s)
  creepVRef: 0.10,    // 소성 게이트 포화 속도 (m/s)
  neckCreep: 0.20,    // 네킹 유예 중 소성유동 억제 배율
  neckGraceT: 0.40,   // 네킹 유예 (s) — 사람의 반응 지연을 흡수하되, 아래 graceShrink 로 초과분만큼 짧아진다
  graceShrink: 26.0,  // 한계를 넘긴 정도에 비례해 유예를 깎는다(살짝=길게, 크게=거의 즉시)
  graceMin: 0.07,     // 유예 하한
  budgetVar: 0.085,   // 가닥마다 파단 여력이 다르다 — 게이지를 정확히 읽어도 '언제 끊길지'는 모른다.
                      //   이 불확실성이 없으면 한계 직전에서 떼는 것이 항상 안전해져 판단이 사라진다.
  neckVMin: 0.06,     // 이 속도 아래면 완전한 균일 연신 (초소성 영역)
  neckVRef: 0.85,     // 이 속도면 국부 넥킹 최대 (m/s)
  neckRateK: 1.55,    // 고속일수록 넥킹 한계를 끌어올린다 = 일찍 잘록해져 끊긴다
  vAvgTau: 0.45,      // 인장속도 이력 시정수 — '지금까지 어떻게 당겨왔나'가 남는다
  bustGraceT: 0.30,   // 단면 소실(넥킹 파열)에도 유예를 준다 — 즉사 금지
  neckGraceCost: 0.26,// 유예 생존시 파단예산 영구손실 — 살아나도 대가가 있어야 한다
};

// 치즈 종류별 물성 (배수). 상위호환 금지 = 전부 트레이드오프
export const CHEESES = {
  mozzarella: { name: 'mozzarella', k: 1.00, creep: 1.00, lambda: 1.00, tau: 1.00, r: 1.00 },
  cheddar:    { name: 'cheddar',    k: 1.25, creep: 0.85, lambda: 1.05, tau: 0.50, r: 1.05 },
  gorgonzola: { name: 'gorgonzola', k: 0.75, creep: 1.30, lambda: 1.20, tau: 1.10, r: 1.15 },
  raclette:   { name: 'raclette',   k: 0.90, creep: 1.15, lambda: 0.78, tau: 2.00, r: 1.00 },
  stringch:   { name: 'stringch',   k: 1.10, creep: 1.35, lambda: 1.31, tau: 0.80, r: 0.80 },
  burrata:    { name: 'burrata',    k: 0.70, creep: 0.90, lambda: 0.68, tau: 1.20, r: 1.25 },
  provolone:  { name: 'provolone',  k: 1.15, creep: 1.05, lambda: 1.10, tau: 0.90, r: 0.95 },
  emmental:   { name: 'emmental',   k: 1.30, creep: 0.75, lambda: 0.92, tau: 0.70, r: 1.10 },
  gouda:      { name: 'gouda',      k: 0.95, creep: 1.20, lambda: 1.02, tau: 1.30, r: 1.05 },
  brie:       { name: 'brie',       k: 0.60, creep: 1.45, lambda: 0.85, tau: 1.50, r: 1.30 },
  halloumi:   { name: 'halloumi',   k: 1.45, creep: 0.60, lambda: 1.15, tau: 0.60, r: 0.90 },
  taleggio:   { name: 'taleggio',   k: 0.80, creep: 1.25, lambda: 1.28, tau: 1.45, r: 1.20 },
};

export function makeSim(overrides) {
  const c = Object.assign({}, CFG, overrides || {});
  const N = c.N, S = N - 1;
  const s = {
    c, N, S,
    px: new Float64Array(N), py: new Float64Array(N),
    ppx: new Float64Array(N), ppy: new Float64Array(N),
    segL: new Float64Array(S), segL0: new Float64Array(S), segR: new Float64Array(S),
    anchorX: 0, anchorY: 0, anchorVX: 0, anchorVY: 0, anchorSpeed: 0,
    vAvg: 0, vN: 0, bustT: 0, breakAt: 1,
    targetX: 0, targetY: 0,
    rootX: 0, rootY: 0,
    time: 0, acc: 0, T: 1, T0: 1, coolMul: 1,
    broken: false, breakIdx: -1, breakTime: -1,
    budget: 1,
    arc: 0, arcPeak: 0,
    lamMax: 0, lamRatio: 0, minR: 1, minRIdx: 0, epsMax: 0, epsBreak: 1, neckMinCh: 0.24,
    necking: false, neckT: 0,
    cheese: CHEESES.mozzarella,
    ev: { broke: false, breakIdx: -1, neckStart: false, neckSave: false, subSteps: 0 },
  };
  resetSim(s, { cheese: 'mozzarella', temp0: 1 });
  return s;
}

// 초기 배치: 피자(노드0)에서 손(노드N-1)까지 살짝 늘어진 직선
export function resetSim(s, setup) {
  const c = s.c, N = s.N, S = s.S;
  const ch = CHEESES[(setup && setup.cheese) || 'mozzarella'] || CHEESES.mozzarella;
  s.cheese = ch;
  const rootX = (setup && setup.rootX) || 0;
  const rootY = (setup && setup.rootY) || 0;
  const handY = rootY + c.L0 * 0.92;
  s.rootX = rootX; s.rootY = rootY;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = rootX + Math.sin(t * Math.PI) * 0.004;
    const y = rootY + (handY - rootY) * t;
    s.px[i] = x; s.py[i] = y; s.ppx[i] = x; s.ppy[i] = y;
  }
  const segLen = c.L0 / S, r0 = c.r0 * ch.r;
  // 세그먼트마다 미세한 강도 편차(결정론적 고정 패턴). 완전 균일하면 전체가 고르게 늘어나
  // 넥킹이 눈에 보이지 않는다 — 약한 지점이 먼저 얇아져야 '한 곳이 잘록해지는' 물성이 산다.
  const wob = (setup && setup.wobble != null) ? setup.wobble : 0.055;
  for (let i = 0; i < S; i++) {
    const u = i / (S - 1);
    const f = 1 + wob * (Math.sin(u * 7.7 + 1.3) * 0.6 + Math.sin(u * 19.1 + 0.4) * 0.4);
    s.segL0[i] = segLen * f;
    s.segL[i] = segLen * f;
    s.segR[i] = r0;
  }
  s.anchorX = s.px[N - 1]; s.anchorY = s.py[N - 1];
  s.targetX = s.anchorX; s.targetY = s.anchorY;
  s.anchorVX = 0; s.anchorVY = 0; s.anchorSpeed = 0;
  s.vAvg = 0; s.vN = 0; s.bustT = 0;
  // seed 를 주면 재현된다(오늘의 한 가닥·테스트). 없으면 판마다 달라진다.
  {
    let sd = (setup && setup.seed != null) ? (setup.seed >>> 0) : (s.runSeq = (s.runSeq || 0) + 1) * 2654435761;
    sd = (sd * 1103515245 + 12345) & 0x7fffffff;
    const u = (sd / 0x7fffffff);
    s.budget = 1;
    // 게이지(lamRatio)는 정직하게 보여주되, 실제로 끊기는 지점은 가닥마다 다르다.
    //   같은 눈금에서 떼도 어떤 가닥은 버티고 어떤 가닥은 끊긴다 — 이것이 '더 갈까'의 근거다.
    s.breakAt = 1 + (u - 0.5) * 2 * c.budgetVar;
  }
  s.time = 0; s.acc = 0;
  s.T0 = (setup && setup.temp0 != null) ? setup.temp0 : 1;
  s.coolMul = (setup && setup.coolMul) ? setup.coolMul : 1;
  s.T = s.T0;
  s.broken = false; s.breakIdx = -1; s.breakTime = -1;
  s.arc = c.L0; s.arcPeak = c.L0;
  s.lamMax = 1; s.lamRatio = 0; s.minR = 1; s.minRIdx = 0;
  s.necking = false; s.neckT = 0;
  clearEv(s);
  measure(s);
  s.arcPeak = s.arc;
  return s;
}

function clearEv(s) {
  const e = s.ev;
  e.broke = false; e.breakIdx = -1; e.neckStart = false; e.neckSave = false; e.subSteps = 0;
}

// 현재 파단 임계 신장비
export function lambdaBreak(s) {
  const c = s.c, ch = s.cheese;
  const temp = c.tempFloor + c.tempSpan * s.T;
  const rate = 1 - c.rateK * clamp(s.anchorSpeed / c.rateRef, 0, 1);
  return c.lambdaBase * ch.lambda * temp * rate * s.budget;
}

// 프레임 진행. tx,ty = 손가락 목표 월드좌표. dt = 프레임 델타(s)
export function simFrame(s, dt, tx, ty) {
  const c = s.c;
  clearEv(s);
  s.targetX = tx; s.targetY = ty;
  s.acc += Math.min(dt, 0.05);
  let n = 0;
  while (s.acc >= c.h && n < c.subMax) { subStep(s, c.h); s.acc -= c.h; n++; }
  if (n === c.subMax) s.acc = 0;
  s.ev.subSteps = n;
  measure(s);
  return s.ev;
}

function subStep(s, h) {
  const c = s.c, N = s.N, S = s.S, ch = s.cheese;
  s.time += h;
  s.T = s.T0 * Math.exp(-s.time * s.coolMul / (c.tempTau * ch.tau));

  // 1) 손 앵커: 임계감쇠 스프링
  const w = c.anchorOmega;
  const dx = s.targetX - s.anchorX, dy = s.targetY - s.anchorY;
  s.anchorVX += (-2 * w * s.anchorVX + w * w * dx) * h;
  s.anchorVY += (-2 * w * s.anchorVY + w * w * dy) * h;
  let mx = s.anchorVX * h, my = s.anchorVY * h;
  const mlen = Math.hypot(mx, my), lim = c.anchorMaxStep * h * 60;
  if (mlen > lim && mlen > 0) { const k = lim / mlen; mx *= k; my *= k; s.anchorVX *= k; s.anchorVY *= k; }
  s.anchorX += mx; s.anchorY += my;
  s.anchorSpeed = Math.hypot(s.anchorVX, s.anchorVY);
  // 인장속도의 이력(EMA) — 넥킹은 '지금 속도'가 아니라 '어떻게 당겨왔나'가 결정한다
  { const a = 1 - Math.exp(-h / c.vAvgTau); s.vAvg += (s.anchorSpeed - s.vAvg) * a; }

  // 2) Verlet 적분
  const damp = (s.broken && s.time - s.breakTime < c.snapDampT) ? c.snapDamp : c.damp;
  for (let i = 0; i < N; i++) {
    if (i === 0) continue;
    if (i === N - 1) continue;
    const x = s.px[i], y = s.py[i];
    const vx = (x - s.ppx[i]) * damp, vy = (y - s.ppy[i]) * damp;
    s.ppx[i] = x; s.ppy[i] = y;
    s.px[i] = x + vx;
    s.py[i] = y + vy - c.grav * h * h;
  }
  // 앵커 구동 노드도 prev를 갱신해야 속도(px-ppx)/h 가 실제 앵커 속도가 된다.
  // (미갱신 시 prev가 리셋 시점에 고정되어 속도가 누적거리로 폭주 계산됨)
  s.ppx[0] = s.px[0]; s.ppy[0] = s.py[0];
  s.px[0] = s.rootX; s.py[0] = s.rootY;
  s.ppx[N - 1] = s.px[N - 1]; s.ppy[N - 1] = s.py[N - 1];
  s.px[N - 1] = s.anchorX; s.py[N - 1] = s.anchorY;

  // 3) 제약 투영 (전진/후진 교대 Gauss-Seidel)
  const lamB = lambdaBreak(s);
  for (let sw = 0; sw < c.sweeps; sw++) {
    const fwd = (sw % 2) === 0;
    for (let j = 0; j < S; j++) {
      const i = fwd ? j : (S - 1 - j);
      if (s.broken && i === s.breakIdx) continue;
      const a = i, b = i + 1;
      const ex = s.px[b] - s.px[a], ey = s.py[b] - s.py[a];
      const d = Math.hypot(ex, ey);
      if (d < 1e-9) continue;
      const L = s.segL[i];
      const lam = L / s.segL0[i];
      let k = Math.min(0.98, c.k0 * ch.k * (1 + c.kHard * clamp((lam - 1) / (lamB - 1 + 1e-6), 0, 1)));
      if (s.broken) k *= c.breakK;
      const corr = (d - L) / d * k;
      const wa = (a === 0) ? 0 : 1;
      const wb = (b === N - 1) ? 0 : 1;
      const wsum = wa + wb;
      if (wsum === 0) continue;
      let cx = ex * corr / wsum, cy = ey * corr / wsum;
      const clim = c.maxCorr * L, cmag = Math.hypot(cx, cy);
      if (cmag > clim && cmag > 0) { const kc = clim / cmag; cx *= kc; cy *= kc; }
      if (wa) { s.px[a] += cx; s.py[a] += cy; }
      if (wb) { s.px[b] -= cx; s.py[b] -= cy; }
    }
  }

  // 4) 소성 유동 + 부피보존 굵기
  if (!s.broken) {
    const r0 = c.r0 * ch.r;
    // 손이 멈추면 소성 유동 정지 -> 자중만으로 무한정 늘어나지 않는다
    let creepGate = clamp((s.anchorSpeed - c.creepVMin) / c.creepVRef, 0, 1);
    if (s.necking) creepGate *= c.neckCreep;
    const relaxGate = clamp(1 - s.anchorSpeed / c.relaxGate, 0, 1);
    for (let i = 0; i < S; i++) {
      const ex = s.px[i + 1] - s.px[i], ey = s.py[i + 1] - s.py[i];
      const d = Math.hypot(ex, ey), L = s.segL[i];
      const eps = (d - L) / L;
      const epsCapNow = s.necking ? c.epsCap + c.neckEpsBonus : c.epsCap;
      if (eps > epsCapNow) {
        s.segL[i] = d / (1 + epsCapNow);         // 상한 초과 = 즉시 소성 전환
      } else if (eps > c.creepEps && creepGate > 0) {
        let dL = c.creep * ch.creep * (eps - c.creepEps) * L * h * creepGate;
        const cap = c.creepMax * L;
        if (dL > cap) dL = cap;
        s.segL[i] = L + dL;
      }
      // 쉬면 회복된다: 응력 완화(stress relaxation). 실제 점탄성 재료의 성질이고,
      // 이것이 '천천히·나눠서 당기는 실력'이 길이로 보상받는 유일한 통로다.
      if (relaxGate > 0) {
        const dd = Math.hypot(s.px[i + 1] - s.px[i], s.py[i + 1] - s.py[i]);
        if (dd > s.segL[i] * (1 + c.creepEps)) {     // 자중 처짐은 제외 — 실제로 당겨진 응력만 푼다
          const k2 = Math.min(0.5, c.relaxRate * relaxGate * h);
          s.segL[i] += (dd - s.segL[i]) * k2;
        }
      }
      s.segR[i] = r0 * Math.sqrt(s.segL0[i] / s.segL[i]);
    }
  } else {
    const kk = Math.exp(-h / c.snapTau);
    for (let i = 0; i < S; i++) {
      if (i === s.breakIdx) continue;
      const tgt = s.segL0[i] * c.snapShrink;
      s.segL[i] = tgt + (s.segL[i] - tgt) * kk;
    }
  }

  // 5) 파단 판정 — '순간 응력' + '단면 소실' 기준.
  //    누적 신장비(λ)로 끊으면 되돌릴 수 없어 실력과 무관하게 천장이 고정된다.
  if (!s.broken) {
    let lamMax = 0, li = 0, minR = 1e9, mi = 0, epsMax = 0, ei = 0;
    const r0 = c.r0 * ch.r;
    for (let i = 0; i < S; i++) {
      const lam = s.segL[i] / s.segL0[i];
      if (lam > lamMax) { lamMax = lam; li = i; }
      const rr = s.segR[i] / r0;
      if (rr < minR) { minR = rr; mi = i; }
      const dx = s.px[i + 1] - s.px[i], dy = s.py[i + 1] - s.py[i];
      const ee = (Math.hypot(dx, dy) - s.segL[i]) / s.segL[i];
      if (ee > epsMax) { epsMax = ee; ei = i; }
    }
    s.lamMax = lamMax; s.minR = minR; s.minRIdx = mi; s.epsMax = epsMax;
    // 파단 임계 = 온도·인장속도·예산이 깎는 '순간 응력' 한계
    const temp = c.tempFloor + c.tempSpan * s.T;
    const rate = 1 - c.rateK * clamp(s.anchorSpeed / c.rateRef, 0, 1);
    const epsB = c.epsBreak * ch.lambda * temp * rate * s.budget;
    s.epsBreak = epsB;
    // 넥킹 한계도 치즈 물성 — 질긴 치즈(lambda↑)는 더 얇아질 때까지 버틴다
    //   저속 = 소성이 가닥 전체에 고르게 퍼져 아주 얇아질 때까지 버틴다(균일 연신).
    //   고속 = 한 지점에 변형이 몰려 일찍 잘록해진다(국부 넥킹). 실제 재료의 변형률속도 민감도.
    const vN = clamp((s.vAvg - c.neckVMin) / (c.neckVRef - c.neckVMin), 0, 1);
    const neckMinCh = c.neckMin * (1 + c.neckSpread * (1 - ch.lambda)) * (1 + c.neckRateK * vN);
    s.vN = vN;
    s.neckMinCh = neckMinCh;
    // 위험도 = 응력 한계 근접도와 넥킹 근접도 중 큰 쪽
    const rNeck = (1 - minR) / (1 - neckMinCh);
    s.lamRatio = Math.max(epsMax / epsB, rNeck);
    const li2 = (epsMax / epsB >= rNeck) ? ei : mi;
    const neckBust = minR < neckMinCh * (2 - s.breakAt);   // 여력이 약한 가닥은 더 일찍 잘록해진다
    if (neckBust) {
      // 즉사시키지 않는다 — 짧은 유예 안에 속도를 늦추거나 떼면 살아남는다.
      s.necking = true; s.bustT += h;
      if (!s.ev.neckStart && s.neckT === 0) s.ev.neckStart = true;
      const overR = Math.max(0, (neckMinCh - minR) / Math.max(1e-6, neckMinCh));
      const bT = Math.max(c.graceMin, c.bustGraceT / (1 + c.graceShrink * overR));
      if (s.bustT >= bT) doBreak(s, mi);
    } else if (s.lamRatio >= s.breakAt) {
      s.bustT = 0;
      if (!s.necking) { s.necking = true; s.neckT = 0; s.ev.neckStart = true; }
      else {
        s.neckT += h;
        // 한계를 얼마나 넘겼는지가 남은 시간을 정한다 — 무작정 버티면 유예가 사라진다
        const over = Math.max(0, s.lamRatio - s.breakAt);
        const gT = Math.max(c.graceMin, c.neckGraceT / (1 + c.graceShrink * over));
        if (s.neckT >= gT) doBreak(s, li2);
      }
    } else if (s.necking) {
      s.necking = false; s.neckT = 0; s.bustT = 0;
      s.budget *= (1 - c.neckGraceCost);
      s.ev.neckSave = true;
    }
  }
}

function doBreak(s, idx) {
  const c = s.c, N = s.N;
  s.broken = true; s.breakIdx = idx; s.breakTime = s.time;
  s.necking = false; s.neckT = 0;
  s.ev.broke = true; s.ev.breakIdx = idx;
  const a = idx, b = idx + 1;
  const ex = s.px[b] - s.px[a], ey = s.py[b] - s.py[a];
  const d = Math.hypot(ex, ey) || 1;
  const ux = ex / d, uy = ey / d;
  const v = c.snapV * c.h;
  if (a > 0) { s.ppx[a] += ux * v; s.ppy[a] += uy * v; }
  if (b < N - 1) { s.ppx[b] -= ux * v; s.ppy[b] -= uy * v; }
}

function measure(s) {
  let arc = 0;
  const N = s.N;
  for (let i = 0; i < N - 1; i++) {
    if (s.broken && i === s.breakIdx) continue;
    arc += Math.hypot(s.px[i + 1] - s.px[i], s.py[i + 1] - s.py[i]);
  }
  s.arc = arc;
  if (!s.broken && !s.necking && arc > s.arcPeak) s.arcPeak = arc;
}

export function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

export function volume(s) {
  let v = 0;
  for (let i = 0; i < s.S; i++) v += Math.PI * s.segR[i] * s.segR[i] * s.segL[i];
  return v;
}

export function kinetic(s) {
  let e = 0;
  for (let i = 0; i < s.N; i++) {
    const vx = s.px[i] - s.ppx[i], vy = s.py[i] - s.ppy[i];
    e += vx * vx + vy * vy;
  }
  return e;
}

export function maxSpeed(s) {
  let m = 0;
  for (let i = 0; i < s.N; i++) {
    const vx = (s.px[i] - s.ppx[i]) / s.c.h, vy = (s.py[i] - s.ppy[i]) / s.c.h;
    const v = Math.hypot(vx, vy);
    if (v > m) m = v;
  }
  return m;
}

export function checksum(s) {
  let a = 0;
  for (let i = 0; i < s.N; i++) { a += s.px[i] * 1e6 + s.py[i] * 1e3; }
  for (let i = 0; i < s.S; i++) { a += s.segL[i] * 1e4 + s.segR[i] * 1e7; }
  return a;
}

export function isFiniteState(s) {
  for (let i = 0; i < s.N; i++) if (!Number.isFinite(s.px[i]) || !Number.isFinite(s.py[i])) return false;
  for (let i = 0; i < s.S; i++) if (!Number.isFinite(s.segL[i]) || !Number.isFinite(s.segR[i])) return false;
  return true;
}