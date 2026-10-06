/**
 * =========================================================================
 * Google Sheet 資料同步腳本 (Google Sheet Sync CLI)
 * =========================================================================
 * 支援將東橫 INN、APA 飯店、購物藥妝、美食餐廳、便利商店等種子資料
 * 透過 Google Apps Script (GAS) Webhook 批次同步至 Google 試算表對應分頁。
 * 
 * 使用方式：
 *   node scripts/sync_to_sheet.js [--target=all|dining|shopping|apa|toyoko|convenience]
 *   node scripts/sync_to_sheet.js <GAS_WEBHOOK_URL> [--target=all]
 */

import fs from 'fs';
import path from 'path';

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyhYIoTgwWrV32qYipfKavQ8cmNDXhtZsO8G94VZAWodAOMcbUsXoeZ3_dvESUC-UtCyA/exec';

const args = process.argv.slice(2);
const nonFlagArgs = args.filter(a => !a.startsWith('--'));
const flags = Object.fromEntries(
  args.filter(a => a.startsWith('--')).map(a => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  })
);

const GAS_WEBHOOK_URL = nonFlagArgs[0] || process.env.GAS_WEBHOOK_URL || DEFAULT_GAS_URL;
const target = flags.target || 'all';
const customFile = flags.file;
const customSheet = flags.sheet || '飯店';
const customBatchSize = parseInt(flags['batch-size'] || flags.batchSize || '80', 10);

const TARGET_CONFIGS = {
  apa: [
    { file: 'src/data/apa_seed.json', sheetName: '飯店', label: 'APA 飯店' }
  ],
  toyoko: [
    { file: 'src/data/toyoko_seed.json', sheetName: '飯店', label: '東橫 INN' }
  ],
  hotel: [
    { file: 'src/data/toyoko_seed.json', sheetName: '飯店', label: '東橫 INN' },
    { file: 'src/data/apa_seed.json', sheetName: '飯店', label: 'APA 飯店' }
  ],
  uniqlo: [
    { file: 'src/data/uniqlo_seed.json', sheetName: '購物藥妝', label: 'UNIQLO 優衣庫 (788門市)' }
  ],
  muji: [
    { file: 'src/data/muji_seed.json', sheetName: '購物藥妝', label: '無印良品 MUJI (767門市)' }
  ],
  '3coins': [
    { file: 'src/data/3coins_seed.json', sheetName: '購物藥妝', label: '3COINS (390門市)' }
  ],
  loft: [
    { file: 'src/data/loft_seed.json', sheetName: '購物藥妝', label: 'LOFT 生活雜貨 (193門市)' }
  ],
  daiso: [
    { file: 'src/data/daiso_seed.json', sheetName: '購物藥妝', label: '大創百貨 DAISO (1,823門市)' }
  ],
  shopping: [
    { file: 'src/data/shopping_seed.json', sheetName: '購物藥妝', label: '購物藥妝基礎 (Bic Camera/唐吉訶德/松本清)' },
    { file: 'src/data/uniqlo_seed.json', sheetName: '購物藥妝', label: 'UNIQLO 優衣庫 (788門市)' },
    { file: 'src/data/muji_seed.json', sheetName: '購物藥妝', label: '無印良品 MUJI (767門市)' },
    { file: 'src/data/3coins_seed.json', sheetName: '購物藥妝', label: '3COINS (390門市)' },
    { file: 'src/data/loft_seed.json', sheetName: '購物藥妝', label: 'LOFT 生活雜貨 (193門市)' },
    { file: 'src/data/daiso_seed.json', sheetName: '購物藥妝', label: '大創百貨 DAISO (1,823門市)' }
  ],
  matsufuji: [
    { file: 'src/data/matsufuji_seed.json', sheetName: '美食餐廳', label: '六厘舎 / 舎鈴 (83門市)' }
  ],
  syabuyo: [
    { file: 'src/data/syabuyo_seed.json', sheetName: '美食餐廳', label: 'しゃぶ葉 (337門市)' }
  ],
  wendys: [
    { file: 'src/data/wendys_seed.json', sheetName: '美食餐廳', label: 'Wendy\'s First Kitchen (75門市)' }
  ],
  negishi: [
    { file: 'src/data/negishi_seed.json', sheetName: '美食餐廳', label: 'ねぎし (52門市)' }
  ],
  new_brands: [
    { file: 'src/data/muji_seed.json', sheetName: '購物藥妝', label: '無印良品 MUJI (767門市)' },
    { file: 'src/data/3coins_seed.json', sheetName: '購物藥妝', label: '3COINS (390門市)' },
    { file: 'src/data/loft_seed.json', sheetName: '購物藥妝', label: 'LOFT 生活雜貨 (193門市)' },
    { file: 'src/data/daiso_seed.json', sheetName: '購物藥妝', label: '大創百貨 DAISO (1,823門市)' }
  ],
  new_dining: [
    { file: 'src/data/matsufuji_seed.json', sheetName: '美食餐廳', label: '六厘舎 / 舎鈴 (83門市)' },
    { file: 'src/data/syabuyo_seed.json', sheetName: '美食餐廳', label: 'しゃぶ葉 (337門市)' },
    { file: 'src/data/wendys_seed.json', sheetName: '美食餐廳', label: 'Wendy\'s First Kitchen (75門市)' },
    { file: 'src/data/negishi_seed.json', sheetName: '美食餐廳', label: 'ねぎし (52門市)' }
  ],
  dining: [
    { file: 'src/data/dining_seed.json', sheetName: '美食餐廳', label: '美食餐廳 (全國連鎖名店 8,000+門市)' },
    { file: 'src/data/matsufuji_seed.json', sheetName: '美食餐廳', label: '六厘舎 / 舎鈴 (83門市)' },
    { file: 'src/data/syabuyo_seed.json', sheetName: '美食餐廳', label: 'しゃぶ葉 (337門市)' },
    { file: 'src/data/wendys_seed.json', sheetName: '美食餐廳', label: 'Wendy\'s First Kitchen (75門市)' },
    { file: 'src/data/negishi_seed.json', sheetName: '美食餐廳', label: 'ねぎし (52門市)' }
  ],
  convenience: [
    { file: 'src/data/convenience_seed.json', sheetName: '便利商店', label: '便利商店' }
  ],
  all: [
    { file: 'src/data/toyoko_seed.json', sheetName: '飯店', label: '東橫 INN' },
    { file: 'src/data/apa_seed.json', sheetName: '飯店', label: 'APA 飯店' },
    { file: 'src/data/shopping_seed.json', sheetName: '購物藥妝', label: '購物藥妝基礎 (Bic Camera/唐吉訶德/松本清)' },
    { file: 'src/data/uniqlo_seed.json', sheetName: '購物藥妝', label: 'UNIQLO 優衣庫 (788門市)' },
    { file: 'src/data/muji_seed.json', sheetName: '購物藥妝', label: '無印良品 MUJI (767門市)' },
    { file: 'src/data/3coins_seed.json', sheetName: '購物藥妝', label: '3COINS (390門市)' },
    { file: 'src/data/loft_seed.json', sheetName: '購物藥妝', label: 'LOFT 生活雜貨 (193門市)' },
    { file: 'src/data/daiso_seed.json', sheetName: '購物藥妝', label: '大創百貨 DAISO (1,823門市)' },
    { file: 'src/data/dining_seed.json', sheetName: '美食餐廳', label: '美食餐廳 (全國連鎖名店)' },
    { file: 'src/data/matsufuji_seed.json', sheetName: '美食餐廳', label: '六厘舎 / 舎鈴 (83門市)' },
    { file: 'src/data/syabuyo_seed.json', sheetName: '美食餐廳', label: 'しゃぶ葉 (337門市)' },
    { file: 'src/data/wendys_seed.json', sheetName: '美食餐廳', label: 'Wendy\'s First Kitchen (75門市)' },
    { file: 'src/data/negishi_seed.json', sheetName: '美食餐廳', label: 'ねぎし (52門市)' },
    { file: 'src/data/convenience_seed.json', sheetName: '便利商店', label: '便利商店' }
  ]
};

async function syncDataset(filePath, sheetName, label) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ 找不到檔案 ${filePath}，跳過 [${label}] 同步。`);
    return { success: false, count: 0 };
  }

  const spots = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  console.log(`\n==================================================`);
  console.log(`📡 開始同步 [${label}] (共 ${spots.length} 筆) 至 Google Sheet「${sheetName}」分頁...`);
  console.log(`==================================================`);

  const batchSize = isNaN(customBatchSize) ? 80 : customBatchSize;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < spots.length; i += batchSize) {
    const chunk = spots.slice(i, i + batchSize);
    const progress = `${i + 1} ~ ${Math.min(i + batchSize, spots.length)} / ${spots.length}`;

    let attempts = 0;
    let synced = false;

    while (attempts < 3 && !synced) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        const res = await fetch(GAS_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: JSON.stringify({
            action: 'upsert',
            sheetName,
            rows: chunk
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        const text = await res.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch {
          throw new Error(`GAS 回傳非 JSON (HTTP ${res.status}): ${text.slice(0, 120)}`);
        }

        if (result.success) {
          successCount += chunk.length;
          console.log(`  ✅ [${progress}] 成功寫入 ${chunk.length} 筆 (累積成功: ${successCount})`);
          synced = true;
        } else {
          console.warn(`  ⚠️ [${progress}] GAS 回傳非成功 (重試 ${attempts}/3):`, result.message || result);
        }
      } catch (err) {
        console.warn(`  ⚠️ [${progress}] 傳輸異常 (${err.message})，重試中 (${attempts}/3)...`);
        await new Promise(r => setTimeout(r, 1000 * attempts));
      }
    }

    if (!synced) {
      errorCount += chunk.length;
      console.error(`  ❌ [${progress}] 批次推送失敗，跳過此批次`);
    }

    // 禮貌性延遲 500ms 避免 Google Apps Script 執行頻率限制
    await new Promise(r => setTimeout(r, 500));
  }

  return { success: errorCount === 0, count: successCount, total: spots.length };
}

export async function runSync(options = {}) {
  const chosenTarget = options.target || target;
  const webhookUrl = options.url || GAS_WEBHOOK_URL;

  console.log('=== Japan Travel Map Guide: Google Sheet 同步工具 ===');
  console.log(`目標網址: ${webhookUrl.slice(0, 50)}...`);

  let tasks = [];
  if (customFile) {
    tasks.push({ file: customFile, sheetName: customSheet, label: path.basename(customFile) });
  } else if (TARGET_CONFIGS[chosenTarget]) {
    tasks = TARGET_CONFIGS[chosenTarget];
  } else {
    console.error(`未知 target: ${chosenTarget}。可選值: all, dining, shopping, apa, toyoko, convenience`);
    process.exit(1);
  }

  const results = [];
  for (const t of tasks) {
    const res = await syncDataset(t.file, t.sheetName, t.label);
    results.push({ ...t, ...res });
  }

  console.log('\n==================================================');
  console.log('🎉 Google Sheet 同步作業執行完畢！總結報告：');
  results.forEach(r => {
    console.log(`  • ${r.label} -> 「${r.sheetName}」: 成功 ${r.count || 0} / ${r.total || 0} 筆`);
  });
  console.log('==================================================\n');
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('sync_to_sheet.js')) {
  runSync().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
