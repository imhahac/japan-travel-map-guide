/**
 * =========================================================================
 * 松屋 (Matsuya) 全國門市官方爬蟲腳本
 * =========================================================================
 * 資料來源: https://pkg.navitime.co.jp/matsuyafoods/
 * API 端點: GET https://pkg.navitime.co.jp/matsuyafoods/api/proxy2/shop/list?c_d449=1&limit=100&offset={offset}
 * 涵蓋全日本 1,229 間松屋門市，獲取精確經緯度、地址與電話。
 */

import fs from 'fs';
import path from 'path';
import { fetchWithRetry, formatSpotRecord, detectPrefectureFromAddress } from './crawler_utils.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

export async function crawlMatsuya(stationsList = [], options = {}) {
  const { limit = 100, maxStores = 2000, verbose = true } = options;
  if (verbose) console.log('🚀 [松屋] 開始抓取全日本官方門市 (Navitime Citrus API)...');

  const allSpots = [];
  let offset = 0;
  let total = 0;

  while (offset <= total || total === 0) {
    const url = `https://pkg.navitime.co.jp/matsuyafoods/api/proxy2/shop/list?c_d449=1&limit=${limit}&offset=${offset}`;
    try {
      const res = await fetchWithRetry(url, {}, 3, 10000);
      const json = await res.json();
      total = json.count?.total || 0;
      const items = json.items || [];

      if (items.length === 0) break;

      for (const item of items) {
        const lat = item.coord?.lat;
        const lng = item.coord?.lon;
        if (!lat || !lng) continue;

        const rawName = item.name || '';
        const storeName = rawName.replace(/^松屋\s*/, '').trim();
        const fullName = `松屋 ${storeName}`;
        const address = item.address_name || '';
        const phone = item.phone || '';
        const storeCode = item.code || item.external_code || `${Math.random().toString(36).slice(2, 8)}`;
        const realPref = detectPrefectureFromAddress(address);

        const spot = formatSpotRecord({
          id: `dining-matsuya-${storeCode}`,
          category: '美食餐廳',
          subcategory: '牛丼',
          brand: '松屋',
          name: fullName,
          nameJa: fullName,
          prefecture: realPref,
          address,
          lat,
          lng,
          phone,
          bookingUrl: `https://pkg.navitime.co.jp/matsuyafoods/spot/detail?code=${storeCode}`,
          tags: ['牛丼連鎖', '定食附味噌湯', '票券機點餐'],
          notes: `松屋 ${storeName}，郵遞區號：${item.postal_code || ''}，電話：${phone}。`
        }, stationsList);

        if (spot) allSpots.push(spot);
        if (allSpots.length >= maxStores) break;
      }

      if (verbose) {
        console.log(`  ✓ 抓取進度: ${Math.min(offset + items.length, total)} / ${total} 間`);
      }

      offset += items.length;
      if (allSpots.length >= maxStores || offset >= total) break;
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.error(`  ✗ 偏移量 ${offset} 抓取失敗:`, err.message);
      break;
    }
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(allSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  if (verbose) {
    console.log(`🎉 [松屋] 抓取完成: 總計 ${uniqueSpots.length} 間門市，重複: ${duplicateCount} 筆，驗證通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

async function run() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  const spots = await crawlMatsuya(stations);
  const outPath = path.resolve('src/data/matsuya_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 檔案已儲存至: ${outPath} (${spots.length} 間)`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_matsuya.js')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
