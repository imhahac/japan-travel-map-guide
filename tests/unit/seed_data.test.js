import { describe, it, expect } from 'vitest';
import spots from '../../src/data/spots.json';
import toyokoSeed from '../../src/data/toyoko_seed.json';
import { validateSpot } from '../../scripts/core/validator.js';

describe('Seed Datasets Integrity Tests', () => {
  it('spots.json 中的每一筆資料皆具備品牌欄位且符合 Schema 驗證', () => {
    expect(spots.length).toBeGreaterThanOrEqual(347);
    for (const spot of spots) {
      expect(spot.brand).toBeDefined();
      expect(typeof spot.brand).toBe('string');
      expect(spot.brand.trim()).not.toBe('');
      const validation = validateSpot(spot);
      expect(validation.isValid, `Spot ${spot.name} (${spot.id}) failed validation: ${validation.errors.join(', ')}`).toBe(true);
    }
  });

  it('toyoko_seed.json 中的每一筆資料皆為東橫INN且符合 Schema 驗證', () => {
    expect(toyokoSeed.length).toBeGreaterThanOrEqual(347);
    for (const spot of toyokoSeed) {
      expect(spot.brand).toBe('東橫INN');
      const validation = validateSpot(spot);
      expect(validation.isValid, `Toyoko seed ${spot.name} failed: ${validation.errors.join(', ')}`).toBe(true);
    }
  });

  it('apa_seed.json 中的每一筆資料皆為APA飯店且符合 Schema 驗證', async () => {
    const { default: apaSeed } = await import('../../src/data/apa_seed.json');
    expect(apaSeed.length).toBeGreaterThanOrEqual(20);
    for (const spot of apaSeed) {
      expect(spot.brand).toBe('APA飯店');
      const validation = validateSpot(spot);
      expect(validation.isValid, `APA seed ${spot.name} failed: ${validation.errors.join(', ')}`).toBe(true);
    }
  });

  it('shopping_seed.json 中的每一筆資料皆為唐吉訶德或松本清且符合 Schema 驗證', async () => {
    const { default: shoppingSeed } = await import('../../src/data/shopping_seed.json');
    expect(shoppingSeed.length).toBeGreaterThanOrEqual(25);
    for (const spot of shoppingSeed) {
      expect(['唐吉訶德', '松本清']).toContain(spot.brand);
      expect(spot.category).toBe('購物藥妝');
      const validation = validateSpot(spot);
      expect(validation.isValid, `Shopping seed ${spot.name} failed: ${validation.errors.join(', ')}`).toBe(true);
    }
  });

  it('dining_seed.json 中的每一筆資料皆為平價美食且符合 Schema 驗證', async () => {
    const { default: diningSeed } = await import('../../src/data/dining_seed.json');
    expect(diningSeed.length).toBeGreaterThanOrEqual(10);
    for (const spot of diningSeed) {
      expect(['吉野家', '松屋', 'すき家', '客美多咖啡', '一蘭拉麵']).toContain(spot.brand);
      expect(spot.category).toBe('美食餐廳');
      const validation = validateSpot(spot);
      expect(validation.isValid, `Dining seed ${spot.name} failed: ${validation.errors.join(', ')}`).toBe(true);
    }
  });

  it('convenience_seed.json 中的每一筆資料皆為三大超商且符合 Schema 驗證', async () => {
    const { default: convSeed } = await import('../../src/data/convenience_seed.json');
    expect(convSeed.length).toBeGreaterThanOrEqual(20);
    for (const spot of convSeed) {
      expect(['7-Eleven', 'FamilyMart', 'Lawson']).toContain(spot.brand);
      expect(spot.category).toBe('便利商店');
      const validation = validateSpot(spot);
      expect(validation.isValid, `Convenience seed ${spot.name} failed: ${validation.errors.join(', ')}`).toBe(true);
    }
  });
});
