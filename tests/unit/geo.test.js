import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateWalkingMinutes,
  findNearestStation,
  isWithinRadius
} from '../../scripts/core/geo.js';
import sampleStations from '../fixtures/sample_station.json';

describe('Geo Core Module Tests', () => {
  describe('calculateDistance', () => {
    it('應正確計算相同點距離為 0 公尺', () => {
      const dist = calculateDistance(35.6812, 139.7671, 35.6812, 139.7671);
      expect(dist).toBe(0);
    });

    it('應正確計算東京站至新宿站之球面距離 (約 6.5 ~ 7 公里)', () => {
      // 東京站 (35.681236, 139.767125) 至 新宿站 (35.689607, 139.700571)
      const dist = calculateDistance(35.681236, 139.767125, 35.689607, 139.700571);
      expect(dist).toBeGreaterThan(6000);
      expect(dist).toBeLessThan(7000);
    });

    it('遇無效輸入時應安全返回 0', () => {
      expect(calculateDistance(undefined, 139.7, 35.6, 139.7)).toBe(0);
    });
  });

  describe('calculateWalkingMinutes', () => {
    it('套用 1.25x 街區路網校正係數與 80m/min 速率', () => {
      // 400m * 1.25 = 500m / 80 = 6.25 -> 7 分鐘
      expect(calculateWalkingMinutes(400)).toBe(7);
      // 80m * 1.25 = 100m / 80 = 1.25 -> 2 分鐘
      expect(calculateWalkingMinutes(80)).toBe(2);
      // 0m 應至少為 1 分鐘
      expect(calculateWalkingMinutes(0)).toBe(1);
    });
  });

  describe('findNearestStation', () => {
    it('給定歌舞伎町座標應正確匹配新宿站', () => {
      // 歌舞伎町 (35.6961, 139.7042)
      const res = findNearestStation(35.6961, 139.7042, sampleStations);
      expect(res.station).not.toBeNull();
      expect(res.station.name).toBe('新宿站');
      expect(res.distanceMeters).toBeLessThan(1000);
      expect(res.walkMinutes).toBeGreaterThan(0);
    });

    it('距離小於等於 500 公尺時 isWithin500m 應為 true', () => {
      // 新宿站本體座標
      const res = findNearestStation(35.689607, 139.700571, sampleStations);
      expect(res.station.name).toBe('新宿站');
      expect(res.isWithin500m).toBe(true);
    });

    it('超出搜尋半徑時應標註無法抵達', () => {
      // 遠在沖繩的座標 (26.2124, 127.6809)
      const res = findNearestStation(26.2124, 127.6809, sampleStations, 1000);
      expect(res.isWithin500m).toBe(false);
      expect(res.note).toContain('超出搜尋半徑');
    });
  });

  describe('isWithinRadius', () => {
    it('正確判定半徑範圍內外', () => {
      expect(isWithinRadius(35.6896, 139.7005, 35.6896, 139.7010, 100)).toBe(true);
      expect(isWithinRadius(35.6896, 139.7005, 35.7896, 139.8005, 500)).toBe(false);
    });
  });
});
