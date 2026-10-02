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
});
