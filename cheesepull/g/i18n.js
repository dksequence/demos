// i18n.js — 12언어 표준. 디바이스 선호 로케일 '첫 매칭', 없으면 영어.
// 주의: 의성어("쭈-욱")는 번역 불가 -> 언어별 자체 의성어. "ASMR"은 전 언어 원문 유지(번역하면 검색량 소멸).
export const LOCALES = ['ko', 'en', 'ja', 'zh-Hant', 'th', 'ms', 'id', 'es', 'fr', 'pt-BR', 'de', 'zh-Hans'];

export const STR = {
  ko: {
    tipSlow: '너무 빨라요 — 천천히 당기면 더 길어집니다',
    chainDone: '이어붙임 {n}번', passed: '넘음',
    mkChair: '의자', mkPerson: '사람 키', mkCar: '자동차', mkTree: '나무', mkHouse: '2층집', mkLamp: '가로등', mkPole: '전봇대', mkBridge: '교각', mkBuild: '빌딩', mkTowerA: '마천루', mkWheel: '관람차', mkTowerB: '송신탑', mkMount: '산', mkBalloon: '열기구', mkCloud: '구름', mkSpace: '우주',
    app: '치즈 쭈욱', sub: '사티스파잉 늘리기',
    play: '시작', orders: '주문받기', endless: '무한 늘이기', daily: '오늘의 한 가닥',
    collection: '치즈 도감', settings: '설정', back: '뒤로', retry: '다시', next: '다음', share: '기록 카드',
    tipPull: '천천히 당기다가 위험하면 손을 떼세요', tipRelease: '손을 떼면 이어붙습니다',
    tipRed: '빨개지면 끊기기 직전! 담을지 더 갈지 결정하세요',
    chainInfo: '이어붙임 {n}번 · 지금 {cm}cm', keep: '담기', tipAgain: '이어서 당기세요',
    cm: 'cm', best: '최고', goal: '목표', recordNew: '신기록', banked: '{n}cm 담았다', snap: '뚝!',
    whyFast: '너무 빨리 당겼다', whyCold: '치즈가 식었다', whyLimit: '한계를 넘었다',
    shop1: '길거리 화덕', shop2: '트라토리아', shop3: '비스트로', shop4: '델리 카운터', shop5: '장인의 주방',
    typeLong: '길게', typeJust: '정확히', typeSafe: '토핑 사수',
    locked: '잠김', unlockPts: '{n}포인트로 열기', watchAd: '광고 보고 포인트 +50',
    noThanks: '괜찮아요', continueAd: '광고 보고 이어붙이기', removeAds: '광고 제거', restore: '구매 복원',
    points: '포인트',
    sound: '소리', haptic: '진동', lang: '언어', privacy: '개인정보처리방침', devTitle: '만든 곳', devPlay: 'Google Play에서 보기', devSite: '앱 모음 페이지',
    dailyTitle: '오늘의 한 가닥', dailyDone: '오늘은 끝났어요. 내일 또 만나요',
  },
  en: {
    tipSlow: 'Too fast — pull slowly to stretch further',
    chainDone: '{n} splices', passed: 'passed',
    mkChair: 'chair', mkPerson: 'human height', mkCar: 'car', mkTree: 'tree', mkHouse: 'house', mkLamp: 'street lamp', mkPole: 'utility pole', mkBridge: 'bridge', mkBuild: 'building', mkTowerA: 'skyscraper', mkWheel: 'ferris wheel', mkTowerB: 'radio tower', mkMount: 'mountain', mkBalloon: 'hot-air balloon', mkCloud: 'clouds', mkSpace: 'space',
    app: 'Cheese Pull', sub: 'Stretch It Far',
    play: 'Play', orders: 'Orders', endless: 'Endless Stretch', daily: 'Daily Pull',
    collection: 'Cheese Book', settings: 'Settings', back: 'Back', retry: 'Retry', next: 'Next', share: 'Record Card',
    tipPull: 'Pull slowly. Let go when it gets risky', tipRelease: 'Let go to splice it on',
    tipRed: 'Red means it is about to snap. Bank it or push on?',
    chainInfo: 'Spliced {n} · now {cm}cm', keep: 'Keep', tipAgain: 'Pull again',
    cm: 'cm', best: 'Best', goal: 'Goal', recordNew: 'New Record', banked: 'Banked {n}cm', snap: 'Snap!',
    whyFast: 'Pulled too fast', whyCold: 'The cheese went cold', whyLimit: 'Past the limit',
    shop1: 'Street Oven', shop2: 'Trattoria', shop3: 'Bistro', shop4: 'Deli Counter', shop5: 'Master Kitchen',
    typeLong: 'Go Long', typeJust: 'Just Right', typeSafe: 'Keep Toppings',
    locked: 'Locked', unlockPts: 'Unlock for {n} pts', watchAd: 'Watch ad for +50 pts',
    noThanks: 'No thanks', continueAd: 'Watch ad to reconnect', removeAds: 'Remove ads', restore: 'Restore purchase',
    points: 'Points',
    sound: 'Sound', haptic: 'Vibration', lang: 'Language', privacy: 'Privacy Policy', devTitle: 'More from us', devPlay: 'View on Google Play', devSite: 'Our app collection',
    dailyTitle: 'Daily Pull', dailyDone: 'Done for today. See you tomorrow',
  },
  ja: {
    tipSlow: '速すぎます — ゆっくり引くともっと伸びます',
    chainDone: 'つなぎ {n} 回', passed: '突破',
    mkChair: 'いす', mkPerson: '人の背', mkCar: '車', mkTree: '木', mkHouse: '一軒家', mkLamp: '街灯', mkPole: '電柱', mkBridge: '橋', mkBuild: 'ビル', mkTowerA: '高層ビル', mkWheel: '観覧車', mkTowerB: '電波塔', mkMount: '山', mkBalloon: '熱気球', mkCloud: '雲', mkSpace: '宇宙',
    app: 'チーズのび〜る', sub: 'ASMR のばしゲーム',
    play: 'はじめる', orders: '注文をうける', endless: 'エンドレス', daily: '今日のひとすじ',
    collection: 'チーズ図鑑', settings: '設定', back: 'もどる', retry: 'もう一度', next: 'つぎへ', share: '記録カード',
    tipPull: 'ゆっくり引いて、危なくなったら指をはなす', tipRelease: 'はなすとつながります',
    tipRed: '赤くなったら切れる寸前。おさめる？もう少し？',
    chainInfo: 'つなぎ {n}回 ・ いま {cm}cm', keep: 'おさめる', tipAgain: 'つづけて引こう',
    cm: 'cm', best: '最高', goal: '目標', recordNew: '新記録', banked: '{n}cm おさめた', snap: 'ブチッ!',
    whyFast: '引くのが速すぎた', whyCold: 'チーズが冷めた', whyLimit: '限界を超えた',
    shop1: '屋台の窯', shop2: 'トラットリア', shop3: 'ビストロ', shop4: 'デリカウンター', shop5: '職人の厨房',
    typeLong: 'ながく', typeJust: 'ぴったり', typeSafe: '具を落とすな',
    locked: 'ロック', unlockPts: '{n}ポイントで解放', watchAd: '広告を見てポイント+50',
    noThanks: 'やめておく', continueAd: '広告を見てつなぎ直す', removeAds: '広告を消す', restore: '購入を復元',
    points: 'ポイント',
    sound: '音', haptic: '振動', lang: '言語', privacy: 'プライバシーポリシー', devTitle: '制作元', devPlay: 'Google Play で見る', devSite: 'アプリ一覧ページ',
    dailyTitle: '今日のひとすじ', dailyDone: '今日はおしまい。また明日',
  },
  'zh-Hant': {
    tipSlow: '太快了 — 慢慢拉才能拉更長',
    chainDone: '接續 {n} 次', passed: '超越',
    mkChair: '椅子', mkPerson: '人的高度', mkCar: '汽車', mkTree: '樹', mkHouse: '房子', mkLamp: '路燈', mkPole: '電線桿', mkBridge: '橋', mkBuild: '大樓', mkTowerA: '摩天樓', mkWheel: '摩天輪', mkTowerB: '電波塔', mkMount: '山', mkBalloon: '熱氣球', mkCloud: '雲', mkSpace: '太空',
    app: '拉絲起司', sub: 'ASMR 拉長挑戰',
    play: '開始', orders: '接單', endless: '無限拉長', daily: '每日一絲',
    collection: '起司圖鑑', settings: '設定', back: '返回', retry: '再玩一次', next: '下一個', share: '紀錄卡',
    tipPull: '慢慢拉，危險時就放手', tipRelease: '放手就會接上去',
    tipRed: '變紅代表快斷了。要收下還是再拉？',
    chainInfo: '接了 {n} 次 ・ 現在 {cm} 公分', keep: '收下', tipAgain: '繼續拉',
    cm: '公分', best: '最佳', goal: '目標', recordNew: '新紀錄', banked: '收下 {n} 公分', snap: '斷了!',
    whyFast: '拉得太快', whyCold: '起司冷掉了', whyLimit: '超過極限',
    shop1: '街邊窯烤', shop2: '小酒館', shop3: '法式小館', shop4: '熟食櫃檯', shop5: '職人廚房',
    typeLong: '拉長', typeJust: '剛剛好', typeSafe: '別掉配料',
    locked: '未解鎖', unlockPts: '用 {n} 點解鎖', watchAd: '看廣告拿 50 點',
    noThanks: '不用了', continueAd: '看廣告接回去', removeAds: '移除廣告', restore: '恢復購買',
    points: '點數',
    sound: '音效', haptic: '震動', lang: '語言', privacy: '隱私權政策', devTitle: '開發者', devPlay: '在 Google Play 查看', devSite: '應用程式合集頁面',
    dailyTitle: '每日一絲', dailyDone: '今天結束了，明天見',
  },
  'zh-Hans': {
    tipSlow: '太快了 — 慢慢拉才能拉更长',
    chainDone: '接续 {n} 次', passed: '超越',
    mkChair: '椅子', mkPerson: '人的高度', mkCar: '汽车', mkTree: '树', mkHouse: '房子', mkLamp: '路灯', mkPole: '电线杆', mkBridge: '桥', mkBuild: '大楼', mkTowerA: '摩天楼', mkWheel: '摩天轮', mkTowerB: '电波塔', mkMount: '山', mkBalloon: '热气球', mkCloud: '云', mkSpace: '太空',
    app: '拉丝芝士', sub: 'ASMR 拉长挑战',
    play: '开始', orders: '接单', endless: '无限拉长', daily: '每日一丝',
    collection: '芝士图鉴', settings: '设置', back: '返回', retry: '再玩一次', next: '下一个', share: '记录卡',
    tipPull: '慢慢拉，危险时就松手', tipRelease: '松手就会接上去',
    tipRed: '变红说明快断了。收下还是再拉？',
    chainInfo: '接了 {n} 次 ・ 现在 {cm} 厘米', keep: '收下', tipAgain: '继续拉',
    cm: '厘米', best: '最佳', goal: '目标', recordNew: '新纪录', banked: '收下 {n} 厘米', snap: '断了!',
    whyFast: '拉得太快', whyCold: '芝士凉了', whyLimit: '超过极限',
    shop1: '街边窑烤', shop2: '小酒馆', shop3: '法式小馆', shop4: '熟食柜台', shop5: '匠人厨房',
    typeLong: '拉长', typeJust: '刚刚好', typeSafe: '别掉配料',
    locked: '未解锁', unlockPts: '用 {n} 点解锁', watchAd: '看广告拿 50 点',
    noThanks: '不用了', continueAd: '看广告接回去', removeAds: '移除广告', restore: '恢复购买',
    points: '点数',
    sound: '音效', haptic: '震动', lang: '语言', privacy: '隐私政策', devTitle: '开发者', devPlay: '在 Google Play 查看', devSite: '应用合集页面',
    dailyTitle: '每日一丝', dailyDone: '今天结束了，明天见',
  },
};
Object.assign(STR, {
  th: {
    tipSlow: 'เร็วเกินไป — ดึงช้าๆ จะยืดได้ยาวกว่า',
    chainDone: 'ต่อ {n} ครั้ง', passed: 'ผ่านแล้ว',
    mkChair: 'เก้าอี้', mkPerson: 'ส่วนสูงคน', mkCar: 'รถยนต์', mkTree: 'ต้นไม้', mkHouse: 'บ้าน', mkLamp: 'เสาไฟ', mkPole: 'เสาไฟฟ้า', mkBridge: 'สะพาน', mkBuild: 'ตึก', mkTowerA: 'ตึกระฟ้า', mkWheel: 'ชิงช้าสวรรค์', mkTowerB: 'เสาส่งสัญญาณ', mkMount: 'ภูเขา', mkBalloon: 'บอลลูน', mkCloud: 'เมฆ', mkSpace: 'อวกาศ',
    app: 'ชีสยืด', sub: 'เกมยืดชีส ASMR',
    play: 'เริ่ม', orders: 'รับออร์เดอร์', endless: 'ยืดไม่สิ้นสุด', daily: 'เส้นประจำวัน',
    collection: 'สมุดชีส', settings: 'ตั้งค่า', back: 'กลับ', retry: 'เล่นใหม่', next: 'ถัดไป', share: 'การ์ดสถิติ',
    tipPull: 'ค่อย ๆ ดึง พอเสี่ยงก็ปล่อยนิ้ว', tipRelease: 'ปล่อยแล้วจะต่อให้',
    tipRed: 'สีแดงแปลว่าใกล้ขาด จะเก็บหรือไปต่อ?',
    chainInfo: 'ต่อแล้ว {n} ครั้ง ・ ตอนนี้ {cm} ซม.', keep: 'เก็บ', tipAgain: 'ดึงต่อเลย',
    cm: 'ซม.', best: 'สูงสุด', goal: 'เป้าหมาย', recordNew: 'สถิติใหม่', banked: 'เก็บได้ {n} ซม.', snap: 'ขาด!',
    whyFast: 'ดึงเร็วเกินไป', whyCold: 'ชีสเย็นลงแล้ว', whyLimit: 'เกินขีดจำกัด',
    shop1: 'เตาข้างทาง', shop2: 'ทรัตโตเรีย', shop3: 'บิสโทร', shop4: 'เคาน์เตอร์เดลี', shop5: 'ครัวช่างฝีมือ',
    typeLong: 'ยืดยาว', typeJust: 'พอดีเป๊ะ', typeSafe: 'อย่าให้หน้าหล่น',
    locked: 'ล็อก', unlockPts: 'ปลดล็อก {n} แต้ม', watchAd: 'ดูโฆษณารับ 50 แต้ม',
    noThanks: 'ไม่เป็นไร', continueAd: 'ดูโฆษณาเพื่อต่อชีส', removeAds: 'เอาโฆษณาออก', restore: 'กู้คืนการซื้อ',
    points: 'แต้ม',
    sound: 'เสียง', haptic: 'สั่น', lang: 'ภาษา', privacy: 'นโยบายความเป็นส่วนตัว', devTitle: 'แอปอื่นของเรา', devPlay: 'ดูใน Google Play', devSite: 'รวมแอปของเรา',
    dailyTitle: 'เส้นประจำวัน', dailyDone: 'วันนี้จบแล้ว พรุ่งนี้เจอกัน',
  },
  ms: {
    tipSlow: 'Terlalu laju — tarik perlahan untuk lebih panjang',
    chainDone: '{n} sambungan', passed: 'dilepasi',
    mkChair: 'kerusi', mkPerson: 'tinggi orang', mkCar: 'kereta', mkTree: 'pokok', mkHouse: 'rumah', mkLamp: 'lampu jalan', mkPole: 'tiang elektrik', mkBridge: 'jambatan', mkBuild: 'bangunan', mkTowerA: 'pencakar langit', mkWheel: 'roda ferris', mkTowerB: 'menara radio', mkMount: 'gunung', mkBalloon: 'belon udara', mkCloud: 'awan', mkSpace: 'angkasa',
    app: 'Keju Tarik', sub: 'Regang ASMR',
    play: 'Main', orders: 'Terima Pesanan', endless: 'Regang Tanpa Henti', daily: 'Tarikan Harian',
    collection: 'Buku Keju', settings: 'Tetapan', back: 'Kembali', retry: 'Cuba Lagi', next: 'Seterusnya', share: 'Kad Rekod',
    tipPull: 'Tarik perlahan. Lepaskan bila mula bahaya', tipRelease: 'Lepaskan untuk menyambung',
    tipRed: 'Merah bermakna hampir putus. Simpan atau teruskan?',
    chainInfo: 'Disambung {n} kali · kini {cm} sm', keep: 'Simpan', tipAgain: 'Tarik lagi',
    cm: 'sm', best: 'Terbaik', goal: 'Sasaran', recordNew: 'Rekod Baharu', banked: 'Disimpan {n} sm', snap: 'Putus!',
    whyFast: 'Ditarik terlalu laju', whyCold: 'Keju sudah sejuk', whyLimit: 'Melebihi had',
    shop1: 'Dapur Tepi Jalan', shop2: 'Trattoria', shop3: 'Bistro', shop4: 'Kaunter Deli', shop5: 'Dapur Tukang',
    typeLong: 'Panjangkan', typeJust: 'Tepat', typeSafe: 'Jaga Topping',
    locked: 'Terkunci', unlockPts: 'Buka dengan {n} mata', watchAd: 'Tonton iklan untuk +50 mata',
    noThanks: 'Tidak perlu', continueAd: 'Tonton iklan untuk sambung', removeAds: 'Buang iklan', restore: 'Pulihkan pembelian',
    points: 'Mata',
    sound: 'Bunyi', haptic: 'Getaran', lang: 'Bahasa', privacy: 'Dasar Privasi', devTitle: 'Aplikasi kami yang lain', devPlay: 'Lihat di Google Play', devSite: 'Koleksi aplikasi kami',
    dailyTitle: 'Tarikan Harian', dailyDone: 'Selesai untuk hari ini. Jumpa esok',
  },
  id: {
    tipSlow: 'Terlalu cepat — tarik pelan agar lebih panjang',
    chainDone: '{n} sambungan', passed: 'terlewati',
    mkChair: 'kursi', mkPerson: 'tinggi orang', mkCar: 'mobil', mkTree: 'pohon', mkHouse: 'rumah', mkLamp: 'lampu jalan', mkPole: 'tiang listrik', mkBridge: 'jembatan', mkBuild: 'gedung', mkTowerA: 'pencakar langit', mkWheel: 'bianglala', mkTowerB: 'menara radio', mkMount: 'gunung', mkBalloon: 'balon udara', mkCloud: 'awan', mkSpace: 'antariksa',
    app: 'Keju Melar', sub: 'Tarik ASMR',
    play: 'Main', orders: 'Terima Pesanan', endless: 'Tarik Tanpa Batas', daily: 'Tarikan Harian',
    collection: 'Buku Keju', settings: 'Pengaturan', back: 'Kembali', retry: 'Ulangi', next: 'Lanjut', share: 'Kartu Rekor',
    tipPull: 'Tarik pelan. Lepas saat mulai berisiko', tipRelease: 'Lepas untuk menyambung',
    tipRed: 'Merah artinya hampir putus. Simpan atau lanjut?',
    chainInfo: 'Disambung {n}x · kini {cm} cm', keep: 'Simpan', tipAgain: 'Tarik lagi',
    cm: 'cm', best: 'Terbaik', goal: 'Target', recordNew: 'Rekor Baru', banked: 'Tersimpan {n} cm', snap: 'Putus!',
    whyFast: 'Ditarik terlalu cepat', whyCold: 'Kejunya mendingin', whyLimit: 'Melewati batas',
    shop1: 'Tungku Pinggir Jalan', shop2: 'Trattoria', shop3: 'Bistro', shop4: 'Konter Deli', shop5: 'Dapur Ahli',
    typeLong: 'Panjangkan', typeJust: 'Pas', typeSafe: 'Jaga Topping',
    locked: 'Terkunci', unlockPts: 'Buka dengan {n} poin', watchAd: 'Tonton iklan untuk +50 poin',
    noThanks: 'Tidak usah', continueAd: 'Tonton iklan untuk menyambung', removeAds: 'Hapus iklan', restore: 'Pulihkan pembelian',
    points: 'Poin',
    sound: 'Suara', haptic: 'Getaran', lang: 'Bahasa', privacy: 'Kebijakan Privasi', devTitle: 'Aplikasi kami yang lain', devPlay: 'Lihat di Google Play', devSite: 'Koleksi aplikasi kami',
    dailyTitle: 'Tarikan Harian', dailyDone: 'Selesai untuk hari ini. Sampai besok',
  },
  es: {
    tipSlow: 'Demasiado rápido: tira despacio para estirar más',
    chainDone: '{n} empalmes', passed: 'superado',
    mkChair: 'silla', mkPerson: 'altura humana', mkCar: 'coche', mkTree: 'árbol', mkHouse: 'casa', mkLamp: 'farola', mkPole: 'poste', mkBridge: 'puente', mkBuild: 'edificio', mkTowerA: 'rascacielos', mkWheel: 'noria', mkTowerB: 'torre de radio', mkMount: 'montaña', mkBalloon: 'globo', mkCloud: 'nubes', mkSpace: 'espacio',
    app: 'Queso Elástico', sub: 'Estira ASMR',
    play: 'Jugar', orders: 'Pedidos', endless: 'Estirado Infinito', daily: 'Hebra del Día',
    collection: 'Guía de Quesos', settings: 'Ajustes', back: 'Atrás', retry: 'Reintentar', next: 'Siguiente', share: 'Tarjeta de Récord',
    tipPull: 'Tira despacio. Suelta cuando se ponga arriesgado', tipRelease: 'Suelta para empalmarlo',
    tipRed: 'El rojo avisa que va a romperse. ¿Guardas o sigues?',
    chainInfo: 'Empalmes {n} · ahora {cm} cm', keep: 'Guardar', tipAgain: 'Vuelve a tirar',
    cm: 'cm', best: 'Mejor', goal: 'Objetivo', recordNew: 'Nuevo récord', banked: 'Guardado {n} cm', snap: '¡Se rompió!',
    whyFast: 'Tiraste demasiado rápido', whyCold: 'El queso se enfrió', whyLimit: 'Pasaste el límite',
    shop1: 'Horno Callejero', shop2: 'Trattoria', shop3: 'Bistró', shop4: 'Mostrador Deli', shop5: 'Cocina del Maestro',
    typeLong: 'Estirar', typeJust: 'Justo', typeSafe: 'Salva los ingredientes',
    locked: 'Bloqueado', unlockPts: 'Abrir por {n} puntos', watchAd: 'Ver anuncio y ganar 50 puntos',
    noThanks: 'No, gracias', continueAd: 'Ver anuncio para reconectar', removeAds: 'Quitar anuncios', restore: 'Restaurar compra',
    points: 'Puntos',
    sound: 'Sonido', haptic: 'Vibración', lang: 'Idioma', privacy: 'Política de Privacidad', devTitle: 'Más de nosotros', devPlay: 'Ver en Google Play', devSite: 'Nuestra colección de apps',
    dailyTitle: 'Hebra del Día', dailyDone: 'Por hoy terminamos. Hasta mañana',
  },
  fr: {
    tipSlow: 'Trop vite — tirez lentement pour aller plus loin',
    chainDone: '{n} raccords', passed: 'dépassé',
    mkChair: 'chaise', mkPerson: 'taille humaine', mkCar: 'voiture', mkTree: 'arbre', mkHouse: 'maison', mkLamp: 'lampadaire', mkPole: 'poteau', mkBridge: 'pont', mkBuild: 'immeuble', mkTowerA: 'gratte-ciel', mkWheel: 'grande roue', mkTowerB: 'tour radio', mkMount: 'montagne', mkBalloon: 'montgolfière', mkCloud: 'nuages', mkSpace: 'espace',
    app: 'Fromage Étiré', sub: 'Étirement ASMR',
    play: 'Jouer', orders: 'Commandes', endless: 'Étirement Infini', daily: 'Fil du Jour',
    collection: 'Guide des Fromages', settings: 'Réglages', back: 'Retour', retry: 'Recommencer', next: 'Suivant', share: 'Carte de Record',
    tipPull: 'Tire doucement. Relâche quand ça devient risqué', tipRelease: 'Relâche pour raccorder',
    tipRed: 'Le rouge annonce la rupture. Tu valides ou tu continues ?',
    chainInfo: 'Raccords {n} · maintenant {cm} cm', keep: 'Garder', tipAgain: 'Tire encore',
    cm: 'cm', best: 'Record', goal: 'Objectif', recordNew: 'Nouveau record', banked: 'Validé {n} cm', snap: 'Cassé !',
    whyFast: 'Tiré trop vite', whyCold: 'Le fromage a refroidi', whyLimit: 'Limite dépassée',
    shop1: 'Four de Rue', shop2: 'Trattoria', shop3: 'Bistrot', shop4: 'Comptoir Traiteur', shop5: 'Cuisine du Maître',
    typeLong: 'Allonger', typeJust: 'Pile poil', typeSafe: 'Garde la garniture',
    locked: 'Verrouillé', unlockPts: 'Ouvrir pour {n} points', watchAd: 'Voir une pub pour +50 points',
    noThanks: 'Non merci', continueAd: 'Voir une pub pour recoller', removeAds: 'Retirer les pubs', restore: 'Restaurer achat',
    points: 'Points',
    sound: 'Son', haptic: 'Vibration', lang: 'Langue', privacy: 'Politique de confidentialité', devTitle: 'Nos autres apps', devPlay: 'Voir sur Google Play', devSite: 'Notre collection d’applications',
    dailyTitle: 'Fil du Jour', dailyDone: 'Terminé pour aujourd’hui. À demain',
  },
  'pt-BR': {
    tipSlow: 'Rápido demais — puxe devagar para esticar mais',
    chainDone: '{n} emendas', passed: 'superado',
    mkChair: 'cadeira', mkPerson: 'altura humana', mkCar: 'carro', mkTree: 'árvore', mkHouse: 'casa', mkLamp: 'poste de luz', mkPole: 'poste', mkBridge: 'ponte', mkBuild: 'prédio', mkTowerA: 'arranha-céu', mkWheel: 'roda-gigante', mkTowerB: 'torre de rádio', mkMount: 'montanha', mkBalloon: 'balão', mkCloud: 'nuvens', mkSpace: 'espaço',
    app: 'Queijo Puxa', sub: 'Estica ASMR',
    play: 'Jogar', orders: 'Pedidos', endless: 'Esticada Infinita', daily: 'Fio do Dia',
    collection: 'Guia de Queijos', settings: 'Ajustes', back: 'Voltar', retry: 'De novo', next: 'Próximo', share: 'Card de Recorde',
    tipPull: 'Puxe devagar. Solte quando ficar arriscado', tipRelease: 'Solte para emendar',
    tipRed: 'Vermelho quer dizer que vai arrebentar. Guarda ou continua?',
    chainInfo: 'Emendas {n} · agora {cm} cm', keep: 'Guardar', tipAgain: 'Puxe de novo',
    cm: 'cm', best: 'Melhor', goal: 'Meta', recordNew: 'Novo recorde', banked: 'Guardou {n} cm', snap: 'Arrebentou!',
    whyFast: 'Puxou rápido demais', whyCold: 'O queijo esfriou', whyLimit: 'Passou do limite',
    shop1: 'Forno de Rua', shop2: 'Trattoria', shop3: 'Bistrô', shop4: 'Balcão da Deli', shop5: 'Cozinha do Mestre',
    typeLong: 'Esticar', typeJust: 'Na medida', typeSafe: 'Segure o recheio',
    locked: 'Bloqueado', unlockPts: 'Abrir por {n} pontos', watchAd: 'Ver anúncio e ganhar 50 pontos',
    noThanks: 'Agora não', continueAd: 'Ver anúncio para emendar', removeAds: 'Remover anúncios', restore: 'Restaurar compra',
    points: 'Pontos',
    sound: 'Som', haptic: 'Vibração', lang: 'Idioma', privacy: 'Política de Privacidade', devTitle: 'Mais de nós', devPlay: 'Ver no Google Play', devSite: 'Nossa coleção de apps',
    dailyTitle: 'Fio do Dia', dailyDone: 'Por hoje deu. Até amanhã',
  },
  de: {
    tipSlow: 'Zu schnell — langsam ziehen dehnt weiter',
    chainDone: '{n} Ansätze', passed: 'überholt',
    mkChair: 'Stuhl', mkPerson: 'Körpergröße', mkCar: 'Auto', mkTree: 'Baum', mkHouse: 'Haus', mkLamp: 'Laterne', mkPole: 'Strommast', mkBridge: 'Brücke', mkBuild: 'Gebäude', mkTowerA: 'Wolkenkratzer', mkWheel: 'Riesenrad', mkTowerB: 'Funkturm', mkMount: 'Berg', mkBalloon: 'Ballon', mkCloud: 'Wolken', mkSpace: 'Weltraum',
    app: 'Käsefaden', sub: 'ASMR Ziehen',
    play: 'Spielen', orders: 'Bestellungen', endless: 'Endlos Ziehen', daily: 'Faden des Tages',
    collection: 'Käsebuch', settings: 'Einstellungen', back: 'Zurück', retry: 'Nochmal', next: 'Weiter', share: 'Rekordkarte',
    tipPull: 'Zieh langsam. Loslassen, wenn es riskant wird', tipRelease: 'Loslassen setzt den Faden fort',
    tipRed: 'Rot heißt kurz vor dem Riss. Sichern oder weiter?',
    chainInfo: 'Verbunden {n}x · jetzt {cm} cm', keep: 'Sichern', tipAgain: 'Zieh weiter',
    cm: 'cm', best: 'Bestwert', goal: 'Ziel', recordNew: 'Neuer Rekord', banked: '{n} cm gesichert', snap: 'Gerissen!',
    whyFast: 'Zu schnell gezogen', whyCold: 'Der Käse ist kalt geworden', whyLimit: 'Grenze überschritten',
    shop1: 'Straßenofen', shop2: 'Trattoria', shop3: 'Bistro', shop4: 'Deli-Theke', shop5: 'Meisterküche',
    typeLong: 'Lang ziehen', typeJust: 'Genau treffen', typeSafe: 'Belag halten',
    locked: 'Gesperrt', unlockPts: 'Für {n} Punkte öffnen', watchAd: 'Werbung ansehen für +50 Punkte',
    noThanks: 'Nein danke', continueAd: 'Werbung ansehen und anknüpfen', removeAds: 'Werbung entfernen', restore: 'Kauf wiederherstellen',
    points: 'Punkte',
    sound: 'Ton', haptic: 'Vibration', lang: 'Sprache', privacy: 'Datenschutzerklärung', devTitle: 'Mehr von uns', devPlay: 'Auf Google Play ansehen', devSite: 'Unsere App-Sammlung',
    dailyTitle: 'Faden des Tages', dailyDone: 'Für heute fertig. Bis morgen',
  },
});
// 치즈 이름 — 대부분 고유명사. 라틴 표기권은 원문 유지, 그 외는 현지 음차.
export const CHEESE_NAME = {
  ko: { mozzarella: '모짜렐라', cheddar: '체다', gorgonzola: '고르곤졸라', raclette: '라클렛', stringch: '스트링치즈', burrata: '부라타', provolone: '프로볼로네', emmental: '에멘탈', gouda: '고다', brie: '브리', halloumi: '할루미', taleggio: '탈레지오' },
  ja: { mozzarella: 'モッツァレラ', cheddar: 'チェダー', gorgonzola: 'ゴルゴンゾーラ', raclette: 'ラクレット', stringch: 'さけるチーズ', burrata: 'ブラータ', provolone: 'プロヴォローネ', emmental: 'エメンタール', gouda: 'ゴーダ', brie: 'ブリー', halloumi: 'ハルミ', taleggio: 'タレッジョ' },
  'zh-Hant': { mozzarella: '莫札瑞拉', cheddar: '切達', gorgonzola: '戈貢佐拉', raclette: '拉可雷特', stringch: '手撕起司', burrata: '布拉塔', provolone: '波羅伏洛', emmental: '艾曼塔', gouda: '高達', brie: '布里', halloumi: '哈魯米', taleggio: '塔雷吉歐' },
  'zh-Hans': { mozzarella: '马苏里拉', cheddar: '切达', gorgonzola: '戈贡佐拉', raclette: '拉克莱特', stringch: '手撕芝士', burrata: '布拉塔', provolone: '波罗伏洛', emmental: '埃曼塔', gouda: '高达', brie: '布里', halloumi: '哈鲁米', taleggio: '塔雷吉欧' },
  th: { mozzarella: 'มอสซาเรลลา', cheddar: 'เชดดาร์', gorgonzola: 'กอร์กอนโซลา', raclette: 'ราเคล็ต', stringch: 'ชีสฉีก', burrata: 'บูราตา', provolone: 'โปรโวโลเน', emmental: 'เอมเมนทัล', gouda: 'เกาดา', brie: 'บรี', halloumi: 'ฮัลลูมี', taleggio: 'ทาเลจโจ' },
};
const LATIN = { mozzarella: 'Mozzarella', cheddar: 'Cheddar', gorgonzola: 'Gorgonzola', raclette: 'Raclette', stringch: 'String Cheese', burrata: 'Burrata', provolone: 'Provolone', emmental: 'Emmental', gouda: 'Gouda', brie: 'Brie', halloumi: 'Halloumi', taleggio: 'Taleggio' };
for (const L of ['en', 'ms', 'id', 'es', 'fr', 'pt-BR', 'de']) CHEESE_NAME[L] = LATIN;

// ---- 로케일 선택 ----
// 규정: 디바이스 선호 로케일 목록을 앞에서부터 훑어 지원 언어와 '첫 매칭'되는 것을 채택.
// 단일 로케일만 보면 사용자가 2·3순위로 둔 지원 언어를 놓친다. 매칭 실패 시 영어 폴백.
const HANT_HINTS = ['hant', 'tw', 'hk', 'mo'];
export function pickLocale(prefs) {
  const list = (prefs && prefs.length) ? prefs
    : ((typeof navigator !== 'undefined' && navigator.languages) ? navigator.languages
      : [(typeof navigator !== 'undefined' && navigator.language) || 'en']);
  for (const raw of list) {
    if (!raw) continue;
    const low = String(raw).toLowerCase();
    const base = low.split('-')[0];
    if (base === 'zh') {
      let hant = false;
      for (const h of HANT_HINTS) if (low.indexOf(h) >= 0) hant = true;
      return hant ? 'zh-Hant' : 'zh-Hans';
    }
    if (base === 'pt') return 'pt-BR';
    const exact = LOCALES.find(l => l.toLowerCase() === low);
    if (exact) return exact;
    const byBase = LOCALES.find(l => l.toLowerCase() === base);
    if (byBase) return byBase;
  }
  return 'en';
}

let CUR = 'en';
export function setLocale(l) {
  CUR = STR[l] ? l : 'en';
  try { localStorage.setItem('cp_lang', CUR); } catch (e) { }
  return CUR;
}
export function getLocale() { return CUR; }
export function initLocale() {
  // 웹 데모: 래퍼 페이지가 ?lang= 으로 언어를 고정한다(저장하지 않음)
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && STR[q]) { CUR = q; return CUR; }
  } catch (e) { }
  let saved = null;
  try { saved = localStorage.getItem('cp_lang'); } catch (e) { }
  return setLocale(saved && STR[saved] ? saved : pickLocale());
}
export function t(key, vars) {
  const tab = STR[CUR] || STR.en;
  let s = (tab[key] != null) ? tab[key] : ((STR.en[key] != null) ? STR.en[key] : key);
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}
export function cheeseName(key) {
  const tab = CHEESE_NAME[CUR] || CHEESE_NAME.en;
  return tab[key] || key;
}