import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PREFECTURES = {
  1: '北海道', 2: '青森縣', 3: '岩手縣', 4: '宮城縣', 5: '秋田縣',
  6: '山形縣', 7: '福島縣', 8: '茨城縣', 9: '栃木縣', 10: '群馬縣',
  11: '埼玉縣', 12: '千葉縣', 13: '東京都', 14: '神奈川縣', 15: '新潟縣',
  16: '富山縣', 17: '石川縣', 18: '福井縣', 19: '山梨縣', 20: '長野縣',
  21: '岐阜縣', 22: '靜岡縣', 23: '愛知縣', 24: '三重縣', 25: '滋賀縣',
  26: '京都府', 27: '大阪府', 28: '兵庫縣', 29: '奈良縣', 30: '和歌山縣',
  31: '鳥取縣', 32: '島根縣', 33: '岡山縣', 34: '廣島縣', 35: '山口縣',
  36: '德島縣', 37: '香川縣', 38: '愛媛縣', 39: '高知縣', 40: '福岡縣',
  41: '佐賀縣', 42: '長崎縣', 43: '熊本縣', 44: '大分縣', 45: '宮崎縣',
  46: '鹿兒島縣', 47: '沖繩縣'
};

const REGIONS = {
  hokkaido: '北海道',
  tohoku: '東北',
  kanto: '關東',
  tokai: '東海・甲信越・北陸',
  kinki: '近畿',
  chugoku_shikoku: '中國・四國',
  kyushu_okinawa: '九州・沖繩'
};

// Common station name translations from Romanized to Chinese/Kanji
const STATION_NAME_MAP = {
  'Sapporo': '札幌', 'Abashiri': '網走', 'Kushiro': '釧路', 'Obihiro': '帶廣',
  'Kitami': '北見', 'Asahikawa': '旭川', 'Hakodate': '函館', 'Tomakomai': '苫小牧',
  'Shinjuku': '新宿', 'Shibuya': '澀谷', 'Ikebukuro': '池袋', 'Tokyo': '東京',
  'Shinagawa': '品川', 'Ueno': '上野', 'Akihabara': '秋葉原', 'Asakusa': '淺草',
  'Ginza': '銀座', 'Omiya': '大宮', 'Yokohama': '橫濱', 'Kawasaki': '川崎',
  'Nagoya': '名古屋', 'Kyoto': '京都', 'Osaka': '大阪', 'Namba': '難波',
  'Umeda': '梅田', 'Tennoji': '天王寺', 'Shin-Osaka': '新大阪', 'Kobe': '神戶',
  'Sannomiya': '三宮', 'Himeji': '姬路', 'Nara': '奈良', 'Hiroshima': '廣島',
  'Okayama': '岡山', 'Takamatsu': '高松', 'Matsuyama': '松山', 'Hakata': '博多',
  'Tenjin': '天神', 'Kokura': '小倉', 'Kumamoto': '熊本', 'Kagoshima': '鹿兒島',
  'Nagasaki': '長崎', 'Naha': '那霸', 'Kanazawa': '金澤', 'Toyama': '富山',
  'Niigata': '新潟', 'Sendai': '仙台', 'Morioka': '盛岡', 'Aomori': '青森'
};

function formatStationName(stationStr, hotelName) {
  if (!stationStr) {
    // Extract from hotel name
    const match = hotelName.match(/([^\s東西南北口前]+?)(?:站|駅)/);
    if (match) return match[1] + '站';
    return hotelName.replace(/東橫INN\s*/, '').slice(0, 4) + '站';
  }

  let cleaned = stationStr.replace(/\s+station/i, '').replace(/\s+駅/i, '').trim();
  for (const [en, zh] of Object.entries(STATION_NAME_MAP)) {
    if (cleaned.toLowerCase().includes(en.toLowerCase())) {
      return zh + '站';
    }
  }

  // Check if Chinese name contains a recognized station pattern
  const zhMatch = hotelName.match(/([^\s東西南北口前]+?)(?:站|駅)/);
  if (zhMatch) return zhMatch[1] + '站';

  return cleaned + '站';
}

function fetchHotelDetail(hotelCode) {
  try {
    const url = `https://www.toyoko-inn.com/api/trpc/public.hotels.byId?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { "json": { hotelCode } } }))}`;
    const cmd = `curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "${url}"`;
    const res = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const json = JSON.parse(res);
    return json[0]?.result?.data?.json || null;
  } catch (err) {
    console.warn(`[WARN] Failed to fetch details for hotel ${hotelCode}:`, err.message);
    return null;
  }
}

async function run() {
  console.log('=== Starting Toyoko Inn Japan Crawler ===');
  
  // 1. Load hotel list from temp_query_0.json or fetch live
  let rawList;
  if (fs.existsSync('temp_query_0.json')) {
    console.log('Reading from cached temp_query_0.json...');
    rawList = JSON.parse(fs.readFileSync('temp_query_0.json', 'utf8')).list;
  } else {
    console.log('Fetching live hotel list from toyoko-inn.com...');
    const cmd = `curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "https://www.toyoko-inn.com/china/hotel_list/"`;
    const html = execSync(cmd, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
    const json = JSON.parse(match[1]);
    rawList = json.props.pageProps.trpcState.json.queries[0].state.data.list;
  }

  const japanHotels = [];
  rawList.forEach(regionGroup => {
    const kubun = regionGroup.kubun;
    if (kubun === 'overseas') return; // Only Japan hotels
    const regionName = REGIONS[kubun] || kubun;

    regionGroup.list.forEach(prefGroup => {
      prefGroup.hotels.forEach(h => {
        if (h.country === 1 && h.hotelStatus === 'operation') {
          japanHotels.push({
            ...h,
            regionKubun: kubun,
            regionName,
            prefectureName: PREFECTURES[h.prefecture] || '其他'
          });
        }
      });
    });
  });

  console.log(`Found ${japanHotels.length} operational Toyoko Inn hotels in Japan.`);
  console.log('Fetching exact coordinates, access info, and high-res photos...');

  const finalHotels = [];
  const batchSize = 10;

  for (let i = 0; i < japanHotels.length; i += batchSize) {
    const batch = japanHotels.slice(i, i + batchSize);
    process.stdout.write(`\rProcessing ${i + 1} ~ ${Math.min(i + batchSize, japanHotels.length)} / ${japanHotels.length}...`);

    for (const h of batch) {
      const detail = fetchHotelDetail(h.hotelCode);
      const ta = Array.isArray(detail?.trainAccess) && detail.trainAccess.length > 0 ? detail.trainAccess[0] : null;

      const stationName = formatStationName(ta?.station, h.name);
      const walkTime = ta?.time || 3;
      const stationLine = ta?.line || '';
      const stationAccessStr = stationLine ? `${stationLine} ${stationName} 步行約 ${walkTime} 分鐘` : `鄰近 ${stationName} 步行約 ${walkTime} 分鐘`;

      const tags = ['免費早餐'];
      if (detail?.isAvailableParkingLot || h.address?.includes('停車場')) tags.push('附停車場');
      if (walkTime <= 3) tags.push('車站步行3分內');
      if (detail?.isOmotenasi) tags.push('安心認證');

      const images = Array.isArray(detail?.hotelImages) && detail.hotelImages.length > 0
        ? detail.hotelImages.slice(0, 5)
        : ['https://www.toyoko-inn.com/images/ogp/ogp_default.png'];

      const lat = detail?.geo?.lat || 35.6895;
      const lng = detail?.geo?.lng || 139.6917;

      finalHotels.push({
        id: `toyoko-${h.hotelCode}`,
        hotelCode: h.hotelCode,
        category: '飯店',
        brand: '東橫INN',
        name: h.name,
        nameJa: detail?.name || h.name,
        region: h.regionName,
        prefecture: h.prefectureName,
        nearestStation: stationName,
        stationLine: stationLine,
        stationAccess: stationAccessStr,
        walkMinutes: walkTime,
        address: `${h.zipcode ? '〒' + h.zipcode + ' ' : ''}${h.city || ''} ${h.address || ''}`.trim(),
        coordinates: `${lat}, ${lng}`,
        lat: Number(lat),
        lng: Number(lng),
        phone: h.phoneNumber || detail?.phoneNumber || '',
        bookingUrl: `https://www.toyoko-inn.com/china/search/detail/${h.hotelCode}/`,
        googleMapUrl: h.googleMapUrl || `https://maps.google.com/?q=${lat},${lng}`,
        imageUrl: images[0],
        images: images,
        tags: tags.join(', '),
        notes: `東橫 INN 連鎖飯店，提供免費自助早餐與便利交通。`
      });
    }

    // Small breathing pause
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\nAll hotels processed successfully!');
  
  // Output paths
  const outDir = path.resolve('src/data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const seedPath = path.join(outDir, 'toyoko_seed.json');
  fs.writeFileSync(seedPath, JSON.stringify(finalHotels, null, 2), 'utf8');
  console.log(`Saved seed dataset to: ${seedPath} (${(fs.statSync(seedPath).size / 1024).toFixed(1)} KB)`);

  const spotsPath = path.join(outDir, 'spots.json');
  fs.writeFileSync(spotsPath, JSON.stringify(finalHotels, null, 2), 'utf8');
  console.log(`Saved spots dataset to: ${spotsPath}`);
}

run().catch(console.error);
