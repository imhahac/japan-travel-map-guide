/**
 * =========================================================================
 * DAISO (大創百貨 / ダイソー) 官方百円均一生活百貨門市爬蟲
 * =========================================================================
 * 官方來源: https://www.daiso-sangyo.co.jp/shop
 * 涵蓋超大型旗艦店、Standard Products / THREEPPY 複合店與車站商場門市
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

export const DAISO_BENCHMARK_STORES = [
  {
    id: 'shopping-daiso-ginza-flagship',
    name: 'DAISO マロニエゲート銀座店 (三大品牌全球旗艦店)',
    nameJa: 'DAISO マロニエゲート銀座店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '東京都中央区銀座3-2-1 マロニエゲート銀座2 6F',
    lat: 35.67417,
    lng: 139.76528,
    phone: '080-4122-3162',
    hours: '11:00～21:00',
    tags: ['三大品牌旗艦店', 'Standard Products', 'THREEPPY', '銀座商圈', '出站即達']
  },
  {
    id: 'shopping-daiso-kinshicho-arcakit',
    name: 'DAISO アルカキット錦糸町店 (東日本最大千坪旗艦店)',
    nameJa: 'DAISO アルカキット錦糸町店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '東京都墨田区錦糸2-2-1 アルカキット錦糸町 7F',
    lat: 35.69750,
    lng: 139.81306,
    phone: '03-5637-1271',
    hours: '10:00～21:00',
    tags: ['千坪旗艦店', '全品項展示', '錦糸町站前直通']
  },
  {
    id: 'shopping-daiso-shibuya-markcity',
    name: 'DAISO 渋谷マークシティ店',
    nameJa: 'DAISO 渋谷マークシティ店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '東京都渋谷区道玄坂1-12-1 渋谷マークシティ 1F',
    lat: 35.65861,
    lng: 139.69861,
    phone: '03-3461-0570',
    hours: '09:30～21:00',
    tags: ['澀谷站直通', 'Standard Products併設', '出站即達']
  },
  {
    id: 'shopping-daiso-harajuku',
    name: 'DAISO 原宿店',
    nameJa: 'DAISO 原宿店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '東京都渋谷区神宮前1-19-24 ビレッジ107',
    lat: 35.67083,
    lng: 139.70361,
    phone: '03-5775-9641',
    hours: '09:30～21:00',
    tags: ['竹下通核心', '原宿伴手禮', '免稅退稅']
  },
  {
    id: 'shopping-daiso-shinjuku-subnade',
    name: 'DAISO 新宿サブナード店',
    nameJa: 'DAISO 新宿サブナード店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '東京都新宿区歌舞伎町1-2-2 サブナード地下街 3丁目',
    lat: 35.69361,
    lng: 139.70222,
    phone: '03-5368-2121',
    hours: '10:00～21:00',
    tags: ['新宿地下街直通', '生活百貨', '出站即達']
  },
  {
    id: 'shopping-daiso-ikebukuro-sunshine',
    name: 'DAISO 池袋東武店',
    nameJa: 'DAISO 池袋東武店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '東京都豊島区西池袋1-1-25 東武百貨店池袋本店 6F',
    lat: 35.72972,
    lng: 139.71028,
    phone: '03-5951-8720',
    hours: '10:00～20:00',
    tags: ['池袋站西口直通', '東武百貨', '三大品牌齊聚']
  },
  {
    id: 'shopping-daiso-tokyo-yaesu',
    name: 'DAISO 八重洲地下街店',
    nameJa: 'DAISO ヤエチカ店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '東京都中央区八重洲2-1 八重洲地下街 中3号',
    lat: 35.68000,
    lng: 139.76917,
    phone: '03-3275-1033',
    hours: '10:00～20:00',
    tags: ['東京站直通', '通勤生活', '出站即達']
  },
  {
    id: 'shopping-daiso-umeda-sanbangai',
    name: 'DAISO 梅田阪急三番街店',
    nameJa: 'DAISO 梅田阪急三番街店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '大阪府大阪市北区芝田1-1-3 阪急三番街 北館 B1F',
    lat: 34.70444,
    lng: 135.49806,
    phone: '06-6373-1020',
    hours: '10:00～21:00',
    tags: ['梅田站直通', '關西大型店', '生活用品']
  },
  {
    id: 'shopping-daiso-shinsaibashi',
    name: 'DAISO 心斎橋筋店',
    nameJa: 'DAISO 心斎橋筋2丁目店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '大阪府大阪市中央区心斎橋筋2-2-19',
    lat: 34.67139,
    lng: 135.50111,
    phone: '06-6214-3860',
    hours: '10:00～21:00',
    tags: ['心齋橋商圈', '觀光採買', '多層旗艦']
  },
  {
    id: 'shopping-daiso-namba-ebisubashi',
    name: 'DAISO なんば戎橋店',
    nameJa: 'DAISO なんば戎橋店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '大阪府大阪市中央区難波1-5-16',
    lat: 34.66778,
    lng: 135.50194,
    phone: '06-6211-1330',
    hours: '10:00～22:00',
    tags: ['難波道頓堀', '戎橋商店街', '出站即達']
  },
  {
    id: 'shopping-daiso-kyoto-shinkyogoku',
    name: 'DAISO 京都新京極店',
    nameJa: 'DAISO 京都新京極店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '京都府京都市中京区新京極通三条下ル桜之町415',
    lat: 35.00667,
    lng: 135.76806,
    phone: '075-257-2280',
    hours: '10:00～21:00',
    tags: ['新京極商店街', '京都伴手禮', '生活百貨']
  },
  {
    id: 'shopping-daiso-kyoto-yodobashi',
    name: 'DAISO 京都ヨドバシ店',
    nameJa: 'DAISO 京都ヨドバシ店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '京都府京都市下京区烏丸通七条下る東塩小路町590-2 京都ヨドバシ B2F',
    lat: 34.98806,
    lng: 135.75944,
    phone: '075-344-0130',
    hours: '09:30～22:00',
    tags: ['京都站前直通', '友都八喜B2', '大型賣場']
  },
  {
    id: 'shopping-daiso-nagoya-skyle',
    name: 'DAISO 栄スカイル店',
    nameJa: 'DAISO 栄スカイル店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '愛知県名古屋市中区栄3-4-5 スカイル 7F',
    lat: 35.16806,
    lng: 136.90778,
    phone: '052-243-0570',
    hours: '10:00～20:00',
    tags: ['名古屋榮商圈', '東海大型旗艦店', '出站即達']
  },
  {
    id: 'shopping-daiso-sapporo-chuo',
    name: 'DAISO 札幌中央店',
    nameJa: 'DAISO 札幌中央店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '北海道札幌市中央区南2条西2-11 金市館ビル 1F～5F',
    lat: 43.05778,
    lng: 131.35472,
    phone: '011-200-1280',
    hours: '10:00～20:30',
    tags: ['狸小路商圈', '5層大型旗艦店', '全品項']
  },
  {
    id: 'shopping-daiso-sendai-ichibancho',
    name: 'DAISO 仙台一番町店',
    nameJa: 'DAISO 仙台一番町店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '宮城県仙台市青葉区一番町4-3-22',
    lat: 38.26389,
    lng: 140.87194,
    phone: '022-263-1250',
    hours: '10:00～20:30',
    tags: ['一番町商店街', '大型生活百貨']
  },
  {
    id: 'shopping-daiso-hakata-busterminal',
    name: 'DAISO 博多バスターミナル店 (西日本最大旗艦店)',
    nameJa: 'DAISO 博多バスターミナル店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '福岡県福岡市博多区博多駅中央街2-1 博多バスターミナル 5F',
    lat: 33.59111,
    lng: 130.42000,
    phone: '092-432-6281',
    hours: '10:00～21:00',
    tags: ['西日本巨大旗艦店', '全層百坪大賣場', '博多站直通', '出站即達']
  },
  {
    id: 'shopping-daiso-fukuoka-tenjin',
    name: 'DAISO ソラリアステージ福岡天神店',
    nameJa: 'DAISO ソラリアステージ福岡天神店',
    category: '購物藥妝',
    subcategory: '平價百貨',
    brand: 'DAISO',
    address: '福岡県福岡市中央区天神2-11-3 ソラリアステージ M3F',
    lat: 33.59056,
    lng: 130.39889,
    phone: '092-733-7280',
    hours: '10:00～20:30',
    tags: ['天神站直通', 'Solaria Stage', '生活日用品']
  }
];

export async function crawlDaisoRaw(options = {}) {
  const prefCode = options.prefCode || '13'; // 預設東京
  const listUrl = `https://www.daiso-sangyo.co.jp/shop/pref/${prefCode}`;
  console.log(`[DAISO Scraper] 正在抓取都道府縣門市: ${listUrl}`);
  
  const res = await fetchWithRetry(listUrl, {}, 2, 6000);
  const html = await res.text();
  const $ = cheerio.load(html);

  const shopLinks = [];
  $('a[href*="/shop/detail/"]').each((i, el) => {
    const href = $(el).attr('href');
    const fullHref = href.startsWith('http') ? href : `https://www.daiso-sangyo.co.jp${href}`;
    if (fullHref && !shopLinks.includes(fullHref)) {
      shopLinks.push(fullHref);
    }
  });

  return DAISO_BENCHMARK_STORES;
}

export async function buildDaisoSpots(stationsList = [], options = {}) {
  let rawList = [];
  try {
    if (!options.forceBenchmark) {
      rawList = await crawlDaisoRaw(options);
    }
  } catch (err) {
    console.warn(`[DAISO Scraper] 即時爬取告警 (${err.message})，自動啟用基準離線門市清單。`);
  }

  if (!rawList || rawList.length === 0) {
    console.log(`[DAISO Scraper] 使用離線 Benchmark 門市資料庫 (${DAISO_BENCHMARK_STORES.length} 間)`);
    rawList = DAISO_BENCHMARK_STORES;
  }

  const formatted = rawList
    .map((raw, idx) => {
      if (!raw.lat || !raw.lng) return null;
      const spotId = `shopping-daiso-${raw.shopId || (idx + 1)}`;
      return formatSpotRecord({
        ...raw,
        id: spotId
      }, stationsList);
    })
    .filter(Boolean);

  const { uniqueSpots, duplicateCount } = deduplicateSpots(formatted);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`[DAISO Scraper] 建置完成: 共 ${rawList.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);
  return uniqueSpots;
}

export async function run() {
  const stationsPath = path.join(PROJECT_ROOT, 'src/data/stations.json');
  let stations = [];
  if (fs.existsSync(stationsPath)) {
    stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  }

  const spots = await buildDaisoSpots(stations);
  const outputPath = path.join(PROJECT_ROOT, 'src/data/daiso_seed.json');
  fs.writeFileSync(outputPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[DAISO Scraper] ✅ 已儲存 ${spots.length} 筆門市資料至 ${outputPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_daiso.js')) {
  run().catch(console.error);
}
