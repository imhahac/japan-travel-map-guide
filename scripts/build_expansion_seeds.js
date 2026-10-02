import fs from 'fs';
import path from 'path';
import { saveApaSeed } from './scrapers/apa.js';
import { saveShoppingSeed } from './scrapers/shopping.js';

const stationsPath = path.resolve('src/data/stations.json');
const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];

console.log(`[Seed Builder] 載入 ${stations.length} 處車站資料，開始產生擴充種子檔...`);

// 1. APA 飯店擴充種子
let apaSpots = [];
const apaPath = path.resolve('src/data/apa_seed.json');
if (fs.existsSync(apaPath)) {
  apaSpots = JSON.parse(fs.readFileSync(apaPath, 'utf8'));
  console.log(`[Seed Builder] APA 飯店已具備: ${apaSpots.length} 間 (完整全國門市)`);
} else {
  apaSpots = saveApaSeed(stations);
  console.log(`[Seed Builder] APA 飯店已產出: ${apaSpots.length} 間`);
}

// 2. 購物藥妝（唐吉訶德 + 松本清 + Bic Camera + 友都八喜）擴充種子
const shoppingSpots = saveShoppingSeed(stations);
console.log(`[Seed Builder] 購物藥妝已產出: ${shoppingSpots.length} 間`);

console.log('[Seed Builder] 種子資料產出完畢！');
