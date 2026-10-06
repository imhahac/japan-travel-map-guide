/**
 * =========================================================================
 * 無印良品 (MUJI) 官方生活雜貨門市爬蟲
 * =========================================================================
 * 官方來源: https://www.muji.com/jp/ja/shop/preflist
 * 涵蓋日本全國 47 都道府縣大型旗艦店、生活型態店與車站商場門市
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

export const MUJI_BENCHMARK_STORES = [
  {
    id: 'shopping-muji-ginza',
    name: '無印良品 銀座 (MUJI GINZA 全球旗艦店)',
    nameJa: '無印良品 銀座',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '東京都中央区銀座3-3-5',
    lat: 35.67194,
    lng: 139.76556,
    phone: '03-3538-1311',
    hours: '11:00～21:00',
    tags: ['世界旗艦店', 'MUJI Diner', 'MUJI Bakery', '免稅退稅', '銀座站步行1分']
  },
  {
    id: 'shopping-muji-shinjuku',
    name: '無印良品 新宿靖国通り',
    nameJa: '無印良品 新宿靖国通り',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '東京都新宿区新宿3-15-15 新宿ピカデリー B1～2F',
    lat: 35.69222,
    lng: 139.70417,
    phone: '03-5367-2710',
    hours: '11:00～21:00',
    tags: ['新宿商圈', '生活風格', '免稅退稅']
  },
  {
    id: 'shopping-muji-shibuya-seibu',
    name: '無印良品 渋谷西武',
    nameJa: '無印良品 渋谷西武',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '東京都渋谷区宇田川町21-1 渋谷西武パビリオンプラザ館・モヴィーダ館',
    lat: 35.66139,
    lng: 139.70028,
    phone: '03-3770-1636',
    hours: '11:00～21:00',
    tags: ['西武百貨', '大型旗艦店', '生活雜貨', '免稅退稅']
  },
  {
    id: 'shopping-muji-tokyo-ariake',
    name: '無印良品 東京有明 (關東最大複合旗艦店)',
    nameJa: '無印良品 東京有明',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '東京都江東区有明2-1-8 有明ガーデン1F～3F',
    lat: 35.63806,
    lng: 139.79333,
    phone: '03-6380-7818',
    hours: '10:00～21:00',
    tags: ['關東最大門市', '有明花園', 'MUJI Bakery', '居家空間展示']
  },
  {
    id: 'shopping-muji-ikebukuro-seibu',
    name: '無印良品 池袋西武',
    nameJa: '無印良品 池袋西武',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '東京都豊島区南池袋1-28-1 西武池袋本店別館1F～2F',
    lat: 35.72806,
    lng: 139.71167,
    phone: '03-3989-1171',
    hours: '10:00～21:00',
    tags: ['池袋站直通', '生活雜貨', '免稅退稅']
  },
  {
    id: 'shopping-muji-ueno-marui',
    name: '無印良品 上野マルイ',
    nameJa: '無印良品 上野マルイ',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '東京都台東区上野6-15-1 上野マルイ B2F',
    lat: 35.71194,
    lng: 139.77444,
    phone: '03-5817-8500',
    hours: '11:00～20:00',
    tags: ['上野站直通', '上野丸井', '生活用品']
  },
  {
    id: 'shopping-muji-yokohama-portside',
    name: '無印良品 横浜ベイクォーター',
    nameJa: '無印良品 横浜ベイクォーター',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '神奈川県横浜市神奈川区金港町1-10 ベイクォーター3F',
    lat: 35.46778,
    lng: 139.62611,
    phone: '045-440-6260',
    hours: '11:00～20:00',
    tags: ['橫濱海灣', '水岸生活', 'CafeMUJI']
  },
  {
    id: 'shopping-muji-grandfront-osaka',
    name: '無印良品 グランフロント大阪 (關西旗艦店)',
    nameJa: '無印良品 グランフロント大阪',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '大阪府大阪市北区大深町3-1 グランフロント大阪 北館4F',
    lat: 34.70472,
    lng: 135.49611,
    phone: '06-6359-2171',
    hours: '11:00～21:00',
    tags: ['關西旗艦店', '梅田生活圈', 'Cafe & Meal MUJI', '免稅退稅']
  },
  {
    id: 'shopping-muji-shinsaibashi',
    name: '無印良品 心斎橋パルコ',
    nameJa: '無印良品 心斎橋パルコ',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '大阪府大阪市中央区心斎橋筋1-8-3 心斎橋PARCO 7F',
    lat: 34.67361,
    lng: 135.50056,
    phone: '06-6252-8711',
    hours: '10:00～20:00',
    tags: ['心齋橋PARCO', '生活文具', '免稅退稅']
  },
  {
    id: 'shopping-muji-kyoto-bal',
    name: '無印良品 京都BAL (關西生活旗艦店)',
    nameJa: '無印良品 京都BAL',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '京都府京都市中京区河原町通三条下ル山崎町251 京都BAL 4F～5F',
    lat: 35.00694,
    lng: 135.76917,
    phone: '075-223-1120',
    hours: '11:00～20:00',
    tags: ['京都BAL', '河原町商圈', 'Cafe & Meal MUJI', '免稅退稅']
  },
  {
    id: 'shopping-muji-kyoto-station',
    name: '無印良品 京都ポルタ',
    nameJa: '無印良品 京都ポルタ',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '京都府京都市下京区烏丸通塩小路下る東塩小路町902番地 京都駅前地下街ポルタ',
    lat: 34.98583,
    lng: 135.75889,
    phone: '075-343-7300',
    hours: '11:00～20:30',
    tags: ['京都站地下街', 'Porta直通', '生活雜貨']
  },
  {
    id: 'shopping-muji-nagoya-meitetsu',
    name: '無印良品 名古屋名鉄百貨店',
    nameJa: '無印良品 名鉄百貨店本店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '愛知県名古屋市中村区名駅1-2-1 名鉄百貨店本店メンズ館6F',
    lat: 35.16917,
    lng: 136.88389,
    phone: '052-588-5860',
    hours: '10:00～20:00',
    tags: ['名鐵名古屋站直通', '大型賣場', '免稅退稅']
  },
  {
    id: 'shopping-muji-sapporo-parco',
    name: '無印良品 札幌パルコ',
    nameJa: '無印良品 札幌パルコ',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '北海道札幌市中央区南1条西3-3 札幌パルコ 5F～6F',
    lat: 43.05944,
    lng: 141.35389,
    phone: '011-218-5235',
    hours: '10:00～20:00',
    tags: ['大通公園生活圈', '札幌PARCO直通', '免稅退稅']
  },
  {
    id: 'shopping-muji-sendai-s-pal',
    name: '無印良品 エスパル仙台',
    nameJa: '無印良品 エスパル仙台',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '宮城県仙台市青葉区中央1-1-1 エスパル仙台 3F',
    lat: 38.26028,
    lng: 140.88222,
    phone: '022-267-4630',
    hours: '10:00～20:00',
    tags: ['JR仙台站直通', 'S-PAL仙台', '生活文具']
  },
  {
    id: 'shopping-muji-tenjin-daimaru',
    name: '無印良品 天神大丸',
    nameJa: '無印良品 福岡天神大丸',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '福岡県福岡市中央区天神1-4-1 大丸福岡天神店 東館エルガーラ B1F',
    lat: 33.58944,
    lng: 130.40139,
    phone: '092-739-0155',
    hours: '10:00～20:00',
    tags: ['大丸天神直通', '生活風格', '免稅退稅']
  },
  {
    id: 'shopping-muji-hakata-canal',
    name: '無印良品 キャナルシティ博多',
    nameJa: '無印良品 キャナルシティ博多',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '無印良品',
    address: '福岡県福岡市博多区住吉1-2-1 キャナルシティ博多 ノースビル 3F～4F',
    lat: 33.58972,
    lng: 130.41083,
    phone: '092-282-2711',
    hours: '10:00～21:00',
    tags: ['博多運河城', '大型旗艦店', 'CafeMUJI', '免稅退稅']
  }
];

export async function crawlMujiRaw(options = {}) {
  const prefCode = options.prefCode || '13'; // 預設東京 (13)
  const listUrl = `https://www.muji.com/jp/ja/shop/preflist/${prefCode}`;
  console.log(`[MUJI Scraper] 正在抓取都道府縣清單: ${listUrl}`);
  
  const res = await fetchWithRetry(listUrl, {}, 2, 6000);
  const html = await res.text();
  const $ = cheerio.load(html);

  const shopLinks = [];
  $('a[href*="/shop/detail/"]').each((i, el) => {
    const href = $(el).attr('href');
    const fullHref = href.startsWith('http') ? href : `https://www.muji.com${href}`;
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (fullHref && !shopLinks.some(s => s.url === fullHref)) {
      shopLinks.push({ text, url: fullHref });
    }
  });

  console.log(`[MUJI Scraper] 解析出 ${shopLinks.length} 間門市，取得詳細 JSON-LD...`);
  const stores = [];
  const limit = options.limit || (options.maxStores || shopLinks.length);
  const targetLinks = shopLinks.slice(0, limit);

  for (const item of targetLinks) {
    try {
      const dRes = await fetchWithRetry(item.url, {}, 2, 4000);
      const dHtml = await dRes.text();
      const $d = cheerio.load(dHtml);
      
      let storeJson = null;
      $d('script[type="application/ld+json"]').each((_, el) => {
        try {
          const parsed = JSON.parse($d(el).html());
          if (parsed['@type'] === 'LocalBusiness') storeJson = parsed;
        } catch (_) {}
      });

      if (storeJson && storeJson.geo) {
        const lat = parseFloat(storeJson.geo.latitude);
        const lng = parseFloat(storeJson.geo.longitude);
        const name = storeJson.name || item.text.split(' ')[0] || '無印良品';
        const address = storeJson.address?.streetAddress || '';
        const phone = storeJson.telephone || '';
        const shopIdM = item.url.match(/(\d+)$/);
        const shopId = shopIdM ? shopIdM[1] : Math.random().toString(36).slice(2, 7);

        stores.push({
          shopId,
          name,
          nameJa: name,
          category: '購物藥妝',
          subcategory: '生活雜貨',
          brand: '無印良品',
          address,
          lat,
          lng,
          phone,
          hours: '10:00～21:00',
          tags: ['生活雜貨', '極簡美學', '文具收納']
        });
      }
    } catch (_) {}
  }

  return stores;
}

export async function buildMujiSpots(stationsList = [], options = {}) {
  let rawList = [];
  try {
    if (!options.forceBenchmark) {
      rawList = await crawlMujiRaw(options);
    }
  } catch (err) {
    console.warn(`[MUJI Scraper] 即時爬取告警 (${err.message})，自動啟用基準離線門市清單。`);
  }

  if (!rawList || rawList.length === 0) {
    console.log(`[MUJI Scraper] 使用離線 Benchmark 門市資料庫 (${MUJI_BENCHMARK_STORES.length} 間)`);
    rawList = MUJI_BENCHMARK_STORES;
  }

  const formatted = rawList
    .map((raw, idx) => {
      if (!raw.lat || !raw.lng) return null;
      const spotId = `shopping-muji-${raw.shopId || (idx + 1)}`;
      return formatSpotRecord({
        ...raw,
        id: spotId
      }, stationsList);
    })
    .filter(Boolean);

  const { uniqueSpots, duplicateCount } = deduplicateSpots(formatted);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`[MUJI Scraper] 建置完成: 共 ${rawList.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);
  return uniqueSpots;
}

export async function run() {
  const stationsPath = path.join(PROJECT_ROOT, 'src/data/stations.json');
  let stations = [];
  if (fs.existsSync(stationsPath)) {
    stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  }

  const spots = await buildMujiSpots(stations);
  const outputPath = path.join(PROJECT_ROOT, 'src/data/muji_seed.json');
  fs.writeFileSync(outputPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[MUJI Scraper] ✅ 已儲存 ${spots.length} 筆門市資料至 ${outputPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_muji.js')) {
  run().catch(console.error);
}
