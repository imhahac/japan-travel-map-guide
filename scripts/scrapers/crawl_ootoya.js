/**
 * =========================================================================
 * 大戶屋 (Ootoya / 大戸屋ごはん処) 全國門市官方爬蟲腳本
 * =========================================================================
 * 資料來源: https://store.ootoya.com/
 * API 端點: GET https://g9ey9rioe.api.hp.can-ly.com/v2/companies/522/shops/search
 * 涵蓋全日本 459 間大戶屋門市，單次查詢即可取得官方權威經緯度、全地址與電話。
 */

import fs from 'fs';
import path from 'path';
import { fetchWithRetry, formatSpotRecord, detectPrefectureFromAddress } from './crawler_utils.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

export async function crawlOotoya(stationsList = [], options = {}) {
  const { verbose = true } = options;
  if (verbose) console.log('🚀 [大戶屋] 開始抓取官方全日本門市 (Canly API)...');

  const apiUrl = 'https://g9ey9rioe.api.hp.can-ly.com/v2/companies/522/shops/search';
  const res = await fetchWithRetry(apiUrl, {}, 3, 15000);
  const json = await res.json();
  const rawShops = json.shops || [];

  if (verbose) {
    console.log(`  ✓ 成功自官方 API 獲取 ${rawShops.length} 間大戶屋門市資料`);
  }

  const allSpots = [];

  for (const shop of rawShops) {
    const lat = parseFloat(shop.latitude);
    const lng = parseFloat(shop.longitude);
    if (isNaN(lat) || isNaN(lng)) continue;

    // Filter out overseas branches (Taiwan, Thailand, USA, etc.)
    if (lat < 24.0 || lat > 46.0 || lng < 122.0 || lng > 154.0) continue;

    const rawName = shop.nameKanji || shop.storeName || '';
    const cleanStoreName = rawName.replace(/^大戸屋\s*(ごはん処)?/, '').trim();
    const fullName = `大戶屋 ${cleanStoreName}`;
    const address = (shop.address || '').trim();
    const phone = shop.phoneNumber || '';
    const storeCode = shop.storeCode || shop.storeId || `${shop.id}`;
    const realPref = detectPrefectureFromAddress(address);

    let hoursDesc = '';
    if (Array.isArray(shop.businessHours) && shop.businessHours.length > 0) {
      const first = shop.businessHours[0];
      if (first.openTime && first.closeTime) {
        hoursDesc = `${first.openTime.slice(0, 5)} - ${first.closeTime.slice(0, 5)}`;
      }
    }

    const spot = formatSpotRecord({
      id: `dining-ootoya-${storeCode}`,
      category: '美食餐廳',
      subcategory: '定食',
      brand: '大戶屋',
      name: fullName,
      nameJa: `大戸屋 ${cleanStoreName}`,
      prefecture: realPref,
      address,
      lat,
      lng,
      phone,
      bookingUrl: `https://store.ootoya.com/detail/${storeCode}`,
      tags: ['日式定食', '現點現做', '黑醋醬汁招牌'],
      notes: `大戶屋 ${cleanStoreName}，地址：${address}，電話：${phone}，營業時間：${hoursDesc || '以門市公告為準'}。`
    }, stationsList);

    if (spot) allSpots.push(spot);
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(allSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  if (verbose) {
    console.log(`🎉 [大戶屋] 抓取完成: 總計 ${uniqueSpots.length} 間門市，重複: ${duplicateCount} 筆，驗證通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

async function run() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  const spots = await crawlOotoya(stations);
  const outPath = path.resolve('src/data/ootoya_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 檔案已儲存至: ${outPath} (${spots.length} 間)`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_ootoya.js')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
