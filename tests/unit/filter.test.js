import { describe, it, expect } from 'vitest';

// 雙層篩選過濾演算法函式
export function filterSpots(spots, {
  category = 'all',
  brand = 'all',
  region = '全部地區',
  prefecture = '全部都道府縣',
  walkFilter = 'all',
  selectedStation = null
}) {
  return spots.filter(spot => {
    // 1. 大類別過濾
    if (category !== 'all' && spot.category !== category) {
      return false;
    }

    // 2. 品牌過濾（支援單選或 'all'）
    if (brand !== 'all' && spot.brand !== brand) {
      return false;
    }

    // 3. 地區過濾
    if (region !== '全部地區' && spot.region !== region) {
      return false;
    }

    // 4. 都道府縣過濾
    if (prefecture !== '全部都道府縣' && spot.prefecture !== prefecture) {
      return false;
    }

    // 5. 步行時間過濾
    if (walkFilter !== 'all') {
      const maxMinutes = parseInt(walkFilter, 10);
      if (spot.walkMinutes > maxMinutes) return false;
    }

    return true;
  });
}

describe('Two-tier Filter Logic Tests', () => {
  const mockSpots = [
    { id: '1', category: '飯店', brand: '東橫INN', region: '關東', prefecture: '東京都', walkMinutes: 3 },
    { id: '2', category: '飯店', brand: '東橫INN', region: '關東', prefecture: '東京都', walkMinutes: 7 },
    { id: '3', category: '飯店', brand: 'APA飯店', region: '關東', prefecture: '東京都', walkMinutes: 4 },
    { id: '4', category: '飯店', brand: 'APA飯店', region: '近畿', prefecture: '大阪府', walkMinutes: 2 },
    { id: '5', category: '購物藥妝', brand: '唐吉訶德', region: '關東', prefecture: '東京都', walkMinutes: 5 }
  ];

  it('篩選大類為「飯店」應過濾掉購物藥妝', () => {
    const res = filterSpots(mockSpots, { category: '飯店' });
    expect(res).toHaveLength(4);
    expect(res.every(s => s.category === '飯店')).toBe(true);
  });

  it('第二層品牌選擇「APA飯店」時只保留 APA 門市', () => {
    const res = filterSpots(mockSpots, { category: '飯店', brand: 'APA飯店' });
    expect(res).toHaveLength(2);
    expect(res.every(s => s.brand === 'APA飯店')).toBe(true);
  });

  it('第二層品牌選擇「東橫INN」時只保留東橫 INN 門市', () => {
    const res = filterSpots(mockSpots, { category: '飯店', brand: '東橫INN' });
    expect(res).toHaveLength(2);
    expect(res.every(s => s.brand === '東橫INN')).toBe(true);
  });

  it('結合步行時間過濾（3分內）應精準過濾', () => {
    const res = filterSpots(mockSpots, { category: '飯店', walkFilter: '3' });
    // id: 1 (東橫INN 3分), id: 4 (APA 2分)
    expect(res).toHaveLength(2);
    expect(res.map(s => s.id)).toEqual(['1', '4']);
  });

  it('全部條件重設 (all) 時應返回完整資料集', () => {
    const res = filterSpots(mockSpots, {});
    expect(res).toHaveLength(5);
  });
});
