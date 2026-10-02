/**
 * =========================================================================
 * 景點與商店資料 Schema 格式檢查器 (Data Validator Module)
 * =========================================================================
 * 驗證抓取與匯入之資料是否符合系統規範，防止資料格式缺漏或座標偏離。
 */

export const VALID_CATEGORIES = ['飯店', '購物藥妝', '美食餐廳', '便利商店'];

// 日本國土經緯度邊界盒（含沖繩至北海道）
export const JAPAN_BOUNDS = {
  minLat: 24.0,
  maxLat: 46.0,
  minLng: 122.0,
  maxLng: 154.0
};

/**
 * 驗證單筆景點/門市資料格式
 * @param {object} spot 門市資料物件
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateSpot(spot) {
  const errors = [];

  if (!spot || typeof spot !== 'object') {
    return { isValid: false, errors: ['資料必須是有效的物件'] };
  }

  // 1. 必填欄位檢查
  if (!spot.name || typeof spot.name !== 'string' || !spot.name.trim()) {
    errors.push('名稱 (name) 為必填且不可為空');
  }

  if (!spot.category || !VALID_CATEGORIES.includes(spot.category)) {
    errors.push(`類別 (category) 必須是 [${VALID_CATEGORIES.join(', ')}] 之一，收到: ${spot.category}`);
  }

  if (!spot.brand || typeof spot.brand !== 'string' || !spot.brand.trim()) {
    errors.push('品牌 (brand) 為必填且不可為空');
  }

  if (!spot.address || typeof spot.address !== 'string' || !spot.address.trim()) {
    errors.push('地址 (address) 為必填且不可為空');
  }

  // 2. 經緯度數值與日本邊界驗證
  const lat = Number(spot.lat);
  const lng = Number(spot.lng);

  if (isNaN(lat) || isNaN(lng)) {
    errors.push(`經緯度必須是有效數字，收到 lat: ${spot.lat}, lng: ${spot.lng}`);
  } else {
    if (lat < JAPAN_BOUNDS.minLat || lat > JAPAN_BOUNDS.maxLat) {
      errors.push(`緯度超出日本範圍 (${JAPAN_BOUNDS.minLat} ~ ${JAPAN_BOUNDS.maxLat})，收到: ${lat}`);
    }
    if (lng < JAPAN_BOUNDS.minLng || lng > JAPAN_BOUNDS.maxLng) {
      errors.push(`經度超出日本範圍 (${JAPAN_BOUNDS.minLng} ~ ${JAPAN_BOUNDS.maxLng})，收到: ${lng}`);
    }
  }

  // 3. 步行時間驗證（若有填寫必須 >= 0）
  if (spot.walkMinutes !== undefined && spot.walkMinutes !== null && spot.walkMinutes !== '') {
    const wm = Number(spot.walkMinutes);
    if (isNaN(wm) || wm < 0) {
      errors.push(`步行時間 (walkMinutes) 必須是 >= 0 之數字，收到: ${spot.walkMinutes}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 批次驗證資料集
 * @param {Array<object>} spots 
 * @returns {{validCount: number, invalidCount: number, invalidItems: Array<{item: object, errors: string[]}>}}
 */
export function validateSpotsBatch(spots) {
  if (!Array.isArray(spots)) {
    return { validCount: 0, invalidCount: 0, invalidItems: [] };
  }

  let validCount = 0;
  const invalidItems = [];

  for (const s of spots) {
    const res = validateSpot(s);
    if (res.isValid) {
      validCount++;
    } else {
      invalidItems.push({ item: s, errors: res.errors });
    }
  }

  return {
    validCount,
    invalidCount: invalidItems.length,
    invalidItems
  };
}
