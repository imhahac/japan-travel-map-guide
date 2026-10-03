/**
 * =========================================================================
 * Bic Camera (ビックカメラ) 全國門市爬蟲與建置模組
 * =========================================================================
 * 資料來源: https://www.biccamera.com/bc/i/shop/shoplist/index.jsp?ref=shopguide
 * 完整收錄 Bic Camera 於全日本各大主要車站出口、觀光購物重鎮與旗艦百貨之 45 間門市，
 * 具備精確經緯度、中文/日文店名、車站出入口直通導引與中文退稅專櫃標籤。
 */

import fs from 'fs';
import path from 'path';
import { BIC_CAMERA_SEED } from './electronics.js';
import { formatSpotRecord } from './crawler_utils.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

export function crawlBicCamera(stationsList = [], options = {}) {
  const { verbose = true } = options;
  if (verbose) console.log('🚀 [Bic Camera] 開始彙整全日本官方直營旗艦店與門市清單...');

  const allSpots = [];

  for (const item of BIC_CAMERA_SEED) {
    const spot = formatSpotRecord({
      id: `shopping-${item.code}`,
      category: '購物藥妝',
      subcategory: '3C家電',
      brand: 'Bic Camera',
      name: item.name,
      nameJa: item.nameJa,
      region: item.region,
      prefecture: item.prefecture,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      phone: item.phone,
      bookingUrl: item.url,
      imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80',
      tags: item.tags || ['免稅 (Tax-Free)', '出示折價券', '大型電器城'],
      notes: item.notes || `Bic Camera 日本大型連鎖家電量販店，地址：${item.address}。`
    }, stationsList);

    if (spot) allSpots.push(spot);
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(allSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  if (verbose) {
    console.log(`🎉 [Bic Camera] 建置完成: 總計 ${uniqueSpots.length} 間門市，重複: ${duplicateCount} 筆，驗證通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

async function run() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  const spots = crawlBicCamera(stations);
  const outPath = path.resolve('src/data/bic_camera_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 檔案已儲存至: ${outPath} (${spots.length} 間)`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_bic_camera.js')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
