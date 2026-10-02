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

function normalizeSpot(row, fallbackCategory = '飯店') {
  const latLng = (row.Coordinates || row.coordinates || '').split(',').map(s => parseFloat(s.trim()));
  const lat = !isNaN(latLng[0]) ? latLng[0] : (parseFloat(row.lat) || 35.6812);
  const lng = !isNaN(latLng[1]) ? latLng[1] : (parseFloat(row.lng) || 139.7671);

  const rawTags = row.Tags || row.tags || '';
  const tags = typeof rawTags === 'string'
    ? rawTags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    : (Array.isArray(rawTags) ? rawTags : []);

  const walkMin = parseInt(row.WalkMinutes || row.walkMinutes || 5, 10);

  return {
    id: String(row.ID || row.id || `spot-${Math.random().toString(36).substr(2, 9)}`),
    category: row.Category || row.category || fallbackCategory,
    brand: row.Brand || row.brand || '',
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
