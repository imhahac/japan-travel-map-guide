/**
 * =========================================================================
 * 爬蟲共用工具模組 (Crawler Utilities & Unified Formatter)
 * =========================================================================
 * 提供 47 都道府縣清單、區域判定、網路請求重試、車站配對與標準門市物件格式化。
 */

import { findNearestStation } from '../core/geo.js';
import { validateSpotsBatch } from '../core/validator.js';
import { deduplicateSpots } from '../core/dedupe.js';

export const JAPAN_PREFECTURES = [
  '北海道',
  '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
  '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export function getRegionByPrefecture(pref = '') {
  if (pref.includes('北海道')) return '北海道';
  if (/青森|岩手|宮城|秋田|山形|福島/.test(pref)) return '東北';
  if (/東京|神奈川|埼玉|千葉|茨城|栃木|群馬/.test(pref)) return '關東';
  if (/山梨|長野|新潟|富山|石川|福井|岐阜|静岡|愛知/.test(pref)) return '中部';
  if (/京都|大阪|兵庫|滋賀|奈良|和歌山|三重/.test(pref)) return '關西';
  if (/鳥取|島根|岡山|広島|山口/.test(pref)) return '中國';
  if (/徳島|香川|愛媛|高知/.test(pref)) return '四國';
  if (/福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島/.test(pref)) return '九州';
  if (pref.includes('沖縄')) return '沖繩';
  return '其他';
}

export function detectPrefectureFromAddress(address = '') {
  for (const p of JAPAN_PREFECTURES) {
    if (address.includes(p) || address.startsWith(p.replace(/[県府道]$/, ''))) {
      return p;
    }
  }
  return '其他';
}

export async function fetchWithRetry(url, options = {}, maxRetries = 3, timeoutMs = 8000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          ...(options.headers || {})
        }
      });
      if (res.ok) return res;
      if (res.status === 404) return res; // Do not retry 404
      console.warn(`[fetchWithRetry] HTTP ${res.status} on ${url}, attempt ${attempt}/${maxRetries}`);
    } catch (err) {
      console.warn(`[fetchWithRetry] Network error (${err.message}) on ${url}, attempt ${attempt}/${maxRetries}`);
    }
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 400 * attempt));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

const BRAND_IMAGE_MAP = {
  'すき家': 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
  '松屋': 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
  '吉野家': 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
  '壽司郎': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
  '藏壽司': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
  'はま寿司': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
  'やよい軒': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  '大戶屋': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  '客美多咖啡': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
  'Bic Camera': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80',
  'Shake Shack': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  '薩莉亞': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  '六厘舎': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  '舎鈴': 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
  'しゃぶ葉': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
  'Wendy\'s First Kitchen': 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
  'ねぎし': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
};

export function formatSpotRecord(raw, stationsList = []) {
  const lat = typeof raw.lat === 'number' ? raw.lat : parseFloat(raw.lat);
  const lng = typeof raw.lng === 'number' ? raw.lng : parseFloat(raw.lng);

  if (isNaN(lat) || isNaN(lng)) return null;

  // Station Matching
  let nearestStation = raw.nearestStation || '鄰近車站';
  let stationLine = raw.stationLine || '';
  let walkMin = typeof raw.walkMinutes === 'number' ? raw.walkMinutes : 5;

  if (stationsList && stationsList.length > 0) {
    const match = findNearestStation(lat, lng, stationsList, 3000);
    if (match.station) {
      nearestStation = match.station.name;
      walkMin = match.walkMinutes || 3;
      stationLine = match.station.lines?.[0] || 'JR / 地鐵';
    } else if (!raw.nearestStation || raw.nearestStation === '鄰近車站') {
      nearestStation = '周邊生活圈';
      walkMin = 15;
    }
  }

  const prefecture = raw.prefecture || detectPrefectureFromAddress(raw.address);
  const region = raw.region || getRegionByPrefecture(prefecture);

  let tags = [];
  if (Array.isArray(raw.tags)) tags = [...raw.tags];
  else if (typeof raw.tags === 'string') tags = raw.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);

  if (raw.is24Hours && !tags.includes('24小時營業')) tags.unshift('24小時營業');
  if (walkMin <= 3 && !tags.includes('車站步行3分內')) tags.push('車站步行3分內');
  if (raw.hasWifi && !tags.includes('提供Wi-Fi')) tags.push('提供Wi-Fi');
  if (raw.hasPower && !tags.includes('提供充電插座')) tags.push('提供充電插座');

  const imageUrl = raw.imageUrl || BRAND_IMAGE_MAP[raw.brand] || 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80';

  const cleanId = raw.id.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

  return {
    id: cleanId,
    category: raw.category || '美食餐廳',
    subcategory: raw.subcategory || '平價美食',
    brand: raw.brand,
    name: raw.name,
    nameJa: raw.nameJa || raw.name,
    region,
    prefecture,
    nearestStation,
    stationLine,
    stationAccess: raw.stationAccess || `鄰近 ${nearestStation} 步行約 ${walkMin} 分鐘`,
    walkMinutes: walkMin,
    address: raw.address,
    coordinates: `${lat}, ${lng}`,
    lat,
    lng,
    phone: raw.phone || '',
    googleMapUrl: (() => {
      if (raw.googleMapUrl && !/^https?:\/\/(www\.)?google\.com\/maps\/search\/\?api=1&query=[0-9.-]+,[0-9.-]+$/i.test(raw.googleMapUrl)) {
        return raw.googleMapUrl;
      }
      const cleanAddr = (raw.address || '').replace(/〒?\s*\d{3}[-－]?\d{4}\s*/g, '').trim();
      const q = raw.name && cleanAddr ? `${raw.nameJa || raw.name} ${cleanAddr}` : (raw.name || cleanAddr || `${lat},${lng}`);
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q.replace(/[\u3000\s]+/g, ' ').trim())}`;
    })(),
    imageUrl,
    images: [imageUrl],
    tags: tags.join(', '),
    notes: raw.notes || `${raw.brand} 日本全國連鎖門市，地址：${raw.address}。`
  };
}
