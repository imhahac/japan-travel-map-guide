import fs from 'fs';
import path from 'path';

const GAS_WEBHOOK_URL = process.env.GAS_WEBHOOK_URL || process.argv[2];

if (!GAS_WEBHOOK_URL) {
  console.log(`
使用說明：
  node scripts/sync_to_sheet.js <YOUR_GAS_WEBHOOK_URL>
  或是設定環境變數 GAS_WEBHOOK_URL

範例：
  node scripts/sync_to_sheet.js https://script.google.com/macros/s/AKfycbx.../exec
`);
  process.exit(1);
}

const seedPath = path.resolve('src/data/toyoko_seed.json');
if (!fs.existsSync(seedPath)) {
  console.error('找不到種子資料 src/data/toyoko_seed.json，請先執行 npm run crawl:toyoko');
  process.exit(1);
}

const hotels = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
console.log(`準備將 ${hotels.length} 筆東橫 INN 資料同步至 Google Sheet...`);

async function sync() {
  const batchSize = 50;
  for (let i = 0; i < hotels.length; i += batchSize) {
    const chunk = hotels.slice(i, i + batchSize);
    console.log(`正在推送第 ${i + 1} ~ ${Math.min(i + batchSize, hotels.length)} 筆...`);
    try {
      const res = await fetch(GAS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          sheetName: '飯店',
          rows: chunk
        })
      });
      const result = await res.json();
      console.log('  回應:', result);
    } catch (err) {
      console.error('  推送失敗:', err.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('🎉 全部資料同步完成！請打開 Google Sheet 查看「飯店」分頁。');
}

sync().catch(console.error);
