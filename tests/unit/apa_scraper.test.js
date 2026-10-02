import { describe, it, expect } from 'vitest';
import { buildApaHotels, APA_HOTELS_SEED } from '../../scripts/scrapers/apa.js';
import { validateSpot } from '../../scripts/core/validator.js';
import sampleStations from '../fixtures/sample_station.json';
import sampleApa from '../fixtures/sample_apa.json';

describe('APA Hotel Scraper & Builder Tests', () => {
  it('buildApaHotels 應正確建構有效飯店資料且全部符合 Schema', () => {
    const hotels = buildApaHotels(APA_HOTELS_SEED, sampleStations);
    expect(hotels.length).toBeGreaterThanOrEqual(20);

    for (const h of hotels) {
      expect(h.brand).toBe('APA飯店');
      expect(h.category).toBe('飯店');
      expect(h.id).toMatch(/^apa-/);
      expect(h.lat).toBeGreaterThanOrEqual(24.0);
      expect(h.lat).toBeLessThanOrEqual(46.0);
      expect(h.lng).toBeGreaterThanOrEqual(122.0);
      expect(h.lng).toBeLessThanOrEqual(154.0);

      const validation = validateSpot(h);
      expect(validation.isValid, `Hotel ${h.name} failed: ${validation.errors.join(', ')}`).toBe(true);
    }
  });

  it('應正確將新宿歌舞伎町門市配對至新宿站', () => {
    const hotels = buildApaHotels(sampleApa, sampleStations);
    const kabukicho = hotels.find(h => h.id.includes('shinjuku-kabukicho'));
    expect(kabukicho).toBeDefined();
    expect(kabukicho.nearestStation).toBe('新宿站');
    expect(kabukicho.walkMinutes).toBeGreaterThan(0);
    expect(kabukicho.walkMinutes).toBeLessThan(15);
  });

  it('設施標籤中應包含大浴場或 Wi-Fi 等關鍵字', () => {
    const hotels = buildApaHotels(sampleApa, sampleStations);
    const hasSpa = hotels.some(h => h.tags.includes('大浴場'));
    expect(hasSpa).toBe(true);
  });
});
