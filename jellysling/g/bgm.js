/* 앱공장 웹게임 공용 BGM — bgm.ogg 루프 재생 + 🔊 토글(localStorage 지속).
 * 자동재생 정책상 첫 사용자 제스처에서 시작. 탭 숨기면 일시정지. 게임 SFX와 별개. */
(function () {
  'use strict';
  var KEY = 'bgmOff';
  var audio = new Audio('bgm.ogg');
  audio.loop = true;
  audio.volume = 0.32;
  var off = false;
  try { off = localStorage.getItem(KEY) === '1'; } catch (e) {}
  var started = false;

  function tryStart() {
    if (started || off) return;
    var p = audio.play();
    if (p && p.then) p.then(function () { started = true; }).catch(function () {});
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, tryStart, { passive: true });
  });

  function mkBtn() {
    if (document.getElementById('bgmBtn')) return;
    var b = document.createElement('button');
    b.id = 'bgmBtn';
    b.style.cssText = 'position:fixed;top:env(safe-area-inset-top,8px);left:8px;z-index:2147482000;' +
      'width:34px;height:34px;border:none;border-radius:10px;background:rgba(0,0,0,.32);' +
      'color:#fff;font-size:16px;line-height:34px;text-align:center;cursor:pointer;';
    function render() { b.textContent = off ? '🔇' : '🔊'; }
    b.onclick = function (e) {
      e.stopPropagation();
      off = !off;
      try { localStorage.setItem(KEY, off ? '1' : '0'); } catch (_) {}
      if (off) { audio.pause(); } else { started = false; tryStart(); }
      render();
    };
    render();
    document.body.appendChild(b);
  }
  if (document.readyState !== 'loading') mkBtn();
  else document.addEventListener('DOMContentLoaded', mkBtn);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) audio.pause();
    else if (!off && started) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
  });
})();
