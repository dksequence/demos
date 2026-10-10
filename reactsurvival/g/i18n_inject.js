/* DK i18n inject — 한국어(ko)가 아닌 모든 언어는 한국어 텍스트를 영어로 치환(MutationObserver).
 * 2026-10-08: ko·en 외 언어(ja·de 등)가 한국어 화면을 보던 결함 수정 — ko 외에는 영어로. alert 문구도 치환. */
(function(){
  var lang = (localStorage.getItem('dk_lang') || navigator.language || 'ko').slice(0,2);
  if (lang === 'ko') return;
  window.__dkLangEn = true;
  // 긴 문자열 먼저(부분치환 안전). [ko, en]
  var R = [
    ["스타터 건: 리액션 서바이벌 (Starter Gun: Reaction Survival)", "Starter Gun: Reaction Survival"],
    ["하단의 파란 터치 패드를 꾹 누르고 계세요. \"제자리에\", \"차렷\" 신호음이 나옵니다.", "Press and hold the blue pad. You'll hear \"On your marks\", then \"Set\"."],
    ["총소리와 함께 붉은 섬광이 번쩍이는 순간 ", "The instant the gunshot fires and the red flash hits, "],
    ["최대한 빠르게 손가락을 떼세요.", "lift your finger as fast as you can."],
    ["스테이지가 올라갈수록 다른 색의 빛이 번쩍이거나, \"탁!\", \"똑!\" 하는 가짜 효과음이 들립니다. 가짜에 반응해 손가락을 떼면 ", "As stages rise, other colors flash or fake \"tak!\", \"tok!\" sounds play. Lifting on a fake is a "],
    ["로 라이프가 즉시 차감됩니다.", " and costs a life instantly."],
    ["부정출발(Foul)", "false start (Foul)"],
    ["✓ 광고가 제거되었습니다 (프리미엄)", "✓ Ads removed (Premium)"],
    ["모든 배너·전면 광고를 제거합니다.", "Removes all banner and full-screen ads."],
    ["광고 보고 24시간 광고 끄기", "Watch an ad: ads off for 24 hours"],
    ["스토어 결제를 사용할 수 없습니다.", "Store billing is not available right now."],
    ["광고를 불러올 수 없습니다.", "Couldn't load an ad right now."],
    ["광고 제거 (프리미엄)", "Remove Ads (Premium)"],
    ["광고 제거", "Remove ads"],
    ["구매 복원", "Restore purchase"],
    ["개인정보처리방침", "Privacy Policy"],
    ["Google Play에서 보기", "View on Google Play"],
    ["앱 모음 페이지", "Our app collection"],
    ["만든 곳", "More from us"],
    ["설정", "Settings"],
    ["각 스테이지마다 통과해야 하는 제한 시간(예: 0.35초 이내)이 존재합니다.", "Each stage has a time limit to clear (e.g. within 0.35s)."],
    ["손가락을 떼면 반응속도가 측정됩니다", "Lift your finger to measure your reaction"],
    ["터치 영역을 꾹 누르세요", "Press and hold the pad"],
    ["목표 반응 속도: ", "Target: "],
    ["속임수에 당했습니다! (FOUL)", "You got faked out! (FOUL)"],
    ["부정출발! (FOUL)", "FALSE START! (FOUL)"],
    ["제자리에 (READY)", "ON YOUR MARKS"],
    ["🔫 스타터 건 규칙 가이드", "🔫 Starter Gun Rules"],
    ["1. 준비 (Ready & Set)", "1. Ready & Set"],
    ["2. 발포 (Bang!)", "2. Bang!"],
    ["3. 속임수 주의 (Fake Trigger)", "3. Watch for Fakes"],
    ["4. 통과 기준", "4. Clear Condition"],
    ["실격(Foul) 횟수", "Fouls"],
    ["최고 반응속도", "Best Reaction"],
    ["평균 반응속도", "Avg Reaction"],
    ["도달 스테이지", "Stage Reached"],
    ["서바이벌 시작", "Start Survival"],
    ["속도 초과! ", "TOO SLOW! "],
    ["차렷 (SET)", "SET"],
    ["탕! (BANG!)", "BANG!"],
    ["최고 기록", "Best Record"],
    ["게임 규칙", "How to Play"],
    ["다시 도전", "Try Again"],
    ["메인으로", "Home"],
    ["제자리에", "ON YOUR MARKS"],
    ["통과! ", "PASS! "],
    ["차렷", "SET"],
    [" 이내", " or less"],
    ["회", ""],
    ["닫기", "Close"],
    ["띡", ""]
  ];
  function tr(s){ if(!s) return s; for(var i=0;i<R.length;i++){ if(s.indexOf(R[i][0])>=0) s=s.split(R[i][0]).join(R[i][1]); } return s; }
  function hasKo(s){ return /[가-힣]/.test(s); }
  function walk(node){
    if(node.nodeType===3){ if(hasKo(node.nodeValue)){ var v=tr(node.nodeValue); if(v!==node.nodeValue) node.nodeValue=v; } return; }
    if(node.nodeType===1){ for(var c=node.firstChild;c;c=c.nextSibling) walk(c); }
  }
  try{ var _al=window.alert; window.alert=function(m){ return _al.call(window, tr(String(m))); }; }catch(e){}
  try{ document.documentElement.lang='en'; }catch(e){}
  function run(){ try{ document.title=tr(document.title); walk(document.body); }catch(e){} }
  if(document.body) run(); else document.addEventListener('DOMContentLoaded',run);
  var mo=new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){ var m=muts[i];
      if(m.type==='characterData'){ if(hasKo(m.target.nodeValue)){ var v=tr(m.target.nodeValue); if(v!==m.target.nodeValue) m.target.nodeValue=v; } }
      else { for(var j=0;j<m.addedNodes.length;j++) walk(m.addedNodes[j]); }
    }
  });
  function obs(){ if(document.body) mo.observe(document.body,{childList:true,subtree:true,characterData:true}); else setTimeout(obs,50); }
  obs();
})();