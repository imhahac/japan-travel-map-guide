/**
 * =========================================================================
 * 店家唯一識別與去重演算法模組 (Deduplication Module)
 * =========================================================================
 * 透過品牌代碼、官方 ID 與 50 公尺鄰近空間檢驗，防止跨來源或重複抓取時產生重複點位。
 */

import { calculateDistance } from './geo.js';

/**
 * 產生景點唯一複合識別鍵
 * @param {object} spot 
 * @returns {string} 唯一識別鍵
 */
export function generateSpotKey(spot) {
  if (spot.id) {
    return String(spot.id).trim().toLowerCase();
  }
  const brand = (spot.brand || 'unknown').trim().toLowerCase().replace(/\s+/g, '');
  const name = (spot.name || '').trim().toLowerCase().replace(/\s+/g, '');
  const lat = Number(spot.lat || 0).toFixed(4);
  const lng = Number(spot.lng || 0).toFixed(4);
  return `${brand}_${name}_${lat}_${lng}`;
}

/**
 * 去除重複門市資料（依官方 ID、或「同品牌且座標相距 50 公尺內」）
 * @param {Array<object>} spots 門市資料陣列
 * @param {number} [proximityThresholdMeters=50] 視為同一門市的距離閾值（公尺）
 * @returns {{uniqueSpots: Array<object>, duplicateCount: number}}
 */
export function deduplicateSpots(spots, proximityThresholdMeters = 50) {
  if (!Array.isArray(spots) || spots.length === 0) {
    return { uniqueSpots: [], duplicateCount: 0 };
  }

  const uniqueSpots = [];
  const seenIds = new Set();
  let duplicateCount = 0;

  for (const spot of spots) {
    // 1. 若有唯一 ID 且已出現過，視為重複
    if (spot.id) {
      const normalizedId = String(spot.id).trim().toLowerCase();
      if (seenIds.has(normalizedId)) {
        duplicateCount++;
        continue;
      }
      seenIds.add(normalizedId);
    }

    // 2. 空間鄰近度去重（同品牌且相距 < proximityThresholdMeters）
    let isSpatialDuplicate = false;
    for (let i = 0; i < uniqueSpots.length; i++) {
      const existing = uniqueSpots[i];
      if (existing.brand === spot.brand) {
        // 若兩者均有地址且地址明確不同，不視為空間重複
        if (spot.address && existing.address && spot.address.trim() !== existing.address.trim()) {
          continue;
        }
        const dist = calculateDistance(existing.lat, existing.lng, spot.lat, spot.lng);
        if (dist <= proximityThresholdMeters) {
          isSpatialDuplicate = true;
          duplicateCount++;
          // 保留資訊更豐富的一方（例如較完整的電話或圖片）
          if (!existing.phone && spot.phone) existing.phone = spot.phone;
          if (!existing.imageUrl && spot.imageUrl) existing.imageUrl = spot.imageUrl;
          if (!existing.bookingUrl && spot.bookingUrl) existing.bookingUrl = spot.bookingUrl;
          break;
        }
      }
    }

    if (!isSpatialDuplicate) {
      uniqueSpots.push({ ...spot });
    }
  }

  return {
    uniqueSpots,
    duplicateCount
  };
}
