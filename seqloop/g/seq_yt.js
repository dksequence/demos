// YouTube IFrame Player API 래퍼 (SeqLoop 웹 데모). dksequence.com origin 에서 로드된다.
(function () {
  var player = null, cb = null, timer = null, ready = false, pending = [];
  function post(type, data) { try { if (cb) cb(JSON.stringify({ type: type, data: data })); } catch (e) {} }
  function whenReady(fn) { if (ready) fn(); else pending.push(fn); }
  window.seqYT = {
    container: function () {
      var el = document.createElement('div');
      el.style.cssText = 'width:100%;height:100%;background:#000;position:relative;overflow:hidden';
      var inner = document.createElement('div');
      inner.id = 'seqloop-yt-inner';
      el.appendChild(inner);
      return el;
    },
    init: function (callback) {
      cb = callback;
      function create() {
        player = new YT.Player('seqloop-yt-inner', {
          videoId: '3wF_xxn3DJQ', width: '100%', height: '100%',
          playerVars: { controls: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, disablekb: 1, fs: 0,
                        playsinline: 1, cc_load_policy: 0, enablejsapi: 1, origin: location.origin },
          events: {
            onReady: function () {
              ready = true; var q = pending; pending = [];
              q.forEach(function (f) { try { f(); } catch (e) {} });
              post('ready', null);
            },
            onStateChange: function (e) {
              post('stateChange', e.data); clearInterval(timer);
              if (e.data === 1) timer = setInterval(function () { post('time', player.getCurrentTime()); }, 500);
            },
            onError: function (e) { post('error', e.data); }
          }
        });
        window.__seqPlayer = player;
      }
      function start() {
        // Flutter 가 플랫폼뷰를 DOM 에 붙일 때까지 기다린다.
        (function wait() {
          if (document.getElementById('seqloop-yt-inner')) create(); else setTimeout(wait, 50);
        })();
      }
      if (window.YT && window.YT.Player) start();
      else {
        window.onYouTubeIframeAPIReady = start;
        var t = document.createElement('script');
        t.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(t);
      }
    },
    call: function (fn, arg) {
      whenReady(function () {
        if (fn === 'loadVideoById' || fn === 'cueVideoById') player[fn]({ videoId: arg });
        else if (fn === 'seekTo') player.seekTo(arg, true);
        else player[fn]();
      });
    },
    duration: function () { return (player && player.getDuration) ? (player.getDuration() || 0) : 0; }
  };
})();
