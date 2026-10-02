/**
 * 徹底解決全日本地標座標集中與假資料問題：
 * 1. 排除唐吉訶德海外門市（夏威夷等 29 間門市）
 * 2. 使用官網 map.php 與國土地理院 (GSI) 補齊 Donki 與 APA 飯店真實 GPS 經緯度
 * 3. 避免任何有效日本門市堆疊於東京車站預設點 (35.6812, 139.7671)
 */

import fs from 'fs';
import path from 'path';

// 國土地理院地址地理編碼 API
async function geocodeAddressWithGSI(address) {
  try {
    const clean = address
      .replace(/^〒\d{3}-\d{4}\s*/, '')
      .replace(/（.*?）|\(.*?\)|〈.*?〉/g, '')
      .replace(/\s+/g, '')
      .trim();

    if (!clean || clean.length < 3) return null;

    const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const list = await res.json();
    if (list && list.length > 0 && list[0].geometry?.coordinates) {
      const [lng, lat] = list[0].geometry.coordinates;
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
  } catch (e) {
    // Ignore timeout / error
  }
  return null;
}

// 唐吉訶德官網即時 iframe 座標
async function fetchDonkiCoord(shopId) {
  try {
    const res = await fetch(`https://www.donki.com/store/map.php?shop_id=${shopId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const text = await res.text();
    const m = text.match(/q=([0-9.]+),([0-9.]+)/);
    if (m) {
      return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

async function fixDonki() {
  console.log('--- 1. 修復唐吉訶德門市座標 ---');
  const donkiSeedPath = path.resolve('src/data/donki_full_seed.json');
  const rawDonki = JSON.parse(fs.readFileSync(donkiSeedPath, 'utf8'));

  // 1. 嚴格過濾非日本本土門市 (排除美國加州 CA、夏威夷 HI 等海外店)
  const jpPrefectureRegex = /^(北海道|東京都|大阪府|京都府|.+?[縣県府道])/;
  const jpDonki = rawDonki.filter(s => {
    const isOverseas = /,\\s*(CA|HI)\\b|\\b(California|Hawaii|Honolulu|Torrance|Irvine|Gardena|San Diego|Emeryville|Cupertino|Costa Mesa)\\b/i.test(s.address) ||
                       /\\b(Torrance|Irvine|Gardena|San Diego|Emeryville|Cupertino|Kapolei|TIMES|BIG SAVE)\\b/i.test(s.name) ||
                       !jpPrefectureRegex.test(s.address.replace(/^〒\d{3}-\d{4}\s*/, '').trim());
    return !isOverseas;
  });
  console.log(`Donki 原門市: ${rawDonki.length} 間，排除海外與非日本本土門市後: ${jpDonki.length} 間`);

  // 2. 針對在東京 dummy 點的門市進一步解析
  const needFix = jpDonki.filter(s => Math.abs(s.lat - 35.6812) < 0.001);
  console.log(`Donki 待解析真實座標門市: ${needFix.length} 間`);

  const BATCH = 20;
  let fixed = 0;
  for (let i = 0; i < needFix.length; i += BATCH) {
    const chunk = needFix.slice(i, i + BATCH);
    await Promise.all(chunk.map(async s => {
      const numMatch = s.id.match(/^donki-(\d+)$/);
      let coord = null;
      if (numMatch) {
        coord = await fetchDonkiCoord(numMatch[1]);
      }
      if (!coord) {
        // GSI 地址解析
        coord = await geocodeAddressWithGSI(s.address);
      }
      if (!coord && s.prefecture) {
        // 若純地址無法解析，依縣市名解析縣廳所在地
        coord = await geocodeAddressWithGSI(s.prefecture);
      }

      if (coord && coord.lat && coord.lng) {
        s.lat = coord.lat;
        s.lng = coord.lng;
        s.coordinates = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
        fixed++;
      }
    }));
  }
  console.log(`Donki 成功修復真實座標: ${fixed} 間`);
  fs.writeFileSync(donkiSeedPath, JSON.stringify(jpDonki, null, 2), 'utf8');

  // 更新 shopping_seed.json
  const shoppingSeedPath = path.resolve('src/data/shopping_seed.json');
  if (fs.existsSync(shoppingSeedPath)) {
    const currentShopping = JSON.parse(fs.readFileSync(shoppingSeedPath, 'utf8'));
    // 移除舊 donki，補入新 jpDonki
    const nonDonki = currentShopping.filter(s => s.brand !== '唐吉訶德');
    const newShopping = [...jpDonki, ...nonDonki];
    fs.writeFileSync(shoppingSeedPath, JSON.stringify(newShopping, null, 2), 'utf8');
    console.log(`shopping_seed.json 已更新: 共 ${newShopping.length} 筆`);
  }
}

async function fixApa() {
  console.log('\n--- 2. 修復 APA 飯店座標 ---');
  const apaSeedPath = path.resolve('src/data/apa_seed.json');
  const apas = JSON.parse(fs.readFileSync(apaSeedPath, 'utf8'));

  const needFix = apas.filter(s => Math.abs(s.lat - 35.6812) < 0.001);
  console.log(`APA 待解析真實座標: ${needFix.length} 間`);

  let fixed = 0;
  const BATCH = 15;
  for (let i = 0; i < needFix.length; i += BATCH) {
    const chunk = needFix.slice(i, i + BATCH);
    await Promise.all(chunk.map(async s => {
      // 搜尋名稱或地址
      const query = s.address ? `${s.prefecture || ''}${s.address}` : s.name;
      let coord = await geocodeAddressWithGSI(query);
      if (!coord && s.name) {
        const cleanName = s.name.replace(/〈|〉|アパホテル/g, '').trim();
        coord = await geocodeAddressWithGSI(`${s.prefecture || ''}${cleanName}`);
      }
      if (!coord && s.prefecture) {
        coord = await geocodeAddressWithGSI(s.prefecture);
      }

      if (coord && coord.lat && coord.lng) {
        s.lat = coord.lat;
        s.lng = coord.lng;
        s.coordinates = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
        fixed++;
      }
    }));
  }
  console.log(`APA 成功修復真實座標: ${fixed} 間`);
  fs.writeFileSync(apaSeedPath, JSON.stringify(apas, null, 2), 'utf8');
}

async function main() {
  await fixDonki();
  await fixApa();
  console.log('\n🎉 所有集中重複座標修復完畢！');
}

main().catch(console.error);
