/**
 * =========================================================================
 * APA 飯店爬蟲與資料模組 (APA Hotel Scraper & Seed Module)
 * =========================================================================
 * 提供全日本主要連鎖商務飯店 APA Hotel 門市資料、座標、大浴場標籤與最近車站配對。
 */

import fs from 'fs';
import path from 'path';
import { findNearestStation } from '../core/geo.js';
import { validateSpotsBatch } from '../core/validator.js';
import { deduplicateSpots } from '../core/dedupe.js';

// 日本全國高熱門 APA 飯店種子列表（涵蓋東京、大阪、京都、名古屋、福岡、札幌、廣島、金澤等核心樞紐）
export const APA_HOTELS_SEED = [
  // --- 東京首都圈 ---
  {
    code: 'shinjuku-kabukicho-tower',
    name: 'APA飯店〈新宿 歌舞伎町塔〉',
    nameJa: 'アパホテル〈新宿 歌舞伎町タワー〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区歌舞伎町1-20-2',
    lat: 35.6953,
    lng: 139.7018,
    phone: '03-5155-3811',
    urlKey: 'syutoken/tokyo/shinjuku-kabukichotower',
    tags: ['頂樓大浴場', '露天風呂', '車站步行5分內'],
    notes: '28層超高層地標塔樓，頂樓設有人工溫泉展望大浴場與露天風呂。'
  },
  {
    code: 'shinjuku-gyoenmae',
    name: 'APA飯店〈新宿御苑前〉',
    nameJa: 'アパホテル〈新宿御苑前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿2-2-8',
    lat: 35.6888,
    lng: 139.7095,
    phone: '03-5379-5111',
    urlKey: 'syutoken/tokyo/shinjuku-gyoenmae',
    tags: ['大浴場', '車站步行1分內', '新宿商圈'],
    notes: '地下鐵新宿御苑前站 1 號出口步行 1 分鐘，附設大浴場「玄要之湯」。'
  },
  {
    code: 'tokyo-eki-yaesu',
    name: 'APA飯店〈東京站前 八重洲通〉',
    nameJa: 'アパホテル〈八重洲通〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都中央区八丁堀1-4-5',
    lat: 35.6795,
    lng: 139.7758,
    phone: '03-5541-2111',
    urlKey: 'syutoken/tokyo/tokyo-eki-yaesu',
    tags: ['車站步行5分內', '新幹線樞紐'],
    notes: '鄰近東京站八重洲口與八丁堀站，直通成田特急與新幹線。'
  },
  {
    code: 'roppongi-ekimae',
    name: 'APA飯店〈六本木站前〉',
    nameJa: 'アパホテル〈六本木駅前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都港区六本木6-7-8',
    lat: 35.6625,
    lng: 139.7314,
    phone: '03-5413-6811',
    urlKey: 'syutoken/tokyo/roppongi-ekimae',
    tags: ['車站步行1分內', '六本木之丘'],
    notes: '日比谷線/大江戶線六本木站 3 號出口步行 1 分鐘，直達六本木之丘。'
  },
  {
    code: 'ueno-ekimae',
    name: 'APA飯店〈上野站前〉',
    nameJa: 'アパホテル〈上野駅前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区東上野2-18-7',
    lat: 35.7118,
    lng: 139.7785,
    phone: '03-5807-6111',
    urlKey: 'syutoken/tokyo/ueno-ekimae',
    tags: ['頂樓大浴場', '露天風呂', '京成Skyliner直通'],
    notes: '京成上野站直達 Skyliner 直通成田機場 36 分鐘，頂樓附露天大浴場。'
  },
  {
    code: 'asakusa-ekimae',
    name: 'APA飯店〈淺草站前〉',
    nameJa: 'アパホテル〈浅草駅前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区駒形1-12-16',
    lat: 35.7087,
    lng: 139.7963,
    phone: '03-5830-0111',
    urlKey: 'syutoken/tokyo/asakusa-ekimae',
    tags: ['雷門商圈', '晴空塔景觀', '車站步行1分內'],
    notes: '淺草線淺草站 A1 出口步行 1 分鐘，步行至雷門僅需 3 分鐘。'
  },
  {
    code: 'shibuya-dogenzaka',
    name: 'APA飯店〈澀谷道玄坂上〉',
    nameJa: 'アパホテル〈渋谷道玄坂上〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区円山町20-1',
    lat: 35.6568,
    lng: 139.6938,
    phone: '03-6416-7111',
    urlKey: 'syutoken/tokyo/shibuya-dogenzakaueno',
    tags: ['澀谷商圈', '年輕人潮流聚落'],
    notes: 'JR 澀谷站八公口步行約 8 分鐘，道玄坂流行夜生活樞紐。'
  },
  {
    code: 'ikebukuro-ekikitaguchi',
    name: 'APA飯店〈池袋站北口〉',
    nameJa: 'アパホテル〈池袋駅北口〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区池袋2-48-7',
    lat: 35.7335,
    lng: 139.7112,
    phone: '03-5911-8111',
    urlKey: 'syutoken/tokyo/ikebukuro-ekikitaguchi',
    tags: ['池袋商圈', '車站步行4分內'],
    notes: 'JR 池袋站西口（北）步行約 4 分鐘，陽光城與周邊美食林立。'
  },
  {
    code: 'akihabara-eki-denkigaiguchi',
    name: 'APA飯店〈秋葉原站電氣街口〉',
    nameJa: 'アパホテル〈秋葉原駅電気街口〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区外神田3-11-4',
    lat: 35.7008,
    lng: 139.7712,
    phone: '03-5297-6111',
    urlKey: 'syutoken/tokyo/akihabara-eki-denkigaiguchi',
    tags: ['秋葉原電器街', '動漫聖地', '車站步行3分內'],
    notes: '秋葉原電氣街正中央，逛電器動漫回飯店僅需 3 分鐘。'
  },
  {
    code: 'yokohama-bay-tower',
    name: 'APA飯店渡假村〈橫濱港未來灣塔〉',
    nameJa: 'アパホテル＆リゾート〈横浜ベイタワー〉',
    region: '關東',
    prefecture: '神奈川縣',
    address: '神奈川県横浜市中区海岸通5-25-3',
    lat: 35.4526,
    lng: 139.6385,
    phone: '045-226-5111',
    urlKey: 'syutoken/kanagawa/yokohama-bay-tower',
    tags: ['超大型度假飯店', '海景大浴場', '港未來21'],
    notes: '高達 2,311 間客房之日本最大量級度假商旅，擁有港灣夜景與露天大浴場。'
  },

  // --- 近畿關西圈 (大阪 / 京都 / 神戶) ---
  {
    code: 'osaka-namba-ekimae',
    name: 'APA飯店〈難波心齋橋〉',
    nameJa: 'アパホテル〈なんば心斎橋〉',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区西心斎橋2-7-12',
    lat: 34.6698,
    lng: 135.4988,
    phone: '06-6214-0111',
    urlKey: 'kansai/osaka/namba-shinsaibashi',
    tags: ['道頓堀商圈', '心齋橋步行1分', '車站步行4分內'],
    notes: '走出飯店即是心齋橋筋與道頓堀跑跑人地標，美食購物全日本最熱門。'
  },
  {
    code: 'osaka-umeda-eki-tower',
    name: 'APA飯店渡假村〈大阪梅田站塔〉',
    nameJa: 'アパホテル＆リゾート〈大阪梅田駅タワー〉',
    region: '關西',
    prefecture: '大阪府',
    address: '大阪府大阪市北区曾根崎2-8-32',
    lat: 34.7005,
    lng: 135.5012,
    phone: '06-6131-0511',
    urlKey: 'kansai/osaka/osaka-umeda-eki-tower',
    tags: ['展望頂樓泳池', '天然溫泉大浴場', '梅田商圈'],
    notes: '34層超高層塔樓，設有頂樓露天溫泉與梅田全景觀景台。'
  },
  {
    code: 'shin-osaka-ekimae',
    name: 'APA飯店〈新大阪站前〉',
    nameJa: 'アパホテル〈新大阪駅前〉',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市東淀川区東中島1-21-27',
    lat: 34.7335,
    lng: 135.5028,
    phone: '06-6321-4111',
    urlKey: 'kansai/osaka/shin-osaka-ekimae',
    tags: ['新幹線樞紐', '大浴場', '車站步行2分內'],
    notes: 'JR 新大阪站東口步行 2 分鐘，轉乘山陽/東海道新幹線極度便捷。'
  },
  {
    code: 'kyoto-ekimae',
    name: 'APA飯店〈京都站前〉',
    nameJa: 'アパホテル〈京都駅前〉',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区西洞院通塩小路下ル南不動堂町806',
    lat: 34.9862,
    lng: 135.7554,
    phone: '075-365-4111',
    urlKey: 'kansai/kyoto/kyoto-ekimae',
    tags: ['京都站步行3分', '新幹線轉乘', '京都塔周邊'],
    notes: 'JR 京都站烏丸中央口步行 3 分鐘，古都自由行最經典大站據點。'
  },
  {
    code: 'kyoto-gion-kenninji',
    name: 'APA飯店〈京都祇園 EXCELLENT〉',
    nameJa: 'アパホテル〈京都祇園〉EXCELLENT',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市東山区祇園町南側555',
    lat: 35.0035,
    lng: 135.7762,
    phone: '075-551-2111',
    urlKey: 'kansai/kyoto/kyoto-gion',
    tags: ['八坂神社', '祇園花見小路', '頂樓花園'],
    notes: '座落於八坂神社正門口前，步行 2 分鐘即達花見小路。'
  },
  {
    code: 'kobe-sannomiya-ekimae',
    name: 'APA飯店〈神戶三宮站前〉',
    nameJa: 'アパホテル〈神戸三宮駅前〉',
    region: '近畿',
    prefecture: '兵庫縣',
    address: '兵庫県神戸市中央区下山手通2-11-26',
    lat: 34.6932,
    lng: 135.1905,
    phone: '078-335-0811',
    urlKey: 'kansai/hyogo/kobe-sannomiya-ekimae',
    tags: ['神戶三宮商圈', '生田神社旁', '車站步行4分內'],
    notes: '阪急/神戶地鐵三宮站步行 4 分鐘，鄰近生田神社與異人館商圈。'
  },

  // --- 中部東海 (名古屋 / 金澤) ---
  {
    code: 'nagoya-ekimae-shinkansenguchi',
    name: 'APA飯店〈名古屋站新幹線口〉',
    nameJa: 'アパホテル〈名古屋駅新幹線口〉',
    region: '東海・甲信越・北陸',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中村区椿町1-23',
    lat: 35.1702,
    lng: 136.8798,
    phone: '052-459-3111',
    urlKey: 'tokai/aichi/nagoya-eki-shinkansenguchi',
    tags: ['新幹線出口', '大浴場', '車站步行3分內'],
    notes: 'JR 名古屋站太閤通口（新幹線口）步行 3 分鐘，附設大浴場「玄要之湯」。'
  },
  {
    code: 'kanazawa-ekimae',
    name: 'APA飯店〈金澤站前〉',
    nameJa: 'アパホテル〈金沢駅前〉',
    region: '東海・甲信越・北陸',
    prefecture: '石川縣',
    address: '石川県金沢市広岡1-9-28',
    lat: 36.5798,
    lng: 136.6472,
    phone: '076-231-8111',
    urlKey: 'hokuriku/ishikawa/kanazawa-ekimae',
    tags: ['金澤兼六園門戶', '天然溫泉露天浴場', '車站步行1分內'],
    notes: '北陸新幹線金澤站西口徒步 1 分鐘，設有全金澤最完備的露天大浴場與桑拿。'
  },

  // --- 九州 (福岡 / 熊本 / 鹿兒島) ---
  {
    code: 'hakata-ekimae-3chome',
    name: 'APA飯店〈博多站前3丁目〉',
    nameJa: 'アパホテル〈博多駅前3丁目〉',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅前3-11-6',
    lat: 33.5872,
    lng: 130.4175,
    phone: '092-432-8111',
    urlKey: 'kyushu/fukuoka/hakata-ekimae-3chome',
    tags: ['大浴場', '博多拉麵街', '車站步行5分內'],
    notes: 'JR 博多站博多口步行 5 分鐘，轉乘福岡地鐵至福岡機場僅需 5 分鐘。'
  },
  {
    code: 'fukuoka-tenjin-nishi',
    name: 'APA飯店〈福岡天神西〉',
    nameJa: 'アパホテル〈福岡天神西〉',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市中央区大名1-9-38',
    lat: 33.5878,
    lng: 130.3925,
    phone: '092-737-8111',
    urlKey: 'kyushu/fukuoka/fukuoka-tenjin-nishi',
    tags: ['天神購物商圈', '屋台美食街', '車站步行3分內'],
    notes: '地鐵赤坂站步行 3 分鐘，緊鄰天神大名潮流服飾與屋台聚集地。'
  },
  {
    code: 'kumamoto-sakuramachi',
    name: 'APA飯店〈熊本櫻町〉',
    nameJa: 'アパホテル〈熊本桜町バスターミナル南〉',
    region: '九州・沖繩',
    prefecture: '熊本縣',
    address: '熊本県熊本市中央区船場町下1-6-1',
    lat: 32.7985,
    lng: 130.7028,
    phone: '096-324-8111',
    urlKey: 'kyushu/kumamoto/kumamoto-sakuramachi',
    tags: ['熊本城商圈', '櫻町巴士總站旁'],
    notes: '緊鄰櫻町熊本大型商場與巴士總站，直達熊本城與阿蘇觀光。'
  },

  // --- 北海道 (札幌) ---
  {
    code: 'sapporo-susukino-ekimae',
    name: 'APA飯店〈札幌薄野站前〉',
    nameJa: 'アパホテル〈札幌すすきの駅前〉',
    region: '北海道',
    prefecture: '北海道',
    address: '北海道札幌市中央区南4条西2丁目2-5',
    lat: 43.0558,
    lng: 141.3562,
    phone: '011-511-9111',
    urlKey: 'hokkaido/sapporo/susukino-ekimae',
    tags: ['薄野商圈', '地下鐵直通', '狸小路商店街'],
    notes: '地下鐵東豐線豐水薄野站直通，步行 2 分鐘至狸小路商店街與拉麵橫丁。'
  },
  {
    code: 'sapporo-odori-eki-nishi',
    name: 'APA飯店〈札幌大通站前〉',
    nameJa: 'アパホテル〈札幌大通駅前〉',
    region: '北海道',
    prefecture: '北海道',
    address: '北海道札幌市中央区南2条西7丁目10-1',
    lat: 43.0585,
    lng: 141.3468,
    phone: '011-281-8111',
    urlKey: 'hokkaido/sapporo/odori-eki-nishi',
    tags: ['大通公園', '札幌雪祭會場', '大浴場'],
    notes: '鄰近大通公園，冬季札幌雪祭散步即達，附設室內大浴場。'
  },

  // --- 中國 (廣島) ---
  {
    code: 'hiroshima-ekimae-ohashi',
    name: 'APA飯店〈廣島站前大橋〉',
    nameJa: 'アパホテル〈広島駅前大橋〉',
    region: '中國・四國',
    prefecture: '廣島縣',
    address: '廣島県廣島市南区京橋町2-26',
    lat: 34.3948,
    lng: 132.4715,
    phone: '082-568-6111',
    urlKey: 'chushikoku/hiroshima/hiroshima-ekimae-ohashi',
    tags: ['露天溫泉大浴場', '新幹線廣島站步行4分', '廣島和平公園'],
    notes: 'JR 廣島站南口步行 4 分鐘，設有大型露天人造溫泉大浴場。'
  },

  // --- 沖繩 (那霸) ---
  {
    code: 'naha-matsuyama',
    name: 'APA飯店〈那霸松山〉',
    nameJa: 'アパホテル〈那覇松山〉',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市松山1-4-16',
    lat: 26.2185,
    lng: 127.6812,
    phone: '098-868-9111',
    urlKey: 'kyushu/okinawa/naha-matsuyama',
    tags: ['國際通商圈', '大浴場', '單軌電車美榮橋站'],
    notes: '單軌電車美榮橋站步行約 7 分鐘，步行至國際通僅需 8 分鐘，附設人工溫泉大浴場。'
  }
];

/**
 * 產生標準化的 APA 飯店資料集（自動配對最近車站、步行時間與設施標籤）
 * @param {Array<object>} [rawList=APA_HOTELS_SEED] 
 * @param {Array<object>} [stationsList] 
 * @returns {Array<object>}
 */
export function buildApaHotels(rawList = APA_HOTELS_SEED, stationsList = []) {
  const result = [];

  for (const h of rawList) {
    const lat = Number(h.lat);
    const lng = Number(h.lng);
    const id = h.id || `apa-${h.code || Math.random().toString(36).slice(2, 8)}`;

    // 車站配對
    const stationMatch = findNearestStation(lat, lng, stationsList);
    const stationName = stationMatch.station ? stationMatch.station.name : '鄰近車站';
    const walkMin = stationMatch.walkMinutes || 5;

    // 設施與亮點標籤
    let tags = [];
    if (Array.isArray(h.tags)) {
      tags = [...h.tags];
    } else if (typeof h.tags === 'string') {
      tags = h.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (walkMin <= 3 && !tags.includes('車站步行3分內')) {
      tags.push('車站步行3分內');
    }
    if (!tags.includes('全室大型液晶TV')) {
      tags.push('全室大型液晶TV');
    }
    if (!tags.includes('免費高速Wi-Fi')) {
      tags.push('免費高速Wi-Fi');
    }

    const bookingUrl = h.bookingUrl || `https://www.apahotel.com/hotel/${h.urlKey || ''}/`;
    const imageUrl = h.imageUrl || `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80`;

    result.push({
      id,
      category: '飯店',
      brand: 'APA飯店',
      name: h.name,
      nameJa: h.nameJa || h.name,
      region: h.region,
      prefecture: h.prefecture,
      nearestStation: stationName,
      stationLine: stationMatch.station?.lines?.[0] || 'JR / 地鐵',
      stationAccess: stationMatch.note || `鄰近 ${stationName} 步行約 ${walkMin} 分鐘`,
      walkMinutes: walkMin,
      address: h.address,
      coordinates: `${lat}, ${lng}`,
      lat,
      lng,
      phone: h.phone || '',
      bookingUrl,
      googleMapUrl: `https://maps.google.com/?q=${lat},${lng}`,
      imageUrl,
      images: [imageUrl],
      tags: tags.join(', '),
      notes: h.notes || '日本大型連鎖商務飯店，交通便利，設備完善。'
    });
  }

  // 去重與校驗
  const { uniqueSpots, duplicateCount } = deduplicateSpots(result);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`[APA Scraper] 建置完成: 共 ${uniqueSpots.length} 間，去重: ${duplicateCount} 筆，有效驗證通過: ${validation.validCount} 間`);
  return uniqueSpots;
}
