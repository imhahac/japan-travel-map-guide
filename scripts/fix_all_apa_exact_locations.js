/**
 * 抓取全日本 APA 飯店真實官方門牌地址與國土地理院 (GSI) 高精度 GPS 經緯度，
 * 徹底解決「定位偏移」與「地址截斷 (如 東京都小伝馬町駅前〉)」問題。
 */

import fs from 'fs';
import path from 'path';

const SLUGS = [
  { region: '關東', slug: 'shutoken' },
  { region: '近畿', slug: 'kansai' },
  { region: '北海道・東北', slug: 'hokkaido-tohoku' },
  { region: '中部', slug: 'tokai' },
  { region: '中部', slug: 'hokuriku' },
  { region: '中部', slug: 'koshinetsu' },
  { region: '中國・四國', slug: 'chushikoku' },
  { region: '九州・沖繩', slug: 'kyushu-okinawa' }
];

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
    // ignore
  }
  return null;
}

function cleanHotelName(raw) {
  return raw
    .replace(/20\d\d年\d+月.*$/, '')
    .replace(/OPEN.*$/i, '')
    .replace(/リニューアル.*$/, '')
    .replace(/リブランド.*$/, '')
    .replace(/EXCELLENT.*$/, '')
    .replace(/\[|\]/g, '')
    .trim();
}

async function run() {
  console.log('=== 1. 從 APA 官網即時擷取全日本各分館之真實門牌地址與郵遞區號 ===');
  const officialHotelsByNo = new Map();
  const officialHotelsByName = new Map();

  for (const { region, slug } of SLUGS) {
    console.log(`📡 抓取分區: [${slug}]...`);
    try {
      const res = await fetch(`https://r.jina.ai/https://www.apahotel.com/hotel/${slug}/`);
      if (!res.ok) {
        console.warn(`  ⚠️ HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      const regex = /No\.\s*(\d+)\s*\[?\s*(アパ[^\]\r\n]+)\]?[\s\S]*?〒(\d{3}-\d{4})\s*([\r\n]+)?([^\r\n]+?)(?:\s*\[?地図を見る\]?)?[\r\n]/g;
      let match;
      let count = 0;
      while ((match = regex.exec(text)) !== null) {
        const no = match[1];
        const rawName = match[2];
        const name = cleanHotelName(rawName);
        const postal = match[3];
        const address = match[5].replace(/\[?地図を見る\]?/, '').replace(/\(.*?\)/g, '').trim();
        if (address && address.length > 4) {
          const entry = { no, name, rawName, postal, address, region };
          officialHotelsByNo.set(no, entry);
          officialHotelsByName.set(name, entry);
          officialHotelsByName.set(name.replace(/〈.*?〉/, '').trim(), entry);
          count++;
        }
      }
      console.log(`  ✅ [${slug}] 成功提取 ${count} 間飯店真實地址！`);
    } catch (err) {
      console.warn(`  ❌ 抓取例外:`, err.message);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n官網共提取到 ${officialHotelsByNo.size} 間分館官方真實地址！`);

  // 讀取既有 apa_seed.json
  const apaSeedPath = path.resolve('src/data/apa_seed.json');
  const apaList = JSON.parse(fs.readFileSync(apaSeedPath, 'utf8'));

  console.log(`\n=== 2. 逐一比對修正 apa_seed.json (${apaList.length} 間) 的地址與經緯度 ===`);
  let addressFixed = 0;
  let geocoded = 0;

  for (let i = 0; i < apaList.length; i++) {
    const item = apaList[i];
    const noMatch = item.id.match(/^apa-no(\d+)$/);
    const cleanName = cleanHotelName(item.name);
    const official = (noMatch ? officialHotelsByNo.get(noMatch[1]) : null) ||
                     officialHotelsByName.get(cleanName) ||
                     officialHotelsByName.get(cleanName.replace(/〈.*?〉/, '').trim());

    if (official && official.address) {
      item.address = official.address;
      addressFixed++;

      // GSI 地理編碼精準定位
      const coord = await geocodeAddressWithGSI(official.address);
      if (coord && coord.lat && coord.lng) {
        item.lat = coord.lat;
        item.lng = coord.lng;
        item.coordinates = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
        geocoded++;
      }
    } else {
      // 嘗試用現有名稱與都道府縣地址解析
      const cleanAddress = item.address ? item.address.replace(/〉/g, '').trim() : '';
      let coord = null;
      if (cleanAddress && cleanAddress.length >= 6) {
        coord = await geocodeAddressWithGSI(cleanAddress);
      }
      if (!coord) {
        coord = await geocodeAddressWithGSI(`${item.prefecture} ${cleanName}`);
      }
      if (coord && coord.lat && coord.lng) {
        item.lat = coord.lat;
        item.lng = coord.lng;
        item.coordinates = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
        geocoded++;
      }
    }

    if ((i + 1) % 50 === 0 || i === apaList.length - 1) {
      console.log(`  進度: ${i + 1}/${apaList.length}，地址已校正: ${addressFixed}，經緯度已高精度編碼: ${geocoded}`);
    }
  }

  // 寫回 apa_seed.json
  fs.writeFileSync(apaSeedPath, JSON.stringify(apaList, null, 2), 'utf8');
  console.log(`\n🎉 apa_seed.json 更新完成！已修復地址 ${addressFixed} 間，精準校正經緯度 ${geocoded} 間！`);

  // 特別驗證小伝馬町駅前
  const kodem = apaList.find(x => x.id === 'apa-no188' || x.name.includes('小伝馬町'));
  console.log('\n🔍 特別驗證 [アパホテル〈小伝馬町駅前〉]:');
  console.log(JSON.stringify(kodem, null, 2));

  process.exit(0);
}

run();
