// levels.js — 주문 60판 파라메트릭 생성 (순수 함수 · 난수 0 · 서버 0)
// 5가게 x 12주문. 손으로 만드는 것은 가게별 knob 범위 5세트뿐.
import { CHEESES } from './cheese.js';

export const SHOPS = [
  { key: 'street',  cheeses: ['mozzarella', 'cheddar'],                     bgm: 'warm'  },
  { key: 'trattoria', cheeses: ['mozzarella', 'provolone', 'gorgonzola'],   bgm: 'warm'  },
  { key: 'bistro',  cheeses: ['raclette', 'brie', 'gouda'],                 bgm: 'cozy'  },
  { key: 'deli',    cheeses: ['stringch', 'emmental', 'halloumi'],          bgm: 'cozy'  },
  { key: 'master',  cheeses: ['burrata', 'taleggio', 'gorgonzola', 'raclette'], bgm: 'tense' },
];

// 주문 타입: 같은 코어, 다른 채점
export const ORDER_TYPES = ['long', 'just', 'safe'];

export const TOTAL = SHOPS.length * 12;

function lerp(a, b, t) { return a + (b - a) * t; }

// 캘리브레이션 테이블 — _tools/calib.mjs 가 실측으로 생성해 주입한다(추측 금지).
// 값 = 그 판의 물성/온도/시간제한에서 최적 플레이로 도달 가능한 최대 길이(cm).
export let MAXCM = [1043.9, 804.1, 1043.9, 804.1, 1043.9, 755.3, 1043.9, 755.3, 1043.9, 755.3, 1043.9, 755.3, 927.5, 993.4, 1044.4, 927.5, 993.4, 1044.4, 927.5, 993.4, 1044.4, 927.5, 993.4, 1044.4, 906.1, 675.1, 942.1, 906.1, 675.1, 942.1, 886.1, 675.1, 942.1, 886.1, 675.1, 942.1, 802.1, 553.8, 580.1, 802.1, 553.8, 580.1, 802.1, 553.8, 580.1, 802.1, 553.8, 580.1, 402, 987.2, 808.4, 686.8, 400.9, 987.2, 808.4, 631.5, 400.9, 987.2, 807.4, 596.9];
export function setMaxTable(t) { if (Array.isArray(t) && t.length === 60) MAXCM = t; }

// goal 이 없는 순수 물성 레벨(캘리브레이터가 순환 참조 없이 쓰는 형태)
export function levelBase(i) {
  const shopIdx = Math.floor(i / 12);
  const n = i % 12;                       // 0..11
  const shop = SHOPS[shopIdx];
  const g = shopIdx / (SHOPS.length - 1); // 가게 진행도 0..1
  const l = n / 11;                       // 가게 내 진행도 0..1
  const p = (shopIdx * 12 + n) / (TOTAL - 1);

  // 주문 타입: 1~3판은 롱풀로 학습, 이후 순환, 12판째는 보스(롱풀)
  let type = 'long';
  if (n >= 3 && n < 11) type = ORDER_TYPES[(n - 3) % 3];

  const cheese = shop.cheeses[n % shop.cheeses.length];
  const ch = CHEESES[cheese] || CHEESES.mozzarella;

  return {
    idx: i, shop: shop.key, shopIdx, n, type, cheese, p, lam: ch.lambda,
    temp0: lerp(1.0, 0.86, g * 0.9 + l * 0.1),   // 시작 온도(늦은 가게일수록 덜 뜨겁다)
    coolMul: lerp(1.0, 1.9, Math.max(0, g - 0.15) / 0.85),  // 냉각 가속 (가게2부터)
    toppings: shopIdx >= 1 ? Math.min(4, Math.floor(l * 4 + (shopIdx - 1) * 0.6)) : 0,
    timeLimit: shopIdx >= 4 ? Math.round(lerp(22, 11, l)) : 0,   // 0 = 무제한
    justBand: type === 'just' ? Math.round(lerp(9, 4, p)) : 0,   // ±cm
    starThree: type === 'safe' ? 'no_drop' : 'no_red',
    bgm: shop.bgm,
  };
}

// 진행도에 따른 요구 비율: 초반은 물리 최대의 50%면 통과, 후반은 82%까지 요구
function demand(p) { return lerp(0.30, 0.78, Math.pow(p, 0.80)); }   // 2026-08-02: MAXCM 이 '현실 도달치'로 바뀌어 비율도 다시 잡았다

export function makeLevel(i) {
  const b = levelBase(i);
  const max = MAXCM[i] || 100;
  b.goal = Math.max(20, Math.round(max * demand(b.p) / 5) * 5);
  b.maxCm = +max.toFixed(1);
  b.star2 = Math.round(Math.min(b.goal * 1.30, max * 0.94));   // 항상 도달 가능한 ★2
  return b;
}

export function allLevels() {
  const out = [];
  for (let i = 0; i < TOTAL; i++) out.push(makeLevel(i));
  return out;
}

// 별 판정 (순수)
export function judge(level, res) {
  // res: { cm, redEnters, dropped, banked, timeUsed }
  if (!res.banked) return 0;
  if (level.type === 'just') {
    if (Math.abs(res.cm - level.goal) > level.justBand) return 0;
  } else if (res.cm < level.goal) return 0;
  let s = 1;
  if (level.type === 'just') { if (Math.abs(res.cm - level.goal) <= Math.max(1, level.justBand * 0.4)) s = 2; }
  else if (res.cm >= level.star2) s = 2;
  const third = level.starThree === 'no_drop' ? (res.dropped === 0) : (res.redEnters === 0);
  if (s >= 1 && third) s = Math.min(3, s + 1);
  return s;
}