/**
 * =========================================================================
 * LOFT (ロフト) 官方生活文具雜貨門市爬蟲
 * =========================================================================
 * 官方來源: https://www.loft.co.jp/shop_list/
 * 涵蓋日本全國各大核心商圈旗艦店與生活圈分店 (生活雜貨)
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

export const LOFT_BENCHMARK_STORES = [
  {
    id: 'shopping-loft-shibuya',
    name: '渋谷ロフト (Shibuya LOFT)',
    nameJa: '渋谷ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '東京都渋谷区宇田川町18-2',
    lat: 35.66117,
    lng: 139.69973,
    phone: '03-5291-9211',
    hours: '11:00～21:00',
    tags: ['大型旗艦店', '生活文具', '美妝生活', '免稅退稅', '出站即達']
  },
  {
    id: 'shopping-loft-ginza',
    name: '銀座ロフト (Ginza LOFT)',
    nameJa: '銀座ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '東京都中央区銀座2-4-6 銀座ベルビア館1階～6階',
    lat: 35.67389,
    lng: 139.76639,
    phone: '03-3562-6210',
    hours: '11:00～21:00',
    tags: ['全球旗艦店', '設計雜貨', '免稅退稅', '銀座生活圈']
  },
  {
    id: 'shopping-loft-ikebukuro',
    name: '池袋ロフト (Ikebukuro LOFT)',
    nameJa: '池袋ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '東京都豊島区南池袋1-28-1 西武池袋本店9～12階',
    lat: 35.72889,
    lng: 139.71194,
    phone: '03-5960-6210',
    hours: '10:00～21:00',
    tags: ['池袋站直通', '生活文具', '大型賣場', '免稅退稅']
  },
  {
    id: 'shopping-loft-kichijoji',
    name: '吉祥寺ロフト (Kichijoji LOFT)',
    nameJa: '吉祥寺ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '東京都武蔵野市吉祥寺本町1-10-1',
    lat: 35.70472,
    lng: 139.57944,
    phone: '0422-23-6210',
    hours: '10:30～20:00',
    tags: ['吉祥寺商圈', '生活雜貨', '文具精品']
  },
  {
    id: 'shopping-loft-yokohama',
    name: '横浜ロフト (Yokohama LOFT)',
    nameJa: '横浜ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '神奈川県横浜市西区高島2-18-1 そごう横浜店7階',
    lat: 35.46556,
    lng: 139.62583,
    phone: '045-440-6210',
    hours: '10:00～20:00',
    tags: ['橫濱站東口', 'SOGO百貨直通', '生活文具']
  },
  {
    id: 'shopping-loft-chiba',
    name: '千葉ロフト (Chiba LOFT)',
    nameJa: '千葉ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '千葉県千葉市中央区新町1000 そごう千葉店8階',
    lat: 35.61194,
    lng: 140.11361,
    phone: '043-248-6210',
    hours: '10:00～20:00',
    tags: ['千葉站前', '生活文具', '免稅退稅']
  },
  {
    id: 'shopping-loft-umeda',
    name: '梅田ロフト (Umeda LOFT)',
    nameJa: '梅田ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '大阪府大阪市北区茶屋町16-7',
    lat: 34.70639,
    lng: 135.49889,
    phone: '06-6359-0111',
    hours: '11:00～21:00',
    tags: ['關西旗艦店', '茶屋町商圈', '免稅退稅', '文具生活']
  },
  {
    id: 'shopping-loft-shinsaibashi',
    name: '心斎橋ロフト (Shinsaibashi LOFT)',
    nameJa: '心斎橋ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '大阪府大阪市中央区心斎橋筋1-8-3 心斎橋PARCO 9階～11階',
    lat: 34.67361,
    lng: 135.50056,
    phone: '06-6253-6210',
    hours: '10:00～20:00',
    tags: ['PARCO直通', '心齋橋商圈', '生活美妝', '免稅退稅']
  },
  {
    id: 'shopping-loft-kyoto',
    name: '京都ロフト (Kyoto LOFT)',
    nameJa: '京都ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '京都府京都市中京区河原町通三条下ル大黒町58 ミーナ京都4階～6階',
    lat: 35.00833,
    lng: 135.76944,
    phone: '075-255-6210',
    hours: '11:00～21:00',
    tags: ['京都三條', '河原町生活圈', '生活文具', '免稅退稅']
  },
  {
    id: 'shopping-loft-nagoya',
    name: '栄ロフト (Sakae LOFT)',
    nameJa: '栄ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '愛知県名古屋市中区栄3-4-5 SAKUMACHI栄 1階～2階',
    lat: 35.16806,
    lng: 136.90806,
    phone: '052-243-6210',
    hours: '10:00～20:00',
    tags: ['名古屋榮商圈', '設計生活', '美妝雜貨']
  },
  {
    id: 'shopping-loft-sapporo',
    name: 'モユク札幌ロフト (Moyuk Sapporo LOFT)',
    nameJa: 'モユク札幌ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '北海道札幌市中央区南2条西3-20 moyuk SAPPORO 3階',
    lat: 43.05778,
    lng: 141.35333,
    phone: '011-207-6210',
    hours: '10:00～21:00',
    tags: ['狸小路商圈', '地下街直通', '生活文具']
  },
  {
    id: 'shopping-loft-sendai',
    name: '仙台ロフト (Sendai LOFT)',
    nameJa: '仙台ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '宮城県仙台市青葉区中央1-10-10',
    lat: 38.25972,
    lng: 140.88056,
    phone: '022-224-6210',
    hours: '10:00～20:00',
    tags: ['仙台站西口直通', '大型賣場', '免稅退稅']
  },
  {
    id: 'shopping-loft-tenjin',
    name: '天神ロフト (Tenjin LOFT)',
    nameJa: '天神ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '福岡県福岡市中央区天神4-3-8 ミーナ天神4階',
    lat: 33.59306,
    lng: 130.39944,
    phone: '092-724-6210',
    hours: '10:00～20:00',
    tags: ['天神站前', 'mina天神', '生活文具', '免稅退稅']
  },
  {
    id: 'shopping-loft-hakata',
    name: 'ららぽーと福岡ロフト (Lalaport Fukuoka LOFT)',
    nameJa: 'ららぽーと福岡ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '福岡県福岡市博多区那珂6-23-1 ららぽーと福岡1階',
    lat: 33.56528,
    lng: 130.44194,
    phone: '092-588-6210',
    hours: '10:00～21:00',
    tags: ['LaLaport福岡', '家庭生活', '設計文具']
  },
  {
    id: 'shopping-loft-hiroshima',
    name: '広島ロフト (Hiroshima LOFT)',
    nameJa: '広島ロフト',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: 'LOFT',
    address: '広島県広島市中区基町6-27 アクア広島センター街5階',
    lat: 34.39694,
    lng: 132.45667,
    phone: '082-511-6210',
    hours: '10:00～20:00',
    tags: ['紙屋町商圈', '廣島巴士中心', '生活雜貨']
  }
];

export async function crawlLoftRaw(options = {}) {
  const listUrl = 'https://www.loft.co.jp/shop_list/';
  console.log(`[LOFT Scraper] 正在抓取門市清單: ${listUrl}`);
  
  const res = await fetchWithRetry(listUrl, {}, 2, 6000);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const shopLinks = [];
  $('a[href*="/shop_list/detail.php?shop_id="]').each((i, el) => {
    const href = $(el).attr('href');
    const fullHref = href.startsWith('http') ? href : `https://www.loft.co.jp${href}`;
    const name = $(el).text().trim();
    if (fullHref && !shopLinks.some(s => s.url === fullHref)) {
      shopLinks.push({ name, url: fullHref });
    }
  });

  console.log(`[LOFT Scraper] 解析出 ${shopLinks.length} 間門市連結，抓取詳情...`);
  const stores = [];
  const limit = options.limit || (options.maxStores || shopLinks.length);
  const targetLinks = shopLinks.slice(0, limit);

  for (const item of targetLinks) {
    try {
      const dRes = await fetchWithRetry(item.url, {}, 2, 4000);
      const dHtml = await dRes.text();
      const $d = cheerio.load(dHtml);
      
      const shopTitle = $d('h1, .shopname, title').first().text().replace(/｜株式会社ロフト.*$/, '').trim() || item.name;
      const iframe = $d('iframe[src*="google.com/maps"]').attr('src') || '';
      let lat = null, lng = null;
      if (iframe) {
        const latM = iframe.match(/!3d([0-9.]+)/);
        const lngM = iframe.match(/!2d([0-9.]+)/);
        if (latM && lngM) {
          lat = parseFloat(latM[1]);
          lng = parseFloat(lngM[1]);
        }
      }

      let address = '';
      $d('dd, p, td').each((_, el) => {
        const txt = $d(el).text().trim();
        if (/^(東京都|北海道|大阪府|京都府|神奈川県|千葉県|埼玉県|愛知県|福岡県|.*?[都道府県])/.test(txt)) {
          if (!address || txt.length < address.length) address = txt.replace(/\s+/g, ' ');
        }
      });

      let hours = '10:00～21:00';
      $d('dd, p').each((_, el) => {
        const txt = $d(el).text().trim();
        if (/([0-9]{1,2}:[0-9]{2}～[0-9]{1,2}:[0-9]{2}|午前|午後)/.test(txt) && txt.includes('時')) {
          hours = txt.slice(0, 40).replace(/\s+/g, ' ');
        }
      });

      const shopIdM = item.url.match(/shop_id=(\d+)/);
      const shopId = shopIdM ? shopIdM[1] : Math.random().toString(36).slice(2, 7);

      if (lat && lng && address) {
        stores.push({
          shopId,
          name: shopTitle,
          nameJa: shopTitle,
          category: '購物藥妝',
          subcategory: '生活雜貨',
          brand: 'LOFT',
          address,
          lat,
          lng,
          hours,
          tags: ['生活雜貨', '文具精品', '美妝生活']
        });
      }
    } catch (_) {}
  }

  return stores;
}

export async function buildLoftSpots(stationsList = [], options = {}) {
  let rawList = [];
  try {
    if (!options.forceBenchmark) {
      rawList = await crawlLoftRaw(options);
    }
  } catch (err) {
    console.warn(`[LOFT Scraper] 即時爬取告警 (${err.message})，自動啟用基準離線門市清單。`);
  }

  if (!rawList || rawList.length === 0) {
    console.log(`[LOFT Scraper] 使用離線 Benchmark 門市資料庫 (${LOFT_BENCHMARK_STORES.length} 間)`);
    rawList = LOFT_BENCHMARK_STORES;
  }

  const formatted = rawList
    .map((raw, idx) => {
      if (!raw.lat || !raw.lng) return null;
      const spotId = `shopping-loft-${raw.shopId || (idx + 1)}`;
      return formatSpotRecord({
        ...raw,
        id: spotId
      }, stationsList);
    })
    .filter(Boolean);

  const { uniqueSpots, duplicateCount } = deduplicateSpots(formatted);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`[LOFT Scraper] 建置完成: 共 ${rawList.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);
  return uniqueSpots;
}

export async function run() {
  const stationsPath = path.join(PROJECT_ROOT, 'src/data/stations.json');
  let stations = [];
  if (fs.existsSync(stationsPath)) {
    stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  }

  const spots = await buildLoftSpots(stations);
  const outputPath = path.join(PROJECT_ROOT, 'src/data/loft_seed.json');
  fs.writeFileSync(outputPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[LOFT Scraper] ✅ 已儲存 ${spots.length} 筆門市資料至 ${outputPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_loft.js')) {
  run().catch(console.error);
}
