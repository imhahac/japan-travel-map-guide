/**
 * =========================================================================
 * 薩莉亞 (Saizeriya / サイゼリヤ) 全國門市官方爬蟲腳本
 * =========================================================================
 * 資料來源: https://shop.saizeriya.co.jp/sz_restaurant/
 * API 端點: GET https://shop.saizeriya.co.jp/sz_restaurant/api/proxy2/shop/list?limit=100&offset={offset}
 * 涵蓋全日本約 1,696 間薩莉亞門市，獲取原生高精度經緯度、地址與店名。
 */

import fs from 'fs';
import path from 'path';
import { fetchWithRetry, formatSpotRecord, detectPrefectureFromAddress } from './crawler_utils.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

export async function crawlSaizeriya(stationsList = [], options = {}) {
  const { limit = 100, maxStores = 3000, verbose = true } = options;
  if (verbose) console.log('🚀 [薩莉亞] 開始抓取全日本官方門市 (Navitime Citrus API)...');

  const allSpots = [];
  let offset = 0;
  let total = 0;

  while (offset <= total || total === 0) {
    const url = `https://shop.saizeriya.co.jp/sz_restaurant/api/proxy2/shop/list?limit=${limit}&offset=${offset}`;
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

        // 僅保留日本國土範圍內門市 (排除海外如上海、廣州、台灣、香港等海外分店)
        if (lat < 24.0 || lat > 46.0 || lng < 122.0 || lng > 154.0) continue;

        const address = item.address_name || '';
        const realPref = detectPrefectureFromAddress(address);
        if (realPref === '其他' && !/(都|道|府|県)/.test(address)) continue;

        const rawName = item.name || '';
        const storeName = rawName.replace(/^サイゼリヤ\s*/, '').trim();
        const fullName = `薩莉亞 ${storeName}`;
        const phone = item.phone || '';
        const storeCode = item.code || item.external_code || `${Math.random().toString(36).slice(2, 8)}`;

        const spot = formatSpotRecord({
          id: `dining-saizeriya-${storeCode}`,
          category: '美食餐廳',
          subcategory: '家庭餐廳',
          brand: '薩莉亞',
          name: fullName,
          nameJa: rawName || fullName,
          prefecture: realPref,
          address,
          lat,
          lng,
          phone,
          bookingUrl: `https://shop.saizeriya.co.jp/sz_restaurant/spot/detail?code=${storeCode}`,
          tags: ['義式家庭餐廳', '平價義大利麵', '現烤披薩', '百元紅酒', '米蘭風多利亞'],
          notes: `薩莉亞 (サイゼリヤ) 日本人氣義式家庭餐廳，地址：${address}。`
        }, stationsList);

        if (spot) allSpots.push(spot);
        if (allSpots.length >= maxStores) break;
      }

      if (verbose) console.log(`   [薩莉亞] 已抓取 ${allSpots.length}/${total} 間門市 (Offset: ${offset})...`);
      offset += limit;

      if (allSpots.length >= maxStores || offset >= total) break;
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`❌ [薩莉亞] 抓取異常 (offset=${offset}):`, err.message);
      break;
    }
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(allSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  if (verbose) {
    console.log(`✅ [薩莉亞] 爬取完成！總計: ${uniqueSpots.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

async function runStandalone() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  const spots = await crawlSaizeriya(stations, { limit: 100, verbose: true });

  const outPath = path.resolve('src/data/saizeriya_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 薩莉亞種子資料已寫入 ${outPath} (${spots.length} 筆)`);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_saizeriya.js')) {
  runStandalone().catch(console.error);
}
