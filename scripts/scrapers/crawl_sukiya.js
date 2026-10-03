/**
 * =========================================================================
 * すき家 (Sukiya) 全國門市官方爬蟲腳本
 * =========================================================================
 * 資料來源: https://maps.sukiya.jp/jp/address.html
 * API 端點: POST https://maps.sukiya.jp/api/search
 * 涵蓋全日本 47 都道府縣約 1,950+ 間直營門市，獲取精確經緯度、地址與營業時間。
 */

import fs from 'fs';
import path from 'path';
import { JAPAN_PREFECTURES, fetchWithRetry, formatSpotRecord, detectPrefectureFromAddress } from './crawler_utils.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

export async function crawlSukiya(stationsList = [], options = {}) {
  const { prefectures = JAPAN_PREFECTURES, concurrency = 6, verbose = true } = options;
  if (verbose) console.log(`🚀 [すき家] 開始抓取全國門市 (共 ${prefectures.length} 個都道府縣)...`);

  const allSpots = [];
  const chunkSize = concurrency;

  for (let i = 0; i < prefectures.length; i += chunkSize) {
    const chunk = prefectures.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (pref) => {
      try {
        const body = `address=${encodeURIComponent(pref)}&map=1`;
        const res = await fetchWithRetry('https://maps.sukiya.jp/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body
        }, 3, 10000);

        const data = await res.json();
        const mapdata = data.mapdata || [];
        const html = data.list || '';

        // Extract addresses from HTML list
        const addresses = [];
        const addrRegex = /<dl class="address"><dt>住所：<\/dt><dd>([^<]+)<\/dd><\/dl>/g;
        let m;
        while ((m = addrRegex.exec(html)) !== null) {
          addresses.push(m[1].trim());
        }

        // Extract phone numbers if present
        const phones = [];
        const phoneRegex = /<dl class="tel"><dt>電話番号：<\/dt><dd>([^<]*)<\/dd><\/dl>/g;
        while ((m = phoneRegex.exec(html)) !== null) {
          phones.push(m[1].trim());
        }

        for (let idx = 0; idx < mapdata.length; idx++) {
          const item = mapdata[idx];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lng);
          if (isNaN(lat) || isNaN(lng)) continue;

          const storeName = item.name.replace(/^すき家\s*/, '').trim();
          const fullName = `すき家 ${storeName}`;
          const address = addresses[idx] || `${pref} ${storeName}`;
          const phone = phones[idx] || '';
          const is24Hours = (item.business_hour1 || '').includes('24時間') || (item.business_hour1 || '').includes('24h');
          const detailUrl = item.link ? `https://maps.sukiya.jp${item.link}` : 'https://maps.sukiya.jp/';

          const idMatch = (item.link || '').match(/\/([0-9]+)\.html/);
          const storeId = idMatch ? idMatch[1] : `${idx}`;

          const realPref = detectPrefectureFromAddress(address) || pref;
          const spot = formatSpotRecord({
            id: `dining-sukiya-${storeId}`,
            category: '美食餐廳',
            subcategory: '牛丼',
            brand: 'すき家',
            name: fullName,
            nameJa: fullName,
            prefecture: realPref,
            address,
            lat,
            lng,
            phone,
            bookingUrl: detailUrl,
            is24Hours,
            tags: ['牛丼連鎖', '快速出餐', '朝食定食'],
            notes: `すき家 ${storeName}，營業時間：${item.business_hour1 || '以門市公告為準'}。`
          }, stationsList);

          if (spot) allSpots.push(spot);
        }

        if (verbose) {
          console.log(`  ✓ [${pref}] 成功取得 ${mapdata.length} 間門市`);
        }
      } catch (err) {
        console.error(`  ✗ [${pref}] 抓取失敗:`, err.message);
      }
    }));
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(allSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  if (verbose) {
    console.log(`🎉 [すき家] 抓取完成: 總計 ${uniqueSpots.length} 間門市，重複: ${duplicateCount} 筆，驗證通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

async function run() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  const spots = await crawlSukiya(stations);
  const outPath = path.resolve('src/data/sukiya_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 檔案已儲存至: ${outPath} (${spots.length} 間)`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_sukiya.js')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
