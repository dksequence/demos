// store.js — 온디바이스 저장 (localStorage) · 서버 0
// StageKit 정책: main = sequential(앞 판 클리어로 해금) · cheese = collection(포인트·구매로 개별 해금)
import { TOTAL } from './levels.js';

const KEY = 'cp_save_v1';
export const POLICY = {
  freeCheese: 3,          // 무료 제공 치즈 수
  cheeseCost: 150,        // 치즈 1종 해금 포인트
  starPoints: 20,         // 별 1개당 자동 적립(통화 단일화 — 무과금은 별로, 광고 시청자는 광고로)
  adPoints: 50,           // 보상형 1회
};

const DEFAULT = {
  best: 0,                 // 엔드리스 최고 기록(cm)
  stars: {},               // { levelIdx: 0..3 }
  points: 0,
  cheese: [],              // 해금된 치즈 key 목록(무료 3종 외)
  daily: { date: '', cm: 0, streak: 0 },
  adsRemoved: false,
  sound: true, haptic: true,
  plays: 0,                // 총 판 수(전면 광고 빈도 계산용)
};

let S = null;

export function load() {
  if (S) return S;
  S = Object.assign({}, DEFAULT);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      S = Object.assign({}, DEFAULT, o);
      S.stars = o.stars || {};
      S.cheese = Array.isArray(o.cheese) ? o.cheese : [];
      S.daily = Object.assign({}, DEFAULT.daily, o.daily || {});
    }
  } catch (e) { }
  return S;
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
}
export function get() { return load(); }

// ---- 기록 ----
export function setBest(cm) {
  load();
  if (cm > S.best) { S.best = cm; save(); if (typeof window !== 'undefined' && window.Rv) window.Rv.moment(); /* 신기록 = 좋은 순간 */ return true; }
  return false;
}

// ---- 스테이지(sequential) ----
export function starsOf(idx) { load(); return S.stars[idx] || 0; }
export function totalStars() { load(); let n = 0; for (const k in S.stars) n += S.stars[k]; return n; }
export function clearedCount() { load(); let n = 0; for (const k in S.stars) if (S.stars[k] > 0) n++; return n; }
export function isPlayable(idx) {
  load();
  if (idx === 0) return true;
  return (S.stars[idx - 1] || 0) > 0;      // 앞 판을 1성 이상으로 깨야 열린다
}
export function currentIndex() {
  load();
  for (let i = 0; i < TOTAL; i++) if (!(S.stars[i] > 0)) return i;
  return TOTAL - 1;
}
export function recordStars(idx, s) {
  load();
  const prev = S.stars[idx] || 0;
  if (s > prev) {
    S.stars[idx] = s;
    S.points += (s - prev) * POLICY.starPoints;   // 별 = 포인트 자동 적립
    save();
    return true;
  }
  return false;
}

// ---- 치즈(collection) ----
export function freeCheese(list) { return list.slice(0, POLICY.freeCheese); }
export function isCheeseUnlocked(key, list) {
  load();
  if (list && list.indexOf(key) >= 0 && list.indexOf(key) < POLICY.freeCheese) return true;
  return S.adsRemoved || S.cheese.indexOf(key) >= 0;
}
export function canUnlockCheese() { load(); return S.points >= POLICY.cheeseCost; }
export function unlockCheese(key) {
  load();
  if (S.cheese.indexOf(key) >= 0) return true;
  if (S.points < POLICY.cheeseCost) return false;
  S.points -= POLICY.cheeseCost;
  S.cheese.push(key);
  save();
  return true;
}
export function addPoints(n) { load(); S.points += n; save(); return S.points; }

// ---- 데일리 (날짜 시드 · 서버 0) ----
export function todayKey(now) {
  const d = now ? new Date(now) : new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return String(d.getFullYear()) + m + day;
}
export function dailySeed(key) {
  let h = 2166136261;
  const s = key || todayKey();
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}
export function dailyDone(key) { load(); return S.daily.date === (key || todayKey()); }
export function recordDaily(cm, key) {
  load();
  const k = key || todayKey();
  if (S.daily.date === k) return false;
  const prev = S.daily.date;
  S.daily = { date: k, cm: cm, streak: prevIsYesterday(prev, k) ? (S.daily.streak + 1) : 1 };
  save();
  return true;
}
function prevIsYesterday(prev, cur) {
  if (!prev || prev.length !== 8) return false;
  const p = new Date(+prev.slice(0, 4), +prev.slice(4, 6) - 1, +prev.slice(6, 8));
  const c = new Date(+cur.slice(0, 4), +cur.slice(4, 6) - 1, +cur.slice(6, 8));
  return Math.round((c - p) / 86400000) === 1;
}

// ---- 설정·구매 ----
export function setSound(v) { load(); S.sound = !!v; save(); }
export function setHaptic(v) { load(); S.haptic = !!v; save(); }
export function setAdsRemoved(v) { load(); S.adsRemoved = !!v; save(); }
export function bumpPlays() { load(); S.plays++; save(); return S.plays; }
export function resetAll() { S = Object.assign({}, DEFAULT); S.stars = {}; S.cheese = []; save(); }