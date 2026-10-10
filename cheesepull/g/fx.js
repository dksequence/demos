// fx.js — 게임 필(juice) 유틸: easing · 파티클 버스트 · 숫자 팝업 · 스쿼시&스트레치
// 정본 = 005-참조문서 모음집 / 8. 게임 개발 참조문서
// 원칙 2개: "juice는 코어를 반향한다" / "흔한 행동일수록 juice는 단순하게"
import * as THREE from './vendor/three.module.js';

// ---------- easing (03 문서 공식) ----------
export const E = {
  linear: (t) => t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inQuad: (t) => t * t,
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  outElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  outBounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

// 시간 기반 트윈 풀 (프레임당 할당 0)
const TW = [];
for (let i = 0; i < 24; i++) TW.push({ on: false, t: 0, dur: 1, from: 0, to: 0, ease: E.outQuad, cb: null, done: null });
export function tween(from, to, dur, ease, cb, done) {
  for (let i = 0; i < TW.length; i++) {
    const w = TW[i];
    if (w.on) continue;
    w.on = true; w.t = 0; w.dur = Math.max(0.0001, dur);
    w.from = from; w.to = to; w.ease = ease || E.outQuad; w.cb = cb; w.done = done || null;
    return w;
  }
  return null;
}
export function updateTweens(dt) {
  for (let i = 0; i < TW.length; i++) {
    const w = TW[i];
    if (!w.on) continue;
    w.t += dt;
    let p = w.t / w.dur;
    if (p >= 1) p = 1;
    const v = w.from + (w.to - w.from) * w.ease(p);
    if (w.cb) w.cb(v, p);
    if (p >= 1) { w.on = false; if (w.done) w.done(); }
  }
}

// ---------- 파티클 버스트 (단일 Points = 드로우콜 1) ----------
export class Burst {
  constructor(scene, max, color, size, additive) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.vx = new Float32Array(max);
    this.vy = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.spin = new Float32Array(max);
    for (let i = 0; i < max; i++) this.pos[i * 3 + 1] = -999;
    const g = new THREE.BufferGeometry();
    this.attr = new THREE.BufferAttribute(this.pos, 3);
    this.attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.attr);
    this.mat = new THREE.PointsMaterial({
      color: color, size: size, sizeAttenuation: false,
      transparent: true, opacity: 1, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.pts = new THREE.Points(g, this.mat);
    this.pts.frustumCulled = false;
    this.pts.visible = false;
    this.pts.renderOrder = 5;
    scene.add(this.pts);
    this.alive = 0;
    this.seed = 1;
  }
  rnd() { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x7fffffff; }
  // 충돌 지점에 정확히. 5~15개, 속도 랜덤, 수명 0.2~0.6s (01 문서 파라미터)
  fire(x, y, n, speed, spread, upBias) {
    this.pts.visible = true;
    this.mat.opacity = 1;
    const cnt = Math.min(n, this.max);
    for (let i = 0; i < cnt; i++) {
      const a = (i / cnt) * Math.PI * 2 + this.rnd() * spread;
      const sp = speed * (0.45 + this.rnd() * 0.75);
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = 0.3;
      this.vx[i] = Math.cos(a) * sp;
      this.vy[i] = Math.sin(a) * sp + (upBias || 0);
      this.maxLife[i] = 0.22 + this.rnd() * 0.38;
      this.life[i] = this.maxLife[i];
      this.spin[i] = (this.rnd() - 0.5) * 2;
    }
    for (let i = cnt; i < this.max; i++) { this.life[i] = 0; this.pos[i * 3 + 1] = -999; }
    this.alive = cnt;
    this.attr.needsUpdate = true;
  }
  update(dt, gravity) {
    if (!this.pts.visible) return;
    let alive = 0, maxL = 0;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -999; continue; }
      alive++;
      const r = this.life[i] / this.maxLife[i];
      if (r > maxL) maxL = r;
      this.vy[i] -= (gravity || 6.0) * dt;
      this.vx[i] *= 0.985;
      this.pos[i * 3] += this.vx[i] * dt;
      this.pos[i * 3 + 1] += this.vy[i] * dt;
    }
    this.attr.needsUpdate = true;
    this.mat.opacity = maxL;                    // ease-out 페이드 (01 문서)
    if (alive === 0) this.pts.visible = false;
  }
}

// ---------- 숫자/텍스트 팝업 (HTML = 드로우콜 0) ----------
export class Popup {
  constructor(host, n) {
    this.pool = [];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'pop';
      host.appendChild(el);
      this.pool.push({ el, t: 0, dur: 0 });
    }
  }
  // backOut 으로 튀어오르며 등장 -> 위로 흘러 사라짐
  fire(text, xPct, yPct, kind) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (p.dur > 0) continue;
      p.el.textContent = text;
      p.el.className = 'pop' + (kind ? ' ' + kind : '');
      p.el.style.left = xPct + '%';
      p.el.style.top = yPct + '%';
      p.t = 0; p.dur = 1.05;
      p.el.style.opacity = '0';
      return p;
    }
    return null;
  }
  update(dt) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (p.dur <= 0) continue;
      p.t += dt;
      const r = p.t / p.dur;
      if (r >= 1) { p.dur = 0; p.el.style.opacity = '0'; p.el.style.transform = 'translate(-50%,-50%) scale(1)'; continue; }
      const s = r < 0.42 ? E.outBack(r / 0.42) : 1;
      const rise = E.outCubic(r) * -46;
      const fade = r < 0.62 ? 1 : 1 - (r - 0.62) / 0.38;
      p.el.style.opacity = String(fade);
      p.el.style.transform = 'translate(-50%,-50%) translateY(' + rise.toFixed(1) + 'px) scale(' + (0.6 + s * 0.55).toFixed(3) + ')';
    }
  }
}

// ---------- 스쿼시 & 스트레치 ----------
// 볼륨 보존: 한 축을 k배 늘리면 반대 축은 1/sqrt(k)
export function squash(obj, k) {
  const inv = 1 / Math.sqrt(Math.max(0.0001, k));
  obj.scale.set(inv, k, 1);
}