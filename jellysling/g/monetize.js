/* 웹 데모용 스텁 - 광고·결제·리뷰 요청·알림을 일절 띄우지 않는다. 게임이 참조하는 인터페이스만 남긴다. */
(function(){
  'use strict';
  function noop(){}
  window.Monetize={adCovering:false,adsRemoved:function(){return true;},init:noop,showBanner:noop,hideBanner:noop,
    interstitial:noop,purchaseRemoveAds:noop,restore:noop,watchAdFor24h:noop};
})();
