import { describe, it, expect } from 'vitest';
import { validateSpot, validateSpotsBatch } from '../../scripts/core/validator.js';
import sampleSpots from '../fixtures/sample_spots.json';

describe('Data Validator Module Tests', () => {
  it('合規的景點資料應通過驗證', () => {
    const validSpot = sampleSpots[0];
    const res = validateSpot(validSpot);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('缺少名稱或必填欄位時應報錯', () => {
    const invalidSpot = { ...sampleSpots[0], name: '' };
    const res = validateSpot(invalidSpot);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('名稱');
  });

  it('類別不屬於四大大類時應報錯', () => {
    const invalidSpot = { ...sampleSpots[0], category: '休閒娛樂' };
    const res = validateSpot(invalidSpot);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('類別');
  });

  it('品牌欄位為空時應報錯', () => {
    const invalidSpot = { ...sampleSpots[0], brand: '' };
    const res = validateSpot(invalidSpot);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('品牌');
  });

  it('經緯度超出日本國土邊界時應報錯', () => {
    const outOfBoundsSpot = { ...sampleSpots[0], lat: 10.0, lng: 100.0 };
    const res = validateSpot(outOfBoundsSpot);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('日本範圍'))).toBe(true);
  });

  it('批次驗證應正確統計有效與無效數量', () => {
    const batch = [
      sampleSpots[0],
      sampleSpots[1],
      { name: '無效點位', category: '無效類別' }
    ];
    const result = validateSpotsBatch(batch);
    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(1);
    expect(result.invalidItems).toHaveLength(1);
  });
});
