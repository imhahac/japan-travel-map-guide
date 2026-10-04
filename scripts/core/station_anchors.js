/**
 * =========================================================================
 * 權威車站實體座標主庫 (Station Anchors & Master Directory)
 * =========================================================================
 * 確保日本全國鐵路車站之經緯度座標具備絕對物理真實性，
 * 嚴禁以周邊連鎖店家（如郊區下田、伊東等）之經緯度平均值覆寫車站！
 */

import fs from 'fs';
import path from 'path';
import { calculateDistance } from './geo.js';

// 日本各大關鍵樞紐、新幹線、特急及熱門觀光車站之官方物理精確經緯度 (WGS84)
export const PRECISE_STATION_COORDS = {
  // 靜岡 / 觀光門戶 (重點修復)
  '熱海站': { lat: 35.103645, lng: 139.077795, prefecture: '靜岡縣', region: '東海・甲信越・北陸', line: 'JR東海道新幹線 / 東海道本線 / 伊東線' },
  '三島站': { lat: 35.126588, lng: 138.910904, prefecture: '靜岡縣', region: '東海・甲信越・北陸', line: 'JR東海道新幹線 / 東海道本線' },
  '靜岡站': { lat: 34.971710, lng: 138.389104, prefecture: '靜岡縣', region: '東海・甲信越・北陸', line: 'JR東海道新幹線 / 東海道本線' },
  '濱松站': { lat: 34.703741, lng: 137.734568, prefecture: '靜岡縣', region: '東海・甲信越・北陸', line: 'JR東海道新幹線 / 東海道本線' },
  '掛川站': { lat: 34.769213, lng: 138.014526, prefecture: '靜岡縣', region: '東海・甲信越・北陸', line: 'JR東海道新幹線 / 東海道本線' },
  '伊東站': { lat: 34.975056, lng: 139.092778, prefecture: '靜岡縣', region: '東海・甲信越・北陸', line: 'JR伊東線 / 伊豆急行線' },
  '伊豆急下田站': { lat: 34.679722, lng: 138.944722, prefecture: '靜岡縣', region: '東海・甲信越・北陸', line: '伊豆急行線' },

  // 東京 / 首都圈核心大站
  '東京站': { lat: 35.681236, lng: 139.767125, prefecture: '東京都', region: '關東', line: 'JR山手線 / 新幹線 / 東京地鐵' },
  '新宿站': { lat: 35.689592, lng: 139.700413, prefecture: '東京都', region: '關東', line: 'JR山手線 / 中央線 / 小田急 / 京王' },
  '澀谷站': { lat: 35.658034, lng: 139.701636, prefecture: '東京都', region: '關東', line: 'JR山手線 / 東急 / 東京地鐵' },
  '池袋站': { lat: 35.729756, lng: 139.711075, prefecture: '東京都', region: '關東', line: 'JR山手線 / 東武 / 西武 / 東京地鐵' },
  '品川站': { lat: 35.628471, lng: 139.738760, prefecture: '東京都', region: '關東', line: 'JR東海道新幹線 / 山手線 / 京急' },
  '上野站': { lat: 35.713768, lng: 139.777254, prefecture: '東京都', region: '關東', line: 'JR山手線 / 新幹線 / 東京地鐵' },
  '秋葉原站': { lat: 35.698383, lng: 139.773072, prefecture: '東京都', region: '關東', line: 'JR山手線 / 總武線 / 筑波快線' },
  '大手町站': { lat: 35.686567, lng: 139.763489, prefecture: '東京都', region: '關東', line: '東京地鐵丸之內線 / 東西線 / 千代田線 / 半藏門線 / 三田線' },
  '橫濱站': { lat: 35.465786, lng: 139.622715, prefecture: '神奈川縣', region: '關東', line: 'JR東海道本線 / 京急 / 東急 / 相鐵' },
  '新橫濱站': { lat: 35.507456, lng: 139.617585, prefecture: '神奈川縣', region: '關東', line: 'JR東海道新幹線 / 橫濱線 / 相鐵' },
  '大崎站': { lat: 35.619700, lng: 139.728553, prefecture: '東京都', region: '關東', line: 'JR山手線 / 埼京線 / 湘南新宿線 / 臨海線' },
  '押上站': { lat: 35.710628, lng: 139.813139, prefecture: '東京都', region: '關東', line: '東京地鐵半藏門線 / 都營淺草線 / 東武伊勢崎線 / 京成押上線' },
  '羽田機場第3航廈站': { lat: 35.544722, lng: 139.768611, prefecture: '東京都', region: '關東', line: '京急機場線 / 東京單軌電車' },
  '柏站': { lat: 35.862217, lng: 139.970984, prefecture: '千葉縣', region: '關東', line: 'JR常磐線 / 東武野田線' },
  '千葉站': { lat: 35.613374, lng: 140.113063, prefecture: '千葉縣', region: '關東', line: 'JR總武本線 / 千葉都市單軌' },
  '大宮站': { lat: 35.906322, lng: 139.623992, prefecture: '埼玉縣', region: '關東', line: 'JR東北新幹線 / 京濱東北線 / 埼京線' },
  '登戶站': { lat: 35.620958, lng: 139.570183, prefecture: '神奈川縣', region: '關東', line: 'JR南武線 / 小田急小田原線' },
  '武藏小杉站': { lat: 35.576444, lng: 139.659611, prefecture: '神奈川縣', region: '關東', line: 'JR橫須賀線 / 湘南新宿線 / 南武線 / 東急東橫線 / 目黑線' },
  '海濱幕張站': { lat: 35.648641, lng: 140.042138, prefecture: '千葉縣', region: '關東', line: 'JR京葉線' },
  '幕張豐砂站': { lat: 35.658171, lng: 140.026815, prefecture: '千葉縣', region: '關東', line: 'JR京葉線' },
  '勝鬨站': { lat: 35.659364, lng: 139.776639, prefecture: '東京都', region: '關東', line: '都營地下鐵大江戶線' },
  '勝どき站': { lat: 35.659364, lng: 139.776639, prefecture: '東京都', region: '關東', line: '都營地下鐵大江戶線' },
  '龜戶站': { lat: 35.697472, lng: 139.826722, prefecture: '東京都', region: '關東', line: 'JR總武線 / 東武龜戶線' },
  '西小山站': { lat: 35.615694, lng: 139.700139, prefecture: '東京都', region: '關東', line: '東急目黑線' },
  '大島站': { lat: 35.689889, lng: 139.837833, prefecture: '東京都', region: '關東', line: '都營地下鐵新宿線' },
  '大山站': { lat: 35.748361, lng: 139.702889, prefecture: '東京都', region: '關東', line: '東武東上線' },
  '龜有站': { lat: 35.766722, lng: 139.849194, prefecture: '東京都', region: '關東', line: 'JR常磐線' },
  '小岩站': { lat: 35.733472, lng: 139.882194, prefecture: '東京都', region: '關東', line: 'JR總武線' },
  '西荻窪站': { lat: 35.703806, lng: 139.600111, prefecture: '東京都', region: '關東', line: 'JR中央線 / 總武線' },
  '北浦和站': { lat: 35.872222, lng: 139.646861, prefecture: '埼玉縣', region: '關東', line: 'JR京濱東北線' },
  '武藏浦和站': { lat: 35.845833, lng: 139.648611, prefecture: '埼玉縣', region: '關東', line: 'JR埼京線 / 武藏野線' },
  '市谷站': { lat: 35.691167, lng: 139.736028, prefecture: '東京都', region: '關東', line: 'JR中央總武線 / 東京地下鐵南北線 / 有樂町線 / 都營新宿線' },
  '市ヶ谷站': { lat: 35.691167, lng: 139.736028, prefecture: '東京都', region: '關東', line: 'JR中央總武線 / 東京地下鐵南北線 / 有樂町線 / 都營新宿線' },
  '葛西臨海公園站': { lat: 35.644444, lng: 139.862222, prefecture: '東京都', region: '關東', line: 'JR京葉線' },
  '相模大野站': { lat: 35.531889, lng: 139.438028, prefecture: '神奈川縣', region: '關東', line: '小田急小田原線 / 江之島線' },
  '町田站': { lat: 35.542472, lng: 139.445583, prefecture: '東京都', region: '關東', line: 'JR橫濱線 / 小田急小田原線' },
  '國分寺站': { lat: 35.700139, lng: 139.480389, prefecture: '東京都', region: '關東', line: 'JR中央線 / 西武國分寺線 / 多摩湖線' },
  '南柏站': { lat: 35.844722, lng: 139.953889, prefecture: '千葉縣', region: '關東', line: 'JR常磐線' },
  '川越站': { lat: 35.906944, lng: 139.482778, prefecture: '埼玉縣', region: '關東', line: 'JR川越線 / 東武東上線' },
  '西宮北口站': { lat: 34.745556, lng: 135.358889, prefecture: '兵庫縣', region: '關西', line: '阪急神戶本線 / 今津線' },
  '稻田堤站': { lat: 35.633528, lng: 139.535861, prefecture: '神奈川縣', region: '關東', line: 'JR南武線' },
  '北品川站': { lat: 35.622341, lng: 139.740021, prefecture: '東京都', region: '關東', line: '京急本線' },
  '東大宮站': { lat: 35.948889, lng: 139.639722, prefecture: '埼玉縣', region: '關東', line: 'JR宇都宮線' },
  '本八幡站': { lat: 35.720833, lng: 139.927222, prefecture: '千葉縣', region: '關東', line: 'JR總武線 / 都營新宿線 / 京成電鐵' },
  '新浦安站': { lat: 35.649944, lng: 139.912556, prefecture: '千葉縣', region: '關東', line: 'JR京葉線' },

  // 北海道 / 東北
  '札幌站': { lat: 43.068661, lng: 141.350755, prefecture: '北海道', region: '北海道', line: 'JR函館本線 / 地鐵南北線 / 東豐線' },
  '旭川站': { lat: 43.763462, lng: 142.358245, prefecture: '北海道', region: '北海道', line: 'JR函館本線 / 宗谷本線 / 富良野線' },
  '函館站': { lat: 41.773709, lng: 140.726413, prefecture: '北海道', region: '北海道', line: 'JR函館本線' },
  '青森站': { lat: 40.829871, lng: 140.733472, prefecture: '青森縣', region: '東北', line: 'JR奧羽本線 / 津輕線 / 青之森鐵路' },
  '盛岡站': { lat: 39.701281, lng: 141.136894, prefecture: '岩手縣', region: '東北', line: 'JR東北新幹線 / 東北本線' },
  '仙台站': { lat: 38.260132, lng: 140.882438, prefecture: '宮城縣', region: '東北', line: 'JR東北新幹線 / 東北本線 / 仙台市地下鐵' },
  '秋田站': { lat: 39.716944, lng: 140.129722, prefecture: '秋田縣', region: '東北', line: 'JR秋田新幹線 / 奧羽本線' },
  '山形站': { lat: 38.248333, lng: 140.327500, prefecture: '山形縣', region: '東北', line: 'JR山形新幹線 / 奧羽本線' },
  '郡山站': { lat: 37.398611, lng: 140.388889, prefecture: '福島縣', region: '東北', line: 'JR東北新幹線 / 東北本線 / 磐越西線' },

  // 中部 / 北陸
  '名古屋站': { lat: 35.170915, lng: 136.881537, prefecture: '愛知縣', region: '東海・甲信越・北陸', line: 'JR東海道新幹線 / 東海道本線 / 名鐵 / 近鐵' },
  '金澤站': { lat: 36.578056, lng: 136.647778, prefecture: '石川縣', region: '東海・甲信越・北陸', line: 'JR北陸新幹線 / 北陸本線' },
  '富山站': { lat: 36.701389, lng: 137.213333, prefecture: '富山縣', region: '東海・甲信越・北陸', line: 'JR北陸新幹線 / 愛之風富山鐵道' },
  '長野站': { lat: 36.643056, lng: 138.188611, prefecture: '長野縣', region: '東海・甲信越・北陸', line: 'JR北陸新幹線 / 信越本線 / 長野電鐵' },
  '新潟站': { lat: 37.912222, lng: 139.061667, prefecture: '新潟縣', region: '東海・甲信越・北陸', line: 'JR上越新幹線 / 信越本線 / 白新線' },

  // 關西
  '京都站': { lat: 34.985849, lng: 135.758767, prefecture: '京都府', region: '關西', line: 'JR東海道新幹線 / JR京都線 / 近鐵 / 京都市營地鐵' },
  '大阪站': { lat: 34.702485, lng: 135.495951, prefecture: '大阪府', region: '關西', line: 'JR大阪環狀線 / JR京都線 / 神戶線' },
  '新大阪站': { lat: 34.733479, lng: 135.500276, prefecture: '大阪府', region: '關西', line: 'JR東海道新幹線 / 山陽新幹線 / Osaka Metro 御堂筋線' },
  '難波站': { lat: 34.662947, lng: 135.500808, prefecture: '大阪府', region: '關西', line: '南海電鐵 / 近鐵 / Osaka Metro' },
  '神戶三宮站': { lat: 34.693498, lng: 135.195484, prefecture: '兵庫縣', region: '關西', line: 'JR神戶線 / 阪急 / 阪神 / 神戶市營地鐵' },

  // 中國 / 四國
  '廣島站': { lat: 34.397672, lng: 132.475379, prefecture: '廣島縣', region: '中國', line: 'JR山陽新幹線 / 山陽本線 / 廣島電鐵' },
  '岡山站': { lat: 34.665319, lng: 133.918451, prefecture: '岡山縣', region: '中國', line: 'JR山陽新幹線 / 山陽本線' },
  '高松站': { lat: 34.350833, lng: 134.046944, prefecture: '香川縣', region: '四國', line: 'JR予讚線 / 高德線' },
  '松山站': { lat: 33.840278, lng: 132.751667, prefecture: '愛媛縣', region: '四國', line: 'JR予讚線 / 伊予鐵道' },

  // 九州 / 沖繩
  '博多站': { lat: 33.590184, lng: 130.420675, prefecture: '福岡縣', region: '九州', line: 'JR山陽新幹線 / 九州新幹線 / 鹿兒島本線 / 福岡市地下鐵' },
  '小倉站': { lat: 33.886884, lng: 130.882583, prefecture: '福岡縣', region: '九州', line: 'JR山陽新幹線 / 鹿兒島本線' },
  '熊本站': { lat: 32.789828, lng: 130.688647, prefecture: '熊本縣', region: '九州', line: 'JR九州新幹線 / 鹿兒島本線 / 豐肥本線' },
  '大分站': { lat: 33.232778, lng: 131.606944, prefecture: '大分縣', region: '九州', line: 'JR日豐本線 / 久大本線 / 豐肥本線' },
  '鹿兒島中央站': { lat: 31.583906, lng: 130.541339, prefecture: '鹿兒島縣', region: '九州', line: 'JR九州新幹線 / 鹿兒島本線 / 指宿枕崎線' },
  '那霸機場站': { lat: 26.206497, lng: 127.652187, prefecture: '沖繩縣', region: '沖繩', line: '沖繩都市單軌電車線（Yui Rail）' },
  '縣廳前站': { lat: 26.214444, lng: 127.680000, prefecture: '沖繩縣', region: '沖繩', line: '沖繩都市單軌電車線（Yui Rail）' }
};

// 需徹底排除的無效偽站點（爬蟲缺漏時填寫的假站名）
export const INVALID_STATION_NAMES = new Set([
  '鄰近車站',
  '周邊生活圈',
  '日本各地主要車站',
  '愛知縣主要車站',
  '埼玉縣主要車站',
  '愛媛縣主要車站',
  '沖繩縣主要車站',
  '岩手縣主要車站',
  '徳島縣主要車站',
  '山梨縣主要車站',
  '高知縣主要車站',
  '栃木縣主要車站',
  'Bic Camera 相模大野站店',
  'なんば御堂筋'
]);

/**
 * 建立不可竄改的權威車站主檔字典
 * @param {Array<object>} seedSpots 所有飯店與景點種子資料
 * @returns {Map<string, {name: string, lat: number, lng: number, prefecture: string, region: string, line: string, source: string}>}
 */
export function buildAuthoritativeStationMaster(seedSpots = []) {
  const master = new Map();

  // 1. 先注入精準權威大站
  for (const [name, info] of Object.entries(PRECISE_STATION_COORDS)) {
    master.set(name, {
      name,
      lat: info.lat,
      lng: info.lng,
      prefecture: info.prefecture,
      region: info.region,
      line: info.line,
      source: 'precise_railway'
    });
  }

  // 2. 從東橫 INN 與 APA 提取「站前旗艦門市」作為極高精準度基準點（步行 1~5 分鐘 = 50~350m 內）
  // 篩選出明確以該站為名、步行時間極短的站前飯店
  const candidateHotels = seedSpots.filter(s => {
    if (!s.nearestStation || INVALID_STATION_NAMES.has(s.nearestStation)) return false;
    if (s.category !== '飯店') return false;
    const walkMin = s.walkMinutes || 10;
    return walkMin <= 6;
  });

  // 依步行時間由短至長排序，取最近的站前店
  candidateHotels.sort((a, b) => (a.walkMinutes || 5) - (b.walkMinutes || 5));

  for (const hotel of candidateHotels) {
    const stName = hotel.nearestStation;
    if (master.has(stName)) continue; // 若已有權威座標則保留

    master.set(stName, {
      name: stName,
      lat: hotel.lat,
      lng: hotel.lng,
      prefecture: hotel.prefecture,
      region: hotel.region,
      line: hotel.stationLine || 'JR / 私鐵',
      source: `seed_hotel_${hotel.brand || 'hotel'}`
    });
  }

  // 3. 特殊站名更正對應
  if (master.has('名古屋站') && !master.has('名站')) {
    const ng = master.get('名古屋站');
    master.set('名站', { ...ng, name: '名站' });
  }

  return master;
}
