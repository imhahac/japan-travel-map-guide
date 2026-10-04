/**
 * =========================================================================
 * 智慧複合層次步行導航與地圖連結工具 (Smart Navigation & Map URL Utilities)
 * =========================================================================
 * 專為赴日旅人打造：告別「純經緯度無名紅圖釘」與「行人道路吸附後巷死胡同」，
 * 採用「官方日文店名 + 日本在地地址」複合層次查詢，直擊 Google 官方 Place 商家卡片
 * 與商場/地下街之專屬行人通道，並支援起點車站聯程步行路線。
 */

/**
 * 文字標準化清理（全形空格、多餘空格壓縮）
 * @param {string} str 
 * @returns {string}
 */
export function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\u3000\s]+/g, ' ')
    .trim();
}

/**
 * 日本地址深度清洗（移除郵政編碼、重複店名綴詞）
 * @param {string} address 原始地址
 * @param {string} [storeName=''] 店家名稱
 * @returns {string}
 */
export function cleanJapaneseAddress(address, storeName = '') {
  if (!address || typeof address !== 'string') return '';

  let clean = address
    // 移除日本郵遞區號 (例: 〒160-0022、160-0022)
    .replace(/〒?\s*\d{3}[-－]?\d{4}\s*/g, '')
    // 統一全形數字與符號
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .trim();

  // 若地址末端重複帶有店名，予以剔除避免搜尋冗贅
  if (storeName && typeof storeName === 'string') {
    const escapedName = storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clean = clean.replace(new RegExp(`\\s*${escapedName}\\s*$`, 'i'), '').trim();
  }

  return normalizeText(clean);
}

/**
 * 產製極致精準之導航查詢字串（四級安全回退防禦架構）
 * @param {object} spot 門市資料物件
 * @returns {string} 精準搜尋字串或座標字串
 */
export function buildNavigationQuery(spot) {
  if (!spot) return '';

  const name = normalizeText(spot.nameJa || spot.name || '');
  const rawAddress = spot.address || '';
  const cleanAddr = cleanJapaneseAddress(rawAddress, name);

  const hasValidStation = spot.nearestStation &&
    spot.nearestStation !== '周邊生活圈' &&
    spot.nearestStation !== '鄰近車站' &&
    !spot.nearestStation.includes('主要車站');

  const station = hasValidStation ? normalizeText(spot.nearestStation) : '';
  const prefecture = normalizeText(spot.prefecture || '');

  // 1. Tier 1 (最高優先)：日文官方店名 + 日本在地詳細地址（命中率最高、行人出入口最精準）
  if (name && cleanAddr && cleanAddr.length >= 4) {
    return `${name} ${cleanAddr}`.trim();
  }

  // 2. Tier 2 (次級防禦)：店名 + 都道府縣 + 最鄰近車站名（地址缺漏時）
  if (name && (prefecture || station)) {
    return `${name} ${prefecture} ${station}`.trim();
  }

  // 3. Tier 3 (一般防禦)：單純門市名稱
  if (name) {
    return name;
  }

  // 4. Tier 4 (極端兜底)：物理坐標浮點數
  if (spot.lat !== undefined && spot.lng !== undefined && !isNaN(spot.lat) && !isNaN(spot.lng)) {
    return `${spot.lat},${spot.lng}`;
  }

  return '';
}

/**
 * 產製起點車站標準搜尋字串
 * @param {object|string} station 車站物件或名稱
 * @returns {string} 結尾帶「駅」之日文標準站名
 */
export function formatStationOrigin(station) {
  if (!station) return '';
  const raw = typeof station === 'string' ? station : (station.nameJa || station.name || '');
  const clean = normalizeText(raw);
  if (!clean) return '';

  if (clean.endsWith('駅')) return clean;
  if (clean.endsWith('站')) return clean.replace(/站$/, '駅');
  return `${clean}駅`;
}

/**
 * 產製極致精準之 Google 地圖步行導航 Universal URL
 * @param {object} spot 門市資料
 * @param {object|string|null} [selectedStation=null] 使用者當前聚焦之車站 (選填)
 * @param {boolean} [forceFromCurrentLocation=false] 是否強制從目前 GPS 出發 (忽略起點車站)
 * @returns {string} 可直接開啟或喚醒 Google Maps App 之 Universal URL
 */
export function buildWalkingNavUrl(spot, selectedStation = null, forceFromCurrentLocation = false) {
  if (!spot) return '#';

  const destQuery = buildNavigationQuery(spot);
  if (!destQuery) return '#';

  const encodedDest = encodeURIComponent(destQuery);
  let url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&travelmode=walking&dir_action=navigate`;

  // 若在「車站生活圈聚焦模式」且非強制使用者當前 GPS，帶入起點車站
  if (selectedStation && !forceFromCurrentLocation) {
    const originStr = formatStationOrigin(selectedStation);
    if (originStr) {
      url += `&origin=${encodeURIComponent(originStr)}`;
    }
  }

  return url;
}

/**
 * 產製精確之 Google 地圖商家搜尋 / 詳情檢視 Universal URL
 * @param {object} spot 門市資料
 * @returns {string}
 */
export function buildGoogleMapSearchUrl(spot) {
  if (!spot) return '#';

  const query = buildNavigationQuery(spot);
  if (!query) return '#';

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
