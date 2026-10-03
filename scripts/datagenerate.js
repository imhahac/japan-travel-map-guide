import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Readable } from 'stream';

const SHEET_ID = process.env.SHEET_ID || '';
const GID = process.env.GID || '0';
const TAB_GIDS = {
  '飯店': process.env.GID_HOTEL || GID,
  '美食餐廳': process.env.GID_FOOD || '',
  '便利商店': process.env.GID_CONVENIENCE || '',
  '購物藥妝': process.env.GID_SHOPPING || ''
};

const outputDir = path.resolve('src/data');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function fetchSheetCsv(sheetId, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    signal: AbortSignal.timeout(4000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching gid ${gid}`);
  return await res.text();
}

function parseCsv(csvText) {
  return new Promise((resolve, reject) => {
    const results = [];
    Readable.from(csvText)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function getSubcategory(category, brand = '', name = '') {
  if (category === '飯店' || brand === '東橫INN' || brand === 'APA飯店') {
    return '商務飯店';
  }
  if (category === '購物藥妝') {
    if (['Bic Camera', '友都八喜', 'Kojima', 'Sofmap'].includes(brand) || /Camera|ヨドバシ|ソフマップ|ビック|コジマ/i.test(name)) {
      return '3C家電';
    }
    return '藥妝量販';
  }
  if (category === '美食餐廳') {
    if (['吉野家', '松屋', 'すき家'].includes(brand) || /牛丼/.test(name)) return '牛丼';
    if (['一蘭拉麵', '一風堂'].includes(brand) || /拉麵|ラーメン/i.test(name)) return '拉麵';
    if (['壽司郎', '藏壽司'].includes(brand) || /壽司|スシ|寿司/i.test(name)) return '壽司';
    if (['やよい軒', '大戶屋'].includes(brand) || /定食|彌生軒/.test(name)) return '定食';
    if (['客美多咖啡'].includes(brand) || /咖啡|珈琲|コメダ/i.test(name)) return '咖啡';
    return '平價美食';
  }
  if (category === '便利商店' || ['7-Eleven', 'FamilyMart', 'Lawson'].includes(brand)) {
    return '連鎖超商';
  }
  return '特色精選';
}

function normalizeSpot(row, fallbackCategory = '飯店') {
  const latLng = (row.Coordinates || row.coordinates || '').split(',').map(s => parseFloat(s.trim()));
  const lat = !isNaN(latLng[0]) ? latLng[0] : (parseFloat(row.lat) || 35.6812);
  const lng = !isNaN(latLng[1]) ? latLng[1] : (parseFloat(row.lng) || 139.7671);

  const rawTags = row.Tags || row.tags || '';
  const tags = typeof rawTags === 'string'
    ? rawTags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    : (Array.isArray(rawTags) ? rawTags : []);

  const walkMin = parseInt(row.WalkMinutes || row.walkMinutes || 5, 10);
  const category = row.Category || row.category || fallbackCategory;
  const brand = row.Brand || row.brand || '';
  const name = row.Name || row.name || '未命名地點';
  const subcategory = row.Subcategory || row.subcategory || getSubcategory(category, brand, name);

  return {
    id: String(row.ID || row.id || `spot-${Math.random().toString(36).substr(2, 9)}`),
    category: category,
    subcategory: subcategory,
    brand: brand,
    name: row.Name || row.name || '未命名地點',
    nameJa: row.NameJa || row.nameJa || row.Name || row.name || '',
    region: row.Region || row.region || '其他',
    prefecture: row.Prefecture || row.prefecture || '其他',
    nearestStation: row.NearestStation || row.nearestStation || '鄰近車站',
    stationLine: row.StationLine || row.stationLine || '',
    stationAccess: row.StationAccess || row.stationAccess || `步行約 ${walkMin} 分鐘`,
    walkMinutes: isNaN(walkMin) ? 5 : walkMin,
    address: row.Address || row.address || '',
    coordinates: `${lat}, ${lng}`,
    lat: lat,
    lng: lng,
    phone: row.Phone || row.phone || '',
    bookingUrl: row.BookingUrl || row.bookingUrl || '',
    googleMapUrl: row.GoogleMapUrl || row.googleMapUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    imageUrl: row.ImageUrl || row.imageUrl || (Array.isArray(row.images) ? row.images[0] : '') || '',
    images: Array.isArray(row.images) ? row.images : (row.ImageUrl ? [row.ImageUrl] : []),
    tags: tags,
    notes: row.Notes || row.notes || ''
  };
}

async function generate() {
  console.log('=== Japan Travel Map Guide: Data Generator ===');
  let allSpots = [];

  if (SHEET_ID) {
    console.log(`📡 Connecting to Google Sheet ID: ${SHEET_ID}`);
    for (const [category, gid] of Object.entries(TAB_GIDS)) {
      if (!gid) continue;
      try {
        console.log(`Fetching tab [${category}] (gid: ${gid})...`);
        const csvText = await fetchSheetCsv(SHEET_ID, gid);
        const rows = await parseCsv(csvText);
        console.log(`  Parsed ${rows.length} rows from [${category}].`);
        rows.forEach(r => {
          if (r.Name || r.name) {
            allSpots.push(normalizeSpot(r, category));
          }
        });
      } catch (err) {
        console.warn(`  Failed to fetch tab [${category}]:`, err.message);
      }
    }
  }

  // Fallback or merge with local seed data if needed
  if (allSpots.length === 0) {
    console.log('📦 Using local seed data (src/data/toyoko_seed.json)...');
    const seedPath = path.join(outputDir, 'toyoko_seed.json');
    if (fs.existsSync(seedPath)) {
      const seedHotels = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      seedHotels.forEach(h => allSpots.push(normalizeSpot(h, '飯店')));
      console.log(`Loaded ${seedHotels.length} hotels from seed data.`);
    }

    // Also load APA Hotels seed if present
    const apaPath = path.join(outputDir, 'apa_seed.json');
    if (fs.existsSync(apaPath)) {
      const apaHotels = JSON.parse(fs.readFileSync(apaPath, 'utf8'));
      apaHotels.forEach(h => allSpots.push(normalizeSpot(h, '飯店')));
      console.log(`Loaded ${apaHotels.length} APA hotels from seed data.`);
    }

    // Also load Shopping & Drugstore seed if present
    const shoppingPath = path.join(outputDir, 'shopping_seed.json');
    if (fs.existsSync(shoppingPath)) {
      const shoppingSpots = JSON.parse(fs.readFileSync(shoppingPath, 'utf8'));
      shoppingSpots.forEach(s => allSpots.push(normalizeSpot(s, '購物藥妝')));
      console.log(`Loaded ${shoppingSpots.length} shopping & drugstore spots from seed data.`);
    }

    // Also load Dining & Restaurant seed if present
    const diningPath = path.join(outputDir, 'dining_seed.json');
    if (fs.existsSync(diningPath)) {
      const diningSpots = JSON.parse(fs.readFileSync(diningPath, 'utf8'));
      diningSpots.forEach(s => allSpots.push(normalizeSpot(s, '美食餐廳')));
      console.log(`Loaded ${diningSpots.length} dining & restaurant spots from seed data.`);
    }

    // Also load Convenience Store seed if present
    const conveniencePath = path.join(outputDir, 'convenience_seed.json');
    if (fs.existsSync(conveniencePath)) {
      const convSpots = JSON.parse(fs.readFileSync(conveniencePath, 'utf8'));
      convSpots.forEach(s => allSpots.push(normalizeSpot(s, '便利商店')));
      console.log(`Loaded ${convSpots.length} convenience store spots from seed data.`);
    }

    // Also load any custom spots if present
    const customPath = path.join(outputDir, 'custom_spots.json');
    if (fs.existsSync(customPath)) {
      const customSpots = JSON.parse(fs.readFileSync(customPath, 'utf8'));
      customSpots.forEach(s => allSpots.push(normalizeSpot(s, s.category || '美食餐廳')));
      console.log(`Loaded ${customSpots.length} custom spots.`);
    }
  }

  console.log(`Total active spots: ${allSpots.length}`);

  // Build Stations Index
  const stationMap = new Map();
  allSpots.forEach(spot => {
    const station = spot.nearestStation;
    if (!station || station === '鄰近車站') return;

    if (!stationMap.has(station)) {
      stationMap.set(station, {
        name: station,
        prefecture: spot.prefecture,
        region: spot.region,
        line: spot.stationLine || '',
        lats: [],
        lngs: [],
        count: 0,
        hotelCount: 0,
        foodCount: 0,
        spotIds: []
      });
    }

    const entry = stationMap.get(station);
    entry.lats.push(spot.lat);
    entry.lngs.push(spot.lng);
    entry.count++;
    if (spot.category === '飯店') entry.hotelCount++;
    if (spot.category === '美食餐廳') entry.foodCount++;
    entry.spotIds.push(spot.id);
  });

  const stations = Array.from(stationMap.values()).map(st => {
    const avgLat = st.lats.reduce((a, b) => a + b, 0) / st.lats.length;
    const avgLng = st.lngs.reduce((a, b) => a + b, 0) / st.lngs.length;
    return {
      name: st.name,
      prefecture: st.prefecture,
      region: st.region,
      line: st.line,
      lat: Number(avgLat.toFixed(6)),
      lng: Number(avgLng.toFixed(6)),
      count: st.count,
      hotelCount: st.hotelCount,
      foodCount: st.foodCount,
      spotIds: st.spotIds
    };
  }).sort((a, b) => b.count - a.count); // sort by most spots

  console.log(`Generated ${stations.length} unique stations for smart search & radius filtering.`);

  // Write files
  const spotsOut = path.join(outputDir, 'spots.json');
  fs.writeFileSync(spotsOut, JSON.stringify(allSpots, null, 2), 'utf8');

  const stationsOut = path.join(outputDir, 'stations.json');
  fs.writeFileSync(stationsOut, JSON.stringify(stations, null, 2), 'utf8');

  console.log(`✅ Data generation complete! Output saved to ${spotsOut} & ${stationsOut}`);
}

generate().catch(console.error);
