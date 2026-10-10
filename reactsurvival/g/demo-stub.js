/* browser demo: no ads / billing / review prompts - stubs for native-only modules */
(function(){
  try { var m = location.search.match(/[?&]lang=(ko|en)/); if (m) localStorage.setItem('dk_lang', m[1]); } catch (e) {}
  var noop = function(){};
  window.Monetize = { adsRemoved: function(){return true;}, init: noop, showBanner: noop, hideBanner: noop, interstitial: noop, purchaseRemoveAds: noop, restore: noop, watchAdFor24h: noop };
  window.Rv = { moment: noop, openStore: noop };
})();
