/**
 * =========================================================================
 * 平價美食與連鎖餐廳模組 (Dining Scraper & 500m Station Filter Module)
 * =========================================================================
 * 收錄全日本車站周邊 500 公尺內之三大牛丼 (吉野家、松屋、すき家)、一蘭拉麵與客美多咖啡。
 */

import fs from 'fs';
import path from 'path';
import { findNearestStation, calculateDistance } from '../core/geo.js';
import { validateSpotsBatch } from '../core/validator.js';
import { deduplicateSpots } from '../core/dedupe.js';

export const DINING_STORES_SEED = [
  // --- 吉野家 (百年經典牛丼) ---
  {
    code: 'yoshinoya-shinjuku-east',
    brand: '吉野家',
    name: '吉野家 新宿東口店',
    nameJa: '吉野家 新宿東口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿3-23-11',
    lat: 35.6928,
    lng: 139.7015,
    phone: '03-5363-2280',
    is24Hours: true,
    url: 'https://www.yoshinoya.com/',
    tags: ['24小時營業', '百年經典牛丼', '車站步行2分內', '支援行動支付'],
    notes: '全天候 24 小時營業，經典秘傳醬汁牛肉飯與朝食定食。'
  },
  {
    code: 'yoshinoya-shibuya-ekimae',
    brand: '吉野家',
    name: '吉野家 澀谷站前店',
    nameJa: '吉野家 渋谷駅前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区道玄坂1-3-1',
    lat: 35.6588,
    lng: 139.6998,
    phone: '03-5459-2511',
    is24Hours: true,
    url: 'https://www.yoshinoya.com/',
    tags: ['24小時營業', '澀谷站出口旁', '特美辣牛肉飯'],
    notes: 'JR 澀谷站八公口步行 1 分鐘，出站用餐極度便捷。'
  },
  {
    code: 'yoshinoya-ikebukuro-east',
    brand: '吉野家',
    name: '吉野家 池袋東口店',
    nameJa: '吉野家 池袋東口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区東池袋1-2-6',
    lat: 35.7302,
    lng: 139.7135,
    phone: '03-5953-6110',
    is24Hours: true,
    url: 'https://www.yoshinoya.com/',
    tags: ['24小時營業', '池袋東口步行2分'],
    notes: '池袋繁華商圈 24 小時深夜供餐首選。'
  },
  {
    code: 'yoshinoya-osaka-namba',
    brand: '吉野家',
    name: '吉野家 難波戎橋店',
    nameJa: '吉野家 なんば戎橋店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区難波3-2-25',
    lat: 34.6675,
    lng: 139.7015,
    lng: 135.5015,
    phone: '06-6635-1510',
    is24Hours: true,
    url: 'https://www.yoshinoya.com/',
    tags: ['24小時營業', '戎橋商店街內', '難波站步行2分'],
    notes: '南海難波與地鐵難波站旁，高人氣平價美食。'
  },
  {
    code: 'yoshinoya-kyoto-ekimae',
    brand: '吉野家',
    name: '吉野家 京都站前店',
    nameJa: '吉野家 京都駅前店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区烏丸通七条下ル東塩小路町718',
    lat: 34.9875,
    lng: 135.7592,
    phone: '075-353-6881',
    is24Hours: true,
    url: 'https://www.yoshinoya.com/',
    tags: ['24小時營業', '京都站烏丸口步行2分', '早晨朝食'],
    notes: 'JR 京都站正對面，早班車出發前享用日式朝食最理想。'
  },
  {
    code: 'yoshinoya-hakata-chikushiguchi',
    brand: '吉野家',
    name: '吉野家 博多站筑紫口店',
    nameJa: '吉野家 博多駅筑紫口店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅中央街5-11',
    lat: 33.5898,
    lng: 130.4225,
    phone: '092-432-8210',
    is24Hours: true,
    url: 'https://www.yoshinoya.com/',
    tags: ['24小時營業', '新幹線筑紫口直達', '博多站旁'],
    notes: '博多站新幹線側出口徒步 1 分鐘，搭車前迅速飽餐。'
  },

  // --- 松屋 (內用附免費味噌湯) ---
  {
    code: 'matsuya-shinjuku-kabukicho',
    brand: '松屋',
    name: '松屋 新宿歌舞伎町店',
    nameJa: '松屋 新宿歌舞伎町店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区歌舞伎町1-21-1',
    lat: 35.6952,
    lng: 139.7025,
    phone: '03-5291-5250',
    is24Hours: true,
    url: 'https://www.matsuyafoods.co.jp/',
    tags: ['24小時營業', '內用附免費味噌湯', '自動點餐機支援中文'],
    notes: '全天 24 小時營業，招牌牛肉飯與生薑燒肉定食均附味噌湯。'
  },
  {
    code: 'matsuya-shibuya-chuo',
    brand: '松屋',
    name: '松屋 澀谷中央街店',
    nameJa: '松屋 渋谷センター街店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区宇田川町29-4',
    lat: 35.6608,
    lng: 139.6978,
    phone: '03-5459-2570',
    is24Hours: true,
    url: 'https://www.matsuyafoods.co.jp/',
    tags: ['24小時營業', '澀谷中央街', '免費味噌湯'],
    notes: '澀谷逛街熱點中心，平價定食與蔥香牛肉蓋飯。'
  },
  {
    code: 'matsuya-osaka-shinsaibashi',
    brand: '松屋',
    name: '松屋 心齋橋店',
    nameJa: '松屋 心斎橋店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区南船場3-12-3',
    lat: 34.6752,
    lng: 135.5005,
    phone: '06-6282-3860',
    is24Hours: true,
    url: 'https://www.matsuyafoods.co.jp/',
    tags: ['24小時營業', '心齋橋站步行1分', '支援信用卡與電子票證'],
    notes: '心齋橋站出口旁，多國語言點餐機友善外國旅客。'
  },
  {
    code: 'matsuya-kyoto-gion',
    brand: '松屋',
    name: '松屋 京都祇園店',
    nameJa: '松屋 祇園店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市東山区祇園町北側281-1',
    lat: 35.0035,
    lng: 135.7758,
    phone: '075-533-7220',
    is24Hours: true,
    url: 'https://www.matsuyafoods.co.jp/',
    tags: ['24小時營業', '八坂神社旁', '祇園商圈'],
    notes: '祇園四條步行 4 分鐘，八坂神社正門斜對面。'
  },

  // --- すき家 Sukiya (口味豐富起司牛丼) ---
  {
    code: 'sukiya-shinjuku-south',
    brand: 'すき家',
    name: 'すき家 新宿南口店',
    nameJa: 'すき家 新宿南口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区代々木2-11-17',
    lat: 35.6875,
    lng: 139.6995,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://www.sukiya.jp/',
    tags: ['24小時營業', '三種起司牛丼', '新宿南口步行3分', '平價早餐'],
    notes: '24 小時營業，經典起司牛丼與高 CP 值鮭魚朝食套餐。'
  },
  {
    code: 'sukiya-osaka-dotonbori',
    brand: 'すき家',
    name: 'すき家 道頓堀一丁目店',
    nameJa: 'すき家 道頓堀一丁目店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区道頓堀1-1-11',
    lat: 34.6685,
    lng: 135.5052,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://www.sukiya.jp/',
    tags: ['24小時營業', '道頓堀河畔', '日本橋站步行3分'],
    notes: '鄰近日本橋站與黑門市場，逛街宵夜首選。'
  },
  {
    code: 'sukiya-naha-kokusai',
    brand: 'すき家',
    name: 'すき家 那霸國際通松尾店',
    nameJa: 'すき家 国際通り松尾店',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市松尾1-1-2',
    lat: 26.2145,
    lng: 127.6835,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://www.sukiya.jp/',
    tags: ['24小時營業', '縣廳前站步行3分', '國際通入口'],
    notes: '單軌電車縣廳前站出站步行 3 分鐘，國際通入口第一站。'
  },

  // --- 客美多咖啡 Komeda's Coffee (名古屋買咖啡送早餐) ---
  {
    code: 'komeda-shinjuku-yasukuni',
    brand: '客美多咖啡',
    name: '客美多咖啡 新宿靖國通店',
    nameJa: 'コメダ珈琲店 新宿靖国通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区歌舞伎町1-5-2',
    lat: 35.6936,
    lng: 139.7028,
    phone: '03-5292-5512',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['買飲料送早餐 (朝食)', '附設插座與Wi-Fi', '冰與火丹麥麵包', '新宿東口步行3分'],
    notes: '每日 11:00 前點購飲品即贈現烤厚片吐司搭配水煮蛋或紅豆泥。'
  },
  {
    code: 'komeda-shibuya-miyamasuzaka',
    brand: '客美多咖啡',
    name: '客美多咖啡 澀谷宮益坂店',
    nameJa: 'コメダ珈琲店 渋谷宮益坂店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区渋谷1-14-14 2F',
    lat: 35.6598,
    lng: 139.7032,
    phone: '03-6427-4660',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['買飲料送早餐 (朝食)', '澀谷宮益坂口步行2分', '舒適沙發包廂'],
    notes: '澀谷東口宮益坂步行 2 分鐘，提供旅客鬧中取靜的充電好去處。'
  },
  {
    code: 'komeda-nagoya-eki-west',
    brand: '客美多咖啡',
    name: '客美多咖啡 名古屋站西店',
    nameJa: 'コメダ珈琲店 エスカ店',
    region: '東海・甲信越・北陸',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中村区椿町6-9 エスカ地下街',
    lat: 35.1702,
    lng: 136.8812,
    phone: '052-452-6680',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['名古屋朝食發源地', 'ESCA地下街直通', '新幹線口步行1分'],
    notes: '名古屋站太閤通口 ESCA 地下街內，最道地的名古屋元祖朝食體驗。'
  },
  {
    code: 'komeda-osaka-namba',
    brand: '客美多咖啡',
    name: '客美多咖啡 難波千日前店',
    nameJa: 'コメダ珈琲店 なんば千日前店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区難波千日前15-12',
    lat: 34.6658,
    lng: 135.5032,
    phone: '06-6630-8015',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['買飲料送早餐 (朝食)', '南海難波站步行3分', '黑門市場周邊'],
    notes: '逛黑門市場前先來一份香烤厚片吐司早晨能量。'
  },

  // --- 一蘭拉麵 Ichiran (天然豚骨拉麵、個人味集中隔間) ---
  {
    code: 'ichiran-shinjuku-east',
    brand: '一蘭拉麵',
    name: '一蘭拉麵 新宿中央東口店',
    nameJa: '一蘭 新宿中央東口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿3-34-11 B1F',
    lat: 35.6905,
    lng: 139.7022,
    phone: '050-1808-2545',
    is24Hours: true,
    url: 'https://ichiran.com/',
    tags: ['天然豚骨拉麵', '個人味集中座位', '24小時營業', '新宿站步行2分'],
    notes: '新宿東口徒步 2 分鐘，全天 24 小時營業，個人味集中座位客製濃郁湯頭。'
  },
  {
    code: 'ichiran-dotonbori-main',
    brand: '一蘭拉麵',
    name: '一蘭拉麵 道頓堀本館',
    nameJa: '一蘭 道頓堀店本館',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区宗右衛門町7-18 1F',
    lat: 34.6688,
    lng: 135.5035,
    phone: '050-1808-2549',
    is24Hours: true,
    url: 'https://ichiran.com/',
    tags: ['道頓堀運河旁', '24小時營業', '排隊朝聖地標'],
    notes: '緊鄰道頓堀運河，大阪自由行最著名拉麵排隊名店，24 小時供餐。'
  },
  {
    code: 'ichiran-fukuoka-tenjin-nishi',
    brand: '一蘭拉麵',
    name: '一蘭拉麵 福岡天神西通店',
    nameJa: '一蘭 天神西通り店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市中央区大名2-1-57',
    lat: 33.5878,
    lng: 130.3955,
    phone: '050-1808-2558',
    is24Hours: false,
    url: 'https://ichiran.com/',
    tags: ['限定方碗釜汁豚骨', '福岡天神限定', '深夜營業至02:00'],
    notes: '全日本極少數提供「方形特製重箱」釜汁拉麵的一蘭旗艦分店。'
  }
];

/**
 * 車站周邊 500m 篩選演算法 (Proximity Filter)
 * @param {Array<object>} stores 門市清單
 * @param {Array<object>} stationsList 車站索引清單
 * @param {number} [maxRadiusMeters=500] 距離車站最大公尺數
 * @returns {Array<object>} 距離車站 <= maxRadiusMeters 之門市
 */
export function filterStoresWithinStationRadius(stores, stationsList = [], maxRadiusMeters = 500) {
  if (!Array.isArray(stores)) return [];
  if (!Array.isArray(stationsList) || stationsList.length === 0) return stores;

  const filtered = [];

  for (const s of stores) {
    const lat = Number(s.lat);
    const lng = Number(s.lng);

    const match = findNearestStation(lat, lng, stationsList, maxRadiusMeters);

    // 嚴格檢驗：僅保留距離最近車站 <= maxRadiusMeters 之門市
    if (match.station && match.distanceMeters <= maxRadiusMeters) {
      filtered.push({
        ...s,
        nearestStation: match.station.name,
        stationLine: match.station.lines?.[0] || 'JR / 地鐵',
        stationDistanceMeters: match.distanceMeters,
        walkMinutes: match.walkMinutes,
        stationAccess: match.note
      });
    }
  }

  return filtered;
}

/**
 * 建置標準化平價美食門市資料集（套用 500m 車站半徑演算法）
 * @param {Array<object>} [rawList=DINING_STORES_SEED] 
 * @param {Array<object>} [stationsList=[]] 
 * @param {number} [maxRadiusMeters=500] 
 * @returns {Array<object>}
 */
export function buildDiningSpots(rawList = DINING_STORES_SEED, stationsList = [], maxRadiusMeters = 500) {
  // 1. 車站 500 公尺過濾
  const nearStores = filterStoresWithinStationRadius(rawList, stationsList, maxRadiusMeters);

  const result = [];
  for (const s of nearStores) {
    const lat = Number(s.lat);
    const lng = Number(s.lng);
    const id = s.id || `dining-${s.code || Math.random().toString(36).slice(2, 8)}`;

    const tags = Array.isArray(s.tags) ? [...s.tags] : (typeof s.tags === 'string' ? s.tags.split(',').map(t => t.trim()) : []);

    if (s.is24Hours && !tags.includes('24小時營業')) {
      tags.unshift('24小時營業');
    }
    if (s.walkMinutes <= 3 && !tags.includes('車站步行3分內')) {
      tags.push('車站步行3分內');
    }

    const bookingUrl = s.url || s.bookingUrl || 'https://www.google.com/';
    const imageUrl = s.imageUrl || 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80';

    result.push({
      id,
      category: '美食餐廳',
      brand: s.brand,
      name: s.name,
      nameJa: s.nameJa || s.name,
      region: s.region,
      prefecture: s.prefecture,
      nearestStation: s.nearestStation || '鄰近車站',
      stationLine: s.stationLine || 'JR / 地鐵',
      stationAccess: s.stationAccess || `步行約 ${s.walkMinutes || 3} 分鐘`,
      walkMinutes: s.walkMinutes || 3,
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
      notes: s.notes || '日本知名連鎖平價美食餐廳，鄰近車站，平價美味。'
    });
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(result);
  const validation = validateSpotsBatch(uniqueSpots);
  console.log(`[Dining Scraper] 建置完成: 共 ${uniqueSpots.length} 間 (500m 車站周邊篩選)，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);

  return uniqueSpots;
}

export function saveDiningSeed(stationsList = [], outDir = 'src/data') {
  const spots = buildDiningSpots(DINING_STORES_SEED, stationsList, 500);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const targetPath = path.join(outDir, 'dining_seed.json');
  fs.writeFileSync(targetPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[Dining] 成功儲存 ${spots.length} 筆美食餐廳門市至 ${targetPath}`);
  return spots;
}
