/**
 * =========================================================================
 * 壽司郎 (Sushiro / スシロー) 全國門市官方爬蟲腳本
 * =========================================================================
 * 資料來源: https://www.akindo-sushiro.co.jp/shop/
 * 涵蓋全日本 670+ 間直營門市，獲取精確經緯度、地址與電話。
 */

import fs from 'fs';
import path from 'path';
import { fetchWithRetry, formatSpotRecord, detectPrefectureFromAddress } from './crawler_utils.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

export async function crawlSushiro(stationsList = [], options = {}) {
  const { maxDetailFetch = 1000, concurrency = 12, verbose = true } = options;
  if (verbose) console.log('🚀 [壽司郎] 開始抓取官方全日本門市清單...');

  const listUrl = 'https://www.akindo-sushiro.co.jp/shop/?keyword=';
  const res = await fetchWithRetry(listUrl, {}, 3, 15000);
  const html = await res.text();

  // Parse store panels
  const storeRegex = /<a\s+href="detail\.php\?id=([0-9]+)"[^>]*class="common-shop-list__panel"[^>]*>([\s\S]*?)<\/a>/gi;
  const rawStores = [];
  let match;

  while ((match = storeRegex.exec(html)) !== null) {
    const storeId = match[1];
    const innerHtml = match[2];

    const nameMatch = innerHtml.match(/class="common-shop-list__name">([^<]+)<\/div>/i);
    const addrMatch = innerHtml.match(/class="common-shop-list__address">([^<]+)<\/div>/i);
    const badgeMatch = innerHtml.match(/class="common-shop-list__badge">([^<]+)<\/div>/i);

    if (nameMatch && addrMatch) {
      rawStores.push({
        id: storeId,
        name: nameMatch[1].trim(),
        address: addrMatch[1].trim(),
        badge: badgeMatch ? badgeMatch[1].trim() : ''
      });
    }
  }

  if (verbose) {
    console.log(`  ✓ 成功解析官方清單共 ${rawStores.length} 間壽司郎門市，開始擷取詳細座標...`);
  }

  const allSpots = [];
  const limitToFetch = Math.min(rawStores.length, maxDetailFetch);
  const chunkSize = concurrency;

  for (let i = 0; i < limitToFetch; i += chunkSize) {
    const chunk = rawStores.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (st) => {
      try {
        const detailUrl = `https://www.akindo-sushiro.co.jp/shop/detail.php?id=${st.id}`;
        const detailRes = await fetchWithRetry(detailUrl, {}, 2, 8000);
        const detailHtml = await detailRes.text();

        // Extract coordinates from query=lat,lng
        let lat = null;
        let lng = null;
        const mapMatch = detailHtml.match(/query=([0-9]+\.[0-9]+),([0-9]+\.[0-9]+)/);
        if (mapMatch) {
          lat = parseFloat(mapMatch[1]);
          lng = parseFloat(mapMatch[2]);
        }

        // Extract phone number
        let phone = '';
        const phoneMatch = detailHtml.match(/id="tel-pc">\s*([0-9\-]+)\s*<\/span>/);
        if (phoneMatch) phone = phoneMatch[1].trim();

        // Extract business hours
        let hours = '';
        const hoursMatch = detailHtml.match(/<th>営業時間<\/th>[\s\S]*?<td>([\s\S]*?)<\/td>/i);
        if (hoursMatch) {
          hours = hoursMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        if (!lat || !lng) {
          // Fallback if detail page coordinate missing: use center of Tokyo or skip
          return;
        }

        const fullName = `壽司郎 ${st.name}`;
        const realPref = detectPrefectureFromAddress(st.address);
        const tags = ['人氣迴轉壽司', '產地直送', '觸控螢幕點餐'];
        if (st.badge) tags.push(st.badge);

        const spot = formatSpotRecord({
          id: `dining-sushiro-${st.id}`,
          category: '美食餐廳',
          subcategory: '壽司',
          brand: '壽司郎',
          name: fullName,
          nameJa: `スシロー ${st.name}`,
          prefecture: realPref,
          address: st.address,
          lat,
          lng,
          phone,
          bookingUrl: detailUrl,
          tags,
          notes: `壽司郎 ${st.name}，地址：${st.address}，電話：${phone}，營業時間：${hours || '以門市公告為準'}。`
        }, stationsList);

        if (spot) allSpots.push(spot);
      } catch (err) {
        if (verbose) console.warn(`    ⚠️ 門市 ${st.name} 詳情取得逾時:`, err.message);
      }
    }));

    if (verbose && (i + chunkSize) % 50 === 0) {
      console.log(`  ✓ 座標進度: ${Math.min(i + chunkSize, limitToFetch)} / ${limitToFetch}`);
    }
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(allSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  if (verbose) {
    console.log(`🎉 [壽司郎] 抓取完成: 總計 ${uniqueSpots.length} 間門市，重複: ${duplicateCount} 筆，驗證通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

async function run() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  const spots = await crawlSushiro(stations);
  const outPath = path.resolve('src/data/sushiro_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 檔案已儲存至: ${outPath} (${spots.length} 間)`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_sushiro.js')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
