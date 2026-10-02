/**
 * =========================================================================
 * Google Sheet 資料同步腳本 (Google Sheet Sync CLI)
 * =========================================================================
 * 支援將東橫 INN、APA 飯店、購物藥妝、美食餐廳、便利商店等種子資料
 * 透過 Google Apps Script (GAS) Webhook 批次同步至 Google 試算表對應分頁。
 * 
 * 使用方式：
 *   node scripts/sync_to_sheet.js <GAS_WEBHOOK_URL> [--target=all|apa|toyoko|shopping|dining|convenience]
 *   node scripts/sync_to_sheet.js <GAS_WEBHOOK_URL> --file=path/to/data.json --sheet=飯店
 * 
 * 亦可預先設定環境變數：
 *   export GAS_WEBHOOK_URL="https://script.google.com/macros/s/AKfycbx.../exec"
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const nonFlagArgs = args.filter(a => !a.startsWith('--'));
const flags = Object.fromEntries(
  args.filter(a => a.startsWith('--')).map(a => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  })
);

const GAS_WEBHOOK_URL = nonFlagArgs[0] || process.env.GAS_WEBHOOK_URL;
const target = flags.target || 'toyoko';
const customFile = flags.file;
const customSheet = flags.sheet || '飯店';

if (!GAS_WEBHOOK_URL) {
  console.log(`
使用說明：
  node scripts/sync_to_sheet.js <YOUR_GAS_WEBHOOK_URL> [--target=all|apa|toyoko|shopping|dining|convenience]
  或是設定環境變數 GAS_WEBHOOK_URL

參數說明：
  --target=apa          同步 APA 飯店至「飯店」分頁
  --target=toyoko       同步東橫 INN 至「飯店」分頁
  --target=shopping     同步購物藥妝至「購物藥妝」分頁
  --target=dining       同步美食餐廳至「美食餐廳」分頁
  --target=convenience  同步便利商店至「便利商店」分頁
  --target=all          依序同步全部資料至各自對應分頁
  --file=<路徑>         指定自訂 JSON 檔案
  --sheet=<分頁名>      指定 Google Sheet 分頁名稱 (預設: 飯店)

範例：
  node scripts/sync_to_sheet.js https://script.google.com/macros/s/AKfycbx.../exec --target=apa
  node scripts/sync_to_sheet.js https://script.google.com/macros/s/AKfycbx.../exec --target=all
`);
  process.exit(1);
}

const TARGET_CONFIGS = {
  apa: [
    { file: 'src/data/apa_seed.json', sheetName: '飯店', label: 'APA 飯店' }
  ],
  toyoko: [
    { file: 'src/data/toyoko_seed.json', sheetName: '飯店', label: '東橫 INN' }
  ],
  shopping: [
    { file: 'src/data/shopping_seed.json', sheetName: '購物藥妝', label: '購物藥妝' }
  ],
  dining: [
    { file: 'src/data/dining_seed.json', sheetName: '美食餐廳', label: '美食餐廳' }
  ],
  convenience: [
    { file: 'src/data/convenience_seed.json', sheetName: '便利商店', label: '便利商店' }
  ],
  all: [
    { file: 'src/data/toyoko_seed.json', sheetName: '飯店', label: '東橫 INN' },
    { file: 'src/data/apa_seed.json', sheetName: '飯店', label: 'APA 飯店' },
    { file: 'src/data/shopping_seed.json', sheetName: '購物藥妝', label: '購物藥妝' },
    { file: 'src/data/dining_seed.json', sheetName: '美食餐廳', label: '美食餐廳' },
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
  console.log(`📡 開始同步 [${label}] (${spots.length} 筆) 至「${sheetName}」分頁...`);
  console.log(`==================================================`);

  const batchSize = 50;
  let successCount = 0;

  for (let i = 0; i < spots.length; i += batchSize) {
    const chunk = spots.slice(i, i + batchSize);
    console.log(`  正在推送第 ${i + 1} ~ ${Math.min(i + batchSize, spots.length)} 筆...`);
    try {
      const res = await fetch(GAS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          sheetName,
          rows: chunk
        })
      });
      const result = await res.json();
      if (result.success) {
        successCount += chunk.length;
        console.log(`  ✅ 成功寫入 ${chunk.length} 筆 (總成功: ${successCount})`);
      } else {
        console.warn(`  ⚠️ GAS 回傳錯誤:`, result.message || result);
      }
    } catch (err) {
      console.error(`  ❌ 推送失敗:`, err.message);
    }
    // 禮貌性延遲 800ms 避免 Google 伺服器頻率限制
    await new Promise(r => setTimeout(r, 800));
  }

  return { success: true, count: successCount, total: spots.length };
}

async function run() {
  console.log('=== Japan Travel Map Guide: Google Sheet 同步工具 ===');
  console.log(`目標網址: ${GAS_WEBHOOK_URL.slice(0, 45)}...`);

  let tasks = [];
  if (customFile) {
    tasks.push({ file: customFile, sheetName: customSheet, label: path.basename(customFile) });
  } else if (TARGET_CONFIGS[target]) {
    tasks = TARGET_CONFIGS[target];
  } else {
    console.error(`未知 target: ${target}。可選值: all, apa, toyoko, shopping, dining, convenience`);
    process.exit(1);
  }

  const results = [];
  for (const t of tasks) {
    const res = await syncDataset(t.file, t.sheetName, t.label);
    results.push({ ...t, ...res });
  }

  console.log('\n==================================================');
  console.log('🎉 同步作業執行完畢！總結報告：');
  results.forEach(r => {
    console.log(`- ${r.label} -> 「${r.sheetName}」: 成功 ${r.count || 0} / ${r.total || 0} 筆`);
  });
  console.log('請打開您的 Google Sheet 查看最新同步資料。');
}

run().catch(console.error);
