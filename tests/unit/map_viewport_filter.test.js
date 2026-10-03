import { describe, it, expect } from 'vitest';

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function filterAndSortSpotsByViewport(spots, {
  viewport = null,
  syncWithMapBounds = true,
  selectedStation = null
}) {
  if (!syncWithMapBounds || !viewport) {
    return spots;
  }

  const { north, south, east, west } = viewport;

  return spots
    .filter(spot => {
      if (!spot.lat || !spot.lng) return false;
      if (spot.lat < south || spot.lat > north) return false;
      if (west <= east) {
        return spot.lng >= west && spot.lng <= east;
      } else {
        return spot.lng >= west || spot.lng <= east;
      }
    })
    .map(spot => {
      let distStation = Infinity;
      let distCenter = Infinity;
      if (selectedStation && spot.lat && spot.lng) {
        distStation = calculateDistance(selectedStation.lat, selectedStation.lng, spot.lat, spot.lng);
      }
      if (viewport.center && spot.lat && spot.lng) {
        distCenter = calculateDistance(viewport.center.lat, viewport.center.lng, spot.lat, spot.lng);
      }
      return { ...spot, currentDistance: distStation, distanceToCenter: distCenter };
    })
    .sort((a, b) => {
      if (selectedStation) {
        return a.currentDistance - b.currentDistance;
      }
      if (viewport.center && a.distanceToCenter !== b.distanceToCenter) {
        return a.distanceToCenter - b.distanceToCenter;
      }
      return (a.walkMinutes || 5) - (b.walkMinutes || 5);
    });
}

describe('Map Viewport Bounds Filter & Proximity Sort Tests', () => {
  const sampleSpots = [
    {
      id: 'dining-ichiran-naha',
      name: '一蘭拉麵 那霸國際通店',
      prefecture: '沖繩縣',
      lat: 26.2165,
      lng: 127.6888,
      walkMinutes: 1
    },
    {
      id: 'dining-ichiran-asakusa',
      name: '一蘭拉麵 浅草店',
      prefecture: '東京都',
      lat: 35.7118,
      lng: 139.7975,
      walkMinutes: 2
    },
    {
      id: 'dining-matsuya-kinshicho',
      name: '松屋 錦糸町店',
      prefecture: '東京都',
      lat: 35.6968,
      lng: 139.8142,
      walkMinutes: 3
    },
    {
      id: 'dining-sukiya-ueno',
      name: 'すき家 上野店',
      prefecture: '東京都',
      lat: 35.7105,
      lng: 139.7758,
      walkMinutes: 4
    },
    {
      id: 'dining-sushiro-osaka',
      name: '壽司郎 大阪心齋橋店',
      prefecture: '大阪府',
      lat: 34.6710,
      lng: 135.5012,
      walkMinutes: 3
    }
  ];

  // 東京下町 (台東區、墨田區、江東區) 視窗範圍
  const tokyoViewport = {
    north: 35.735,
    south: 35.680,
    east: 139.835,
    west: 139.760,
    center: { lat: 35.697, lng: 139.814 } // 錦糸町中心點
  };

  it('地圖在東京時，應自動過濾掉沖繩那霸與大阪門市，僅保留可視區域內的東京門市', () => {
    const result = filterAndSortSpotsByViewport(sampleSpots, {
      viewport: tokyoViewport,
      syncWithMapBounds: true
    });

    // 應該只保留浅草、錦糸町、上野 3 間
    expect(result).toHaveLength(3);
    const ids = result.map(s => s.id);
    expect(ids).toContain('dining-ichiran-asakusa');
    expect(ids).toContain('dining-matsuya-kinshicho');
    expect(ids).toContain('dining-sukiya-ueno');
    // 沖繩那霸與大阪心齋橋必須被排除
    expect(ids).not.toContain('dining-ichiran-naha');
    expect(ids).not.toContain('dining-sushiro-osaka');
  });

  it('視野內門市應依照離地圖視野中心的距離由近至遠排序', () => {
    const result = filterAndSortSpotsByViewport(sampleSpots, {
      viewport: tokyoViewport,
      syncWithMapBounds: true
    });

    // 視野中心為 (35.697, 139.814) 錦糸町
    // 第一名應該是松屋錦糸町店 (距離中心 < 50m)
    expect(result[0].name).toBe('松屋 錦糸町店');
  });

  it('若使用者關閉視野鎖定 (syncWithMapBounds: false)，應回傳全部門市', () => {
    const result = filterAndSortSpotsByViewport(sampleSpots, {
      viewport: tokyoViewport,
      syncWithMapBounds: false
    });

    expect(result).toHaveLength(5);
    expect(result.map(s => s.id)).toContain('dining-ichiran-naha');
  });

  it('當選中特定車站時，應以距離該車站的距離優先排序', () => {
    const uenoStation = { name: '上野站', lat: 35.7138, lng: 139.7773 };
    const result = filterAndSortSpotsByViewport(sampleSpots, {
      viewport: tokyoViewport,
      syncWithMapBounds: true,
      selectedStation: uenoStation
    });

    // 距離上野站最近的應該是すき家上野店
    expect(result[0].name).toBe('すき家 上野店');
  });
});
