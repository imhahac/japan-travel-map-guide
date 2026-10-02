/**
 * 全日本唐吉訶德 (Don Quijote) 849 間門市真實經緯度解析器
 * 1. 優先從官網 https://www.donki.com/store/map.php?shop_id=${id} 抓取精準 Google Maps 經緯度
 * 2. 次之使用日本國土地理院 (GSI) 官方 API 解析地址經緯度
 * 3. 避免任何門市落入東京都心 dummy 座標
 */

import fs from 'fs';
import path from 'path';

const DONKI_SEED_PATH = path.resolve('src/data/donki_full_seed.json');

async function fetchDonkiCoord(shopId) {
  try {
    const res = await fetch(`https://www.donki.com/store/map.php?shop_id=${shopId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const text = await res.text();
    const m = text.match(/q=([0-9.]+),([0-9.]+)/);
    if (m) {
      return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    }
  } catch (e) {
    // Timeout or network error
  }
  return null;
}

async function fetchGsiCoord(address) {
  try {
    const clean = address.replace(/^〒\d{3}-\d{4}\s*/, '').replace(/\s+/g, '').trim();
    const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const list = await res.json();
    if (list && list.length > 0 && list[0].geometry?.coordinates) {
      const [lng, lat] = list[0].geometry.coordinates;
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

async function main() {
  console.log(`[Donki Geocoder] 讀取 ${DONKI_SEED_PATH}...`);
  const stores = JSON.parse(fs.readFileSync(DONKI_SEED_PATH, 'utf8'));
  console.log(`[Donki Geocoder] 共有 ${stores.length} 間門市，開始分批解析真實經緯度...`);

  const CONCURRENCY = 25;
  let resolvedCount = 0;
  let gsiCount = 0;
  let unchangedCount = 0;

  for (let i = 0; i < stores.length; i += CONCURRENCY) {
    const batch = stores.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async s => {
      let coord = null;
      const numMatch = s.id.match(/^donki-(\d+)$/);
      if (numMatch) {
        coord = await fetchDonkiCoord(numMatch[1]);
        if (coord) resolvedCount++;
      }
      if (!coord) {
        coord = await fetchGsiCoord(s.address);
        if (coord) gsiCount++;
      }
      if (coord && coord.lat && coord.lng) {
        s.lat = coord.lat;
        s.lng = coord.lng;
        s.coordinates = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
      } else {
        unchangedCount++;
      }
    }));

    if ((i + CONCURRENCY) % 100 < CONCURRENCY || i + CONCURRENCY >= stores.length) {
      console.log(`  進度: ${Math.min(i + CONCURRENCY, stores.length)} / ${stores.length} (官網抓取: ${resolvedCount}, 國土地理院: ${gsiCount})`);
    }
  }

  console.log(`[Donki Geocoder] 完成！官網解析: ${resolvedCount}, GSI解析: ${gsiCount}, 維持原狀: ${unchangedCount}`);

  // 寫回 donki_full_seed.json
  fs.writeFileSync(DONKI_SEED_PATH, JSON.stringify(stores, null, 2), 'utf8');

  // 更新 shopping_seed.json
  const shoppingPath = path.resolve('src/data/shopping_seed.json');
  if (fs.existsSync(shoppingPath)) {
    const shopping = JSON.parse(fs.readFileSync(shoppingPath, 'utf8'));
    const donkiMap = new Map(stores.map(s => [s.id, s]));
    const updatedShopping = shopping.map(item => {
      if (donkiMap.has(item.id)) {
        const d = donkiMap.get(item.id);
        return {
          ...item,
          lat: d.lat,
          lng: d.lng,
          coordinates: d.coordinates
        };
      }
      return item;
    });
    fs.writeFileSync(shoppingPath, JSON.stringify(updatedShopping, null, 2), 'utf8');
    console.log(`[Donki Geocoder] 已同步更新 ${shoppingPath} (共 ${updatedShopping.length} 筆)！`);
  }
}

main().catch(err => {
  console.error('[Donki Geocoder] 發生錯誤:', err);
  process.exit(1);
});
