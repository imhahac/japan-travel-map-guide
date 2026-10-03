/**
 * =========================================================================
 * 地理與車站距離計算核心模組 (Geo Core Module)
 * =========================================================================
 * 提供高精確度 Haversine 距離計算、街區繞道係數校正 (1.25x) 與車站配對演算法。
 */

const EARTH_RADIUS_METERS = 6371000;
const DEFAULT_DETOUR_FACTOR = 1.25; // 日本市區街道繞道係數
const WALKING_SPEED_MPM = 80;       // 日本不動產公定步行速度：80公尺/分鐘

/**
 * 計算兩經緯度座標間的球面直線距離（公尺）
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} 距離（公尺，四捨五入至整數）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * 計算推估步行時間（分鐘），套用市區道路繞道係數
 * @param {number} straightDistanceMeters 直線距離（公尺）
 * @param {number} [detourFactor=1.25] 街道繞道係數
 * @param {number} [speedMpm=80] 步行速度（公尺/分鐘）
 * @returns {number} 步行時間（分鐘，最少1分鐘）
 */
export function calculateWalkingMinutes(straightDistanceMeters, detourFactor = DEFAULT_DETOUR_FACTOR, speedMpm = WALKING_SPEED_MPM) {
  if (!straightDistanceMeters || straightDistanceMeters <= 0) return 1;
  const estimatedStreetDistance = straightDistanceMeters * detourFactor;
  return Math.max(1, Math.ceil(estimatedStreetDistance / speedMpm));
}

/**
 * 從車站列表中找出距離給定座標最近的車站
 * @param {number} lat 景點/飯店緯度
 * @param {number} lng 景點/飯店經度
 * @param {Array<{name: string, lat: number, lng: number, line?: string}>} stations 車站列表
 * @param {number} [maxRadiusMeters=10000] 最大搜尋半徑（公尺）
 * @returns {{station: object|null, distanceMeters: number, walkMinutes: number, isWithin500m: boolean, note: string}}
 */
export function findNearestStation(lat, lng, stations, maxRadiusMeters = 10000) {
  if (!Array.isArray(stations) || stations.length === 0 || lat === undefined || lng === undefined) {
    return {
      station: null,
      distanceMeters: 0,
      walkMinutes: 0,
      isWithin500m: false,
      note: '無車站資料'
    };
  }

  let minDistance = Infinity;
  let nearest = null;

  for (const st of stations) {
    const d = calculateDistance(lat, lng, st.lat, st.lng);
    if (d < minDistance) {
      minDistance = d;
      nearest = st;
    }
  }

  if (!nearest || minDistance > maxRadiusMeters) {
    return {
      station: null,
      nearestCandidate: nearest,
      distanceMeters: minDistance === Infinity ? 0 : minDistance,
      walkMinutes: calculateWalkingMinutes(minDistance),
      isWithin500m: false,
      note: '超出搜尋半徑（建議搭乘大眾交通工具）'
    };
  }

  const walkMin = calculateWalkingMinutes(minDistance);
  return {
    station: nearest,
    distanceMeters: minDistance,
    walkMinutes: walkMin,
    isWithin500m: minDistance <= 500,
    note: minDistance <= 500 ? `步行約 ${walkMin} 分鐘` : `步行約 ${walkMin} 分鐘 (${Math.round(minDistance / 1000 * 10) / 10} 公里)`
  };
}

/**
 * 檢查兩點間是否在特定半徑範圍內
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @param {number} radiusMeters 半徑公尺
 * @returns {boolean}
 */
export function isWithinRadius(lat1, lon1, lat2, lon2, radiusMeters) {
  return calculateDistance(lat1, lon1, lat2, lon2) <= radiusMeters;
}
