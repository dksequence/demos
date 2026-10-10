// ads.js — 수익화 3종 (규정 의무)
//  ① 노출형: 배너 = 메뉴·결과 화면만 / 전면 = 결과 화면을 «떠나는 버튼»(다음·다시·뒤로)을 누른 뒤에만
//     (2026-10-06 정책감사: 결과 화면이 자동으로 뜨는 순간 = 드래그하던 손가락이 남아 있을 수 있어 오클릭 위험 → 이동)
//  ② 보상형 opt-in (3개소)
//  ③ remove_ads IAP -> adsRemoved 플래그로 배너·전면만 OFF (보상형은 유지)
// AdMob 정책: 플레이 중(하단 드래그 조작) 배너 노출은 실수 클릭 유발 배치 -> 아예 언로드한다.
import * as store from './store.js';

export const UNITS = {
  // 실 ID 는 콘솔 게이트에서 주입. 기본값 = Google 공식 테스트 ID
  banner: 'ca-app-pub-8602803028290360~2602594052',
  bannerUnit: 'ca-app-pub-8602803028290360' + String.fromCharCode(47) + '2518833572',
  interUnit: 'ca-app-pub-8602803028290360' + String.fromCharCode(47) + '8302372248',
  rewardUnit: 'ca-app-pub-8602803028290360' + String.fromCharCode(47) + '4666379564',
};

export const POLICY = {
  interEveryPlays: 3,        // 3판마다 1회
  interMinGapSec: 90,        // 최소 간격
  freeFirstPlays: 3,         // 첫 세션 3판 면제
};

let AdMob = null, ready = false, bannerUp = false;
let lastInterAt = 0;

export async function init() {
  try {
    const cap = window.Capacitor;
    if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return false;
    // 🔴 2026-10-06: 예전엔 import('@capacitor-community/admob') 였다 — 번들러·importmap 이 없는 웹뷰에선
    //    «Failed to resolve module specifier» 로 항상 실패해 광고·UMP 가 한 번도 초기화되지 않았다(vc1~vc6).
    //    네이티브 플러그인은 Capacitor 가 window.Capacitor.Plugins 에 올려 준다(다른 Capacitor 앱 monetize.js 와 같은 방식).
    initBilling();                          // 광고 제거 구매 복원은 광고 초기화와 무관하게 먼저
    AdMob = (cap.Plugins && cap.Plugins.AdMob) || null;
    if (!AdMob) return false;
    await AdMob.initialize({ initializeForTesting: false });
    // GDPR/UMP - 유럽 사용자 동의(@capacitor-community/admob v8)
    try {
      const ci = await AdMob.requestConsentInfo();
      if (ci && ci.isConsentFormAvailable && ci.status === 'REQUIRED') { await AdMob.showConsentForm(); }
    } catch (e) { }
    ready = true;
    return true;
  } catch (e) { ready = false; return false; }
}

function adsOn() { return !store.get().adsRemoved; }

// ---- 배너 ----
// 하단 배너는 웹뷰 위에 겹친다(화면 전체폭, 투명 양옆도 터치를 가로챔) — 실측 높이를 --ad-h 로 받아
// 화면 아래 버튼을 비켜 세운다(표준 02-TEMPLATE/ads-standard, release_gate B18). no-fill·숨김 때 0.
function setAdH(h) {
  try { document.documentElement.style.setProperty('--ad-h', (h > 0 ? h : 0) + 'px'); } catch (e) { }
}
let sizeListen = false;
let wantBanner = false;   // 마지막 요청이 '보이기'인지 — 비동기 경합으로 플레이 중에 배너가 남는 것을 막는다
export async function showBanner() {
  wantBanner = true;
  if (!ready || !adsOn() || bannerUp) return;
  bannerUp = true;
  try {
    if (!sizeListen) {
      sizeListen = true;
      try { AdMob.addListener('bannerAdSizeChanged', (sz) => setAdH(sz && sz.height)); } catch (e) { }
    }
    await AdMob.showBanner({
      adId: UNITS.bannerUnit,
      position: 'BOTTOM_CENTER',
      adSize: 'ADAPTIVE_BANNER',
      margin: 0,
    });
  } catch (e) { bannerUp = false; return; }
  if (!wantBanner) await hideBanner();    // 띄우는 사이 게임이 시작됐으면 바로 내린다
}
export async function hideBanner() {
  wantBanner = false;
  if (!ready) return;
  bannerUp = false;                       // 띄우는 중이어도 항상 내리기를 보낸다(없으면 무시됨)
  try { await AdMob.removeBanner(); } catch (e) { }
  setAdH(0);
}

// ---- 전면: 순수 판정 함수(테스트 대상) ----
export function shouldShowInterstitial(st) {
  // st: { adsRemoved, plays, lastInterAt, nowSec, wasRecord, wasDaily }
  if (st.adsRemoved) return false;
  if (st.wasRecord || st.wasDaily) return false;            // 가장 기분 좋은 순간은 덮지 않는다
  if (st.plays <= POLICY.freeFirstPlays) return false;      // 첫 3판 면제
  if (st.plays % POLICY.interEveryPlays !== 0) return false;
  if (st.nowSec - st.lastInterAt < POLICY.interMinGapSec) return false;
  return true;
}
// ---- 전면 2단계: 결과 화면이 뜰 때는 «판정·미리 받기»만, 보여 주는 건 떠나는 버튼에서 ----
//  빈도 규칙(shouldShowInterstitial)은 그대로 — 판정은 한 판에 한 번(결과 화면 진입 시)만 한다.
//  떠나는 버튼을 눌렀을 때 아직 다 못 받았으면 기다리지 않고 건너뛴다(노출이 늘어나는 방향의 변경 없음).
let armed = null;   // { ok:boolean }
export function armInterstitial(ctx) {
  armed = null;
  const st = {
    adsRemoved: store.get().adsRemoved,
    plays: store.get().plays,
    lastInterAt: lastInterAt,
    nowSec: Date.now() * 0.001,
    wasRecord: !!(ctx && ctx.wasRecord),
    wasDaily: !!(ctx && ctx.wasDaily),
  };
  if (!shouldShowInterstitial(st)) return false;
  if (!ready) { lastInterAt = st.nowSec; return false; }
  const a = { ok: false };
  armed = a;
  preload(a);   // 기다리지 않는다 — 결과 화면은 바로 조작 가능
  return true;
}
async function preload(a) {
  try { await AdMob.prepareInterstitial({ adId: UNITS.interUnit }); a.ok = true; } catch (e) { a.ok = false; }
}
export async function fireInterstitial() {
  const a = armed; armed = null;
  if (!a || !a.ok || !ready || !adsOn()) return false;
  try {
    await AdMob.showInterstitial();
    lastInterAt = Date.now() * 0.001;
    return true;
  } catch (e) { return false; }
}

// ---- 보상형 (opt-in 전용. remove_ads 를 사도 남는다) ----
export async function showRewarded() {
  if (!ready) return false;                 // 웹/미초기화: 보상 지급 안 함(정직)
  try {
    await AdMob.prepareRewardVideoAd({ adId: UNITS.rewardUnit });
    const r = await AdMob.showRewardVideoAd();
    return !!r;
  } catch (e) { return false; }
}

// ---- IAP (remove_ads) — BillingPlugin.java(@CapacitorPlugin name="Billing")에 연결 ----
//  지급은 purchaseUpdated 이벤트에서만(정본 패턴). buy()는 결제 플로우만 띄운다.
function _billing() {
  return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Billing) || null;
}
let _billingListen = false;
export async function initBilling() {
  const B = _billing();
  if (!B) return false;
  try {
    if (!_billingListen) {
      B.addListener('purchaseUpdated', () => { store.setAdsRemoved(true); hideBanner(); });
      _billingListen = true;
    }
    const r = await B.isOwned();          // 재설치/기기변경 복원
    if (r && r.owned) { store.setAdsRemoved(true); await hideBanner(); }
    return true;
  } catch (e) { return false; }
}
export async function buyRemoveAds() {
  const B = _billing();
  if (!B) return false;
  try {
    await B.buy();                        // 지급은 purchaseUpdated 리스너에서
    return true;
  } catch (e) { return false; }
}
export async function restorePurchases() {
  const B = _billing();
  if (!B) return false;
  try {
    const r = await B.isOwned();
    if (r && r.owned) { store.setAdsRemoved(true); await hideBanner(); return true; }
    return false;
  } catch (e) { return false; }
}