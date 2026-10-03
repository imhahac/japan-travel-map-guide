/**
 * =========================================================================
 * 日本全國門市總體爬蟲管線 (Nationwide Master Crawler Pipeline)
 * =========================================================================
 * 統籌執行 9 大指標性日本餐飲與購物連鎖品牌爬蟲：
 * 1. Bic Camera (ビックカメラ)
 * 2. すき家 (Sukiya / Zensho API)
 * 3. 松屋 (Matsuya / Navitime Citrus API)
 * 4. 壽司郎 (Sushiro / Akindo Sushiro Search & Details)
 * 5. 藏壽司 (Kura Sushi / Data-store & Geo)
 * 6. はま寿司 (Hama Sushi / Zensho API)
 * 7. やよい軒 (Yayoiken / Mapion LBS API)
 * 8. 大戶屋 (Ootoya / Canly API)
 * 9. 客美多咖啡 (Komeda's Coffee / Komeda Official REST API)
 *
 * 具備斷點續爬、分頁重試、站點配對、國土範圍驗證與自動更新 `spots.json`。
 */

import fs from 'fs';
import path from 'path';
import { crawlSukiya } from './crawl_sukiya.js';
import { crawlHamaSushi } from './crawl_hama.js';
import { crawlMatsuya } from './crawl_matsuya.js';
import { crawlSushiro } from './crawl_sushiro.js';
import { crawlKuraSushi } from './crawl_kura.js';
import { crawlOotoya } from './crawl_ootoya.js';
import { crawlKomeda } from './crawl_komeda.js';
import { crawlYayoiken } from './crawl_yayoiken.js';
import { crawlBicCamera } from './crawl_bic_camera.js';
import { crawlSaizeriya } from './crawl_saizeriya.js';
import { crawlShakeShack } from './crawl_shakeshack.js';
import { deduplicateSpots } from '../core/dedupe.js';
import { validateSpotsBatch } from '../core/validator.js';

export async function runNationwidePipeline(options = {}) {
  const {
    brands = ['bic_camera', 'sukiya', 'matsuya', 'sushiro', 'kura', 'hama', 'yayoiken', 'ootoya', 'komeda', 'saizeriya', 'shakeshack'],
    outDir = 'src/data',
    fresh = false,
    verbose = true
  } = options;

  console.log('================================================================');
  console.log('🇯🇵 日本全國門市官方爬蟲數據管線 (Real Nationwide Pipeline)');
  console.log(`執行品牌: ${brands.join(', ')} (重新抓取: ${fresh ? '是' : '否'})`);
  console.log('================================================================');

  const stationsPath = path.resolve(outDir, 'stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];

  const results = {
    bicCamera: [],
    sukiya: [],
    matsuya: [],
    sushiro: [],
    kura: [],
    hama: [],
    yayoiken: [],
    ootoya: [],
    komeda: [],
    saizeriya: [],
    shakeshack: []
  };

  const getSeedOrFetch = async (brandKey, fileName, crawlerFn, crawlerOpts = {}) => {
    const seedPath = path.resolve(outDir, fileName);
    if (!fresh && fs.existsSync(seedPath)) {
      try {
        const loaded = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        if (Array.isArray(loaded) && loaded.length > 0) {
          if (verbose) console.log(`📦 [${fileName}] 載入既有抓取種子 (${loaded.length} 間門市)`);
          return loaded;
        }
      } catch (_) {}
    }
    const scraped = await crawlerFn(stations, { verbose, ...crawlerOpts });
    fs.writeFileSync(seedPath, JSON.stringify(scraped, null, 2), 'utf8');
    return scraped;
  };

  // 1. Bic Camera
  if (brands.includes('bic_camera')) {
    results.bicCamera = await getSeedOrFetch('bic_camera', 'bic_camera_seed.json', crawlBicCamera);
  }

  // 2. すき家 (Sukiya)
  if (brands.includes('sukiya')) {
    try {
      results.sukiya = await getSeedOrFetch('sukiya', 'sukiya_seed.json', crawlSukiya);
    } catch (err) {
      console.error('❌ [すき家] 抓取異常:', err.message);
    }
  }

  // 3. はま寿司 (Hama Sushi)
  if (brands.includes('hama')) {
    try {
      results.hama = await getSeedOrFetch('hama', 'hama_seed.json', crawlHamaSushi);
    } catch (err) {
      console.error('❌ [はま寿司] 抓取異常:', err.message);
    }
  }

  // 4. 松屋 (Matsuya)
  if (brands.includes('matsuya')) {
    try {
      results.matsuya = await getSeedOrFetch('matsuya', 'matsuya_seed.json', crawlMatsuya);
    } catch (err) {
      console.error('❌ [松屋] 抓取異常:', err.message);
    }
  }

  // 5. 大戶屋 (Ootoya)
  if (brands.includes('ootoya')) {
    try {
      results.ootoya = await getSeedOrFetch('ootoya', 'ootoya_seed.json', crawlOotoya);
    } catch (err) {
      console.error('❌ [大戶屋] 抓取異常:', err.message);
    }
  }

  // 6. 客美多咖啡 (Komeda)
  if (brands.includes('komeda')) {
    try {
      results.komeda = await getSeedOrFetch('komeda', 'komeda_seed.json', crawlKomeda, { maxDetailFetch: 1200 });
    } catch (err) {
      console.error('❌ [客美多咖啡] 抓取異常:', err.message);
    }
  }

  // 7. 壽司郎 (Sushiro)
  if (brands.includes('sushiro')) {
    try {
      results.sushiro = await getSeedOrFetch('sushiro', 'sushiro_seed.json', crawlSushiro, { maxDetailFetch: 700 });
    } catch (err) {
      console.error('❌ [壽司郎] 抓取異常:', err.message);
    }
  }

  // 8. 藏壽司 (Kura)
  if (brands.includes('kura')) {
    try {
      results.kura = await getSeedOrFetch('kura', 'kura_seed.json', crawlKuraSushi);
    } catch (err) {
      console.error('❌ [藏壽司] 抓取異常:', err.message);
    }
  }

  // 9. やよい軒 (Yayoiken)
  if (brands.includes('yayoiken')) {
    try {
      results.yayoiken = await getSeedOrFetch('yayoiken', 'yayoiken_seed.json', crawlYayoiken, { maxKencodes: 47 });
    } catch (err) {
      console.error('❌ [やよい軒] 抓取異常:', err.message);
    }
  }

  // 10. 薩莉亞 (Saizeriya)
  if (brands.includes('saizeriya')) {
    try {
      results.saizeriya = await getSeedOrFetch('saizeriya', 'saizeriya_seed.json', crawlSaizeriya);
    } catch (err) {
      console.error('❌ [薩莉亞] 抓取異常:', err.message);
    }
  }

  // 11. Shake Shack (昔客來)
  if (brands.includes('shakeshack')) {
    try {
      results.shakeshack = await getSeedOrFetch('shakeshack', 'shakeshack_seed.json', crawlShakeShack);
    } catch (err) {
      console.error('❌ [Shake Shack] 抓取異常:', err.message);
    }
  }

  // =========================================================================
  // 彙整更新 dining_seed.json
  // =========================================================================
  const diningSeedPath = path.resolve(outDir, 'dining_seed.json');
  let existingDining = [];
  if (fs.existsSync(diningSeedPath)) {
    try {
      existingDining = JSON.parse(fs.readFileSync(diningSeedPath, 'utf8'));
    } catch (_) {}
  }

  // Retain non-target brands (like 一蘭, 一風堂, 吉野家) from existing dining
  const targetBrandNames = ['すき家', '松屋', '壽司郎', '藏壽司', 'はま寿司', 'やよい軒', '大戶屋', '客美多咖啡', '薩莉亞', 'Shake Shack'];
  const retainedDining = existingDining.filter(s => !targetBrandNames.includes(s.brand));

  const newDiningSpots = [
    ...retainedDining,
    ...results.sukiya,
    ...results.matsuya,
    ...results.sushiro,
    ...results.kura,
    ...results.hama,
    ...results.yayoiken,
    ...results.ootoya,
    ...results.komeda,
    ...results.saizeriya,
    ...results.shakeshack
  ];

  const { uniqueSpots: uniqueDining, duplicateCount: diningDups } = deduplicateSpots(newDiningSpots);
  const diningValidation = validateSpotsBatch(uniqueDining);

  fs.writeFileSync(diningSeedPath, JSON.stringify(uniqueDining, null, 2), 'utf8');
  console.log(`\n💾 [Dining] 成功彙整 ${uniqueDining.length} 間餐廳門市至 ${diningSeedPath} (重複過濾: ${diningDups} 筆，驗證通過: ${diningValidation.validCount} 間)`);

  // =========================================================================
  // 彙整更新 shopping_seed.json (Bic Camera)
  // =========================================================================
  const shoppingSeedPath = path.resolve(outDir, 'shopping_seed.json');
  let existingShopping = [];
  if (fs.existsSync(shoppingSeedPath)) {
    try {
      existingShopping = JSON.parse(fs.readFileSync(shoppingSeedPath, 'utf8'));
    } catch (_) {}
  }

  const retainedShopping = existingShopping.filter(s => s.brand !== 'Bic Camera');
  const newShoppingSpots = [...retainedShopping, ...results.bicCamera];
  const { uniqueSpots: uniqueShopping } = deduplicateSpots(newShoppingSpots);

  fs.writeFileSync(shoppingSeedPath, JSON.stringify(uniqueShopping, null, 2), 'utf8');
  console.log(`💾 [Shopping] 成功儲存 ${uniqueShopping.length} 間購物藥妝門市至 ${shoppingSeedPath}`);

  console.log('\n================================================================');
  console.log('📊 全國門市爬蟲數據總結 (Real Data Statistics)');
  console.log(`  1. Bic Camera: ${results.bicCamera.length} 間`);
  console.log(`  2. すき家: ${results.sukiya.length} 間`);
  console.log(`  3. 松屋: ${results.matsuya.length} 間`);
  console.log(`  4. 壽司郎: ${results.sushiro.length} 間`);
  console.log(`  5. 藏壽司: ${results.kura.length} 間`);
  console.log(`  6. はま寿司: ${results.hama.length} 間`);
  console.log(`  7. やよい軒: ${results.yayoiken.length} 間`);
  console.log(`  8. 大戶屋: ${results.ootoya.length} 間`);
  console.log(`  9. 客美多咖啡: ${results.komeda.length} 間`);
  console.log(`  10. 薩莉亞: ${results.saizeriya.length} 間`);
  console.log(`  11. Shake Shack: ${results.shakeshack.length} 間`);
  console.log('================================================================\n');

  return {
    diningCount: uniqueDining.length,
    shoppingCount: uniqueShopping.length,
    results
  };
}

async function run() {
  const args = process.argv.slice(2);
  let brands = ['bic_camera', 'sukiya', 'matsuya', 'sushiro', 'kura', 'hama', 'yayoiken', 'ootoya', 'komeda', 'saizeriya', 'shakeshack'];
  const fresh = args.includes('--fresh');

  const brandArg = args.find(a => a.startsWith('--brand='));
  if (brandArg) {
    brands = [brandArg.split('=')[1].trim()];
  }

  await runNationwidePipeline({ brands, fresh });
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_all_nationwide.js')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
