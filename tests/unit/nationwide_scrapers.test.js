import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateSpot, validateSpotsBatch } from '../../scripts/core/validator.js';
import { crawlBicCamera } from '../../scripts/scrapers/crawl_bic_camera.js';
import { crawlSukiya } from '../../scripts/scrapers/crawl_sukiya.js';
import { crawlHamaSushi } from '../../scripts/scrapers/crawl_hama.js';
import { crawlMatsuya } from '../../scripts/scrapers/crawl_matsuya.js';
import { crawlSushiro } from '../../scripts/scrapers/crawl_sushiro.js';
import { crawlKuraSushi } from '../../scripts/scrapers/crawl_kura.js';
import { crawlOotoya } from '../../scripts/scrapers/crawl_ootoya.js';
import { crawlKomeda } from '../../scripts/scrapers/crawl_komeda.js';
import { crawlYayoiken } from '../../scripts/scrapers/crawl_yayoiken.js';
import { crawlSaizeriya } from '../../scripts/scrapers/crawl_saizeriya.js';
import { crawlShakeShack } from '../../scripts/scrapers/crawl_shakeshack.js';

describe('Nationwide 11-Brand Official Scrapers Test Suite', { timeout: 20000 }, () => {
  const sampleStations = [
    { name: '新宿', lat: 35.6909, lng: 139.7003, lines: ['JR 山手線'] },
    { name: '東京', lat: 35.6812, lng: 139.7671, lines: ['JR 山手線'] }
  ];

  it('1. Bic Camera 爬蟲應建置真實門市且通過格式驗證', () => {
    const spots = crawlBicCamera(sampleStations, { verbose: false });
    expect(spots.length).toBeGreaterThanOrEqual(40);
    const first = spots[0];
    expect(first.brand).toBe('Bic Camera');
    expect(first.category).toBe('購物藥妝');
    expect(first.subcategory).toBe('3C家電');
    const val = validateSpotsBatch(spots);
    expect(val.invalidCount).toBe(0);
  });

  it('2. すき家 (Sukiya) 爬蟲應抓取真實門市並符合 Schema', async () => {
    const spots = await crawlSukiya(sampleStations, { prefectures: ['東京都'], verbose: false });
    expect(spots.length).toBeGreaterThanOrEqual(100);
    const first = spots[0];
    expect(first.brand).toBe('すき家');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('牛丼');
    expect(validateSpot(first).isValid).toBe(true);
  });

  it('3. はま寿司 (Hama Sushi) 爬蟲應抓取真實門市並符合 Schema', async () => {
    const spots = await crawlHamaSushi(sampleStations, { prefectures: ['東京都'], verbose: false });
    expect(spots.length).toBeGreaterThanOrEqual(30);
    const first = spots[0];
    expect(first.brand).toBe('はま寿司');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('壽司');
    expect(validateSpot(first).isValid).toBe(true);
  });

  it('4. 松屋 (Matsuya) 爬蟲應自 Navitime Citrus API 獲取真實門市', async () => {
    const spots = await crawlMatsuya(sampleStations, { limit: 10, maxStores: 10, verbose: false });
    expect(spots.length).toBe(10);
    const first = spots[0];
    expect(first.brand).toBe('松屋');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('牛丼');
    expect(validateSpot(first).isValid).toBe(true);
  });

  it('5. 大戶屋 (Ootoya) 爬蟲應自 Canly API 獲取真實日本門市', async () => {
    const spots = await crawlOotoya(sampleStations, { verbose: false });
    expect(spots.length).toBeGreaterThanOrEqual(300);
    const first = spots[0];
    expect(first.brand).toBe('大戶屋');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('定食');
    expect(validateSpot(first).isValid).toBe(true);
  });

  it('6. 藏壽司 (Kura Sushi) 爬蟲應自官方 data-store 獲取門市並建立坐標', async () => {
    const spots = await crawlKuraSushi(sampleStations, { maxStores: 10, verbose: false });
    expect(spots.length).toBe(10);
    const first = spots[0];
    expect(first.brand).toBe('藏壽司');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('壽司');
    expect(validateSpot(first).isValid).toBe(true);
  });

  it('7. 客美多咖啡 (Komeda) 爬蟲應獲取官方經緯度與營業標籤', async () => {
    const spots = await crawlKomeda(sampleStations, { maxDetailFetch: 5, verbose: false });
    expect(spots.length).toBeGreaterThanOrEqual(5);
    const first = spots[0];
    expect(first.brand).toBe('客美多咖啡');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('咖啡');
    expect(validateSpot(first).isValid).toBe(true);
  });

  it('8. やよい軒 (Yayoiken) 爬蟲應獲取經緯度與電話', async () => {
    const spots = await crawlYayoiken(sampleStations, { maxKencodes: 1, verbose: false });
    expect(spots.length).toBeGreaterThanOrEqual(5);
    const first = spots[0];
    expect(first.brand).toBe('やよい軒');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('定食');
    expect(validateSpot(first).isValid).toBe(true);
  });

  it('9. 壽司郎 (Sushiro) 爬蟲應解析門市清單與經緯度', async () => {
    const spots = await crawlSushiro(sampleStations, { maxDetailFetch: 3, verbose: false });
    expect(spots.length).toBeGreaterThanOrEqual(3);
    const first = spots[0];
    expect(first.brand).toBe('壽司郎');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('壽司');
    expect(validateSpot(first).isValid).toBe(true);
  });

  it('10. 薩莉亞 (Saizeriya) 爬蟲應自 Navitime Citrus API 獲取真實日本門市且符合 Schema', async () => {
    const spots = await crawlSaizeriya(sampleStations, { limit: 10, maxStores: 10, verbose: false });
    expect(spots.length).toBe(10);
    const first = spots[0];
    expect(first.brand).toBe('薩莉亞');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('家庭餐廳');
    expect(validateSpot(first).isValid).toBe(true);
  });

  it('11. Shake Shack 爬蟲應獲取官方門市資訊、美式漢堡子分類且符合 Schema', async () => {
    const spots = await crawlShakeShack(sampleStations, { maxStores: 5, verbose: false });
    expect(spots.length).toBeGreaterThanOrEqual(5);
    const first = spots[0];
    expect(first.brand).toBe('Shake Shack');
    expect(first.category).toBe('美食餐廳');
    expect(first.subcategory).toBe('漢堡輕食');
    expect(validateSpot(first).isValid).toBe(true);
  }, 15000);
});
