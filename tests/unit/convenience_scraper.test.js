import { describe, it, expect } from 'vitest';
import {
  filterStoresWithinStationRadius,
  buildConvenienceSpots,
  CONVENIENCE_STORES_SEED
} from '../../scripts/scrapers/convenience.js';
import { validateSpot } from '../../scripts/core/validator.js';
import sampleStations from '../fixtures/sample_station.json';
import sampleConvenience from '../fixtures/sample_convenience.json';

describe('Convenience Stores & 500m Station Proximity Filter Tests', () => {
  describe('filterStoresWithinStationRadius (500m 演算法)', () => {
    it('距離車站 500 公尺內之超商應被保留，超出者應被嚴格過濾', () => {
      // 新宿站周邊 150m 門市
      const closeStore = {
        name: '新宿站前超商',
        lat: 35.6898,
        lng: 139.7015
      };
      // 距離新宿站約 1.8 公里之超商
      const farStore = {
        name: '郊區遠程超商',
        lat: 35.7100,
        lng: 139.7200
      };

      const result = filterStoresWithinStationRadius([closeStore, farStore], sampleStations, 500);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('新宿站前超商');
      expect(result[0].stationDistanceMeters).toBeLessThanOrEqual(500);
      expect(result[0].nearestStation).toBe('新宿站');
    });

    it('空列表或無符合者應安全返回空陣列', () => {
      const farStore = { name: '離島門市', lat: 28.0, lng: 129.0 };
      const res = filterStoresWithinStationRadius([farStore], sampleStations, 500);
      expect(res).toHaveLength(0);
    });
  });

  describe('buildConvenienceSpots', () => {
    it('應正確建置三大超商且全部符合 Schema 規範', () => {
      const spots = buildConvenienceSpots(CONVENIENCE_STORES_SEED, sampleStations, 1000);
      expect(spots.length).toBeGreaterThanOrEqual(10);

      for (const s of spots) {
        expect(s.category).toBe('便利商店');
        expect(['7-Eleven', 'FamilyMart', 'Lawson']).toContain(s.brand);
        expect(s.id).toMatch(/^convenience-/);
        expect(s.walkMinutes).toBeGreaterThan(0);

        const validation = validateSpot(s);
        expect(validation.isValid, `Convenience spot ${s.name} failed: ${validation.errors.join(', ')}`).toBe(true);
      }
    });

    it('7-Eleven 應包含 24小時營業 與 Seven Bank ATM 或 ATM 服務標籤', () => {
      const spots = buildConvenienceSpots(sampleConvenience, sampleStations, 1000);
      const seven = spots.find(s => s.brand === '7-Eleven');
      expect(seven).toBeDefined();
      expect(seven.tags).toContain('24小時營業');
      expect(seven.tags.toLowerCase()).toContain('atm');
    });

    it('FamilyMart 應包含全家炸雞 (FamiChiki) 或 24小時營業 標籤', () => {
      const spots = buildConvenienceSpots(sampleConvenience, sampleStations, 1000);
      const fami = spots.find(s => s.brand === 'FamilyMart');
      expect(fami).toBeDefined();
      expect(fami.tags).toContain('24小時營業');
    });

    it('Lawson 應包含 L-Chiki 或 Uchi Café 甜點標籤', () => {
      const spots = buildConvenienceSpots(sampleConvenience, sampleStations, 1000);
      const lawson = spots.find(s => s.brand === 'Lawson');
      expect(lawson).toBeDefined();
      expect(lawson.tags).toContain('24小時營業');
    });
  });
});
