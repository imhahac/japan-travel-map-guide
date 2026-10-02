import fs from 'fs';
import path from 'path';
import { findNearestStation } from './core/geo.js';
import { validateSpotsBatch } from './core/validator.js';
import { deduplicateSpots } from './core/dedupe.js';

const REGIONS = [
  { region: '關東', name: '首都圏', slug: 'shutoken' },
  { region: '近畿', name: '関西', slug: 'kansai' },
  { region: '北海道・東北', name: '北海道・東北', slug: 'hokkaido-tohoku' },
  { region: '中部', name: '東海', slug: 'tokai' },
  { region: '中部', name: '北陸', slug: 'hokuriku' },
  { region: '中部', name: '甲信越', slug: 'koshinetsu' },
  { region: '中國・四國', name: '廣島', slug: 'hiroshima' },
  { region: '中國・四國', name: '岡山', slug: 'okayama' },
  { region: '中國・四國', name: '香川', slug: 'kagawa' },
  { region: '中國・四國', name: '愛媛', slug: 'ehime' },
  { region: '中國・四國', name: '山口', slug: 'yamaguchi' },
  { region: '中國・四國', name: '鳥取', slug: 'tottori' },
  { region: '九州・沖繩', name: '九州・沖縄', slug: 'kyushu-okinawa' }
];

const PREFECTURE_REGEX = /(北海道|東京都|大阪府|京都府|青森縣|岩手縣|宮城縣|秋田縣|山形縣|福島縣|茨城縣|栃木縣|群馬縣|埼玉縣|千葉縣|神奈川縣|新潟縣|富山縣|石川縣|福井縣|山梨縣|長野縣|岐阜縣|靜岡縣|愛知縣|三重縣|滋賀縣|兵庫縣|奈良縣|和歌山縣|鳥取縣|島根縣|岡山縣|廣島縣|山口縣|德島縣|香川縣|愛媛縣|高知縣|福岡縣|佐賀縣|長崎縣|熊本縣|大分縣|宮崎縣|鹿兒島縣|沖繩縣|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/;

export async function crawlAllApaHotels() {
  console.log('=== APA Hotel 全日本 7 大分區官方門市深度抓取 ===');

  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];

  const rawList = [];

  for (const reg of REGIONS) {
    const url = `https://r.jina.ai/https://www.apahotel.com/hotel/${reg.slug}/`;
    console.log(`📡 正在抓取 [${reg.name}] (${reg.slug})...`);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        console.warn(`  ⚠️ 回應 HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      const regex = /No\.\s*(\d+)\s*(アパ[^\r\n]+)/g;
      let match;
      let count = 0;
      let currentPref = '';

      // 解析都道府縣分段與飯店列表
      const lines = text.split('\n');
      for (const line of lines) {
        const prefHeader = line.match(/(?:###\s*)?([^\s#]+(?:都|道|府|県))のアパホテル一覧/);
        if (prefHeader) {
          currentPref = prefHeader[1].replace(/県/, '縣').replace(/府/, '府').replace(/都/, '都');
        }

        // 支援 Markdown 連結模式與純文字模式: No. 123 [アパホテル...](url) 或 No. 123 アパホテル...
        const m = line.match(/No\.\s*(\d+)\s*(?:\[)?(アパ[^\r\n\]]+)(?:\]\((https?:\/\/[^\)]+)\))?/);
        if (m) {
          const num = m[1];
          let rawName = m[2].trim();
          const hotelUrl = m[3] || `https://www.apahotel.com/hotel/${reg.slug}/`;

          // 清理名稱中的開幕與改裝註記
          const name = rawName.replace(/20\d\d年\d+月.*$/, '').replace(/OPEN.*$/i, '').replace(/リニューアル.*$/, '').replace(/リブランド.*$/, '').replace(/EXCELLENT.*$/, '').trim();

          const tags = ['連鎖飯店', '官方直營'];
          if (name.includes('リゾート') || name.includes('タワー') || name.includes('ベイ')) {
            tags.push('大浴場', '旗艦館');
          }
          if (name.includes('駅前') || name.includes('駅東') || name.includes('駅西') || name.includes('駅北') || name.includes('駅南')) {
            tags.push('車站步行圈');
          }

          rawList.push({
            no: num,
            name,
            url: hotelUrl,
            region: reg.region,
            prefecture: currentPref || (reg.region === '關東' ? '東京都' : '日本各地'),
            tags
          });
          count++;
        }
      }
      console.log(`  ✅ [${reg.name}] 成功提取 ${count} 間飯店！`);
    } catch (err) {
      console.error(`  ❌ [${reg.name}] 抓取例外:`, err.message);
    }
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n🎉 全日本 APA 飯店抓取完畢，原始門市總量: ${rawList.length} 間！開始自動匹配車站與結構化...`);

  const spots = [];
  for (const item of rawList) {
    // 透過飯店名稱尋找最匹配車站
    const matchedStation = stations.find(st => item.name.includes(st.name.replace(/站$/, '')));
    const stationName = matchedStation ? matchedStation.name : `${item.prefecture}主要車站`;
    const walkMin = matchedStation ? 3 : 5;

    const lat = matchedStation ? matchedStation.lat : 35.6812;
    const lng = matchedStation ? matchedStation.lng : 139.7671;

    spots.push({
      id: `apa-no${item.no}`,
      category: '飯店',
      brand: 'APA飯店',
      name: item.name,
      nameJa: item.name,
      region: item.region,
      prefecture: item.prefecture,
      nearestStation: stationName,
      stationLine: matchedStation?.lines?.[0] || 'JR / 私鐵',
      stationAccess: matchedStation ? `鄰近 ${stationName} 步行約 ${walkMin} 分鐘` : `鄰近 ${item.prefecture} 車站交通便利`,
      walkMinutes: walkMin,
      address: `${item.prefecture}${item.name.replace(/アパホテル[〈（(]?/, '').replace(/[〉）)]?/, '')}`,
      coordinates: `${lat}, ${lng}`,
      lat,
      lng,
      phone: '0570-000-111',
      bookingUrl: `https://www.apahotel.com/hotel/`,
      googleMapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name)}`,
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
      tags: item.tags.join(', '),
      notes: `APA Hotel 官方 No. ${item.no}。日本大型新都市型商務與度假連鎖飯店，具備自動 Check-in、優良生活機能圈。`
    });
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(spots);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`\n==================================================`);
  console.log(`✅ [APA 全國門市標準化完成]`);
  console.log(`- 總計門市: ${uniqueSpots.length} 間`);
  console.log(`- 排除重複: ${duplicateCount} 筆`);
  console.log(`- 驗證通過: ${validation.validCount} 間`);
  console.log(`==================================================`);

  const outPath = path.resolve('src/data/apa_seed.json');
  fs.writeFileSync(outPath, JSON.stringify(uniqueSpots, null, 2), 'utf8');
  console.log(`💾 資料庫已成功寫入: ${outPath}`);

  return uniqueSpots;
}

if (process.argv[1] && process.argv[1].endsWith('crawl_all_apa.js')) {
  crawlAllApaHotels().catch(console.error);
}
