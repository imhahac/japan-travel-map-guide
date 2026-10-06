/**
 * =========================================================================
 * 3COINS (スリーコインズ) 官方生活日雜門市爬蟲
 * =========================================================================
 * 官方來源: https://www.palcloset.jp/addons/pal/shoplist/?b=3coins
 * 涵蓋原宿旗艦店、3COINS+plus、3COINS station 車站商場專門店
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

export const THREECOINS_BENCHMARK_STORES = [
  {
    id: 'shopping-3coins-harajuku-flagship',
    name: '3COINS 原宿本店 (全國旗艦店)',
    nameJa: '3COINS 原宿本店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '東京都渋谷区神宮前6-12-22 秋田ビル1F',
    lat: 35.66694,
    lng: 139.70417,
    phone: '03-6427-4333',
    hours: '11:00～20:00',
    tags: ['旗艦本店', '限定商品', '拍照打卡', '出站即達']
  },
  {
    id: 'shopping-3coins-shinjuku-lumineest',
    name: '3COINS ルミネエスト新宿店',
    nameJa: '3COINS ルミネエスト新宿店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '東京都新宿区新宿3-38-1 ルミネエスト 3F',
    lat: 35.69139,
    lng: 139.70111,
    phone: '03-5368-2430',
    hours: '11:00～21:00',
    tags: ['新宿站直通', 'Lumine Est', '3COINS+plus']
  },
  {
    id: 'shopping-3coins-shibuya-markcity',
    name: '3COINS マークシティ渋谷店',
    nameJa: '3COINS 渋谷マークシティ店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '東京都渋谷区道玄坂1-12-1 渋谷マークシティ 4F',
    lat: 35.65861,
    lng: 139.69861,
    phone: '03-6809-0820',
    hours: '10:00～21:00',
    tags: ['澀谷站直通', 'Mark City', '生活美妝']
  },
  {
    id: 'shopping-3coins-tokyo-gransta',
    name: '3COINS station 東京駅グランスタ店',
    nameJa: '3COINS station 東京駅グランスタ店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '東京都千代田区丸の内1-9-1 JR東日本東京駅構内 B1F グランスタ',
    lat: 35.68111,
    lng: 139.76722,
    phone: '03-5224-6830',
    hours: '08:00～22:00',
    tags: ['東京站站內', '旅行隨身', '晨間營業', '出站即達']
  },
  {
    id: 'shopping-3coins-ikebukuro-sunshine',
    name: '3COINS+plus サンシャインシティ池袋店',
    nameJa: '3COINS+plus サンシャインシティ池袋店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '東京都豊島区東池袋3-1 サンシャインシティ アルパ B1F',
    lat: 35.72889,
    lng: 139.71889,
    phone: '03-5952-1630',
    hours: '10:00～20:00',
    tags: ['大型Plus店', '食品雜貨', '陽光城商圈']
  },
  {
    id: 'shopping-3coins-kichijoji-atre',
    name: '3COINS アトレ吉祥寺店',
    nameJa: '3COINS アトレ吉祥寺店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '東京都武蔵野市吉祥寺南町1-1-24 アトレ吉祥寺 本館 2F',
    lat: 35.70278,
    lng: 139.57972,
    phone: '0422-22-2030',
    hours: '10:00～21:00',
    tags: ['吉祥寺站直通', 'atre吉祥寺', '生活日雜']
  },
  {
    id: 'shopping-3coins-yokohama-porta',
    name: '3COINS 横浜ポルタ店',
    nameJa: '3COINS 横浜ポルタ店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '神奈川県横浜市西区高島2-16 横浜駅東口地下街ポルタ B1F',
    lat: 35.46528,
    lng: 139.62389,
    phone: '045-453-3330',
    hours: '10:00～21:00',
    tags: ['橫濱站東口直通', 'Porta地下街', '出站即達']
  },
  {
    id: 'shopping-3coins-umeda-lucua',
    name: '3COINS+plus ルクア大阪店',
    nameJa: '3COINS+plus ルクア大阪店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '大阪府大阪市北区梅田3-1-3 ルクア 8F',
    lat: 34.70250,
    lng: 135.49583,
    phone: '06-6151-1330',
    hours: '10:30～20:30',
    tags: ['大阪站直通', 'LUCUA梅田', '大型Plus店']
  },
  {
    id: 'shopping-3coins-namba-city',
    name: '3COINS なんばCITY店',
    nameJa: '3COINS なんばCITY店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '大阪府大阪市中央区難波5-1-60 なんばCITY 本館 B2F',
    lat: 34.66444,
    lng: 135.50222,
    phone: '06-6644-2630',
    hours: '11:00～21:00',
    tags: ['南海難波站直通', '生活雜貨', '出站即達']
  },
  {
    id: 'shopping-3coins-kyoto-porta',
    name: '3COINS 京都ポルタ店',
    nameJa: '3COINS 京都ポルタ店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '京都府京都市下京区烏丸通塩小路下る東塩小路町902番地 京都駅前地下街ポルタ',
    lat: 34.98583,
    lng: 135.75889,
    phone: '075-343-3330',
    hours: '11:00～20:30',
    tags: ['京都站地下街直通', '日系文創', '出站即達']
  },
  {
    id: 'shopping-3coins-nagoya-gatewalk',
    name: '3COINS ゲートウォーク名古屋店',
    nameJa: '3COINS ゲートウォーク名古屋店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '愛知県名古屋市中村区名駅1-1-2 ゲートウォーク B1F',
    lat: 35.17083,
    lng: 136.88278,
    phone: '052-589-3330',
    hours: '10:00～21:00',
    tags: ['名古屋站地下街直通', '生活風格', '出站即達']
  },
  {
    id: 'shopping-3coins-sapporo-apia',
    name: '3COINS 札幌アピア店',
    nameJa: '3COINS 札幌アピア店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '北海道札幌市中央区北5条西3丁目 アピア B1F',
    lat: 43.06778,
    lng: 141.35083,
    phone: '011-209-1330',
    hours: '10:00～21:00',
    tags: ['札幌站地下街直通', '生活精品', '出站即達']
  },
  {
    id: 'shopping-3coins-sendai-s-pal',
    name: '3COINS エスパル仙台店',
    nameJa: '3COINS エスパル仙台店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '宮城県仙台市青葉区中央1-1-1 エスパル仙台 本館 3F',
    lat: 38.26028,
    lng: 140.88222,
    phone: '022-721-3330',
    hours: '10:00～20:00',
    tags: ['仙台站直通', 'S-PAL仙台', '出站即達']
  },
  {
    id: 'shopping-3coins-tenjin-chikagai',
    name: '3COINS 天神地下街店',
    nameJa: '3COINS 天神地下街店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '福岡県福岡市中央区天神2丁目地下3号 天神地下街 西4番街 034号',
    lat: 33.58972,
    lng: 130.40028,
    phone: '092-732-3330',
    hours: '10:00～20:00',
    tags: ['天神地下街直通', '生活日雜', '出站即達']
  },
  {
    id: 'shopping-3coins-hakata-chikagai',
    name: '3COINS 博多駅地下街店',
    nameJa: '3COINS 博多駅地下街店',
    category: '購物藥妝',
    subcategory: '生活雜貨',
    brand: '3COINS',
    address: '福岡県福岡市博多区博多駅中央街1-1 博多駅地下街',
    lat: 33.58972,
    lng: 130.42056,
    phone: '092-474-3330',
    hours: '10:00～20:00',
    tags: ['博多站地下街直通', '通勤生活圈', '出站即達']
  }
];

export async function crawl3CoinsRaw(options = {}) {
  const url = 'https://palcloset.storelocator.jp/api/pointlist/?limit=2000';
  console.log(`[3COINS Scraper] 正在從 PAL CLOSET 官方 Store Locator API 擷取全量門市: ${url}`);

  const res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://palcloset.storelocator.jp/list/?iframe&c=3coins'
    }
  }, 3, 10000);

  if (!res.ok) {
    throw new Error(`PAL CLOSET API 回應失敗 (${res.status})`);
  }

  const data = await res.json();
  const rawItems = data?.items || [];
  console.log(`[3COINS Scraper] API 總門市項目: ${rawItems.length}，正在篩選 3COINS 旗下品牌門市...`);

  const threeCoinsStores = [];
  for (const item of rawItems) {
    const brand = (item.extra_fields?.['代表ブランドコード'] || '').toLowerCase();
    const brands = (item.extra_fields?.['取り扱いブランドコード'] || '').toLowerCase();
    const name = item.name || '';

    const is3Coins = brand.includes('3coins') ||
      brands.includes('3coins') ||
      name.includes('3COINS') ||
      name.includes('スリーコインズ');

    if (!is3Coins) continue;
    if (!item.latitude || !item.longitude) continue;

    const lat = parseFloat(item.latitude);
    const lng = parseFloat(item.longitude);
    if (isNaN(lat) || isNaN(lng)) continue;
    // 嚴格過濾日本國內門市 (排除海外店如吉隆坡門市)
    if (lat < 24.0 || lat > 46.0 || lng < 122.0 || lng > 154.0) continue;

    // 格式化店名：確保具備 3COINS 品牌標識
    let displayName = name.trim();
    if (!displayName.toUpperCase().includes('3COINS')) {
      displayName = `3COINS ${displayName}`;
    }

    const tags = ['生活雜貨', '平價日雜', '300円均一'];
    if (name.includes('+plus') || name.includes('プラス')) {
      tags.push('3COINS+plus大型店');
    }
    if (name.toLowerCase().includes('station')) {
      tags.push('3COINS station車站店');
    }
    if (name.toLowerCase().includes('oooops')) {
      tags.push('3COINS Oooops');
    }

    const phone = item.extra_fields?.['電話番号'] && item.extra_fields?.['電話番号'] !== '-'
      ? item.extra_fields?.['電話番号'].trim()
      : '';
    const hours = item.extra_fields?.['営業時間'] && item.extra_fields?.['営業時間'] !== '-'
      ? item.extra_fields?.['営業時間'].trim()
      : '10:00～20:00';

    threeCoinsStores.push({
      shopId: String(item.id),
      name: displayName,
      nameJa: displayName,
      category: '購物藥妝',
      subcategory: '生活雜貨',
      brand: '3COINS',
      address: item.address || '',
      lat,
      lng,
      phone,
      hours,
      tags
    });
  }

  console.log(`[3COINS Scraper] 官方 API 篩選完畢，共取得 ${threeCoinsStores.length} 間 3COINS 門市。`);
  return threeCoinsStores;
}

export async function build3CoinsSpots(stationsList = [], options = {}) {
  let rawList = [];
  try {
    if (!options.forceBenchmark && !process.env.VITEST) {
      rawList = await crawl3CoinsRaw(options);
    }
  } catch (err) {
    console.warn(`[3COINS Scraper] 即時爬取告警 (${err.message})，自動啟用基準離線門市清單。`);
  }

  if (!rawList || rawList.length === 0) {
    console.log(`[3COINS Scraper] 使用離線 Benchmark 門市資料庫 (${THREECOINS_BENCHMARK_STORES.length} 間)`);
    rawList = THREECOINS_BENCHMARK_STORES;
  }

  const formatted = rawList
    .map((raw, idx) => {
      if (!raw.lat || !raw.lng) return null;
      const spotId = `shopping-3coins-${raw.shopId || (idx + 1)}`;
      return formatSpotRecord({
        ...raw,
        id: spotId
      }, stationsList);
    })
    .filter(Boolean);

  const { uniqueSpots, duplicateCount } = deduplicateSpots(formatted);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`[3COINS Scraper] 建置完成: 共 ${rawList.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);
  return uniqueSpots;
}

export async function run() {
  const stationsPath = path.join(PROJECT_ROOT, 'src/data/stations.json');
  let stations = [];
  if (fs.existsSync(stationsPath)) {
    stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  }

  const spots = await build3CoinsSpots(stations);
  const outputPath = path.join(PROJECT_ROOT, 'src/data/3coins_seed.json');
  fs.writeFileSync(outputPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[3COINS Scraper] ✅ 已儲存 ${spots.length} 筆門市資料至 ${outputPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_3coins.js')) {
  run().catch(console.error);
}
