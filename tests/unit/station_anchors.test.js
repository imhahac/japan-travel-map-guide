import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { calculateDistance } from '../../scripts/core/geo.js';
import { PRECISE_STATION_COORDS, INVALID_STATION_NAMES } from '../../scripts/core/station_anchors.js';

describe('車站權威定位與熱海站精確生活圈驗證', () => {
  const stationsPath = path.resolve('src/data/stations.json');
  const spotsPath = path.resolve('src/data/spots.json');

  const stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  const spots = JSON.parse(fs.readFileSync(spotsPath, 'utf8'));

  it('熱海站定位必須為 JR 熱海站精確物理座標，絕不飄移至伊東市', () => {
    const atami = stations.find(s => s.name === '熱海站');
    expect(atami).toBeDefined();

    // 官方 JR 熱海站春日町物理座標
    expect(atami.lat).toBeCloseTo(35.103645, 4);
    expect(atami.lng).toBeCloseTo(139.077795, 4);
    expect(atami.prefecture).toBe('靜岡縣');

    // 驗證與舊錯誤伊東市座標 (34.977588, 139.081513) 差距 > 10 公里
    const driftFromWrongIto = calculateDistance(atami.lat, atami.lng, 34.977588, 139.081513);
    expect(driftFromWrongIto).toBeGreaterThan(13000); // 修正了 14 公里的巨大偏差！
  });

  it('熱海站生活圈必須精準包含「東橫INN 熱海站前」，且步行時間在 5 分鐘內', () => {
    const atami = stations.find(s => s.name === '熱海站');
    expect(atami.spotIds).toContain('toyoko-00166');

    const toyokoAtami = spots.find(s => s.id === 'toyoko-00166');
    expect(toyokoAtami).toBeDefined();
    expect(toyokoAtami.name).toBe('東橫INN 熱海站前');

    const distance = calculateDistance(atami.lat, atami.lng, toyokoAtami.lat, toyokoAtami.lng);
    expect(distance).toBeLessThan(500); // 距離 JR 熱海站僅約 300 公尺
    expect(toyokoAtami.walkMinutes).toBeLessThanOrEqual(5);
  });

  it('熱海站生活圈絕不可包含伊東市、下田市等遠方門市', () => {
    const atami = stations.find(s => s.name === '熱海站');
    const atamiSpots = spots.filter(s => atami.spotIds.includes(s.id));

    // 檢查所有掛在熱海站的店家，距離 JR 熱海站直線距離不可超過 2500m
    for (const spot of atamiSpots) {
      const dist = calculateDistance(atami.lat, atami.lng, spot.lat, spot.lng);
      expect(dist).toBeLessThanOrEqual(2500);
      expect(spot.address).not.toContain('下田市');
      expect(spot.address).not.toContain('伊東市');
    }
  });

  it('全國主要樞紐車站（東京、旭川、青森、柏、大手町等）必須為真實物理座標', () => {
    for (const [stName, expected] of Object.entries(PRECISE_STATION_COORDS)) {
      const st = stations.find(s => s.name === stName);
      if (st) {
        expect(st.lat).toBeCloseTo(expected.lat, 2);
        expect(st.lng).toBeCloseTo(expected.lng, 2);
      }
    }
  });

  it('無效的佔位站名（如「愛知縣主要車站」）已被徹底過濾', () => {
    for (const invalidName of INVALID_STATION_NAMES) {
      const found = stations.find(s => s.name === invalidName);
      expect(found).toBeUndefined();
    }
  });
});
