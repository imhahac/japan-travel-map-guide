/**
 * =========================================================================
 * UNIQLO (ユニクロ / 優衣庫) 官方流行服飾門市爬蟲
 * =========================================================================
 * 官方來源: https://map.uniqlo.com/jp/ja/
 * 涵蓋全球旗艦店 (Global Flagship)、大型商場店與車站生活圈門市
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

export const UNIQLO_BENCHMARK_STORES = [
  {
    id: 'shopping-uniqlo-tokyo-ginza',
    name: 'UNIQLO TOKYO (銀座旗艦店)',
    nameJa: 'UNIQLO TOKYO',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '東京都中央区銀座3-2-1 マロニエゲート銀座2 地上1～4階',
    lat: 35.67417,
    lng: 139.76528,
    phone: '03-5159-3931',
    hours: '11:00～21:00',
    tags: ['全球旗艦店', 'UT專區', '免稅退稅', '銀座生活圈', '出站即達']
  },
  {
    id: 'shopping-uniqlo-ginza-flagship',
    name: 'UNIQLO 銀座店 (全球旗艦店)',
    nameJa: 'ユニクロ 銀座店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '東京都中央区銀座6-9-5 ギンザコマツ東館 1F～12F',
    lat: 35.66944,
    lng: 139.76333,
    phone: '03-6252-5181',
    hours: '11:00～21:00',
    tags: ['12層全球旗艦店', 'UNIQLO COFFEE', '免稅退稅', '銀座核心']
  },
  {
    id: 'shopping-uniqlo-shinjuku-flagship',
    name: 'UNIQLO 新宿本店 (新宿全球旗艦店)',
    nameJa: 'ユニクロ 新宿本店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '東京都新宿区新宿3-29-1 新宿三越コトブキビル B1F～3F',
    lat: 35.69056,
    lng: 139.70333,
    phone: '03-5367-9371',
    hours: '10:00～22:00',
    tags: ['新宿旗艦店', '免稅退稅', '新宿站直通', 'UTme客製化']
  },
  {
    id: 'shopping-uniqlo-harajuku',
    name: 'UNIQLO 原宿店',
    nameJa: 'ユニクロ 原宿店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '東京都渋谷区神宮前1-14-30 WITH HARAJUKU B1F・1F',
    lat: 35.66972,
    lng: 139.70278,
    phone: '03-5843-1745',
    hours: '11:00～21:00',
    tags: ['原宿站前', 'StyleHint專區', '潮流服飾', '免稅退稅']
  },
  {
    id: 'shopping-uniqlo-shibuya-dogenzaka',
    name: 'UNIQLO 渋谷道玄坂店',
    nameJa: 'ユニクロ 渋谷道玄坂店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '東京都渋谷区道玄坂2-29-5 渋谷プライム 1F～2F',
    lat: 35.65944,
    lng: 139.69833,
    phone: '03-5456-8291',
    hours: '11:00～21:00',
    tags: ['澀谷商圈', '道玄坂', '免稅退稅', '出站即達']
  },
  {
    id: 'shopping-uniqlo-ikebukuro-higashiguchi',
    name: 'UNIQLO 池袋東口店',
    nameJa: 'ユニクロ 池袋東口店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '東京都豊島区東池袋1-21-4 池袋グローブ 1F～6F',
    lat: 35.73028,
    lng: 139.71444,
    phone: '03-5957-3161',
    hours: '10:00～21:00',
    tags: ['池袋商圈', '大型多層門市', '免稅退稅']
  },
  {
    id: 'shopping-uniqlo-tokyo-yaesu',
    name: 'UNIQLO 八重洲地下街店',
    nameJa: 'ユニクロ 八重洲地下街店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '東京都中央区八重洲2-1 八重洲地下街 南1号',
    lat: 35.67972,
    lng: 139.76944,
    phone: '03-3517-5781',
    hours: '10:00～20:00',
    tags: ['東京站地下街', '商務通勤', '出站即達']
  },
  {
    id: 'shopping-uniqlo-ueno-hirokoji',
    name: 'UNIQLO 上野広小路店',
    nameJa: 'ユニクロ 御徒町店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '東京都台東区上野3-27-12 御徒町吉池本店ビル 1F～4F',
    lat: 35.70778,
    lng: 139.77444,
    phone: '03-5812-1641',
    hours: '10:00～21:00',
    tags: ['御徒町站前', '吉池本店大樓', '免稅退稅']
  },
  {
    id: 'shopping-uniqlo-shinsaibashi',
    name: 'UNIQLO 心斎橋店 (全球旗艦店)',
    nameJa: 'ユニクロ 心斎橋店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '大阪府大阪市中央区心斎橋筋1-2-17 1F～4F',
    lat: 35.67389,
    lng: 135.50056,
    phone: '06-6252-5181',
    hours: '11:00～21:00',
    tags: ['心齋橋旗艦店', '免稅退稅', '心齋橋站直通']
  },
  {
    id: 'shopping-uniqlo-umeda-links',
    name: 'UNIQLO LINKS UMEDA店',
    nameJa: 'ユニクロ LINKS UMEDA店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '大阪府大阪市北区大深町1-1 LINKS UMEDA 1F',
    lat: 34.70417,
    lng: 135.49750,
    phone: '06-6374-2181',
    hours: '10:00～21:00',
    tags: ['梅田站前', 'Links Umeda', '關西大型店']
  },
  {
    id: 'shopping-uniqlo-kyoto-kawaramachi',
    name: 'UNIQLO 京都河原町店',
    nameJa: 'ユニクロ 京都河原町店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '京都府京都市中京区河原町通三条下ル大黒町58 ミーナ京都 B1F～3F',
    lat: 35.00833,
    lng: 135.76944,
    phone: '075-222-8611',
    hours: '11:00～21:00',
    tags: ['京都三條', 'mina京都', '免稅退稅']
  },
  {
    id: 'shopping-uniqlo-kyoto-station',
    name: 'UNIQLO JR京都駅八条口店',
    nameJa: 'ユニクロ JR京都駅八条口店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '京都府京都市下京区東塩小路高倉町8-3 JR京都駅八条口 アスティロード 1F',
    lat: 34.98444,
    lng: 135.75944,
    phone: '075-693-8551',
    hours: '09:00～21:00',
    tags: ['新幹線八條口直通', '旅行急需', '出站即達']
  },
  {
    id: 'shopping-uniqlo-nagoya-gatetower',
    name: 'UNIQLO JRゲートタワー名古屋店',
    nameJa: 'ユニクロ JRゲートタワー店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '愛知県名古屋市中村区名駅1-1-3 JRゲートタワー 11F',
    lat: 35.17139,
    lng: 136.88333,
    phone: '052-566-6701',
    hours: '10:00～21:00',
    tags: ['名古屋站直通', '東海最大旗艦店', '免稅退稅']
  },
  {
    id: 'shopping-uniqlo-sapporo-tokyu',
    name: 'UNIQLO 東急百貨店さっぽろ店',
    nameJa: 'ユニクロ 東急百貨店さっぽろ店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '北海道札幌市中央区北4条西2-1 東急百貨店さっぽろ店 7F',
    lat: 43.06694,
    lng: 131.35278,
    phone: '011-212-2431',
    hours: '10:00～20:00',
    tags: ['札幌站前', '東急百貨直通', '免稅退稅']
  },
  {
    id: 'shopping-uniqlo-sendai-aer',
    name: 'UNIQLO 仙台アエル店',
    nameJa: 'ユニクロ 仙台アエル店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '宮城県仙台市青葉区中央1-3-1 AER 2F',
    lat: 38.26222,
    lng: 140.88194,
    phone: '022-723-8711',
    hours: '10:00～20:00',
    tags: ['仙台站西口直通', 'AER大樓', '免稅退稅']
  },
  {
    id: 'shopping-uniqlo-mina-tenjin',
    name: 'UNIQLO ミーナ天神店',
    nameJa: 'ユニクロ ミーナ天神店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '福岡県福岡市中央区天神4-3-8 ミーナ天神 1F～2F',
    lat: 33.59306,
    lng: 130.39944,
    phone: '092-737-8821',
    hours: '10:00～20:00',
    tags: ['九州最大旗艦店', 'mina天神', '免稅退稅']
  },
  {
    id: 'shopping-uniqlo-canal-city-hakata',
    name: 'UNIQLO キャナルシティ博多店',
    nameJa: 'ユニクロ キャナルシティ博多店',
    category: '購物藥妝',
    subcategory: '流行服飾',
    brand: 'UNIQLO',
    address: '福岡県福岡市博多区住吉1-2-22 キャナルシティ博多 イーストビル 1F～3F',
    lat: 33.58972,
    lng: 130.41111,
    phone: '092-283-2851',
    hours: '10:00～21:00',
    tags: ['博多運河城', '超大型門市', '免稅退稅']
  }
];

export async function crawlUniqloRaw(options = {}) {
  const allStores = [];
  let offset = 0;
  const limit = 100;

  console.log('[UNIQLO Scraper] 開始從 Fast Retailing 官方 Store Locator API 爬取全日本門市...');

  while (true) {
    const url = `https://map.uniqlo.com/jp/api/storelocator/v1/ja/stores?limit=${limit}&offset=${offset}&r=storelocator`;
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://map.uniqlo.com/jp/ja/'
      }
    }, 3, 10000);

    if (!res.ok) {
      console.warn(`[UNIQLO Scraper] API 回傳狀態碼異常: ${res.status}`);
      break;
    }

    const data = await res.json();
    const stores = data?.result?.stores || [];
    if (stores.length === 0) break;

    for (const s of stores) {
      if (!s.latitude || !s.longitude) continue;
      const lat = parseFloat(s.latitude);
      const lng = parseFloat(s.longitude);
      if (isNaN(lat) || isNaN(lng)) continue;

      let hours = '10:00～20:00';
      if (s.wdOpenAt && s.wdCloseAt) {
        if (s.weHolOpenAt && s.weHolCloseAt && (s.weHolOpenAt !== s.wdOpenAt || s.weHolCloseAt !== s.wdCloseAt)) {
          hours = `平日 ${s.wdOpenAt}～${s.wdCloseAt} / 土日祝 ${s.weHolOpenAt}～${s.weHolCloseAt}`;
        } else {
          hours = `${s.wdOpenAt}～${s.wdCloseAt}`;
        }
      }

      const tags = ['流行服飾', '免稅退稅'];
      if (s.storeTypeName && s.storeTypeName !== 'なし' && s.storeTypeName !== 'NONE') {
        tags.push(s.storeTypeName);
      }
      if (s.parkingFlag) {
        tags.push('停車場あり');
      }
      if (Array.isArray(s.productTypeList)) {
        s.productTypeList.forEach(p => {
          const pName = p.name ? p.name.trim() : '';
          if (pName && !tags.includes(pName)) tags.push(pName);
        });
      }

      allStores.push({
        shopId: s.id,
        name: s.name || `UNIQLO ${s.id}`,
        nameJa: s.name || `ユニクロ`,
        category: '購物藥妝',
        subcategory: '流行服飾',
        brand: 'UNIQLO',
        address: s.address || '',
        lat,
        lng,
        phone: s.phone || '',
        hours,
        tags
      });
    }

    console.log(`[UNIQLO Scraper] 已抓取 ${allStores.length} 間門市 (offset: ${offset})...`);
    offset += limit;
    if (stores.length < limit) break;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`[UNIQLO Scraper] 官方 API 爬取完畢，全日本共取得 ${allStores.length} 間門市。`);
  return allStores;
}

export async function buildUniqloSpots(stationsList = [], options = {}) {
  let rawList = [];
  try {
    if (!options.forceBenchmark && !process.env.VITEST) {
      rawList = await crawlUniqloRaw(options);
    }
  } catch (err) {
    console.warn(`[UNIQLO Scraper] 即時爬取告警 (${err.message})，自動啟用基準離線門市清單。`);
  }

  if (!rawList || rawList.length === 0) {
    console.log(`[UNIQLO Scraper] 使用離線 Benchmark 門市資料庫 (${UNIQLO_BENCHMARK_STORES.length} 間)`);
    rawList = UNIQLO_BENCHMARK_STORES;
  }

  const formatted = rawList
    .map((raw, idx) => {
      if (!raw.lat || !raw.lng) return null;
      const spotId = `shopping-uniqlo-${raw.shopId || (idx + 1)}`;
      return formatSpotRecord({
        ...raw,
        id: spotId
      }, stationsList);
    })
    .filter(Boolean);

  const { uniqueSpots, duplicateCount } = deduplicateSpots(formatted);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`[UNIQLO Scraper] 建置完成: 共 ${rawList.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);
  return uniqueSpots;
}

export async function run() {
  const stationsPath = path.join(PROJECT_ROOT, 'src/data/stations.json');
  let stations = [];
  if (fs.existsSync(stationsPath)) {
    stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  }

  const spots = await buildUniqloSpots(stations);
  const outputPath = path.join(PROJECT_ROOT, 'src/data/uniqlo_seed.json');
  fs.writeFileSync(outputPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[UNIQLO Scraper] ✅ 已儲存 ${spots.length} 筆門市資料至 ${outputPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('crawl_uniqlo.js')) {
  run().catch(console.error);
}
