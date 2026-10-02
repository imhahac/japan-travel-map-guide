import { describe, it, expect } from 'vitest';
import { buildDonkiStores, DONKI_STORES_SEED } from '../../scripts/scrapers/donki.js';
import { buildMatsukiyoStores, MATSUKIYO_STORES_SEED } from '../../scripts/scrapers/matsumoto.js';
import { buildShoppingSpots } from '../../scripts/scrapers/shopping.js';
import { validateSpot } from '../../scripts/core/validator.js';
import sampleStations from '../fixtures/sample_station.json';
import sampleShopping from '../fixtures/sample_shopping.json';

describe('Shopping & Drugstore Scraper Tests', () => {
  describe('Don Quijote Scraper', () => {
    it('應正確建置唐吉訶德門市且全部符合 Schema', () => {
      const stores = buildDonkiStores(DONKI_STORES_SEED, sampleStations);
      expect(stores.length).toBeGreaterThanOrEqual(15);

      for (const s of stores) {
        expect(s.brand).toBe('唐吉訶德');
        expect(s.category).toBe('購物藥妝');
        expect(s.id).toMatch(/^donki-/);
        expect(s.tags).toContain('免稅 (Tax-Free)');

        const validation = validateSpot(s);
        expect(validation.isValid, `Store ${s.name} failed: ${validation.errors.join(', ')}`).toBe(true);
      }
    });

    it('歌舞伎町店應標記 24小時營業 且配對至新宿站', () => {
      const stores = buildDonkiStores(sampleShopping, sampleStations);
      const kabukicho = stores.find(s => s.id.includes('shinjuku-kabukicho'));
      expect(kabukicho).toBeDefined();
      expect(kabukicho.tags).toContain('24小時營業');
      expect(kabukicho.nearestStation).toBe('新宿站');
      expect(kabukicho.walkMinutes).toBeLessThan(10);
    });
  });

  describe('Matsumoto Kiyoshi Scraper', () => {
    it('應正確建置松本清門市且全部符合 Schema', () => {
      const stores = buildMatsukiyoStores(MATSUKIYO_STORES_SEED, sampleStations);
      expect(stores.length).toBeGreaterThanOrEqual(10);

      for (const s of stores) {
        expect(s.brand).toBe('松本清');
        expect(s.category).toBe('購物藥妝');
        expect(s.id).toMatch(/^matsukiyo-/);
        expect(s.tags).toContain('免稅 (Tax-Free)');

        const validation = validateSpot(s);
        expect(validation.isValid, `Store ${s.name} failed: ${validation.errors.join(', ')}`).toBe(true);
      }
    });

    it('新宿東口店應配對至新宿站且步行時間在 10 分鐘內', () => {
      const stores = buildMatsukiyoStores(sampleShopping, sampleStations);
      const east = stores.find(s => s.id.includes('shinjuku-east'));
      expect(east).toBeDefined();
      expect(east.nearestStation).toBe('新宿站');
      expect(east.walkMinutes).toBeGreaterThan(0);
      expect(east.walkMinutes).toBeLessThanOrEqual(8);
    });
  });

  describe('Shopping Aggregator Integration', () => {
    it('buildShoppingSpots 應合併唐吉訶德、松本清與電器3C且無重複項', () => {
      const allShopping = buildShoppingSpots(sampleStations);
      expect(allShopping.length).toBeGreaterThanOrEqual(25);
      const donkiCount = allShopping.filter(s => s.brand === '唐吉訶德').length;
      const matsukiyoCount = allShopping.filter(s => s.brand === '松本清').length;
      const electronicsCount = allShopping.filter(s => ['Bic Camera', 'Kojima × Bic Camera', 'Sofmap (ソフマップ)', '友都八喜 (Yodobashi)'].includes(s.brand)).length;
      expect(donkiCount).toBeGreaterThan(0);
      expect(matsukiyoCount).toBeGreaterThan(0);
      expect(electronicsCount).toBeGreaterThan(0);
      expect(donkiCount + matsukiyoCount + electronicsCount).toBe(allShopping.length);
    });
  });
});
