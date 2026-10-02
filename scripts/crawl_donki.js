/**
 * =========================================================================
 * 唐吉訶德 (Don Quijote) 全日本官網全門市爬蟲
 * =========================================================================
 * 目標來源：https://www.donki.com/store/shop_list.php
 * 爬取全日本 850+ 間唐吉訶德、MEGA Donki、Picasso 門市資料。
 */

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { findNearestStation } from './core/geo.js';
import { validateSpotsBatch } from './core/validator.js';
import { deduplicateSpots } from './core/dedupe.js';
import { MATSUKIYO_STORES_SEED, buildMatsukiyoStores } from './scrapers/matsumoto.js';

const DONKI_LIST_URL = 'https://www.donki.com/store/shop_list.php';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const PREFECTURE_REGEX = /(北海道|東京都|大阪府|京都府|青森縣|岩手縣|宮城縣|秋田縣|山形縣|福島縣|茨城縣|栃木縣|群馬縣|埼玉縣|千葉縣|神奈川縣|新潟縣|富山縣|石川縣|福井縣|山梨縣|長野縣|岐阜縣|靜岡縣|愛知縣|三重縣|滋賀縣|兵庫縣|奈良縣|和歌山縣|鳥取縣|島根縣|岡山縣|廣島縣|山口縣|德島縣|香川縣|愛媛縣|高知縣|福岡縣|佐賀縣|長崎縣|熊本縣|大分縣|宮崎縣|鹿兒島縣|沖繩縣|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/;

export async function crawlDonkiStores(stationsList = []) {
  console.log(`[Donki Scraper] 開始從官網抓取全日本唐吉訶德清單 (${DONKI_LIST_URL})...`);
  const res = await fetch(DONKI_LIST_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!res.ok) {
    throw new Error(`唐吉訶德官網回應 HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const rawStores = [];
  $('.shopList__storeNameArea').each((_, el) => {
    const item = $(el).parent();
    const name = $(el).find('.shop__name').text().replace(/\s+/g, ' ').trim();
    if (!name) return;

    const link = item.find('a[href*="shop_id="]').first().attr('href') || '';
    const idMatch = link.match(/shop_id=(\d+)/);
    const shopId = idMatch ? idMatch[1] : Math.random().toString(36).slice(2, 7);

    const dls = item.find('dl.shopList__shopDetail');
    const addr = dls.find('dt:contains("住所") + dd').text().replace(/\s+/g, ' ').trim();
    const tel = dls.find('dt:contains("TEL") + dd').text().replace(/\s+/g, ' ').trim();
    const hours = dls.find('dt:contains("営業時間") + dd').text().replace(/\s+/g, ' ').trim();

    rawStores.push({ shopId, name, addr, tel, hours });
  });

  console.log(`[Donki Scraper] 成功自官方網頁解析出 ${rawStores.length} 間門市！開始標準化...`);

  const results = [];
  for (const s of rawStores) {
    const prefMatch = s.addr.match(PREFECTURE_REGEX);
    const prefecture = prefMatch ? prefMatch[1].replace(/県/, '縣').replace(/府/, '府').replace(/都/, '都') : '日本各地';

    // 推算地區
    let region = '其他';
    if (['東京都', '神奈川縣', '千葉縣', '埼玉縣', '茨城縣', '栃木縣', '群馬縣'].includes(prefecture)) region = '關東';
    else if (['大阪府', '京都府', '兵庫縣', '奈良縣', '滋賀縣', '和歌山縣'].includes(prefecture)) region = '近畿';
    else if (['北海道'].includes(prefecture)) region = '北海道';
    else if (['愛知縣', '靜岡縣', '岐阜縣', '三重縣', '新潟縣', '石川縣', '富山縣', '福井縣', '長野縣', '山梨縣'].includes(prefecture)) region = '中部';
    else if (['福岡縣', '佐賀縣', '長崎縣', '熊本縣', '大分縣', '宮崎縣', '鹿兒島縣', '沖繩縣'].includes(prefecture)) region = '九州・沖繩';
    else if (['廣島縣', '岡山縣', '山口縣', '鳥取縣', '島根縣', '香川縣', '愛媛縣', '高知縣', '德島縣'].includes(prefecture)) region = '中國・四國';
    else region = '東北';

    // 標籤
    const tags = ['免稅 (Tax-Free)', '生活量販'];
    const is24h = s.hours.includes('24時間') || s.hours.includes('24小時');
    if (is24h) tags.unshift('24小時營業');
    if (s.name.includes('MEGA')) tags.push('MEGA旗艦店');

    const bookingUrl = `https://www.donki.com/store/shop_detail.php?shop_id=${s.shopId}`;
    const cleanAddr = s.addr.replace(/^〒\d{3}-\d{4}\s*/, '').trim();

    // 匹配鄰近車站
    // 使用店名或地址尋找車站匹配
    const matchedStation = stationsList.find(st => s.name.includes(st.name.replace(/站$/, '')) || cleanAddr.includes(st.name.replace(/站$/, '')));
    const stationName = matchedStation ? matchedStation.name : `${prefecture}主要車站`;
    const walkMin = matchedStation ? 3 : 5;

    results.push({
      id: `donki-${s.shopId}`,
      category: '購物藥妝',
      brand: '唐吉訶德',
      name: `唐吉訶德 ${s.name}`,
      nameJa: s.name,
      region,
      prefecture,
      nearestStation: stationName,
      stationLine: matchedStation?.lines?.[0] || 'JR / 私鐵',
      stationAccess: `鄰近 ${stationName} 步行約 ${walkMin} 分鐘`,
      walkMinutes: walkMin,
      address: cleanAddr,
      coordinates: matchedStation ? `${matchedStation.lat}, ${matchedStation.lng}` : '35.6812, 139.7671',
      lat: matchedStation ? matchedStation.lat : 35.6812,
      lng: matchedStation ? matchedStation.lng : 139.7671,
      phone: s.tel,
      bookingUrl,
      googleMapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('ドン・キホーテ ' + s.name)}`,
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80'],
      tags: tags.join(', '),
      notes: `營業時間: ${s.hours}。日本大型綜合折扣連鎖量販店，提供免稅與各類美妝、電器、伴手禮。`
    });
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(results);
  const validation = validateSpotsBatch(uniqueSpots);
  console.log(`[Donki Scraper] 全國門市建置完畢: 共 ${uniqueSpots.length} 間，排除重複: ${duplicateCount} 筆，驗證通過: ${validation.validCount} 間`);

  return uniqueSpots;
}

async function run() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];

  const donkiSpots = await crawlDonkiStores(stations);
  const matsukiyoSpots = buildMatsukiyoStores(MATSUKIYO_STORES_SEED, stations);

  const combinedShopping = [...donkiSpots, ...matsukiyoSpots];
  const outPath = path.resolve('src/data/shopping_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(combinedShopping, null, 2), 'utf8');
  console.log(`💾 [Shopping] 已儲存全日本 ${combinedShopping.length} 筆門市至 ${outPath} (唐吉訶德: ${donkiSpots.length} 間, 松本清: ${matsukiyoSpots.length} 間)`);

  const syncArg = process.argv.includes('--sync');
  const gasUrl = process.env.GAS_WEBHOOK_URL || process.argv.find(a => a.startsWith('http'));
  if (syncArg && gasUrl) {
    const { execSync } = await import('child_process');
    execSync(`node scripts/sync_to_sheet.js "${gasUrl}" --target=shopping`, { stdio: 'inherit' });
  }
}

if (process.argv[1] && process.argv[1].endsWith('crawl_donki.js')) {
  run().catch(console.error);
}
