/**
 * =========================================================================
 * 購物藥妝整合模組 (Shopping Aggregator Module)
 * =========================================================================
 * 彙整唐吉訶德 (Don Quijote) 與松本清 (Matsumoto Kiyoshi) 門市資料。
 */

import fs from 'fs';
import path from 'path';
import { buildDonkiStores, DONKI_STORES_SEED } from './donki.js';
import { buildMatsukiyoStores, MATSUKIYO_STORES_SEED } from './matsumoto.js';

export function buildShoppingSpots(stationsList = []) {
  const donkiSpots = buildDonkiStores(DONKI_STORES_SEED, stationsList);
  const matsukiyoSpots = buildMatsukiyoStores(MATSUKIYO_STORES_SEED, stationsList);
  return [...donkiSpots, ...matsukiyoSpots];
}

export function saveShoppingSeed(stationsList = [], outDir = 'src/data') {
  const spots = buildShoppingSpots(stationsList);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const targetPath = path.join(outDir, 'shopping_seed.json');
  fs.writeFileSync(targetPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[Shopping] 成功儲存 ${spots.length} 筆購物藥妝門市至 ${targetPath}`);
  return spots;
}
