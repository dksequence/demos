// audio.js — 파일 기반 SFX/BGM + 절차 인장음
// 자산: 폴더 7 정본(14-CC0-사운드-음악)에서 선별한 CC0 1.0 · 크레딧 의무 없음(대장=store-출시준비/07)
// 규율: SFX 는 사전 디코딩된 AudioBuffer 만 사용(트리거 지연 0) · <audio>.play() 금지
//       인장 지속음은 '장력 실시간 변조'가 필요해 파일로 대체 불가 -> 절차 합성 유지
let ctx = null, master = null, sfxGain = null, bgmGain = null, muted = false;
const buf = {};
const SFX = ['grab', 'snap', 'tick', 'bank', 'record', 'clear', 'drop', 'ui', 'whoosh', 'fail'];
const BGM = ['warm', 'cozy', 'tense'];
const bgmBuf = {};
let bgmSrc = null, bgmCur = '', bgmReq = '';

// 절차 인장음(치즈가 늘어나는 소리) — 장력에 따라 gain·필터·피치가 연속 변조된다
let noiseBuf = null, creakFilt = null, creakGain = null, creakSrc = null;
let ambGain = null;

export function ready() { return !!ctx; }
export function getCtx() { return ctx; }

export async function init() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.95; master.connect(ctx.destination);
  sfxGain = ctx.createGain(); sfxGain.gain.value = 1.0; sfxGain.connect(master);
  bgmGain = ctx.createGain(); bgmGain.gain.value = 0.0; bgmGain.connect(master);

  // 결정론 노이즈(절차 인장음·폴백용)
  const len = Math.floor(ctx.sampleRate * 1.0);
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff) - 1; }

  await Promise.all(SFX.map((n) => load('./assets/sfx/' + n + '.ogg').then((b) => { if (b) buf[n] = b; })));
  // BGM 은 첫 사용 시 지연 로드(초기 로딩 무게 감소)
  return true;
}

async function load(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await ctx.decodeAudioData(await r.arrayBuffer());
  } catch (e) { return null; }
}

export function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
export function setMuted(v) {
  muted = !!v;
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.95, ctx.currentTime, 0.04);
}

// ---------- SFX ----------
export function play(name, opts) {
  if (!ctx || muted) return;
  const o = opts || {};
  const b = buf[name];
  if (!b) { fallback(name); return; }
  const s = ctx.createBufferSource();
  s.buffer = b;
  s.playbackRate.value = o.rate || 1;
  const g = ctx.createGain();
  g.gain.value = (o.vol != null) ? o.vol : 1;
  s.connect(g); g.connect(sfxGain);
  s.start(ctx.currentTime + (o.delay || 0));
}
// 파일이 없을 때만 쓰는 절차 폴백(무음보다 낫다)
function fallback(name) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  const f = { snap: 120, bank: 620, record: 880, ui: 440, tick: 1500, drop: 300 }[name] || 500;
  o.type = name === 'snap' ? 'sawtooth' : 'sine';
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.2);
}

// ---------- BGM (가게 무드별 · 크로스페이드 전환) ----------
export async function bgm(key) {
  if (!ctx) return;
  const k = BGM.indexOf(key) >= 0 ? key : 'warm';
  bgmReq = k;
  if (bgmCur === k && bgmSrc) { bgmGain.gain.setTargetAtTime(0.34, ctx.currentTime, 0.8); return; }
  if (!bgmBuf[k]) {
    const b = await load('./assets/bgm/' + k + '.ogg');
    if (!b) return;
    bgmBuf[k] = b;
  }
  if (bgmReq !== k) return;                        // 로딩 중 다른 요청이 들어온 경우
  if (bgmSrc) { try { bgmSrc.stop(ctx.currentTime + 0.6); } catch (e) { } }
  bgmGain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.25);
  const s = ctx.createBufferSource();
  s.buffer = bgmBuf[k]; s.loop = true;
  s.connect(bgmGain);
  s.start(ctx.currentTime + 0.28);
  bgmSrc = s; bgmCur = k;
  bgmGain.gain.setTargetAtTime(0.34, ctx.currentTime + 0.3, 1.0);
}
export function bgmOff() { if (ctx && bgmGain) bgmGain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.5); }

// ---------- 절차 인장음 + 화덕 앰비언스 ----------
export function startStretch() {
  if (!ctx || creakSrc) return;
  creakSrc = ctx.createBufferSource(); creakSrc.buffer = noiseBuf; creakSrc.loop = true;
  creakFilt = ctx.createBiquadFilter(); creakFilt.type = 'bandpass'; creakFilt.Q.value = 7;
  creakFilt.frequency.value = 320;
  creakGain = ctx.createGain(); creakGain.gain.value = 0;
  creakSrc.connect(creakFilt); creakFilt.connect(creakGain); creakGain.connect(sfxGain);
  creakSrc.start();

  // 화덕 웅웅 — 저역 통과 노이즈(공간감)
  const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170; lp.Q.value = 0.7;
  ambGain = ctx.createGain(); ambGain.gain.value = 0;
  n.connect(lp); lp.connect(ambGain); ambGain.connect(master); n.start();
}
export function updateStretch(on, strain, rate) {
  if (!ctx || !creakGain) return;
  const t = ctx.currentTime;
  const s = Math.max(0, Math.min(1.15, strain || 0));
  const r = Math.max(0, Math.min(1, rate || 0));
  // 위험도(s)는 음높이를, 인장 속도(r)는 거칠기를 만든다.
  //   천천히 = 낮고 매끈한 늘어남 / 급하게 = 크고 거친 삐걱임. 눈을 감아도 속도를 알 수 있어야 한다.
  creakGain.gain.setTargetAtTime(on ? (0.014 + s * 0.17 + r * 0.13) : 0, t, 0.05);
  creakFilt.frequency.setTargetAtTime(300 + s * 1250 + r * 900, t, 0.05);
  creakFilt.Q.setTargetAtTime(7 - r * 4.4, t, 0.08);        // 과속일수록 Q 를 낮춰 거칠고 넓은 잡음으로
}
export function setAmbience(on) {
  if (!ctx || !ambGain) return;
  ambGain.gain.setTargetAtTime(on ? 0.10 : 0, ctx.currentTime, on ? 0.9 : 0.4);
}

// 백그라운드로 나가면 소리를 끊는다(오디오 포커스 대체)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { try { ctx.suspend(); } catch (e) { } }
    else { try { ctx.resume(); } catch (e) { } }
  });
}