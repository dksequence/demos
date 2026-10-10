// ui.js — 화면 전환·리스트 렌더·시트 (WebGL 컨텍스트는 1개 유지, 오버레이는 전부 HTML)
import { t, setLocale, getLocale, LOCALES, cheeseName } from './i18n.js';
import * as store from './store.js';
import { MARKS, markIndexFor, skyHexAt } from './skyline.js';
import { SHOPS, makeLevel, TOTAL } from './levels.js';
import * as ads from './ads.js';
import { E, tween } from './fx.js';
import * as A from './audio.js';

const $ = (id) => document.getElementById(id);
const SCR = ['scrTitle', 'scrShops', 'scrLevels', 'scrBook', 'scrSet', 'scrResult'];
let cur = 'scrTitle';
let stack = [];
export let hooks = {};   // { startOrder(idx), startEndless(), startDaily(), onScreen(name) }

export function setHooks(h) { hooks = h; }

export function show(name, push) {
  if (name !== cur) A.play('whoosh', { vol: 0.5 });
  if (push && cur !== name) stack.push(cur);
  cur = name;
  for (const s of SCR) $(s).classList.toggle('hidden', s !== name);
  $('hud').classList.add('hidden');
  $('stage').classList.add('hidden');
  if (hooks.onScreen) hooks.onScreen(name);
}
export function showGame() {
  cur = 'game';
  for (const s of SCR) $(s).classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('stage').classList.remove('hidden');
  if (hooks.onScreen) hooks.onScreen('game');
}
export function back() {
  const prev = stack.pop() || 'scrTitle';
  show(prev);
  refresh(prev);
}
export function current() { return cur; }

// ---------- 텍스트 주입(언어 변경 시 재호출) ----------
let heroLoaded = false;
export function loadHero() {
  if (heroLoaded) return;
  const im = $('heroImg');
  im.onload = () => { im.style.display = ''; heroLoaded = true; };
  im.onerror = () => { im.style.display = 'none'; };   // 없으면 그라디언트 폴백 유지
  im.src = './assets/hero.jpg';
}
export function applyTexts() {
  loadHero();
  $('ttlApp').textContent = t('app');
  $('ttlSub').textContent = t('sub');
  $('btnOrders').textContent = t('orders');
  $('btnEndless').textContent = t('endless');
  $('btnDaily').textContent = t('daily');
  $('btnBook').textContent = t('collection');
  $('btnSet').textContent = t('settings');
  $('shopsTtl').textContent = t('orders');
  $('bookTtl').textContent = t('collection');
  $('setTtl').textContent = t('settings');
  $('lbSound').textContent = t('sound');
  $('lbHaptic').textContent = t('haptic');
  $('lbLang').textContent = t('lang');
  $('btnRemoveAds').textContent = t('removeAds');
  $('btnRestore').textContent = t('restore');
  $('btnPrivacy').textContent = t('privacy');
  $('lbDev').textContent = t('devTitle');
  $('btnDevPlay').textContent = t('devPlay');
  $('btnDevSite').textContent = t('devSite');
  $('btnNext').textContent = t('next');
  $('btnRetry').textContent = t('retry');
  $('btnHome').textContent = t('back');
  document.documentElement.lang = getLocale();
}

function ptsText() { return store.get().points + ' ' + t('points'); }
function starStr(n) { return '★★★☆☆☆'.slice(3 - n, 6 - n); }

export function refresh(name) {
  if (name === 'scrShops') renderShops();
  else if (name === 'scrBook') renderBook();
  else if (name === 'scrSet') renderSettings();
}

// ---------- 가게 목록 ----------
export function renderShops() {
  $('ptsShops').textContent = ptsText();
  const box = $('shopList');
  box.innerHTML = '';
  for (let i = 0; i < SHOPS.length; i++) {
    const first = i * 12;
    let cleared = 0, stars = 0;
    for (let k = first; k < first + 12; k++) { if (store.starsOf(k) > 0) cleared++; stars += store.starsOf(k); }
    const open = store.isPlayable(first);
    const el = document.createElement('div');
    el.className = 'card' + (open ? '' : ' lock');
    el.innerHTML = '<div class="ic">' + (open ? '🍕' : '🔒') + '</div>'
      + '<div class="tx"><b></b><span></span></div>'
      + '<div class="pts">★ ' + stars + '</div>';
    el.querySelector('b').textContent = t('shop' + (i + 1));
    el.querySelector('span').textContent = cleared + ' / 12';   // 언어 무관 표기(예전 ' of 12' 는 12개 언어 전부에 영어로 박혀 있었다)
    if (open) el.onclick = () => { renderLevels(i); show('scrLevels', true); };
    box.appendChild(el);
  }
}

// ---------- 판 그리드 ----------
export function renderLevels(shopIdx) {
  $('lvTtl').textContent = t('shop' + (shopIdx + 1));
  $('ptsLv').textContent = ptsText();
  const g = $('lvGrid');
  g.innerHTML = '';
  const curIdx = store.currentIndex();
  for (let n = 0; n < 12; n++) {
    const idx = shopIdx * 12 + n;
    const L = makeLevel(idx);
    const open = store.isPlayable(idx);
    const st = store.starsOf(idx);
    const el = document.createElement('div');
    el.className = 'cell' + (open ? '' : ' lock') + (idx === curIdx ? ' cur' : '');
    el.innerHTML = '<b>' + (open ? (n + 1) : '🔒') + '</b>'
      + '<div class="st">' + (open ? starStr(st) : '') + '</div>'
      + '<div class="gl"></div>';
    el.querySelector('.gl').textContent = open ? (t('goal') + ' ' + L.goal + t('cm')) : '';
    if (open && hooks.startOrder) el.onclick = () => hooks.startOrder(idx);
    g.appendChild(el);
  }
}

// ---------- 치즈 도감 ----------
const CHEESE_ORDER = ['mozzarella', 'cheddar', 'gorgonzola', 'raclette', 'stringch', 'burrata',
  'provolone', 'emmental', 'gouda', 'brie', 'halloumi', 'taleggio'];
// 구형 안드로이드(Emoji 11 이하)에서 두부가 되지 않도록 2017년 이전 이모지만 쓴다.
const CHEESE_ICON = { mozzarella: '🧀', cheddar: '🔶', gorgonzola: '🔵', raclette: '🌟', stringch: '➰', burrata: '⚪',
  provolone: '🌕', emmental: '🕳️', gouda: '🔸', brie: '💮', halloumi: '🔺', taleggio: '🌰' };

export function renderBook() {
  $('ptsBook').textContent = ptsText();
  const box = $('bookList');
  box.innerHTML = '';
  for (const key of CHEESE_ORDER) {
    const un = store.isCheeseUnlocked(key, CHEESE_ORDER);
    const el = document.createElement('div');
    el.className = 'card' + (un ? '' : ' lock');
    el.innerHTML = '<div class="ic">' + (un ? (CHEESE_ICON[key] || '🧀') : '🔒') + '</div>'
      + '<div class="tx"><b></b><span></span></div>';
    el.querySelector('b').textContent = un ? cheeseName(key) : t('locked');
    el.querySelector('span').textContent = un ? '' : t('unlockPts', { n: store.POLICY.cheeseCost });
    if (!un) el.onclick = () => unlockSheet(key);
    box.appendChild(el);
  }
}

// ---------- 잠금 해제 시트 (3 CTA = 수익화 ②③ 접점) ----------
export function unlockSheet(key) {
  openSheet({
    title: cheeseName(key),
    msg: t('unlockPts', { n: store.POLICY.cheeseCost }),
    a: { label: t('unlockPts', { n: store.POLICY.cheeseCost }), on: () => { if (store.unlockCheese(key)) { closeSheet(); renderBook(); } } },
  });
}
export function openSheet(o) {
  $('shTtl').textContent = o.title || '';
  $('shMsg').textContent = o.msg || '';
  const set = (el, spec) => {
    if (!spec) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden'); el.textContent = spec.label; el.onclick = spec.on;
  };
  set($('shA'), o.a); set($('shB'), o.b); set($('shC'), o.c);
  $('sheet').classList.add('on'); $('veil2').classList.add('on');
}
export function closeSheet() { $('sheet').classList.remove('on'); $('veil2').classList.remove('on'); }

// ---------- 설정 ----------
export function renderSettings() {
  const s = store.get();
  $('swSound').classList.toggle('on', s.sound);
  $('swHaptic').classList.toggle('on', s.haptic);
  $('btnRemoveAds').classList.toggle('hidden', s.adsRemoved);
  const box = $('langs');
  box.innerHTML = '';
  const LABEL = { ko: '한국어', en: 'English', ja: '日本語', 'zh-Hant': '繁體', th: 'ไทย', ms: 'Melayu',
    id: 'Indonesia', es: 'Español', fr: 'Français', 'pt-BR': 'Português', de: 'Deutsch', 'zh-Hans': '简体' };
  for (const L of LOCALES) {
    const b = document.createElement('div');
    b.className = 'lang' + (getLocale() === L ? ' on' : '');
    b.textContent = LABEL[L] || L;
    b.onclick = () => { setLocale(L); applyTexts(); renderSettings(); };
    box.appendChild(b);
  }
}

// ---------- 결과 ----------
const RULER = [
  { cm: 20, e: '🥄' }, { cm: 30, e: '🍕' }, { cm: 45, e: '📏' }, { cm: 70, e: '🎾' },
  { cm: 100, e: '🎸' }, { cm: 140, e: '🚲' }, { cm: 175, e: '🚶' }, { cm: 220, e: '🚪' },
  { cm: 300, e: '🐴' }, { cm: 450, e: '🚗' }, { cm: 550, e: '🦒' }, { cm: 800, e: '🐘' },
  { cm: 1200, e: '🚌' }, { cm: 1800, e: '🦕' }, { cm: 2500, e: '🏊' }, { cm: 3000, e: '🐋' },
  { cm: 5000, e: '🏢' }, { cm: 9000, e: '🎡' }, { cm: 30000, e: '🗼' },
];
function rulerRow(cm) {
  let idx = 0;
  for (let i = 0; i < RULER.length; i++) if (cm >= RULER[i].cm) idx = i;
  const html = [];
  for (let i = Math.max(0, idx - 2); i <= Math.min(RULER.length - 1, idx + 2); i++) {
    const on = i === idx;
    html.push('<span style="opacity:' + (on ? 1 : .34) + ';font-size:' + (on ? 9 : 5.6) + 'vw;'
      + 'filter:' + (on ? 'none' : 'grayscale(1)') + '">' + RULER[i].e + '</span>');
  }
  return html.join('<span style="opacity:.22;font-size:4vw"> · </span>');
}

export function showResult(o) {
  $('resStars').textContent = o.stars != null ? starStr(o.stars) : '';
  $('resStars').style.display = o.stars != null ? '' : 'none';
  const target = Math.round(o.cm);
  $('resLen').textContent = '0' + t('cm');
  tween(0, target, 0.85, E.outCubic, (v) => { $('resLen').textContent = Math.round(v) + t('cm'); });
  $('resSub').textContent = o.sub || '';
  const rr = $('resRuler');
  if (rr) rr.innerHTML = rulerRow(o.cm);
  // 결과 화면 배경 = 도달한 고도의 하늘색. 숫자보다 '저기까지 갔다'가 먼저 읽힌다.
  const sc = $('scrResult');
  if (sc) {
    const c = skyHexAt(o.cm * 0.01);
    sc.style.background = 'linear-gradient(180deg,' + c + ' 0%, #6b5334 58%, #40301f 100%)';
  }
  // [v2] 기록 타일 — 최고(또는 목표) · 넘은 표지 · 이어붙임. 모두 기존 데이터·문자열만 쓴다.
  const st = $('resStats');
  if (st) {
    const tiles = [];
    const mi2 = markIndexFor(o.cm);
    if (mi2 >= 0) tiles.push('<div class="tl"><b>' + MARKS[mi2].e + '</b><span>' + t(MARKS[mi2].key) + ' ' + t('passed') + '</span></div>');
    if (o.anchors > 0) tiles.push('<div class="tl one"><b>' + t('chainDone', { n: o.anchors }) + '</b></div>');
    st.innerHTML = tiles.join('');
    st.style.display = tiles.length ? '' : 'none';
    const nx = $('resNextMk');
    const nm = MARKS[mi2 + 1];
    if (nx && nm) {
      const lo = mi2 >= 0 ? MARKS[mi2].cm : 0;
      const pct = Math.max(4, Math.min(100, (o.cm - lo) * 100 / (nm.cm - lo)));
      nx.innerHTML = '<span class="lb">' + (mi2 >= 0 ? MARKS[mi2].e : '') + '</span><span class="bar"><i style="width:' + pct.toFixed(0) + '%"></i></span>'
        + '<span class="to"><em>' + nm.e + '</em> ' + t(nm.key) + ' ' + nm.cm + t('cm') + '</span>';
    } else if (nx) nx.innerHTML = '';
  }
  $('resSub').classList.toggle('rec', !!o.isRecord);
  $('resSub').classList.toggle('ok', o.goal != null && o.cm >= o.goal);
  // 채움 버튼은 항상 1개 — '다음'이 없으면 '다시'가 채움 버튼이 된다
  $('btnRetry').classList.toggle('pri', !o.hasNext);
  $('btnRetry').classList.toggle('sm', !!o.hasNext);
  // 무엇을 넘었는지 — 이어붙이기 횟수와 함께
  const rm = $('resMarks');
  if (rm) {
    const mi = markIndexFor(o.cm);
    const parts = [];
    if (o.anchors > 0) parts.push('<b>' + t('chainDone', { n: o.anchors }) + '</b>');
    if (mi >= 0) parts.push(MARKS[mi].e + ' ' + t(MARKS[mi].key) + ' ' + t('passed'));
    rm.innerHTML = parts.join('<span class="dot"> · </span>');
    rm.style.display = parts.length ? '' : 'none';
  }
  $('btnNext').classList.toggle('hidden', !o.hasNext);
  show('scrResult');
}

// ---------- 바인딩 ----------
function clickable(el, fn) {
  if (!el) return;
  el.onclick = (e) => { A.play('ui', { vol: 0.7 }); fn(e); };
}
export function bind() {
  clickable($('btnOrders'), () => { renderShops(); show('scrShops', true); });
  clickable($('btnEndless'), () => hooks.startEndless && hooks.startEndless());
  clickable($('btnDaily'), () => hooks.startDaily && hooks.startDaily());
  clickable($('btnBook'), () => { renderBook(); show('scrBook', true); });
  clickable($('btnSet'), () => { renderSettings(); show('scrSet', true); });
  for (const b of document.querySelectorAll('[data-back]')) b.onclick = () => back();
  $('veil2').onclick = () => closeSheet();
  $('swSound').onclick = () => { const v = !store.get().sound; store.setSound(v); A.setMuted(!v); if (v) A.play('ui'); renderSettings(); };
  $('swHaptic').onclick = () => { const v = !store.get().haptic; store.setHaptic(v); renderSettings(); };
  $('btnRemoveAds').onclick = async () => { await ads.buyRemoveAds(); renderSettings(); };
  $('btnRestore').onclick = async () => { await ads.restorePurchases(); renderSettings(); };
  $('btnPrivacy').onclick = () => { if (hooks.openPrivacy) hooks.openPrivacy(); };
  $('btnDevPlay').onclick = () => { if (hooks.openUrl) hooks.openUrl('https://play.google.com/store/apps/developer?id=DKSEQUENCE'); };
  $('btnDevSite').onclick = () => { if (hooks.openUrl) hooks.openUrl('https://dksequence.com/apps/'); };
  // 결과 화면을 떠나는 버튼 3개 — 전면광고는 여기서만(사용자가 직접 누른 뒤). 연타 방지.
  let leaving = false;
  const leave = (go) => async () => {
    if (leaving) return;
    leaving = true;
    try { if (hooks.beforeLeave) await hooks.beforeLeave(); } catch (e) { }
    try { go(); } finally { leaving = false; }
  };
  $('btnHome').onclick = leave(() => { stack.length = 0; show('scrTitle'); });
  $('btnHome').textContent = t('back');
  $('btnRetry').onclick = leave(() => hooks.retry && hooks.retry());
  $('btnNext').onclick = leave(() => hooks.next && hooks.next());
}