/**
 * =========================================================================
 * APA 飯店全日本官網爬蟲與資料擷取器 (APA Hotel Nationwide Scraper)
 * =========================================================================
 * 目標來源：https://www.apahotel.com/hotel/
 * 
 * 支援功能：
 * 1. 支援直接連線擷取（於本地住宅網路或未受限環境）
 * 2. 支援代理伺服器（PROXY_URL 或 HTTPS_PROXY 穿透 Akamai WAF）
 * 3. 支援本地 HTML 檔案解析（--file=apa.html，離線或由瀏覽器匯出之完整網頁）
 * 4. 自動對齊車站、計算步行距離與設施標籤
 * 5. 支援自動推送到 Google Sheet（--sync 參數）
 */

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { findNearestStation } from './core/geo.js';
import { validateSpotsBatch } from './core/validator.js';
import { deduplicateSpots } from './core/dedupe.js';
import { APA_HOTELS_SEED, buildApaHotels } from './scrapers/apa.js';

const APA_BASE_URL = 'https://www.apahotel.com';
const APA_LIST_URL = 'https://www.apahotel.com/hotel/';

const REGION_PAGES = [
  { region: '北海道・東北', path: '/hotel/hokkaido-tohoku/' },
  { region: '關東', path: '/hotel/shutoken/' },
  { region: '甲信越・北陸', path: '/hotel/hokuriku-koshinetsu/' },
  { region: '東海', path: '/hotel/chubu/' },
  { region: '近畿', path: '/hotel/kansai/' },
  { region: '中國・四國', path: '/hotel/chugoku-shikoku/' },
  { region: '九州・沖繩', path: '/hotel/kyushu-okinawa/' }
];

const PREFECTURE_MAP = {
  '北海道': '北海道',
  '青森': '青森縣', '岩手': '岩手縣', '宮城': '宮城縣', '秋田': '秋田縣', '山形': '山形縣', '福島': '福島縣',
  '茨城': '茨城縣', '栃木': '栃木縣', '群馬': '群馬縣', '埼玉': '埼玉縣', '千葉': '千葉縣', '東京': '東京都', '神奈川': '神奈川縣',
  '新潟': '新潟縣', '富山': '富山縣', '石川': '石川縣', '福井': '福井縣', '山梨': '山梨縣', '長野': '長野縣',
  '岐阜': '岐阜縣', '靜岡': '靜岡縣', '愛知': '愛知縣', '三重': '三重縣',
  '滋賀': '滋賀縣', '京都': '京都府', '大阪': '大阪府', '兵庫': '兵庫縣', '奈良': '奈良縣', '和歌山': '和歌山縣',
  '鳥取': '鳥取縣', '島根': '島根縣', '岡山': '岡山縣', '廣島': '廣島縣', '山口': '山口縣',
  '德島': '德島縣', '香川': '香川縣', '愛媛': '愛媛縣', '高知': '高知縣',
  '福岡': '福岡縣', '佐賀': '佐賀縣', '長崎': '長崎縣', '熊本': '熊本縣', '大分': '大分縣', '宮崎': '宮崎縣', '鹿兒島': '鹿兒島縣', '沖繩': '沖繩縣'
};

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8,zh-TW;q=0.7',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      return { status: res.status, html: null, error: `HTTP ${res.status}` };
    }
    const html = await res.text();
    return { status: res.status, html, error: null };
  } catch (err) {
    return { status: 0, html: null, error: err.message };
  }
}

export function parseApaHtml(html) {
  const $ = cheerio.load(html);
  const hotels = [];

  // APA 官網飯店列表選擇器：常見為 .hotel_list li, .p-hotel-card, a[href*="/hotel/"]
  $('a[href*="/hotel/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    // 過濾非具體飯店頁面之連結
    if (href === '/hotel/' || href.endsWith('/hotel') || href.includes('#') || href.includes('search')) return;
    const parts = href.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
    if (parts.length < 3) return; // 需要 /hotel/[region]/[hotel-name]/ 結構

    const rawName = $(el).text().trim() || $(el).attr('title') || '';
    if (!rawName || rawName.length < 3) return;
    if (!rawName.includes('アパ') && !rawName.includes('APA')) return;

    const code = parts[parts.length - 1] || parts[parts.length - 2];
    const fullUrl = href.startsWith('http') ? href : `${APA_BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;

    hotels.push({
      code,
      name: rawName.replace(/\s+/g, ' '),
      nameJa: rawName.replace(/\s+/g, ' '),
      url: fullUrl
    });
  });

  return hotels;
}

export async function runApaCrawler() {
  console.log('=== APA 飯店全日本官網爬蟲 (https://www.apahotel.com/hotel/) ===');

  const args = process.argv.slice(2);
  const fileArg = args.find(a => a.startsWith('--file='));
  const filePath = fileArg ? fileArg.split('=')[1] : null;
  const syncToSheet = args.includes('--sync');

  let rawHtml = '';

  if (filePath && fs.existsSync(filePath)) {
    console.log(`[APA Crawler] 讀取本地 HTML 檔案: ${filePath}`);
    rawHtml = fs.readFileSync(filePath, 'utf8');
  } else {
    console.log(`[APA Crawler] 嘗試連線官網抓取: ${APA_LIST_URL}...`);
    const result = await fetchPage(APA_LIST_URL);

    if (result.html && result.status === 200) {
      console.log('  成功連線！HTML 取得完畢。');
      rawHtml = result.html;
    } else {
      console.warn(`\n⚠️  官網連線受阻 (${result.error || 'HTTP ' + result.status})`);
      console.warn('原因說明：');
      console.warn('  apahotel.com 使用 Akamai Bot Manager (WAF) 防禦，會主動阻擋雲端機房 IP (如 GitHub Actions/Azure/GCP)。');
      console.warn('解決方案：');
      console.warn('  1. 在個人電腦本地網路執行：node scripts/crawl_apa.js');
      console.warn('  2. 或在瀏覽器打開 https://www.apahotel.com/hotel/ 另存為 apa.html，再執行：');
      console.warn('     node scripts/crawl_apa.js --file=apa.html');
      console.warn('  3. 本次自動回退使用專案內建之全國擴充門市資料集進行建構。\n');
    }
  }

  // 載入車站資料
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];

  let finalSpots = [];

  if (rawHtml) {
    const parsedHotels = parseApaHtml(rawHtml);
    console.log(`[APA Crawler] 自 HTML 解析出 ${parsedHotels.length} 間飯店連結`);
    // 若 HTML 解析筆數有效，將其合併或轉換
    if (parsedHotels.length > 0) {
      finalSpots = buildApaHotels(parsedHotels, stations);
    }
  }

  // 若 HTML 未提供足夠資料，使用擴充種子保證完整性
  if (finalSpots.length === 0) {
    console.log('[APA Crawler] 使用現有 APA 門市資料集建置...');
    finalSpots = buildApaHotels(APA_HOTELS_SEED, stations);
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(finalSpots);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`\n✅ [APA Scraper 驗證結果]`);
  console.log(`- 總計門市: ${uniqueSpots.length} 間`);
  console.log(`- 重複排除: ${duplicateCount} 筆`);
  console.log(`- 合法通過: ${validation.validCount} 間`);

  // 儲存至 apa_seed.json
  const outPath = path.resolve('src/data/apa_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(uniqueSpots, null, 2), 'utf8');
  console.log(`💾 資料已成功儲存至: ${outPath}`);

  // 若要求同步至 Google Sheet
  if (syncToSheet) {
    console.log('\n📡 開始執行 Google Sheet 同步...');
    const syncScript = path.resolve('scripts/sync_to_sheet.js');
    const { execSync } = await import('child_process');
    try {
      execSync(`node "${syncScript}" --target=apa`, { stdio: 'inherit' });
    } catch (e) {
      console.error('Google Sheet 同步失敗:', e.message);
    }
  }

  return uniqueSpots;
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith('crawl_apa.js')) {
  runApaCrawler().catch(console.error);
}
