/**
 * 日本旅遊地圖導覽 - 核心分類與品牌統一辭典 (Single Source of Truth)
 * 嚴格規範 Tier 1 (大類) ➔ Tier 2 (次級業態/料理子類) ➔ Tier 3 (連鎖品牌)
 */

export const CATEGORIES = [
  { id: 'all', label: '全部', iconName: 'LayoutGrid', color: '#00489d' },
  { id: '飯店', label: '飯店旅館', iconName: 'BedDouble', color: '#00489d' },
  { id: '購物藥妝', label: '購物藥妝', iconName: 'ShoppingBag', color: '#ca8a04' },
  { id: '美食餐廳', label: '在地美食', iconName: 'Utensils', color: '#ea580c' },
  { id: '便利商店', label: '便利商店', iconName: 'Store', color: '#16a34a' }
];

export const SUBCATEGORIES_MAP = {
  飯店: [
    { id: 'all', label: '全部飯店' },
    { id: '商務飯店', label: '商務飯店' }
  ],
  購物藥妝: [
    { id: 'all', label: '全部購物' },
    { id: '藥妝量販', label: '綜合藥妝量販' },
    { id: '3C家電', label: '3C數位家電' }
  ],
  美食餐廳: [
    { id: 'all', label: '全部美食' },
    { id: '鍋物料理', label: '鍋物料理' },
    { id: '拉麵', label: '日式拉麵' },
    { id: '牛丼', label: '平價牛丼' },
    { id: '壽司', label: '迴轉壽司' },
    { id: '定食', label: '和風定食' },
    { id: '家庭餐廳', label: '家庭餐廳' },
    { id: '漢堡輕食', label: '漢堡輕食' },
    { id: '咖啡', label: '喫茶咖啡' }
  ],
  便利商店: [
    { id: 'all', label: '全部超商' },
    { id: '連鎖超商', label: '連鎖超商' }
  ]
};

export const BRANDS_REGISTRY = [
  // ── 飯店旅館 (商務飯店) ──
  {
    id: '東橫INN',
    label: '東橫 INN',
    shortLabel: '東橫 INN',
    category: '飯店',
    subcategory: '商務飯店',
    aliases: ['東橫INN', '東橫 INN', 'Toyoko Inn', '東横イン'],
    color: '#00489d',
    dotBg: '#00489d',
    activeBg: '#eff6ff',
    activeText: '#1e40af'
  },
  {
    id: 'APA飯店',
    label: 'APA 飯店',
    shortLabel: 'APA 飯店',
    category: '飯店',
    subcategory: '商務飯店',
    aliases: ['APA飯店', 'APA 飯店', 'APA Hotel', 'アパホテル', 'APA'],
    color: '#d97706',
    dotBg: '#d97706',
    activeBg: '#fef3c7',
    activeText: '#92400e'
  },

  // ── 購物藥妝 (綜合藥妝量販) ──
  {
    id: '唐吉訶德',
    label: '唐吉訶德 (Donki)',
    shortLabel: '唐吉訶德',
    category: '購物藥妝',
    subcategory: '藥妝量販',
    aliases: ['唐吉訶德', '唐吉訶德 (Donki)', 'Don Quijote', 'ドン・キホーテ', 'Donki'],
    color: '#ca8a04',
    dotBg: '#eab308',
    activeBg: '#fef9c3',
    activeText: '#854d0e'
  },
  {
    id: '松本清',
    label: '松本清 (Matsukiyo)',
    shortLabel: '松本清',
    category: '購物藥妝',
    subcategory: '藥妝量販',
    aliases: ['松本清', '松本清 (Matsukiyo)', 'Matsumoto Kiyoshi', 'マツモトキヨシ'],
    color: '#2563eb',
    dotBg: '#3b82f6',
    activeBg: '#eff6ff',
    activeText: '#1d4ed8'
  },

  // ── 購物藥妝 (3C數位家電) ──
  {
    id: 'Bic Camera',
    label: 'Bic Camera',
    shortLabel: 'Bic Camera',
    category: '購物藥妝',
    subcategory: '3C家電',
    aliases: ['Bic Camera', 'BicCamera', 'ビックカメラ'],
    color: '#dc2626',
    dotBg: '#ef4444',
    activeBg: '#fee2e2',
    activeText: '#b91c1c'
  },
  {
    id: '友都八喜 (Yodobashi)',
    label: '友都八喜 (Yodobashi)',
    shortLabel: '友都八喜',
    category: '購物藥妝',
    subcategory: '3C家電',
    aliases: ['友都八喜', '友都八喜 (Yodobashi)', 'Yodobashi', 'Yodobashi Camera', 'ヨドバシカメラ', 'ヨドバシ'],
    color: '#0284c7',
    dotBg: '#0284c7',
    activeBg: '#e0f2fe',
    activeText: '#0369a1'
  },
  {
    id: 'Kojima × Bic Camera',
    label: 'Kojima × Bic',
    shortLabel: 'Kojima',
    category: '購物藥妝',
    subcategory: '3C家電',
    aliases: ['Kojima × Bic Camera', 'Kojima', 'コジマ×ビックカメラ', 'コジマ'],
    color: '#ea580c',
    dotBg: '#ea580c',
    activeBg: '#ffedd5',
    activeText: '#c2410c'
  },
  {
    id: 'Sofmap (ソフマップ)',
    label: 'Sofmap (索芙瑪)',
    shortLabel: 'Sofmap',
    category: '購物藥妝',
    subcategory: '3C家電',
    aliases: ['Sofmap', 'Sofmap (ソフマップ)', 'ソフマップ', '索芙瑪'],
    color: '#2563eb',
    dotBg: '#2563eb',
    activeBg: '#eff6ff',
    activeText: '#1d4ed8'
  },

  // ── 在地美食 (牛丼) ──
  {
    id: '吉野家',
    label: '吉野家',
    shortLabel: '吉野家',
    category: '美食餐廳',
    subcategory: '牛丼',
    aliases: ['吉野家', 'Yoshinoya'],
    color: '#ea580c',
    dotBg: '#ea580c',
    activeBg: '#ffedd5',
    activeText: '#c2410c'
  },
  {
    id: '松屋',
    label: '松屋',
    shortLabel: '松屋',
    category: '美食餐廳',
    subcategory: '牛丼',
    aliases: ['松屋', 'Matsuya'],
    color: '#0284c7',
    dotBg: '#0284c7',
    activeBg: '#e0f2fe',
    activeText: '#0369a1'
  },
  {
    id: 'すき家',
    label: 'すき家 (Sukiya)',
    shortLabel: 'すき家',
    category: '美食餐廳',
    subcategory: '牛丼',
    aliases: ['すき家', 'すき家 (Sukiya)', 'Sukiya'],
    color: '#dc2626',
    dotBg: '#dc2626',
    activeBg: '#fee2e2',
    activeText: '#b91c1c'
  },

  // ── 在地美食 (拉麵) ──
  {
    id: '一蘭拉麵',
    label: '一蘭拉麵',
    shortLabel: '一蘭',
    category: '美食餐廳',
    subcategory: '拉麵',
    aliases: ['一蘭拉麵', '一蘭', 'Ichiran'],
    color: '#16a34a',
    dotBg: '#dc2626',
    activeBg: '#f0fdf4',
    activeText: '#15803d'
  },
  {
    id: '一風堂',
    label: '一風堂 (IPPUDO)',
    shortLabel: '一風堂',
    category: '美食餐廳',
    subcategory: '拉麵',
    aliases: ['一風堂', '一風堂 (IPPUDO)', 'IPPUDO'],
    color: '#b91c1c',
    dotBg: '#dc2626',
    activeBg: '#fef2f2',
    activeText: '#991b1b'
  },
  {
    id: '六厘舎',
    label: '六厘舎 (Rokurinsha)',
    shortLabel: '六厘舎',
    category: '美食餐廳',
    subcategory: '拉麵',
    aliases: ['六厘舎', '六厘舎 (Rokurinsha)', 'Rokurinsha', '六厘舍', 'ROKURINSHA'],
    color: '#881337',
    dotBg: '#991b1b',
    activeBg: '#fef2f2',
    activeText: '#881337'
  },
  {
    id: '舎鈴',
    label: '舎鈴 (Sharin)',
    shortLabel: '舎鈴',
    category: '美食餐廳',
    subcategory: '拉麵',
    aliases: ['舎鈴', '舎鈴 (Sharin)', 'Sharin', '舍鈴', 'SHARIN'],
    color: '#ea580c',
    dotBg: '#f97316',
    activeBg: '#fff7ed',
    activeText: '#c2410c'
  },

  // ── 在地美食 (壽司) ──
  {
    id: '壽司郎',
    label: '壽司郎 (Sushiro)',
    shortLabel: '壽司郎',
    category: '美食餐廳',
    subcategory: '壽司',
    aliases: ['壽司郎', '壽司郎 (Sushiro)', 'Sushiro', 'スシロー'],
    color: '#dc2626',
    dotBg: '#ef4444',
    activeBg: '#fee2e2',
    activeText: '#b91c1c'
  },
  {
    id: '藏壽司',
    label: '藏壽司 (Kura)',
    shortLabel: '藏壽司',
    category: '美食餐廳',
    subcategory: '壽司',
    aliases: ['藏壽司', '藏壽司 (Kura)', 'Kura Sushi', 'くら寿司'],
    color: '#0284c7',
    dotBg: '#0284c7',
    activeBg: '#e0f2fe',
    activeText: '#0369a1'
  },
  {
    id: 'はま寿司',
    label: 'はま寿司 (Hama)',
    shortLabel: 'はま寿司',
    category: '美食餐廳',
    subcategory: '壽司',
    aliases: ['はま寿司', 'はま寿司 (Hama)', 'Hama Sushi', '濱壽司', '滨寿司', 'はま'],
    color: '#0369a1',
    dotBg: '#0284c7',
    activeBg: '#e0f2fe',
    activeText: '#0369a1'
  },

  // ── 在地美食 (定食) ──
  {
    id: 'やよい軒',
    label: 'やよい軒 (彌生軒)',
    shortLabel: 'やよい軒',
    category: '美食餐廳',
    subcategory: '定食',
    aliases: ['やよい軒', 'やよい軒 (彌生軒)', '彌生軒', 'Yayoi'],
    color: '#d97706',
    dotBg: '#d97706',
    activeBg: '#fef3c7',
    activeText: '#92400e'
  },
  {
    id: '大戶屋',
    label: '大戶屋 (Ootoya)',
    shortLabel: '大戶屋',
    category: '美食餐廳',
    subcategory: '定食',
    aliases: ['大戶屋', '大戶屋 (Ootoya)', 'Ootoya'],
    color: '#1e3a8a',
    dotBg: '#1e3a8a',
    activeBg: '#eff6ff',
    activeText: '#1e40af'
  },

  // ── 在地美食 (咖啡) ──
  {
    id: '客美多咖啡',
    label: '客美多咖啡',
    shortLabel: '客美多',
    category: '美食餐廳',
    subcategory: '咖啡',
    aliases: ['客美多咖啡', '客美多', "Komeda's Coffee", 'コメダ珈琲店'],
    color: '#78350f',
    dotBg: '#92400e',
    activeBg: '#fef3c7',
    activeText: '#78350f'
  },

  // ── 在地美食 (家庭餐廳) ──
  {
    id: '薩莉亞',
    label: '薩莉亞 (Saizeriya)',
    shortLabel: '薩莉亞',
    category: '美食餐廳',
    subcategory: '家庭餐廳',
    aliases: ['薩莉亞', '薩莉亞 (Saizeriya)', 'Saizeriya', 'サイゼリヤ', 'サイゼ'],
    color: '#008837',
    dotBg: '#008837',
    activeBg: '#f0fdf4',
    activeText: '#15803d'
  },

  // ── 在地美食 (漢堡輕食) ──
  {
    id: 'Shake Shack',
    label: 'Shake Shack',
    shortLabel: 'Shake Shack',
    category: '美食餐廳',
    subcategory: '漢堡輕食',
    aliases: ['Shake Shack', 'ShakeShack', 'シェイクシャック', '昔客來'],
    color: '#558b2f',
    dotBg: '#689f38',
    activeBg: '#f1f8e9',
    activeText: '#33691e'
  },

  // ── 在地美食 (鍋物料理) ──
  {
    id: 'しゃぶ葉',
    label: 'しゃぶ葉 (涮乃葉)',
    shortLabel: 'しゃぶ葉',
    category: '美食餐廳',
    subcategory: '鍋物料理',
    aliases: ['しゃぶ葉', 'しゃぶ葉 (涮乃葉)', '涮乃葉', 'Syabuyo', 'syabuyo', 'シャブヨウ', 'しゃぶしゃぶ'],
    color: '#dc2626',
    dotBg: '#dc2626',
    activeBg: '#fef2f2',
    activeText: '#991b1b'
  },

  // ── 便利商店 (連鎖超商) ──
  {
    id: '7-Eleven',
    label: '7-Eleven',
    shortLabel: '7-11',
    category: '便利商店',
    subcategory: '連鎖超商',
    aliases: ['7-Eleven', '7-11', 'セブンイレブン'],
    color: '#16a34a',
    dotBg: '#ea580c',
    activeBg: '#f0fdf4',
    activeText: '#15803d'
  },
  {
    id: 'FamilyMart',
    label: '全家 FamilyMart',
    shortLabel: '全家',
    category: '便利商店',
    subcategory: '連鎖超商',
    aliases: ['FamilyMart', '全家', '全家 FamilyMart', 'ファミリーマート'],
    color: '#0284c7',
    dotBg: '#16a34a',
    activeBg: '#e0f2fe',
    activeText: '#0369a1'
  },
  {
    id: 'Lawson',
    label: '羅森 Lawson',
    shortLabel: 'Lawson',
    category: '便利商店',
    subcategory: '連鎖超商',
    aliases: ['Lawson', '羅森', '羅森 Lawson', 'ローソン'],
    color: '#0284c7',
    dotBg: '#2563eb',
    activeBg: '#eff6ff',
    activeText: '#1d4ed8'
  }
];

/**
 * 健壯的品牌配對函數 (支援 Canonical ID、別名、模糊關鍵字)
 * @param {string} spotBrand 地標自帶的品牌欄位
 * @param {string} filterBrand 使用者所選之品牌 ID 或關鍵字 ('all' 表示不限)
 * @returns {boolean}
 */
export function isBrandMatch(spotBrand, filterBrand) {
  if (!filterBrand || filterBrand === 'all') return true;
  if (!spotBrand) return false;
  if (spotBrand === filterBrand) return true;

  // 防止 Kojima x Bic Camera 誤配對為純 Bic Camera
  const hasKojimaA = /Kojima|コジマ/i.test(spotBrand);
  const hasKojimaB = /Kojima|コジマ/i.test(filterBrand);
  if (hasKojimaA !== hasKojimaB) {
    return false;
  }

  // 查找 Registry
  const registeredBrand = BRANDS_REGISTRY.find(b => 
    b.id === filterBrand || 
    b.label === filterBrand || 
    b.shortLabel === filterBrand ||
    (b.aliases && b.aliases.includes(filterBrand))
  );

  if (registeredBrand) {
    if (registeredBrand.id === spotBrand || registeredBrand.label === spotBrand) return true;
    if (registeredBrand.aliases && registeredBrand.aliases.some(a => a === spotBrand || spotBrand.includes(a))) {
      return true;
    }
  }

  // 倒過來由 spotBrand 查找
  const spotRegistry = BRANDS_REGISTRY.find(b => 
    b.id === spotBrand || 
    b.label === spotBrand || 
    (b.aliases && b.aliases.includes(spotBrand))
  );

  if (spotRegistry) {
    if (spotRegistry.id === filterBrand || spotRegistry.label === filterBrand) return true;
    if (spotRegistry.aliases && spotRegistry.aliases.some(a => a === filterBrand || filterBrand.includes(a))) {
      return true;
    }
  }

  // 清洗符號嚴格比對 (相等)
  const cleanA = spotBrand.replace(/[\s\(\)（）\-\_×]/g, '').toLowerCase();
  const cleanB = filterBrand.replace(/[\s\(\)（）\-\_×]/g, '').toLowerCase();
  return cleanA === cleanB;
}

/**
 * 依據 Category, Brand, Name 精確判斷 Tier 2 子分類
 */
export function determineSubcategory(category, brand = '', name = '') {
  if (category === '飯店' || /東橫|APA|Hotel|飯店/i.test(brand)) {
    return '商務飯店';
  }

  if (category === '購物藥妝') {
    // 3C 數位家電檢驗
    if (
      /Bic|Camera|友都八喜|Yodobashi|Kojima|Sofmap|ビック|ヨドバシ|コジマ|ソフマップ/i.test(brand) ||
      /Bic|Camera|友都八喜|Yodobashi|Kojima|Sofmap|ビック|ヨドバシ|コジマ|ソフマップ/i.test(name)
    ) {
      return '3C家電';
    }
    return '藥妝量販';
  }

  if (category === '美食餐廳') {
    if (/しゃぶ葉|涮乃葉|syabuyo|鍋物|涮涮鍋|壽喜燒|しゃぶしゃぶ|温野菜/i.test(brand) || /しゃぶ葉|涮乃葉|鍋物|涮涮鍋|壽喜燒|しゃぶしゃぶ/i.test(name)) return '鍋物料理';
    if (/吉野家|松屋|すき家|牛丼/i.test(brand) || /牛丼/i.test(name)) return '牛丼';
    if (/一蘭|一風堂|六厘舎|舎鈴|拉麵|ラーメン|つけめん|沾麵/i.test(brand) || /拉麵|ラーメン|つけめん|六厘舎|舎鈴/i.test(name)) return '拉麵';
    if (/壽司郎|藏壽司|スシロー|くら寿司|壽司/i.test(brand) || /壽司|スシ|寿司/i.test(name)) return '壽司';
    if (/やよい軒|大戶屋|定食|彌生軒/i.test(brand) || /定食|彌生軒/i.test(name)) return '定食';
    if (/薩莉亞|サイゼリヤ|サイゼ|家庭餐廳/i.test(brand) || /サイゼリヤ/i.test(name)) return '家庭餐廳';
    if (/Shake\s*Shack|シェイクシャック|昔客來|漢堡/i.test(brand) || /Shake\s*Shack/i.test(name)) return '漢堡輕食';
    if (/客美多|咖啡|珈琲|コメダ/i.test(brand) || /咖啡|珈琲|コメダ/i.test(name)) return '咖啡';
    return '平價美食';
  }

  if (category === '便利商店' || /7-Eleven|FamilyMart|Lawson|セブン|ファミマ|ローソン/i.test(brand)) {
    return '連鎖超商';
  }

  return '特色精選';
}
