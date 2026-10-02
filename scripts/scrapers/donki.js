/**
 * =========================================================================
 * 唐吉訶德 (Don Quijote) 門市爬蟲與資料模組
 * =========================================================================
 * 收錄全日本核心旅遊商圈 24 小時營業與免稅之唐吉訶德與 MEGA Donki 旗艦店。
 */

import { findNearestStation } from '../core/geo.js';
import { validateSpotsBatch } from '../core/validator.js';
import { deduplicateSpots } from '../core/dedupe.js';

export const DONKI_STORES_SEED = [
  // --- 東京首都圈 ---
  {
    code: 'shinjuku-kabukicho',
    name: '唐吉訶德 新宿歌舞伎町店',
    nameJa: 'ドン・キホーテ 新宿歌舞伎町店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区歌舞伎町1-16-5',
    lat: 35.6946,
    lng: 139.7019,
    phone: '0570-008-711',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=29',
    tags: ['免稅 (Tax-Free)', '24小時營業', '歌舞伎町入口', '支援行動支付'],
    notes: '全天候 24 小時營業，歌舞伎町地標，零食、藥妝、電器、伴手禮齊全。'
  },
  {
    code: 'mega-shibuya-honten',
    name: 'MEGA 唐吉訶德 澀谷本店',
    nameJa: 'MEGA ドン・キホーテ 渋谷本店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区宇田川町28-6',
    lat: 35.6608,
    lng: 139.6974,
    phone: '0570-076-311',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=457',
    tags: ['MEGA旗艦店', '免稅 (Tax-Free)', '24小時營業', '生鮮超市', '生肉蔬果'],
    notes: '地下 1 樓至地上 7 樓超大型旗艦店，全天 24 小時營業，附設免稅專用退稅櫃台。'
  },
  {
    code: 'ikebukuro-higashiguchi',
    name: '唐吉訶德 池袋東口站前店',
    nameJa: 'ドン・キホーテ 池袋東口駅前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区南池袋1-22-5',
    lat: 35.7289,
    lng: 139.7126,
    phone: '0570-062-811',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=312',
    tags: ['免稅 (Tax-Free)', '24小時營業', '車站步行2分內'],
    notes: '池袋東口步行僅 2 分鐘，交通便捷，深受自由行旅客喜愛。'
  },
  {
    code: 'akihabara',
    name: '唐吉訶德 秋葉原店',
    nameJa: 'ドン・キホーテ 秋葉原店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区外神田4-3-3',
    lat: 35.7018,
    lng: 139.7715,
    phone: '0570-024-511',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=98',
    tags: ['AKB48劇場', '免稅 (Tax-Free)', '24小時營業', '動漫電玩周邊'],
    notes: '位於秋葉原中央通中央，頂樓為 AKB48 劇場，動漫模型與電器免稅齊備。'
  },
  {
    code: 'asakusa',
    name: '唐吉訶德 淺草店',
    nameJa: 'ドン・キホーテ 浅草店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区浅草2-10',
    lat: 35.7135,
    lng: 139.7928,
    phone: '0570-055-801',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=317',
    tags: ['免稅 (Tax-Free)', '24小時營業', '淺草寺周邊', '傳統伴手禮'],
    notes: '鄰近淺草寺與雷門，日本特色工藝品、日式點心與酒類專門店。'
  },
  {
    code: 'ginza-honkan',
    name: '唐吉訶德 銀座本館',
    nameJa: 'ドン・キホーテ 銀座本館',
    region: '關東',
    prefecture: '東京都',
    address: '東京都中央区銀座8-10 先',
    lat: 35.6668,
    lng: 139.7612,
    phone: '0570-026-611',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=208',
    tags: ['免稅 (Tax-Free)', '24小時營業', '新橋站旁', '名牌精品'],
    notes: '緊鄰 JR 新橋站與銀座大道，精品名牌包與高檔酒款齊全。'
  },
  {
    code: 'roppongi',
    name: '唐吉訶德 六本木店',
    nameJa: 'ドン・キホーテ 六本木店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都港区六本木3-14-10',
    lat: 35.6625,
    lng: 139.7345,
    phone: '0570-010-811',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=24',
    tags: ['免稅 (Tax-Free)', '24小時營業', '外國旅客熱門'],
    notes: '六本木交差點步行 3 分鐘，外語對應服務完備。'
  },

  // --- 近畿關西圈 (大阪 / 京都 / 神戶) ---
  {
    code: 'osaka-dotonbori',
    name: '唐吉訶德 道頓堀店',
    nameJa: 'ドン・キホーテ 道頓堀店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区宗右衛門町7-13',
    lat: 34.6688,
    lng: 135.5028,
    phone: '0570-026-511',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=110',
    tags: ['道頓堀地標摩天輪', '免稅 (Tax-Free)', '24小時營業', '運河景觀'],
    notes: '全球唯一擁有黃色「惠比壽摩天輪」的唐吉訶德，大阪自由行必訪朝聖地。'
  },
  {
    code: 'osaka-umeda-honten',
    name: '唐吉訶德 梅田本店',
    nameJa: 'ドン・キホーテ 梅田本店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市北区小松原町4-16',
    lat: 34.7028,
    lng: 135.5015,
    phone: '0570-079-711',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=262',
    tags: ['梅田地下街直通', '免稅 (Tax-Free)', '24小時營業'],
    notes: 'JR 大阪站與阪急梅田站旁，交通便利，地下街出口即達。'
  },
  {
    code: 'kyoto-shijo-kawaramachi',
    name: '唐吉訶德 四條河原町店',
    nameJa: 'ドン・キホーテ 四条河原町店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市中京区河原町通蛸薬師下る塩屋町321',
    lat: 35.0055,
    lng: 135.7698,
    phone: '0570-038-211',
    is24Hours: false,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=562',
    tags: ['京都最熱鬧商圈', '免稅 (Tax-Free)', '營業至04:00', '八坂神社周邊'],
    notes: '京都四條河原町繁華街中心，營業至深夜凌晨 4 點，採購伴手禮最方便。'
  },
  {
    code: 'kyoto-karasuma-shichijo',
    name: '唐吉訶德 京都烏丸七條店',
    nameJa: 'ドン・キホーテ 京都烏丸七条店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区七条通烏丸東入真苧屋町197',
    lat: 34.9882,
    lng: 135.7605,
    phone: '0570-080-311',
    is24Hours: false,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=570',
    tags: ['京都站步行3分', '免稅 (Tax-Free)', '營業至24:00', '新幹線旁'],
    notes: '距離 JR 京都站烏丸口步行僅 3 分鐘，搭新幹線前最後採購首選。'
  },
  {
    code: 'kobe-sannomiya',
    name: '唐吉訶德 神戶三宮店',
    nameJa: 'ドン・キホーテ 神戸三宮店',
    region: '近畿',
    prefecture: '兵庫縣',
    address: '兵庫県神戸市中央区下山手通2-12-3',
    lat: 34.6938,
    lng: 135.1908,
    phone: '0570-077-811',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=202',
    tags: ['免稅 (Tax-Free)', '24小時營業', '三宮站步行4分'],
    notes: '神戶三宮中心地帶，全天 24 小時營業。'
  },

  // --- 中部東海 (名古屋) ---
  {
    code: 'nagoya-sakae-honten',
    name: '唐吉訶德 名古屋榮本店',
    nameJa: 'ドン・キホーテ 名古屋栄店',
    region: '東海・甲信越・北陸',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中区錦3-17-15',
    lat: 35.1708,
    lng: 136.9065,
    phone: '0570-044-611',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=355',
    tags: ['免稅 (Tax-Free)', '24小時營業', '榮商圈地標', '地鐵直達'],
    notes: '名古屋榮地下鐵 1 號出口直達，全天 24 小時營業之超人氣旗艦店。'
  },

  // --- 九州 (福岡) ---
  {
    code: 'fukuoka-nakasu',
    name: '唐吉訶德 福岡中洲店',
    nameJa: 'ドン・キホーテ 中洲店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区中洲3-7-24 gate\'s 2F',
    lat: 33.5938,
    lng: 130.4062,
    phone: '0570-085-411',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=268',
    tags: ['中洲屋台街旁', '地鐵中洲川端站直通', '免稅 (Tax-Free)', '24小時營業'],
    notes: '福岡地鐵中洲川端站直通 gate\'s 大樓 2 樓，逛完中洲屋台夜市順路採買。'
  },
  {
    code: 'fukuoka-tenjin-honten',
    name: '唐吉訶德 福岡天神本店',
    nameJa: 'ドン・キホーテ 福岡天神本店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市中央区今泉1-20-17',
    lat: 33.5872,
    lng: 130.3995,
    phone: '0570-079-811',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=459',
    tags: ['天神購物中心', '免稅 (Tax-Free)', '24小時營業'],
    notes: '全棟 5 層樓天神旗艦店，藥妝與九州在地伴手禮專區豐富。'
  },

  // --- 北海道 (札幌) ---
  {
    code: 'mega-sapporo-tanukikoji',
    name: 'MEGA 唐吉訶德 札幌狸小路本店',
    nameJa: 'MEGA ドン・キホーテ 札幌狸小路本店',
    region: '北海道',
    prefecture: '北海道',
    address: '北海道札幌市中央区南3条西4-12-1',
    lat: 43.0568,
    lng: 141.3532,
    phone: '0570-022-711',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=532',
    tags: ['狸小路4丁目', 'MEGA旗艦店', '免稅 (Tax-Free)', '24小時營業', '北海道伴手禮'],
    notes: '狸小路商店街 4 丁目核心，北海道白色戀人、六花亭伴手禮與藥妝應有盡有。'
  },

  // --- 沖繩 (那霸) ---
  {
    code: 'naha-kokusaidori',
    name: '唐吉訶德 那霸國際通店',
    nameJa: 'ドン・キホーテ 国際通り店',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市松尾2-8-19',
    lat: 26.2155,
    lng: 127.6892,
    phone: '0570-008-811',
    is24Hours: true,
    url: 'https://www.donki.com/store/shop_detail.php?shop_id=323',
    tags: ['國際通核心地標', '免稅 (Tax-Free)', '24小時營業', '沖繩限定伴手禮'],
    notes: '國際通中央地標，黑糖、紅芋塔、泡盛酒與浮潛用具全館 24 小時免稅服務。'
  }
];

/**
 * 建置標準化唐吉訶德門市資料集
 * @param {Array<object>} [rawList=DONKI_STORES_SEED] 
 * @param {Array<object>} [stationsList=[]] 
 * @returns {Array<object>}
 */
export function buildDonkiStores(rawList = DONKI_STORES_SEED, stationsList = []) {
  const result = [];

  for (const s of rawList) {
    const lat = Number(s.lat);
    const lng = Number(s.lng);
    const id = s.id || `donki-${s.code || Math.random().toString(36).slice(2, 8)}`;

    const stationMatch = findNearestStation(lat, lng, stationsList);
    const stationName = stationMatch.station ? stationMatch.station.name : '鄰近車站';
    const walkMin = stationMatch.walkMinutes || 4;

    let tags = [];
    if (Array.isArray(s.tags)) {
      tags = [...s.tags];
    } else if (typeof s.tags === 'string') {
      tags = s.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (s.is24Hours && !tags.includes('24小時營業')) {
      tags.unshift('24小時營業');
    }
    if (!tags.includes('免稅 (Tax-Free)')) {
      tags.unshift('免稅 (Tax-Free)');
    }

    const bookingUrl = s.url || s.bookingUrl || 'https://www.donki.com/';
    const imageUrl = s.imageUrl || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80';

    result.push({
      id,
      category: '購物藥妝',
      brand: '唐吉訶德',
      name: s.name,
      nameJa: s.nameJa || s.name,
      region: s.region,
      prefecture: s.prefecture,
      nearestStation: stationName,
      stationLine: stationMatch.station?.lines?.[0] || 'JR / 地鐵',
      stationAccess: stationMatch.note || `鄰近 ${stationName} 步行約 ${walkMin} 分鐘`,
      walkMinutes: walkMin,
      address: s.address,
      coordinates: `${lat}, ${lng}`,
      lat,
      lng,
      phone: s.phone || '',
      bookingUrl,
      googleMapUrl: `https://maps.google.com/?q=${lat},${lng}`,
      imageUrl,
      images: [imageUrl],
      tags: tags.join(', '),
      notes: s.notes || '日本大型綜合折扣連鎖量販店，提供免稅與各類美妝、電器、伴手禮。'
    });
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(result);
  const validation = validateSpotsBatch(uniqueSpots);
  console.log(`[Donki Scraper] 建置完成: 共 ${uniqueSpots.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);

  return uniqueSpots;
}
