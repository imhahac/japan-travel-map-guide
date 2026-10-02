import { describe, it, expect } from 'vitest';
import { generateSpotKey, deduplicateSpots } from '../../scripts/core/dedupe.js';
import sampleSpots from '../fixtures/sample_spots.json';

describe('Deduplication Module Tests', () => {
  it('generateSpotKey 應正確產生標準格式', () => {
    const key = generateSpotKey(sampleSpots[0]);
    expect(key).toBe('toyoko-test-01');

    const keyWithoutId = generateSpotKey({
      brand: '東橫 INN',
      name: '新宿歌舞伎町',
      lat: 35.6961,
      lng: 139.7042
    });
    expect(keyWithoutId).toContain('東橫inn_新宿歌舞伎町');
  });

  it('重複 ID 之資料應被去重過濾', () => {
    const duplicateList = [
      sampleSpots[0],
      { ...sampleSpots[0], notes: '重複項' }
    ];
    const { uniqueSpots, duplicateCount } = deduplicateSpots(duplicateList);
    expect(uniqueSpots).toHaveLength(1);
    expect(duplicateCount).toBe(1);
  });

  it('同品牌且相距 50 公尺內之門市應合併去重', () => {
    const spotA = {
      brand: 'APA飯店',
      name: 'APA飯店 歌舞伎町A',
      lat: 35.6953,
      lng: 139.7018,
      phone: '03-1234-5678'
    };
    // 相距僅約 10 公尺的同一間分店（微幅座標誤差）
    const spotB = {
      brand: 'APA飯店',
      name: 'アパホテル 歌舞伎町B',
      lat: 35.69538,
      lng: 139.70185,
      imageUrl: 'https://example.com/photo.jpg'
    };

    const { uniqueSpots, duplicateCount } = deduplicateSpots([spotA, spotB]);
    expect(uniqueSpots).toHaveLength(1);
    expect(duplicateCount).toBe(1);
    // 合併後的物件應補足原有缺失資訊
    expect(uniqueSpots[0].phone).toBe('03-1234-5678');
    expect(uniqueSpots[0].imageUrl).toBe('https://example.com/photo.jpg');
  });

  it('不同品牌即使在同一座標亦不可去重', () => {
    const hotel = {
      brand: '東橫INN',
      name: '東橫INN 新宿',
      lat: 35.6953,
      lng: 139.7018
    };
    const donki = {
      brand: '唐吉訶德',
      name: '唐吉訶德 新宿東口店',
      lat: 35.6953,
      lng: 139.7018
    };

    const { uniqueSpots, duplicateCount } = deduplicateSpots([hotel, donki]);
    expect(uniqueSpots).toHaveLength(2);
    expect(duplicateCount).toBe(0);
  });
});
