/* JellySling 다국어(12개 언어) — 2026-10-08 v1.0.4
 * 언어 결정: 저장된 선택(localStorage 'lang') → 기기 선호 언어 목록(navigator.languages)의 첫 매칭 → 영어.
 * 화면 글자는 data-i18n 속성으로 채우고, 설정 카드(monetize.js)는 window.T() 로 읽는다. */
(function () {
  'use strict';
  var LANGS = ['ko', 'en', 'ja', 'zh-Hant', 'zh-Hans', 'th', 'ms', 'id', 'es', 'fr', 'pt-BR', 'de'];
  var NAMES = { 'ko': '한국어', 'en': 'English', 'ja': '日本語', 'zh-Hant': '繁體中文', 'zh-Hans': '简体中文', 'th': 'ไทย',
    'ms': 'Bahasa Melayu', 'id': 'Bahasa Indonesia', 'es': 'Español', 'fr': 'Français', 'pt-BR': 'Português (Brasil)', 'de': 'Deutsch' };
  var S = {
    sub: { 'ko': '🍬 당겼다 놓아 위로 위로!', 'en': '🍬 Pull, let go, up and up!', 'ja': '🍬 引いて放して、上へ上へ！',
      'zh-Hant': '🍬 拉一拉，放一放，向上再向上！', 'zh-Hans': '🍬 拉一拉，放一放，向上再向上！', 'th': '🍬 ดึงแล้วปล่อย ขึ้นไปให้สูง!',
      'ms': '🍬 Tarik, lepas, naik terus!', 'id': '🍬 Tarik, lepas, naik terus!', 'es': '🍬 ¡Estira, suelta y arriba!',
      'fr': '🍬 Tire, lâche, et plus haut !', 'pt-BR': '🍬 Puxe, solte e suba!', 'de': '🍬 Ziehen, loslassen – immer höher!' },
    tip1: { 'ko': '젤리를 끌어당겼다 놓기', 'en': 'Pull the jelly back and let go', 'ja': 'ゼリーを引っぱって放す',
      'zh-Hant': '拉住果凍再放手', 'zh-Hans': '拉住果冻再松手', 'th': 'ลากเยลลี่แล้วปล่อย',
      'ms': 'Tarik jeli dan lepaskan', 'id': 'Tarik jeli lalu lepaskan', 'es': 'Estira la gelatina y suéltala',
      'fr': 'Étire la gelée et relâche', 'pt-BR': 'Puxe a gelatina e solte', 'de': 'Gelee ziehen und loslassen' },
    tip2: { 'ko': '펙에 찰싹 붙으며 더 높이', 'en': 'Stick to the pegs, climb higher', 'ja': 'ペグにくっついて、もっと高く',
      'zh-Hant': '黏住釘子，越爬越高', 'zh-Hans': '粘住钉子，越爬越高', 'th': 'เกาะหมุดแล้วปีนให้สูงขึ้น',
      'ms': 'Lekat pada pasak, panjat lebih tinggi', 'id': 'Menempel di pasak, naik lebih tinggi', 'es': 'Agárrate a las clavijas y sube',
      'fr': 'Accroche-toi aux plots et grimpe', 'pt-BR': 'Grude nos pinos e suba mais', 'de': 'An Stiften festhalten, höher klettern' },
    combo: { 'ko': '콤보', 'en': 'Combo', 'ja': 'コンボ', 'zh-Hant': '連擊', 'zh-Hans': '连击', 'th': 'คอมโบ',
      'ms': 'Kombo', 'id': 'Kombo', 'es': 'Combo', 'fr': 'Combo', 'pt-BR': 'Combo', 'de': 'Combo' },
    retry: { 'ko': '↻ 다시', 'en': '↻ Again', 'ja': '↻ もう一度', 'zh-Hant': '↻ 再來', 'zh-Hans': '↻ 再来', 'th': '↻ เล่นอีกครั้ง',
      'ms': '↻ Main lagi', 'id': '↻ Main lagi', 'es': '↻ Otra vez', 'fr': '↻ Rejouer', 'pt-BR': '↻ De novo', 'de': '↻ Nochmal' },
    settings: { 'ko': '설정', 'en': 'Settings', 'ja': '設定', 'zh-Hant': '設定', 'zh-Hans': '设置', 'th': 'การตั้งค่า',
      'ms': 'Tetapan', 'id': 'Pengaturan', 'es': 'Ajustes', 'fr': 'Paramètres', 'pt-BR': 'Configurações', 'de': 'Einstellungen' },
    removed_ok: { 'ko': '✓ 광고 제거됨 (프리미엄)', 'en': '✓ Ads removed (Premium)', 'ja': '✓ 広告を削除しました（プレミアム）',
      'zh-Hant': '✓ 已移除廣告（進階版）', 'zh-Hans': '✓ 已移除广告（高级版）', 'th': '✓ ลบโฆษณาแล้ว (พรีเมียม)',
      'ms': '✓ Iklan telah dibuang (Premium)', 'id': '✓ Iklan sudah dihapus (Premium)', 'es': '✓ Anuncios quitados (Premium)',
      'fr': '✓ Publicités supprimées (Premium)', 'pt-BR': '✓ Anúncios removidos (Premium)', 'de': '✓ Werbung entfernt (Premium)' },
    off24_ok: { 'ko': '✓ 24시간 동안 광고 꺼짐', 'en': '✓ Ads off for 24 hours', 'ja': '✓ 24時間 広告オフ',
      'zh-Hant': '✓ 24小時關閉廣告', 'zh-Hans': '✓ 24小时关闭广告', 'th': '✓ ปิดโฆษณา 24 ชั่วโมง',
      'ms': '✓ Iklan dimatikan selama 24 jam', 'id': '✓ Iklan dimatikan selama 24 jam', 'es': '✓ Anuncios desactivados 24 horas',
      'fr': '✓ Publicités désactivées 24 heures', 'pt-BR': '✓ Anúncios desativados por 24 horas', 'de': '✓ Werbung 24 Stunden aus' },
    close: { 'ko': '닫기', 'en': 'Close', 'ja': '閉じる', 'zh-Hant': '關閉', 'zh-Hans': '关闭', 'th': 'ปิด',
      'ms': 'Tutup', 'id': 'Tutup', 'es': 'Cerrar', 'fr': 'Fermer', 'pt-BR': 'Fechar', 'de': 'Schließen' },
    remove_title: { 'ko': '광고 제거 (프리미엄)', 'en': 'Remove ads (Premium)', 'ja': '広告を削除（プレミアム）',
      'zh-Hant': '移除廣告（進階版）', 'zh-Hans': '移除广告（高级版）', 'th': 'ลบโฆษณา (พรีเมียม)',
      'ms': 'Buang iklan (Premium)', 'id': 'Hapus iklan (Premium)', 'es': 'Quitar anuncios (Premium)',
      'fr': 'Supprimer les publicités (Premium)', 'pt-BR': 'Remover anúncios (Premium)', 'de': 'Werbung entfernen (Premium)' },
    remove_desc: { 'ko': '배너·전면 광고를 모두 제거합니다.', 'en': 'Removes all banner and full-screen ads.',
      'ja': 'バナー広告と全画面広告をすべて削除します。', 'zh-Hant': '移除所有橫幅廣告和全螢幕廣告。', 'zh-Hans': '移除所有横幅广告和全屏广告。',
      'th': 'ลบโฆษณาแบนเนอร์และโฆษณาเต็มหน้าจอทั้งหมด', 'ms': 'Membuang semua iklan sepanduk dan skrin penuh.',
      'id': 'Menghapus semua iklan banner dan layar penuh.', 'es': 'Quita todos los anuncios de banner y de pantalla completa.',
      'fr': 'Supprime toutes les bannières et publicités plein écran.', 'pt-BR': 'Remove todos os anúncios de banner e de tela cheia.',
      'de': 'Entfernt alle Banner- und Vollbildanzeigen.' },
    remove_btn: { 'ko': '광고 제거', 'en': 'Remove ads', 'ja': '広告を削除', 'zh-Hant': '移除廣告', 'zh-Hans': '移除广告', 'th': 'ลบโฆษณา',
      'ms': 'Buang iklan', 'id': 'Hapus iklan', 'es': 'Quitar anuncios', 'fr': 'Supprimer les publicités', 'pt-BR': 'Remover anúncios', 'de': 'Werbung entfernen' },
    watch24: { 'ko': '광고 보고 24시간 광고 끄기', 'en': 'Watch an ad: ads off for 24 hours', 'ja': '広告を見て24時間 広告オフ',
      'zh-Hant': '看廣告，24小時關閉廣告', 'zh-Hans': '看广告，24小时关闭广告', 'th': 'ดูโฆษณาเพื่อปิดโฆษณา 24 ชั่วโมง',
      'ms': 'Tonton iklan untuk matikan iklan 24 jam', 'id': 'Tonton iklan untuk mematikan iklan 24 jam',
      'es': 'Mira un anuncio y desactiva los anuncios 24 horas', 'fr': 'Regarde une publicité : publicités désactivées 24 heures',
      'pt-BR': 'Assista a um anúncio e desative os anúncios por 24 horas', 'de': 'Werbung ansehen und 24 Stunden ausblenden' },
    restore: { 'ko': '구매 복원', 'en': 'Restore purchase', 'ja': '購入を復元', 'zh-Hant': '恢復購買', 'zh-Hans': '恢复购买', 'th': 'กู้คืนการซื้อ',
      'ms': 'Pulihkan pembelian', 'id': 'Pulihkan pembelian', 'es': 'Restaurar compra', 'fr': "Restaurer l'achat", 'pt-BR': 'Restaurar compra', 'de': 'Kauf wiederherstellen' },
    billing_na: { 'ko': '스토어 결제를 사용할 수 없습니다.', 'en': 'Store purchases are not available right now.', 'ja': 'ストア決済を利用できません。',
      'zh-Hant': '目前無法使用商店付款。', 'zh-Hans': '目前无法使用商店付款。', 'th': 'ขณะนี้ไม่สามารถชำระเงินผ่านสโตร์ได้',
      'ms': 'Pembayaran kedai tidak tersedia buat masa ini.', 'id': 'Pembayaran toko tidak tersedia saat ini.',
      'es': 'Las compras de la tienda no están disponibles ahora.', 'fr': 'Les achats via le Store sont indisponibles pour le moment.',
      'pt-BR': 'As compras na loja não estão disponíveis agora.', 'de': 'Store-Käufe sind gerade nicht verfügbar.' },
    ad_na: { 'ko': '지금은 광고를 불러오지 못했어요.', 'en': "Couldn't load an ad right now.", 'ja': '今は広告を読み込めませんでした。',
      'zh-Hant': '暫時無法載入廣告。', 'zh-Hans': '暂时无法加载广告。', 'th': 'ไม่สามารถโหลดโฆษณาได้ในขณะนี้',
      'ms': 'Tidak dapat memuatkan iklan sekarang.', 'id': 'Tidak dapat memuat iklan sekarang.', 'es': 'No se pudo cargar un anuncio ahora.',
      'fr': 'Impossible de charger une publicité pour le moment.', 'pt-BR': 'Não foi possível carregar um anúncio agora.', 'de': 'Werbung konnte gerade nicht geladen werden.' },
    privacy: { 'ko': '개인정보처리방침', 'en': 'Privacy Policy', 'ja': 'プライバシーポリシー', 'zh-Hant': '隱私權政策', 'zh-Hans': '隐私政策',
      'th': 'นโยบายความเป็นส่วนตัว', 'ms': 'Dasar Privasi', 'id': 'Kebijakan Privasi', 'es': 'Política de privacidad',
      'fr': 'Politique de confidentialité', 'pt-BR': 'Política de Privacidade', 'de': 'Datenschutzerklärung' },
    language: { 'ko': '언어', 'en': 'Language', 'ja': '言語', 'zh-Hant': '語言', 'zh-Hans': '语言', 'th': 'ภาษา',
      'ms': 'Bahasa', 'id': 'Bahasa', 'es': 'Idioma', 'fr': 'Langue', 'pt-BR': 'Idioma', 'de': 'Sprache' },
    lang_auto: { 'ko': '기기 설정', 'en': 'Device default', 'ja': '端末の設定', 'zh-Hant': '跟隨系統', 'zh-Hans': '跟随系统', 'th': 'ตามอุปกรณ์',
      'ms': 'Ikut peranti', 'id': 'Ikuti perangkat', 'es': 'Según el dispositivo', 'fr': "Selon l'appareil", 'pt-BR': 'Padrão do aparelho', 'de': 'Gerätestandard' }
  };

  function norm(tag) {
    if (!tag) return null;
    var t = String(tag).replace('_', '-'), p = t.toLowerCase().split('-'), l = p[0];
    if (l === 'zh') {
      if (/hant|-tw|-hk|-mo/i.test(t)) return 'zh-Hant';
      return 'zh-Hans';
    }
    if (l === 'pt') return 'pt-BR';
    if (l === 'in') return 'id';
    return LANGS.indexOf(l) >= 0 ? l : null;
  }
  function deviceLang() {
    var list = [];
    try { list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language]; } catch (e) {}
    for (var i = 0; i < list.length; i++) { var n = norm(list[i]); if (n) return n; }
    return 'en';
  }
  function saved() { try { var v = localStorage.getItem('lang'); return LANGS.indexOf(v) >= 0 ? v : null; } catch (e) { return null; } }

  var cur = saved() || deviceLang();
  function T(k) { var e = S[k]; if (!e) return k; return e[cur] || e.en || k; }
  function apply() {
    try {
      document.documentElement.lang = cur;
      var els = document.querySelectorAll('[data-i18n]');
      for (var i = 0; i < els.length; i++) els[i].textContent = T(els[i].getAttribute('data-i18n'));
    } catch (e) {}
  }
  window.T = T;
  window.I18N = {
    langs: LANGS, names: NAMES, apply: apply,
    current: function () { return cur; },
    choice: function () { return saved() || ''; },
    set: function (v) {
      try { if (v) localStorage.setItem('lang', v); else localStorage.removeItem('lang'); } catch (e) {}
      cur = (v && LANGS.indexOf(v) >= 0) ? v : deviceLang();
      apply();
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
