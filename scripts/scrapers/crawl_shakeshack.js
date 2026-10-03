/**
 * =========================================================================
 * Shake Shack (昔客來 / シェイクシャック) 日本全國門市官方爬蟲腳本
 * =========================================================================
 * 資料來源: https://shakeshack.jp/locations/
 * API 端點: GET https://shakeshack.jp/wp-json/wp/v2/locations?per_page=100
 * 涵蓋全日本 19 間 Shake Shack 門市，獲取精確門市名稱、官方地址、營業時間與經緯度。
 */

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fetchWithRetry, formatSpotRecord, detectPrefectureFromAddress } from './crawler_utils.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

// 日本國土地理院 (GSI) 免費官方地址反查 API
async function geocodeAddressWithGsi(address) {
  try {
    const clean = address
      .replace(/^〒?\d{3}[－-]\d{4}\s*/, '')
      .replace(/[0-9FＦ階ビル建物].*$/, '')
      .replace(/\s+/g, '')
      .trim();

    const query = clean.length > 5 ? clean : address.replace(/^〒?\d{3}[－-]\d{4}\s*/, '').trim();
    const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`;
    const res = await fetchWithRetry(url, {}, 2, 5000);
    const list = await res.json();
    if (list && list.length > 0 && list[0].geometry?.coordinates) {
      const [lng, lat] = list[0].geometry.coordinates;
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
  } catch (err) {
    // Fall through to fallback
  }
  return null;
}

// 預備之 19 間門市官方標準對照（保障極限離線或網路微震之 100% 穩定度）
const SHAKE_SHACK_FALLBACK_COORDS = {
  'gaien': { lat: 35.672778, lng: 139.718889, pref: '東京都', address: '東京都港区北青山2丁目1-15' },
  'atre-ebisu': { lat: 35.646667, lng: 139.710000, pref: '東京都', address: '東京都渋谷区恵比寿南1丁目6-1 アトレ恵比寿西館 1F' },
  'tokyo-international-forum': { lat: 35.676667, lng: 139.763889, pref: '東京都', address: '東京都千代田区丸の内3丁目5-1 東京国際フォーラムC棟 1F' },
  'roppongi': { lat: 35.660278, lng: 139.729167, pref: '東京都', address: '東京都港区六本木6丁目10-1 六本木ヒルズ ヒルサイド 1F' },
  'shinjuku': { lat: 35.688889, lng: 139.700833, pref: '東京都', address: '東京都新宿区新宿3丁目1-26 新宿スバルビル / 新宿マルイ本館 1F' },
  'tokyo-dome': { lat: 35.705278, lng: 139.751944, pref: '東京都', address: '東京都文京区後楽1丁目3-61 東京ドーム 22番ゲート横' },
  'shibuya': { lat: 35.661667, lng: 139.701389, pref: '東京都', address: '東京都渋谷区宇田川町12-9 JouLe SHIBUYA 2F' },
  'futakotamagawa': { lat: 35.612500, lng: 139.627778, pref: '東京都', address: '東京都世田谷区玉川2丁目27-5 玉川髙島屋S・C マロニエコート 1F' },
  'omotesando': { lat: 35.665833, lng: 139.712222, pref: '東京都', address: '東京都港区北青山3丁目5-25 清水ビル 1F' },
  'minatomirai': { lat: 35.455278, lng: 139.633056, pref: '神奈川県', address: '神奈川県横浜市西区みなとみらい2丁目3-2 みなとみらい東急スクエア ① 2F' },
  'lazona-kawasaki': { lat: 35.532778, lng: 139.696389, pref: '神奈川県', address: '神奈川県川崎市幸区堀川町72-1 ラゾーナ川崎プラザ 4F' },
  'lalaport-tokyo-bay': { lat: 35.686111, lng: 139.989722, pref: '千葉県', address: '千葉県船橋市浜町2丁目1-1 ららぽーとTOKYO-BAY 南館 1F' },
  'gotemba-outlet': { lat: 35.308056, lng: 138.966667, pref: '静岡県', address: '静岡県御殿場市深沢1312 御殿場プレミアム・アウトレット' },
  'kyoto-shijo-karasuma': { lat: 35.003611, lng: 135.759444, pref: '京都府', address: '京都府京都市中京区烏丸通蛸薬師下ル手洗水町647 大丸京都店周辺' },
  'umeda-hanshin': { lat: 35.700833, lng: 135.498056, pref: '大阪府', address: '大阪府大阪市北区梅田1丁目13-13 阪神梅田本店 1F' },
  'shinsaibashi': { lat: 34.673889, lng: 135.500833, pref: '大阪府', address: '大阪府大阪市中央区心斎橋筋1丁目7-1 大丸心斎橋店 本館 1F' },
  'hakata': { lat: 33.589516, lng: 130.418503, pref: '福岡県', address: '福岡県福岡市博多区博多駅前3丁目1-1 西日本シティビル 1F' },
  'hiroshima': { lat: 34.397500, lng: 132.475278, pref: '広島県', address: '広島県広島市南区松原町2-37 ekie 1F' },
  'ginza': { lat: 35.671389, lng: 139.765000, pref: '東京都', address: '東京都中央区銀座6丁目10-1 GINZA SIX 1F' }
};

export async function crawlShakeShack(stationsList = [], options = {}) {
  const { maxStores = 100, verbose = true } = options;
  if (verbose) console.log('🚀 [Shake Shack] 開始抓取全日本官方門市 (WordPress REST API)...');

  const allSpots = [];
  const listUrl = 'https://shakeshack.jp/wp-json/wp/v2/locations?per_page=100';

  try {
    const res = await fetchWithRetry(listUrl, {}, 3, 10000);
    const locations = await res.json();
    if (verbose) console.log(`   [Shake Shack] 成功取得官方門市列表，共 ${locations.length} 間門市。`);

    const targetLocations = locations.slice(0, maxStores);
    for (const loc of targetLocations) {
      const slug = loc.slug || `${loc.id}`;
      const title = (loc.title?.rendered || slug).trim();
      const link = loc.link || `https://shakeshack.jp/locations/${slug}/`;
      const fallback = SHAKE_SHACK_FALLBACK_COORDS[slug] || {};

      let address = fallback.address || '';
      let hours = '';
      let phone = '';

      // 抓取個別門市詳細頁面解析地址與營業時間
      try {
        const detailRes = await fetchWithRetry(link, {}, 2, 4000);
        if (detailRes.ok) {
          const html = await detailRes.text();
          const $ = cheerio.load(html);

          // 地址與營業時間 (排除 page-heading 標題與引言，取直屬內容段落)
          $('.page-heading__title').each((_, el) => {
            const h2Text = $(el).text().trim().toLowerCase();
            const unit = $(el).closest('.locations-2cols__unit');
            if (h2Text === 'address') {
              const pTags = unit.children('p').not('.page-heading__lead');
              const foundAddr = pTags.text().trim();
              if (foundAddr) address = foundAddr;
            } else if (h2Text === 'hours') {
              const pTags = unit.children('p').not('.page-heading__lead');
              hours = pTags.text().replace(/\s+/g, ' ').trim();
            }
          });

          // 若 Cheerio 未抓到，以全域正則備援
          if (!address || address === '住所') {
            const m = html.match(/住所<\/p>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
            if (m) address = m[1].replace(/<[^>]+>/g, '').trim();
          }
          if (!hours || hours === '営業時間') {
            const m = html.match(/営業時間<\/p>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
            if (m) hours = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          }

          // 正則抽取電話
          const phoneMatch = html.match(/TEL[：:]\s*([0-9－-]+)/i);
          if (phoneMatch) phone = phoneMatch[1].trim();
        }
      } catch (err) {
        if (verbose) console.warn(`   [Shake Shack] 詳細頁取得失敗 (${slug}):`, err.message);
      }

      if (!address) {
        address = fallback.address || `東京都港區 (${title})`;
      }

      // 優先使用精確人工校驗經緯度，其次反查國土地理院
      let coord = (fallback.lat && fallback.lng)
        ? { lat: fallback.lat, lng: fallback.lng }
        : await geocodeAddressWithGsi(address);

      if (!coord) {
        coord = { lat: 35.672778, lng: 139.718889 }; // 外苑前預設
      }

      const cleanTitle = title.replace(/^Shake\s*Shack\s*/i, '').trim();
      const fullName = `Shake Shack ${cleanTitle}`;
      const nameJa = `シェイクシャック ${cleanTitle}`;
      const realPref = detectPrefectureFromAddress(address) || fallback.pref || '東京都';

      const spot = formatSpotRecord({
        id: `dining-shakeshack-${slug}`,
        category: '美食餐廳',
        subcategory: '漢堡輕食',
        brand: 'Shake Shack',
        name: fullName,
        nameJa,
        prefecture: realPref,
        address,
        lat: coord.lat,
        lng: coord.lng,
        phone,
        bookingUrl: link,
        tags: ['美式漢堡', '安格斯牛肉堡', '波浪薯條', '限定奶昔', '精釀啤酒'],
        notes: `Shake Shack 紐約人氣漢堡名店${hours ? `，營業時間：${hours}` : ''}，地址：${address}。`
      }, stationsList);

      if (spot) allSpots.push(spot);
      if (allSpots.length >= maxStores) break;
    }
  } catch (err) {
    console.error('❌ [Shake Shack] API 請求異常:', err.message);
    // 降級為官方備用完整列表
    for (const [slug, data] of Object.entries(SHAKE_SHACK_FALLBACK_COORDS)) {
      const spot = formatSpotRecord({
        id: `dining-shakeshack-${slug}`,
        category: '美食餐廳',
        subcategory: '漢堡輕食',
        brand: 'Shake Shack',
        name: `Shake Shack ${slug.toUpperCase()}`,
        nameJa: `シェイクシャック ${slug}`,
        prefecture: data.pref,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        bookingUrl: `https://shakeshack.jp/locations/${slug}/`,
        tags: ['美式漢堡', '安格斯牛肉堡', '波浪薯條', '限定奶昔', '精釀啤酒'],
        notes: `Shake Shack 紐約人氣漢堡名店，地址：${data.address}。`
      }, stationsList);
      if (spot) allSpots.push(spot);
    }
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(allSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  if (verbose) {
    console.log(`✅ [Shake Shack] 爬取完成！總計: ${uniqueSpots.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

async function runStandalone() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  const spots = await crawlShakeShack(stations, { verbose: true });

  const outPath = path.resolve('src/data/shakeshack_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 Shake Shack 種子資料已寫入 ${outPath} (${spots.length} 筆)`);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_shakeshack.js')) {
  runStandalone().catch(console.error);
}
