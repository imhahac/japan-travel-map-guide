/**
 * =========================================================================
 * やよい軒 (Yayoiken / 彌生軒) 全國門市官方爬蟲腳本
 * =========================================================================
 * 資料來源: https://store.yayoiken.com/b/yayoiken/
 * 涵蓋全日本 47 都道府縣約 360+ 間彌生軒直營門市，獲取精確經緯度、全地址與電話。
 */

import fs from 'fs';
import path from 'path';
import { JAPAN_PREFECTURES, fetchWithRetry, formatSpotRecord, detectPrefectureFromAddress } from './crawler_utils.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

export async function crawlYayoiken(stationsList = [], options = {}) {
  const { concurrency = 3, maxKencodes = 47, verbose = true } = options;
  if (verbose) console.log('🚀 [やよい軒] 開始抓取官方 47 都道府縣門市清單 (Mapion LBS)...');

  const rawStores = [];
  const kencodes = [];
  for (let i = 1; i <= maxKencodes; i++) {
    kencodes.push(String(i).padStart(2, '0'));
  }

  const chunkSize = concurrency;
  for (let i = 0; i < kencodes.length; i += chunkSize) {
    const chunk = kencodes.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (kencode) => {
      try {
        const url = `https://store.yayoiken.com/b/yayoiken/attr/?t=attr_con&kencode=${kencode}`;
        const res = await fetchWithRetry(url, {}, 2, 8000);
        const html = await res.text();

        const itemRegex = /<li\s+class="result-list-item"[\s\S]*?<a\s+href="\/b\/yayoiken\/info\/([0-9]+)\/"[\s\S]*?<h3\s+class="result-ttl">\s*<span>([^<]+)<\/span>[\s\S]*?<p\s+class="result-address">([^<]+)<\/p>/gi;
        let m;
        while ((m = itemRegex.exec(html)) !== null) {
          rawStores.push({
            id: m[1].trim(),
            name: m[2].trim(),
            address: m[3].trim()
          });
        }
      } catch (err) {
        if (verbose) console.warn(`  ✗ 都道府縣代碼 ${kencode} 抓取失敗:`, err.message);
      }
    }));
  }

  if (verbose) {
    console.log(`  ✓ 成功彙整 ${rawStores.length} 間やよい軒門市，開始擷取精確官方座標...`);
  }

  const allSpots = [];
  const detailChunk = concurrency * 2;

  for (let i = 0; i < rawStores.length; i += detailChunk) {
    const chunk = rawStores.slice(i, i + detailChunk);
    await Promise.all(chunk.map(async (st) => {
      try {
        const detailUrl = `https://store.yayoiken.com/b/yayoiken/info/${st.id}/`;
        const res = await fetchWithRetry(detailUrl, {}, 2, 8000);
        const html = await res.text();

        let lat = null;
        let lng = null;
        let phone = '';

        const latMatch = html.match(/"latitude"\s*:\s*"([0-9\.]+)"/);
        const lngMatch = html.match(/"longitude"\s*:\s*"([0-9\.]+)"/);
        const phoneMatch = html.match(/"tel"\s*:\s*"([0-9\-]+)"/);

        if (latMatch && lngMatch) {
          lat = parseFloat(latMatch[1]);
          lng = parseFloat(lngMatch[1]);
        }
        if (phoneMatch) {
          phone = phoneMatch[1].trim();
        }

        // Fallback: extract schema.org geo
        if (!lat || !lng) {
          const latSchema = html.match(/itemprop="latitude"\s+content="([0-9\.]+)"/);
          const lngSchema = html.match(/itemprop="longitude"\s+content="([0-9\.]+)"/);
          if (latSchema && lngSchema) {
            lat = parseFloat(latSchema[1]);
            lng = parseFloat(lngSchema[1]);
          }
        }

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

        const cleanName = st.name.replace(/^やよい軒\s*/, '').trim();
        const fullName = `やよい軒 ${cleanName}`;
        const realPref = detectPrefectureFromAddress(st.address);

        const spot = formatSpotRecord({
          id: `dining-yayoiken-${st.id}`,
          category: '美食餐廳',
          subcategory: '定食',
          brand: 'やよい軒',
          name: fullName,
          nameJa: fullName,
          prefecture: realPref,
          address: st.address,
          lat,
          lng,
          phone,
          bookingUrl: detailUrl,
          tags: ['平價日式定食', '白飯無限續加', '朝食定食'],
          notes: `やよい軒 ${cleanName}，地址：${st.address}，電話：${phone}，提供無限續飯與多樣定食選擇。`
        }, stationsList);

        if (spot) allSpots.push(spot);
      } catch (err) {
        if (verbose) console.warn(`    ⚠️ 門市 ${st.name} 詳情取得失敗:`, err.message);
      }
    }));

    if (verbose && (i + detailChunk) % 50 === 0) {
      console.log(`  ✓ 座標進度: ${Math.min(i + detailChunk, rawStores.length)} / ${rawStores.length}`);
    }
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(allSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  if (verbose) {
    console.log(`🎉 [やよい軒] 抓取完成: 總計 ${uniqueSpots.length} 間門市，重複: ${duplicateCount} 筆，驗證通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

async function run() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  const spots = await crawlYayoiken(stations);
  const outPath = path.resolve('src/data/yayoiken_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 檔案已儲存至: ${outPath} (${spots.length} 間)`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_yayoiken.js')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
