/**
 * =========================================================================
 * Wendy's First Kitchen (ウェンディーズ・ファーストキッチン) 官方門市爬蟲
 * =========================================================================
 * 官方來源: https://wendys-firstkitchen.co.jp/shop/
 * 涵蓋東京、神奈川、埼玉、千葉、群馬、信越、中部、關西等。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import {
  fetchWithRetry,
  formatSpotRecord,
  detectPrefectureFromAddress,
  getRegionByPrefecture
} from './crawler_utils.js';
import { validateSpotsBatch } from '../core/validator.js';
import { deduplicateSpots } from '../core/dedupe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

export const WENDYS_AREAS = [
  'tokyo',
  'kanagawa',
  'saitama',
  'chiba',
  'gunma',
  'ibaraki',
  'tochigi',
  'shinetsu',
  'chubu',
  'kansai',
  'kyushu'
];

// 離線基準門市清單 (Benchmark)
export const WENDYS_BENCHMARK_STORES = [
  {
    id: 'dining-wendys-shibuya-centergai',
    name: 'Wendy\'s First Kitchen 渋谷センター街店',
    nameJa: 'ウェンディーズ・ファーストキッチン 渋谷センター街店',
    category: '美食餐廳',
    subcategory: '漢堡輕食',
    brand: 'Wendy\'s First Kitchen',
    address: '東京都渋谷区宇田川町26-11 白馬ビル1F',
    lat: 35.66014,
    lng: 139.69912,
    phone: '03-3464-0756',
    hours: '08:00～22:00',
    tags: ['美式漢堡', '義大利麵', '薯條甜點', '提供Wi-Fi', '充電插座']
  },
  {
    id: 'dining-wendys-shinjuku-minamiguchi',
    name: 'Wendy\'s First Kitchen 新宿南口店',
    nameJa: 'ウェンディーズ・ファーストキッチン 新宿南口店',
    category: '美食餐廳',
    subcategory: '漢堡輕食',
    brand: 'Wendy\'s First Kitchen',
    address: '東京都渋谷区代々木2-11-20 新宿島津ビル1F',
    lat: 35.68772,
    lng: 139.69911,
    phone: '03-3370-0720',
    hours: '07:00～22:00',
    tags: ['美式漢堡', '義大利麵', '出站即達', '提供Wi-Fi']
  },
  {
    id: 'dining-wendys-roppongi',
    name: 'Wendy\'s First Kitchen 六本木店',
    nameJa: 'ウェンディーズ・ファーストキッチン 六本木店',
    category: '美食餐廳',
    subcategory: '漢堡輕食',
    brand: 'Wendy\'s First Kitchen',
    address: '東京都港区六本木5-1-1 マイアミビル1F',
    lat: 35.66276,
    lng: 139.73238,
    phone: '03-3404-1888',
    hours: '08:00～22:00',
    tags: ['美式漢堡', '六本木交差點', '提供Wi-Fi']
  },
  {
    id: 'dining-wendys-nakameguro',
    name: 'Wendy\'s First Kitchen 中目黒駅前店',
    nameJa: 'ウェンディーズ・ファーストキッチン 中目黒駅前店',
    category: '美食餐廳',
    subcategory: '漢堡輕食',
    brand: 'Wendy\'s First Kitchen',
    address: '東京都目黒区上目黒1-20-7 山口ビル1F',
    lat: 35.64470,
    lng: 139.69896,
    phone: '03-6712-2922',
    hours: '10:00～21:00',
    tags: ['美式漢堡', '中目黑站前', '提供Wi-Fi', '充電插座']
  },
  {
    id: 'dining-wendys-umeda-hephive',
    name: 'Wendy\'s First Kitchen 梅田HEPナビオ店',
    nameJa: 'ウェンディーズ・ファーストキッチン 梅田HEPナビオ店',
    category: '美食餐廳',
    subcategory: '漢堡輕食',
    brand: 'Wendy\'s First Kitchen',
    address: '大阪府大阪市北区角田町7-10 HEP NAVIO 1F',
    lat: 34.70321,
    lng: 135.50085,
    phone: '06-6311-6288',
    hours: '08:00～22:30',
    tags: ['美式漢堡', '梅田商圈', '提供Wi-Fi']
  }
];

export async function fetchShopCoordinates(shopId) {
  if (!shopId) return null;
  try {
    const url = `https://wendys-firstkitchen.co.jp/shop/map.php?shopid=${shopId}`;
    const res = await fetchWithRetry(url, {}, 2, 5000);
    const text = await res.text();
    const match = text.match(/LatLng\(\s*['"]?([0-9.]+)['"]?,\s*['"]?([0-9.]+)['"]?\s*\)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
  } catch (err) {
    // ignore individual map fetch error
  }
  return null;
}

export async function crawlWendysRaw(options = {}) {
  console.log('[Wendy\'s Scraper] 正在自官方站點搜尋各都道府縣門市清單...');
  const seenShopIds = new Set();
  const rawShops = [];

  for (const area of WENDYS_AREAS) {
    try {
      const url = `https://wendys-firstkitchen.co.jp/shop/result.php?areaid=${area}`;
      const res = await fetchWithRetry(url, {}, 3, 8000);
      const buffer = await res.arrayBuffer();
      const decoder = new TextDecoder('euc-jp');
      const html = decoder.decode(buffer);
      const $ = cheerio.load(html);

      const rows = $('table.result-pc tbody tr');
      for (let i = 0; i < rows.length; i++) {
        const row = $(rows[i]);
        const nameEl = row.find('h4.shop-name');
        if (!nameEl.length) continue;

        let rawName = nameEl.text().trim();
        const mapLink = row.find('a.tomap').attr('href') || '';
        const shopIdMatch = mapLink.match(/shopid=([0-9]+)/);
        const shopId = shopIdMatch ? shopIdMatch[1] : '';

        if (shopId && seenShopIds.has(shopId)) continue;
        if (shopId) seenShopIds.add(shopId);

        // Normalize Name
        let formattedName = rawName;
        const isWfk = rawName.includes('WFK') || rawName.includes('ウェンディーズ');
        const cleanBaseName = rawName.replace(/【(WFK|FK)】/g, '').trim();

        if (isWfk) {
          formattedName = `Wendy's First Kitchen ${cleanBaseName}`;
          if (!formattedName.endsWith('店') && !formattedName.endsWith('前')) {
            formattedName += '店';
          }
        } else {
          formattedName = `First Kitchen ${cleanBaseName}`;
          if (!formattedName.endsWith('店') && !formattedName.endsWith('前')) {
            formattedName += '店';
          }
        }

        // Info text
        const infoText = row.find('ul.shop-info').text().trim();
        const addressMatch = infoText.match(/^([^\n]+?)(?:TEL:([0-9-]+)|$)/m);
        let address = addressMatch ? addressMatch[1].trim() : '';
        // If address still has TEL or MAP, clean it
        address = address.replace(/TEL:[0-9-]+/g, '').replace(/MAP/g, '').trim();

        const telMatch = infoText.match(/TEL:\s*([0-9-]+)/);
        const phone = telMatch ? telMatch[1].trim() : '';

        const hoursText = row.find('ul.biz-hours').text().trim().replace(/\s+/g, ' ');

        const tags = ['美式漢堡', '義大利麵', '風味薯條'];
        row.find('img.re-icon').each((_, img) => {
          const t = $(img).attr('title') || $(img).attr('alt') || '';
          if (/wifi/i.test(t)) tags.push('提供Wi-Fi');
          if (/電源|concent/i.test(t)) tags.push('提供充電插座');
          if (/電子マネー|クレジット/i.test(t)) tags.push('電子支付');
          if (/QR/i.test(t)) tags.push('QR碼支付');
        });

        rawShops.push({
          shopId,
          name: formattedName,
          nameJa: rawName,
          category: '美食餐廳',
          subcategory: '漢堡輕食',
          brand: 'Wendy\'s First Kitchen',
          area,
          address,
          phone,
          hours: hoursText,
          tags
        });
      }
    } catch (e) {
      console.warn(`[Wendy's Scraper] 抓取區域 ${area} 遭遇警告: ${e.message}`);
    }
  }

  console.log(`[Wendy's Scraper] 門市列表解析完畢，共獲取 ${rawShops.length} 間門市，正在批次獲取精確經緯度...`);

  // Fetch coordinates in concurrent batches of 8
  const BATCH_SIZE = 8;
  for (let i = 0; i < rawShops.length; i += BATCH_SIZE) {
    const chunk = rawShops.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async shop => {
      const coords = await fetchShopCoordinates(shop.shopId);
      if (coords) {
        shop.lat = coords.lat;
        shop.lng = coords.lng;
      }
    }));
    await new Promise(r => setTimeout(r, 150));
  }

  return rawShops;
}

export async function buildWendysSpots(stationsList = [], options = {}) {
  let rawList = [];
  try {
    if (!options.forceBenchmark) {
      rawList = await crawlWendysRaw(options);
    }
  } catch (err) {
    console.warn(`[Wendy's Scraper] 即時爬取失敗 (${err.message})，自動啟用基準離線門市清單。`);
  }

  if (!rawList || rawList.length === 0) {
    console.log(`[Wendy's Scraper] 使用離線 Benchmark 門市資料庫 (${WENDYS_BENCHMARK_STORES.length} 間)`);
    rawList = WENDYS_BENCHMARK_STORES;
  }

  const formatted = rawList
    .map((raw, idx) => {
      if (!raw.lat || !raw.lng) return null;
      const spotId = `dining-wendys-${raw.shopId || (idx + 1)}`;
      return formatSpotRecord({
        ...raw,
        id: spotId
      }, stationsList);
    })
    .filter(Boolean);

  const { uniqueSpots, duplicateCount } = deduplicateSpots(formatted);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`[Wendy's Scraper] 建置完成: 共 ${rawList.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);
  return uniqueSpots;
}

export async function run() {
  const stationsPath = path.join(PROJECT_ROOT, 'src/data/stations.json');
  let stations = [];
  if (fs.existsSync(stationsPath)) {
    stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  }

  const spots = await buildWendysSpots(stations);
  const outputPath = path.join(PROJECT_ROOT, 'src/data/wendys_seed.json');
  fs.writeFileSync(outputPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[Wendy's Scraper] ✅ 已儲存 ${spots.length} 筆門市資料至 ${outputPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_wendys.js')) {
  run().catch(console.error);
}
