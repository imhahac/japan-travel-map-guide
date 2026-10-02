/**
 * =========================================================================
 * 松本清 (Matsumoto Kiyoshi) 門市爬蟲與資料模組
 * =========================================================================
 * 收錄全日本核心觀光商圈與車站出口最前線之松本清免稅藥妝門市。
 */

import { findNearestStation } from '../core/geo.js';
import { validateSpotsBatch } from '../core/validator.js';
import { deduplicateSpots } from '../core/dedupe.js';

export const MATSUKIYO_STORES_SEED = [
  // --- 東京首都圈 ---
  {
    code: 'shinjuku-east',
    name: '松本清 新宿東口店',
    nameJa: 'マツモトキヨシ 新宿東口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿3-22-6',
    lat: 35.6924,
    lng: 139.7022,
    phone: '03-5360-4231',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '車站步行2分內', '新宿商圈', '支援行動支付'],
    notes: '緊鄰 JR 新宿站東口，地下 1 樓至地上 3 樓藥品、美妝、保健品一應俱全。'
  },
  {
    code: 'shibuya-part1',
    name: '松本清 澀谷 Part 1 店',
    nameJa: 'マツモトキヨシ 渋谷Part1店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区宇田川町22-3',
    lat: 35.6601,
    lng: 139.6998,
    phone: '03-3463-8728',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '澀谷十字路口旁', '熱門美妝保養'],
    notes: '澀谷八公口十字路口步行 2 分鐘，外國觀光客超人氣採購點。'
  },
  {
    code: 'ginza-5chome',
    name: '松本清 銀座5丁目店',
    nameJa: 'マツモトキヨシ 銀座5丁目店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都中央区銀座5-5-1',
    lat: 35.6705,
    lng: 139.7635,
    phone: '03-3289-0260',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '銀座中央通', '高端專櫃品牌'],
    notes: '座落於銀座晴海通與中央通交會處，專櫃級美妝與專屬退稅通道。'
  },
  {
    code: 'ueno-ameyoko',
    name: '松本清 上野阿美橫丁店',
    nameJa: 'マツモトキヨシ 上野アメ横店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区上野4-7-17',
    lat: 35.7108,
    lng: 139.7745,
    phone: '03-3836-9730',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '阿美橫丁入口', '折扣力度大', '中文對應'],
    notes: '上野站不忍口正對面，阿美橫町熱門伴手禮與常備藥品免稅專賣。'
  },
  {
    code: 'ikebukuro-part2',
    name: '松本清 池袋 Part 2 店',
    nameJa: 'マツモトキヨシ 池袋Part2店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区東池袋1-22-8',
    lat: 35.7305,
    lng: 139.7152,
    phone: '03-5951-3181',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '太陽城通', '營業至深夜'],
    notes: '池袋東口太陽城 60 通道上，營業至深夜 23:00。'
  },
  {
    code: 'akihabara-ekimae',
    name: '松本清 秋葉原站前店',
    nameJa: 'マツモトキヨシ アキバ店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区外神田1-13-1',
    lat: 35.6985,
    lng: 139.7712,
    phone: '03-5297-8811',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '秋葉原站中央口旁', '車站步行1分內'],
    notes: 'JR 秋葉原站電氣街口出站即達。'
  },

  // --- 近畿關西圈 (大阪 / 京都 / 神戶) ---
  {
    code: 'osaka-shinsaibashi-chuo',
    name: '松本清 心齋橋中央店',
    nameJa: 'マツモトキヨシ 心斎橋中央店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区心斎橋筋2-1-21',
    lat: 34.6712,
    lng: 135.5008,
    phone: '06-6213-7761',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '心齋橋商店街核心', '中文店員常駐'],
    notes: '大阪最熱門的心齋橋筋商店街中央，台灣旅客掃貨首選據點。'
  },
  {
    code: 'osaka-ebisubashi',
    name: '松本清 難波戎橋店',
    nameJa: 'マツモトキヨシ 戎橋店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区難波1-5-16',
    lat: 34.6678,
    lng: 135.5015,
    phone: '06-6211-1378',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '道頓堀跑跑人橋旁', '難波站步行3分'],
    notes: '緊鄰道頓堀戎橋與固力果招牌，位置極度顯眼方便。'
  },
  {
    code: 'kyoto-shijo-kawaramachi',
    name: '松本清 京都四條河原町店',
    nameJa: 'マツモトキヨシ 四条河原町店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区四条通小橋西入真町88',
    lat: 35.0038,
    lng: 135.7705,
    phone: '075-257-2270',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '阪急河原町站出口', '祇園商圈'],
    notes: '阪急京都河原町站出口直達，前往祇園與鴨川必經。'
  },
  {
    code: 'kyoto-porta',
    name: '松本清 京都站前 Porta 店',
    nameJa: 'マツモトキヨシ 京都ポルタ店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区烏丸通塩小路下る東塩小路町902',
    lat: 34.9858,
    lng: 135.7588,
    phone: '075-343-2615',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '京都站地下街直通', '新幹線旁'],
    notes: '京都站地下街 Porta 內，搭乘新幹線或 HARUKA 前補貨最便利。'
  },

  // --- 九州 (福岡) ---
  {
    code: 'hakata-chikagai',
    name: '松本清 博多站地下街店',
    nameJa: 'マツモトキヨシ 博多駅地下街店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅中央街1-1 地下1F',
    lat: 33.5902,
    lng: 130.4195,
    phone: '092-474-0610',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '博多車站地下街直通', '全天候不受天氣影響'],
    notes: 'JR 博多站中央地下街直通，免出站即可完成免稅採買。'
  },

  // --- 北海道 (札幌) ---
  {
    code: 'sapporo-tanukikoji-3chome',
    name: '松本清 札幌狸小路3丁目店',
    nameJa: 'マツモトキヨシ 札幌狸小路Part2店',
    region: '北海道',
    prefecture: '北海道',
    address: '北海道札幌市中央区南2条西3丁目1-5',
    lat: 43.0575,
    lng: 141.3545,
    phone: '011-209-7030',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '狸小路商店街', '北海道藥妝伴手禮'],
    notes: '狸小路 3 丁目拱廊商店街內，馬油、保濕面膜與熱門藥品齊全。'
  },

  // --- 沖繩 (那霸) ---
  {
    code: 'naha-kokusaidori-chuo',
    name: '松本清 那霸國際通中央店',
    nameJa: 'マツモトキヨシ 国際通り店',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市松尾2-8-16',
    lat: 26.2158,
    lng: 127.6888,
    phone: '098-860-2670',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '國際通核心', '防曬美白專區'],
    notes: '那霸國際通中心地帶，沖繩限定美妝、防曬與伴手禮專賣。'
  }
];

/**
 * 建置標準化松本清門市資料集
 * @param {Array<object>} [rawList=MATSUKIYO_STORES_SEED] 
 * @param {Array<object>} [stationsList=[]] 
 * @returns {Array<object>}
 */
export function buildMatsukiyoStores(rawList = MATSUKIYO_STORES_SEED, stationsList = []) {
  const result = [];

  for (const s of rawList) {
    const lat = Number(s.lat);
    const lng = Number(s.lng);
    const id = s.id || `matsukiyo-${s.code || Math.random().toString(36).slice(2, 8)}`;

    const stationMatch = findNearestStation(lat, lng, stationsList);
    const stationName = stationMatch.station ? stationMatch.station.name : '鄰近車站';
    const walkMin = stationMatch.walkMinutes || 3;

    let tags = [];
    if (Array.isArray(s.tags)) {
      tags = [...s.tags];
    } else if (typeof s.tags === 'string') {
      tags = s.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (!tags.includes('免稅 (Tax-Free)')) {
      tags.unshift('免稅 (Tax-Free)');
    }
    if (walkMin <= 3 && !tags.includes('車站步行3分內')) {
      tags.push('車站步行3分內');
    }

    const bookingUrl = s.url || s.bookingUrl || 'https://www.matsukiyococokara-online.com/';
    const imageUrl = s.imageUrl || 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80';

    result.push({
      id,
      category: '購物藥妝',
      brand: '松本清',
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
      notes: s.notes || '日本大型知名連鎖藥妝店，提供免稅服務與豐富的美妝保養品。'
    });
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(result);
  const validation = validateSpotsBatch(uniqueSpots);
  console.log(`[Matsukiyo Scraper] 建置完成: 共 ${uniqueSpots.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);

  return uniqueSpots;
}
