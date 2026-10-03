/**
 * =========================================================================
 * 客美多咖啡 (Komeda's Coffee / コメダ珈琲店) 全國門市官方爬蟲腳本
 * =========================================================================
 * 資料來源: https://www.komeda.co.jp/shop/?brand=1
 * API 端點:
 *   1. 門市總表: GET https://eu.komeda.co.jp/v1/hp/shop?brand_type=1&all=true
 *   2. 門市座標與詳情: GET https://eu.komeda.co.jp/v1/hp/shop/{id}
 * 涵蓋全日本 1,050 間官方直營/加盟門市，獲取精確經緯度、電話、營業時間與 Wi-Fi/插座設施。
 */

import fs from 'fs';
import path from 'path';
import { fetchWithRetry, formatSpotRecord, detectPrefectureFromAddress } from './crawler_utils.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

export async function crawlKomeda(stationsList = [], options = {}) {
  const { maxDetailFetch = 1200, concurrency = 10, verbose = true } = options;
  if (verbose) console.log('🚀 [客美多咖啡] 開始抓取官方全門市列表 (eu.komeda.co.jp API)...');

  const listUrl = 'https://eu.komeda.co.jp/v1/hp/shop?brand_type=1&all=true';
  const res = await fetchWithRetry(listUrl, {}, 3, 15000);
  const json = await res.json();
  const rawItems = json.items || [];

  if (verbose) {
    console.log(`  ✓ 成功自官方 API 獲取 ${rawItems.length} 間客美多咖啡門市清單，開始取得官方經緯度與營業資訊...`);
  }

  const allSpots = [];
  const limitToFetch = Math.min(rawItems.length, maxDetailFetch);
  const chunkSize = concurrency;

  for (let i = 0; i < limitToFetch; i += chunkSize) {
    const chunk = rawItems.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (item) => {
      try {
        const detailUrl = `https://eu.komeda.co.jp/v1/hp/shop/${item.id}`;
        const detailRes = await fetchWithRetry(detailUrl, {}, 2, 8000);
        const detailJson = await detailRes.json();
        const shop = detailJson.shop || {};

        const lat = parseFloat(shop.shop_latitude);
        const lng = parseFloat(shop.shop_longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        // Skip overseas stores if any
        if (lat < 24.0 || lat > 46.0 || lng < 122.0 || lng > 154.0) return;

        const cleanName = (shop.name || item.name || '').replace(/^コメダ珈琲店\s*/, '').trim();
        const fullName = `客美多咖啡 ${cleanName}`;
        const address = shop.address || item.address || '';
        const phone = shop.tel || '';
        const realPref = detectPrefectureFromAddress(address);

        let hours = '';
        if (shop.business_hours_start_time && shop.business_hours_end_time) {
          hours = `${shop.business_hours_start_time.slice(0, 5)} - ${shop.business_hours_end_time.slice(0, 5)}`;
        }

        const tags = ['點飲料送朝食早餐', '名古屋復古喫茶', '特製厚片吐司'];
        if (shop.has_wifi) tags.push('提供Wi-Fi');
        if (shop.has_power_supply) tags.push('提供充電插座');

        const spot = formatSpotRecord({
          id: `dining-komeda-${item.id}`,
          category: '美食餐廳',
          subcategory: '咖啡',
          brand: '客美多咖啡',
          name: fullName,
          nameJa: `コメダ珈琲店 ${cleanName}`,
          prefecture: realPref,
          address,
          lat,
          lng,
          phone,
          bookingUrl: `https://www.komeda.co.jp/shop/detail.html?id=${item.id}`,
          hasWifi: shop.has_wifi,
          hasPower: shop.has_power_supply,
          tags,
          notes: `客美多咖啡 ${cleanName}，營業時間：${hours || '以門市公告為準'}，提供買飲料送早餐服務。`
        }, stationsList);

        if (spot) allSpots.push(spot);
      } catch (err) {
        if (verbose) console.warn(`    ⚠️ 門市 ID ${item.id} 詳情取得失敗:`, err.message);
      }
    }));

    if (verbose && (i + chunkSize) % 100 === 0) {
      console.log(`  ✓ 抓取進度: ${Math.min(i + chunkSize, limitToFetch)} / ${limitToFetch}`);
    }
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(allSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  if (verbose) {
    console.log(`🎉 [客美多咖啡] 抓取完成: 總計 ${uniqueSpots.length} 間門市，重複: ${duplicateCount} 筆，驗證通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

async function run() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  const spots = await crawlKomeda(stations);
  const outPath = path.resolve('src/data/komeda_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 檔案已儲存至: ${outPath} (${spots.length} 間)`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_komeda.js')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
