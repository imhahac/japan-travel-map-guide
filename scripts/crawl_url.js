import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
let targetUrl = '';
let targetCategory = '飯店';
let customName = '';
let fromQueue = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) targetUrl = args[++i];
  if (args[i] === '--category' && args[i + 1]) targetCategory = args[++i];
  if (args[i] === '--name' && args[i + 1]) customName = args[++i];
  if (args[i] === '--from-queue') fromQueue = true;
}

const GAS_WEBHOOK_URL = process.env.GAS_WEBHOOK_URL;

async function geocodeAddress(address) {
  try {
    const cleanAddr = address.replace(/^〒\d{3}-\d{4}\s*/, '').trim();
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddr)}&countrycodes=jp&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'JapanTravelMapGuide/1.0 (contact: info@example.com)' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (err) {
    console.warn('[WARN] Geocoding failed:', err.message);
  }
  return null;
}

async function scrapeUrl(url, category = '飯店') {
  console.log(`\n🔍 正在分析網址: ${url} (類別: ${category})`);
  
  // Use curl with realistic browser headers
  const cmd = `curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"`;
  let html = '';
  try {
    html = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (e) {
    console.error('抓取網頁失敗:', e.message);
    return null;
  }

  const $ = cheerio.load(html);

  // 1. Check for JSON-LD structured metadata
  let schemaData = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html());
      if (parsed['@type'] || parsed['@graph']) {
        schemaData = parsed['@graph'] ? parsed['@graph'][0] : parsed;
      }
    } catch (_) {}
  });

  // 2. Extract OpenGraph & meta
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';

  // 3. Name
  const name = customName || schemaData?.name || ogTitle.split(/[-|_]/)[0].trim() || '未知名稱';
  
  // 4. Address & Postal Code
  let address = '';
  if (schemaData?.address) {
    if (typeof schemaData.address === 'string') {
      address = schemaData.address;
    } else {
      const a = schemaData.address;
      address = `${a.postalCode ? '〒' + a.postalCode + ' ' : ''}${a.addressRegion || ''}${a.addressLocality || ''}${a.streetAddress || ''}`;
    }
  }

  if (!address) {
    // Search text body for Japanese address patterns
    const bodyText = $('body').text();
    const addrMatch = bodyText.match(/(?:〒\d{3}-\d{4}\s*)?(?:東京都|北海道|大阪府|京都府|.{2,3}縣|.{2,3}県)[^\n\r<>"']{5,40}/);
    if (addrMatch) {
      address = addrMatch[0].trim();
    }
  }

  // 5. Phone
  let phone = schemaData?.telephone || '';
  if (!phone) {
    const phoneMatch = $('body').text().match(/0\d{1,4}-\d{1,4}-\d{3,4}/);
    if (phoneMatch) phone = phoneMatch[0];
  }

  // 6. Coordinates (Lat, Lng)
  let lat = schemaData?.geo?.latitude || null;
  let lng = schemaData?.geo?.longitude || null;

  if (!lat || !lng) {
    // Try Google Maps link in page
    const mapLink = $('a[href*="maps.google"], a[href*="goo.gl/maps"]').attr('href') || '';
    const coordMatch = mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || mapLink.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      lat = parseFloat(coordMatch[1]);
      lng = parseFloat(coordMatch[2]);
    }
  }

  if ((!lat || !lng) && address) {
    console.log(`嘗試透過 OpenStreetMap 查詢地址經緯度: ${address}...`);
    const geo = await geocodeAddress(address);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }
  }

  // Fallback coords to Tokyo Station if not found
  if (!lat || !lng) {
    lat = 35.681236;
    lng = 139.767125;
    console.log('[INFO] 未取得經緯度，預設指向東京車站周邊');
  }

  // 7. Nearest Station and Walking Minutes
  let nearestStation = '車站附近';
  let walkMinutes = 5;
  const stationMatch = $('body').text().match(/([^\s]+?(?:站|駅))(?:\s*徒[步歩]|\s*步行)?\s*(\d+)\s*分/);
  if (stationMatch) {
    nearestStation = stationMatch[1];
    walkMinutes = parseInt(stationMatch[2], 10);
  }

  // Extract Prefecture from address
  const prefMatch = address.match(/(東京都|北海道|大阪府|京都府|.{2,3}縣|.{2,3}県)/);
  const prefecture = prefMatch ? prefMatch[1] : '東京都';

  const spot = {
    id: `custom-${Date.now()}`,
    category: category,
    brand: category === '便利商店' ? (name.match(/(7-Eleven|Lawson|FamilyMart|全家)/i)?.[0] || '便利商店') : '',
    name: name,
    nameJa: schemaData?.alternateName || name,
    region: '日本',
    prefecture: prefecture,
    nearestStation: nearestStation,
    stationAccess: `鄰近 ${nearestStation} 步行約 ${walkMinutes} 分鐘`,
    walkMinutes: walkMinutes,
    address: address || '日本在地',
    coordinates: `${lat}, ${lng}`,
    lat: Number(lat),
    lng: Number(lng),
    phone: phone,
    bookingUrl: url,
    googleMapUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    imageUrl: schemaData?.image?.[0] || ogImage || '',
    tags: category,
    notes: ogDesc.slice(0, 100) || `透過爬蟲自動匯入 (${url})`
  };

  console.log('✅ 解析結果:', spot);

  // If GAS Webhook is available, push to Google Sheet
  if (GAS_WEBHOOK_URL) {
    try {
      console.log(`正在將資料寫入 Google Sheet [${category}] 分頁...`);
      const res = await fetch(GAS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          sheetName: category,
          rows: [spot]
        })
      });
      const json = await res.json();
      console.log('Google Sheet 寫入回應:', json);
    } catch (e) {
      console.error('寫入 Google Sheet 失敗:', e.message);
    }
  }

  // Save to local custom_spots.json
  const dataDir = path.resolve('src/data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const customPath = path.join(dataDir, 'custom_spots.json');
  let customSpots = [];
  if (fs.existsSync(customPath)) {
    try { customSpots = JSON.parse(fs.readFileSync(customPath, 'utf8')); } catch (_) {}
  }
  customSpots.push(spot);
  fs.writeFileSync(customPath, JSON.stringify(customSpots, null, 2), 'utf8');
  console.log(`已同步儲存至 ${customPath}`);

  return spot;
}

async function handleQueue() {
  if (!GAS_WEBHOOK_URL) {
    console.error('執行佇列爬取需設定 GAS_WEBHOOK_URL 環境變數！');
    process.exit(1);
  }
  console.log('正在從 Google Sheet 取得待爬取清單...');
  try {
    const res = await fetch(`${GAS_WEBHOOK_URL}?action=getQueue`);
    const data = await res.json();
    const queue = data.queue || [];
    console.log(`待爬清單共 ${queue.length} 筆`);
    for (const item of queue) {
      await scrapeUrl(item.url, item.category);
      // Mark as done
      await fetch(GAS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markQueueDone', url: item.url })
      });
      console.log(`已標記 ${item.url} 為 DONE`);
    }
  } catch (err) {
    console.error('讀取待爬清單失敗:', err.message);
  }
}

async function main() {
  if (fromQueue) {
    await handleQueue();
  } else if (targetUrl) {
    await scrapeUrl(targetUrl, targetCategory);
  } else {
    console.log(`
使用方式：
  1. 爬取單一網址：
     node scripts/crawl_url.js --url "https://example.com/restaurant" --category "美食餐廳"
  
  2. 爬取 Google Sheet「待爬清單」工作表：
     node scripts/crawl_url.js --from-queue
`);
  }
}

main().catch(console.error);
