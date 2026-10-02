import { describe, it, expect } from 'vitest';
import {
  filterStoresWithinStationRadius,
  buildDiningSpots,
  DINING_STORES_SEED
} from '../../scripts/scrapers/dining.js';
import { validateSpot } from '../../scripts/core/validator.js';
import sampleStations from '../fixtures/sample_station.json';
import sampleDining from '../fixtures/sample_dining.json';

describe('Dining & 500m Station Proximity Filter Tests', () => {
  describe('filterStoresWithinStationRadius (500m 演算法)', () => {
    it('距離車站 500 公尺內之門市應被保留，超出者應被嚴格過濾', () => {
      // 新宿站周邊 200m 門市
      const closeStore = {
        name: '新宿近站店',
        lat: 35.6896,
        lng: 139.7020
      };
      // 距離新宿站約 1.5 公里之遠門市
      const farStore = {
        name: '新宿郊區店',
        lat: 35.7050,
        lng: 139.7200
      };

      const result = filterStoresWithinStationRadius([closeStore, farStore], sampleStations, 500);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('新宿近站店');
      expect(result[0].stationDistanceMeters).toBeLessThanOrEqual(500);
      expect(result[0].nearestStation).toBe('新宿站');
    });

    it('空列表或無符合者應安全返回空陣列', () => {
      const farStore = { name: '遠處', lat: 30.0, lng: 130.0 };
      const res = filterStoresWithinStationRadius([farStore], sampleStations, 500);
      expect(res).toHaveLength(0);
    });
  });

  describe('buildDiningSpots', () => {
    it('應正確建置平價美食門市且全部符合 Schema 驗證', () => {
      const spots = buildDiningSpots(DINING_STORES_SEED, sampleStations, 1000);
      expect(spots.length).toBeGreaterThanOrEqual(8);

      for (const s of spots) {
        expect(s.category).toBe('美食餐廳');
        expect(['吉野家', '松屋', 'すき家', '客美多咖啡', '一蘭拉麵']).toContain(s.brand);
        expect(s.id).toMatch(/^dining-/);
        expect(s.walkMinutes).toBeGreaterThan(0);

        const validation = validateSpot(s);
        expect(validation.isValid, `Dining spot ${s.name} failed: ${validation.errors.join(', ')}`).toBe(true);
      }
    });

    it('sampleDining 中的吉野家與松屋應包含 24小時營業 標籤', () => {
      const spots = buildDiningSpots(sampleDining, sampleStations, 1000);
      const yoshinoya = spots.find(s => s.brand === '吉野家');
      expect(yoshinoya).toBeDefined();
      expect(yoshinoya.tags).toContain('24小時營業');

      const matsuya = spots.find(s => s.brand === '松屋');
      expect(matsuya).toBeDefined();
      expect(matsuya.tags).toContain('24小時營業');
    });

    it('客美多咖啡應包含買飲料送早餐標籤', () => {
      const spots = buildDiningSpots(sampleDining, sampleStations, 1000);
      const komeda = spots.find(s => s.brand === '客美多咖啡');
      expect(komeda).toBeDefined();
      expect(komeda.tags).toContain('買飲料送早餐');
    });
  });
});
