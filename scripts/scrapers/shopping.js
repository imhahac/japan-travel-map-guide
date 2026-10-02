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
import { getAllElectronicsSpots } from './electronics.js';

export function buildShoppingSpots(stationsList = []) {
  const fullDonkiPath = path.resolve('src/data/donki_full_seed.json');
  let donkiSpots = [];
  if (fs.existsSync(fullDonkiPath)) {
    donkiSpots = JSON.parse(fs.readFileSync(fullDonkiPath, 'utf8'));
  } else {
    donkiSpots = buildDonkiStores(DONKI_STORES_SEED, stationsList);
  }
  const matsukiyoSpots = buildMatsukiyoStores(MATSUKIYO_STORES_SEED, stationsList);
  const electronicsSpots = getAllElectronicsSpots(stationsList);
  return [...donkiSpots, ...matsukiyoSpots, ...electronicsSpots];
}

export function saveShoppingSeed(stationsList = [], outDir = 'src/data') {
  const spots = buildShoppingSpots(stationsList);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const targetPath = path.join(outDir, 'shopping_seed.json');
  fs.writeFileSync(targetPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[Shopping] 成功儲存 ${spots.length} 筆購物藥妝門市 (含 Donki、松本清、Bic Camera、Yodobashi) 至 ${targetPath}`);
  return spots;
}

