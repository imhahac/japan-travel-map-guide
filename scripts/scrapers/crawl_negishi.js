/**
 * =========================================================================
 * 牛たん・とろろ・麦めし ねぎし (Negishi) 官方門市爬蟲
 * =========================================================================
 * 官方來源: https://www.negishi.co.jp/location/index.html
 * 涵蓋東京、橫濱、川崎、千葉、大宮、梅田、神戶等核心生活圈。
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

export const NEGISHI_SOURCE_URL = 'https://www.negishi.co.jp/location/index.html';

// 離線基準門市資料庫 (確保無網路或網站維護時 100% 可用)
export const NEGISHI_BENCHMARK_STORES = [
  {
    id: 'dining-negishi-shinjuku-ltower',
    name: 'ねぎし 新宿エルタワー店',
    nameJa: 'ねぎし エルタワー店',
    category: '美食餐廳',
    subcategory: '定食',
    brand: 'ねぎし',
    address: '東京都新宿区西新宿1-6-1 新宿エルタワーB2',
    lat: 35.69215,
    lng: 139.6974,
    phone: '03-3348-2255',
    hours: '10:30～22:00',
    tags: ['牛舌定食', '山藥麥飯', '出站即達']
  },
  {
    id: 'dining-negishi-shinjuku-higashiguchi',
    name: 'ねぎし 新宿東口店',
    nameJa: 'ねぎし 新宿東口店',
    category: '美食餐廳',
    subcategory: '定食',
    brand: 'ねぎし',
    address: '東京都新宿区新宿3-25-10 當山ビル B1階',
    lat: 35.69254,
    lng: 139.70208,
    phone: '03-6457-7057',
    hours: '11:00～22:00',
    tags: ['牛舌定食', '山藥麥飯', '席位預約']
  },
  {
    id: 'dining-negishi-shibuya-centergai',
    name: 'ねぎし 渋谷センター街店',
    nameJa: 'ねぎし 渋谷センター街店',
    category: '美食餐廳',
    subcategory: '定食',
    brand: 'ねぎし',
    address: '東京都渋谷区宇田川町28-1 高山ランド第15ビル B1',
    lat: 35.66014,
    lng: 139.69837,
    phone: '03-6427-0021',
    hours: '11:00～22:00',
    tags: ['牛舌定食', '山藥麥飯', '商圈名店']
  },
  {
    id: 'dining-negishi-tokyo-yaechika',
    name: 'ねぎし 東京駅八重洲地下街店',
    nameJa: 'ねぎし 八重洲地下街店',
    category: '美食餐廳',
    subcategory: '定食',
    brand: 'ねぎし',
    address: '東京都中央区八重洲2-1 八重洲地下街中3号',
    lat: 35.67978,
    lng: 139.76945,
    phone: '03-3275-2525',
    hours: '10:30～22:00',
    tags: ['牛舌定食', '地下街直通', '出站即達']
  },
  {
    id: 'dining-negishi-links-umeda',
    name: 'ねぎし リンクス梅田店',
    nameJa: 'ねぎし リンクス梅田店',
    category: '美食餐廳',
    subcategory: '定食',
    brand: 'ねぎし',
    address: '大阪府大阪市北区大深町1-1 LINKS UMEDA 8階',
    lat: 35.7028, // will calibrate or match
    lng: 135.4958,
    phone: '06-6940-7876',
    hours: '11:00～23:00',
    tags: ['牛舌定食', '關西首店', 'LINKS UMEDA']
  }
];

export async function crawlNegishiRaw() {
  console.log(`[Negishi Scraper] 正在自官方站點擷取門市: ${NEGISHI_SOURCE_URL}`);
  const res = await fetchWithRetry(NEGISHI_SOURCE_URL, {}, 3, 10000);
  const html = await res.text();
  const $ = cheerio.load(html);

  const rawStores = [];
  $('tr[id]').each((_, el) => {
    const row = $(el);
    const storeNameEl = row.find('h4 a');
    if (!storeNameEl.length) return;

    let rawName = storeNameEl.text().trim();
    if (!rawName) return;

    let storeName = rawName;
    if (!storeName.startsWith('ねぎし')) {
      storeName = `ねぎし ${storeName}`;
    }

    // Coordinates extraction: check store link or any maps link in row
    let lat = null;
    let lng = null;

    const parseCoords = (str = '') => {
      const m = str.match(/ll=([0-9.]+)(?:%2C|,)\s*([0-9.]+)/i);
      if (m) {
        return [parseFloat(m[1]), parseFloat(m[2])];
      }
      return null;
    };

    const linkHref = storeNameEl.attr('href') || '';
    const directCoords = parseCoords(linkHref);
    if (directCoords) {
      lat = directCoords[0];
      lng = directCoords[1];
    } else {
      row.find('a[href*="maps"]').each((_, a) => {
        if (!lat) {
          const c = parseCoords($(a).attr('href') || '');
          if (c) {
            lat = c[0];
            lng = c[1];
          }
        }
      });
    }

    // Extract address and phone
    const td2 = row.find('td').eq(1);
    const rawText = td2.text().trim();
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    let phone = '';
    const phoneMatch = rawText.match(/(\d{2,4}-\d{2,4}-\d{3,4})/);
    if (phoneMatch) {
      phone = phoneMatch[1];
    }

    // Address extraction: extract all text except the phone number, clean up area tags
    let address = '';
    const addressCandidates = lines.filter(l => 
      !l.includes('TEL') && 
      !l.match(/^\d{2,4}-\d{2,4}-\d{3,4}$/) &&
      !l.includes(rawName) &&
      !l.includes('ねぎし') &&
      !l.includes('キャッシュレス')
    );
    if (addressCandidates.length > 0) {
      address = addressCandidates.join(' ')
        .replace(/0\d{1,3}-\d{2,4}-\d{3,4}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Hours
    const td3 = row.find('td').eq(2);
    const hours = td3.clone().children().remove().end().text().trim() || td3.text().trim().split('\n')[0];

    const isDeli = storeName.includes('デリキッチン');
    const tags = ['牛舌定食', '山藥麥飯', '日式定食'];
    if (isDeli) tags.push('外帶外送專門');
    if (storeName.includes('予約') || rawText.includes('予約')) tags.push('提供預約');
    if (rawText.includes('キャッシュレス')) tags.push('無現金支付專用');

    const cleanSlug = storeName.replace(/[^a-zA-Z0-9\u3040-\u30ff\u4e00-\u9faf]/g, '').toLowerCase();
    rawStores.push({
      id: `dining-negishi-${cleanSlug}-${rawStores.length + 1}`,
      name: storeName,
      nameJa: storeName,
      category: '美食餐廳',
      subcategory: '定食',
      brand: 'ねぎし',
      address,
      lat,
      lng,
      phone,
      hours: hours.replace(/\s+/g, ' ').trim(),
      tags
    });
  });

  return rawStores;
}

export async function buildNegishiSpots(stationsList = [], options = {}) {
  let rawList = [];
  try {
    if (!options.forceBenchmark) {
      rawList = await crawlNegishiRaw();
    }
  } catch (err) {
    console.warn(`[Negishi Scraper] 即時爬取失敗 (${err.message})，自動啟用基準離線門市清單。`);
  }

  if (!rawList || rawList.length === 0) {
    console.log(`[Negishi Scraper] 使用離線 Benchmark 門市資料庫 (${NEGISHI_BENCHMARK_STORES.length} 間)`);
    rawList = NEGISHI_BENCHMARK_STORES;
  }

  const formatted = rawList
    .map(raw => {
      if (!raw.lat || !raw.lng) return null;
      return formatSpotRecord(raw, stationsList);
    })
    .filter(Boolean);

  const { uniqueSpots, duplicateCount } = deduplicateSpots(formatted);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`[Negishi Scraper] 建置完成: 共 ${rawList.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);
  return uniqueSpots;
}

export async function run() {
  const stationsPath = path.join(PROJECT_ROOT, 'src/data/stations.json');
  let stations = [];
  if (fs.existsSync(stationsPath)) {
    stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  }

  const spots = await buildNegishiSpots(stations);
  const outputPath = path.join(PROJECT_ROOT, 'src/data/negishi_seed.json');
  fs.writeFileSync(outputPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[Negishi Scraper] ✅ 已儲存 ${spots.length} 筆門市資料至 ${outputPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_negishi.js')) {
  run().catch(console.error);
}
