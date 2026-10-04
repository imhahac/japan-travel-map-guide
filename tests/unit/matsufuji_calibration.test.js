import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('六厘舎與舎鈴 (Matsufuji) 坐標與生活圈校準驗證', () => {
  const seedPath = path.resolve('src/data/matsufuji_seed.json');
  const spotsPath = path.resolve('src/data/spots.json');

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const spots = JSON.parse(fs.readFileSync(spotsPath, 'utf8'));

  it('1. 全數 83 間松富士門市皆應具備有效物理坐標且全數通過 Schema 驗證', () => {
    expect(seed.length).toBeGreaterThanOrEqual(80);
    seed.forEach(spot => {
      expect(spot.lat).toBeGreaterThan(34);
      expect(spot.lat).toBeLessThan(37);
      expect(spot.lng).toBeGreaterThan(135);
      expect(spot.lng).toBeLessThan(141);
      expect(isNaN(spot.lat)).toBe(false);
      expect(isNaN(spot.lng)).toBe(false);
      expect(spot.coordinates).toMatch(/^[0-9.]+, [0-9.]+$/);
    });
  });

  it('2. 六厘舎 6 大旗艦店應徹底消除 Google Maps embed 西偏，精準定錨於車站改札 1~2 分鐘內', () => {
    const tokyoSt = spots.find(s => s.brand === '六厘舎' && s.name.includes('東京ラーメンストリート'));
    expect(tokyoSt).toBeDefined();
    expect(tokyoSt.nearestStation).toBe('東京站');
    expect(tokyoSt.walkMinutes).toBeLessThanOrEqual(2);
    expect(tokyoSt.lng).toBeGreaterThan(139.767); // 修正前為 139.765271 (西偏 250m)

    const ueno = spots.find(s => s.brand === '六厘舎' && s.name.includes('上野'));
    expect(ueno).toBeDefined();
    expect(ueno.nearestStation).toBe('上野站');
    expect(ueno.walkMinutes).toBeLessThanOrEqual(2);

    const osaki = spots.find(s => s.brand === '六厘舎' && s.name.includes('大崎'));
    expect(osaki).toBeDefined();
    expect(osaki.nearestStation).toBe('大崎站'); // 修正前錯配為大井町站
    expect(osaki.walkMinutes).toBeLessThanOrEqual(2);

    const skytree = spots.find(s => s.brand === '六厘舎' && s.name.includes('ソラマチ'));
    expect(skytree).toBeDefined();
    expect(skytree.nearestStation).toBe('押上站');
    expect(skytree.walkMinutes).toBeLessThanOrEqual(2);

    const haneda = spots.find(s => s.brand === '六厘舎' && s.name.includes('羽田'));
    expect(haneda).toBeDefined();
    expect(haneda.nearestStation).toBe('羽田機場第3航廈站');
    expect(haneda.walkMinutes).toBeLessThanOrEqual(2);

    const ikebukuro = spots.find(s => s.brand === '六厘舎' && s.name.includes('池袋'));
    expect(ikebukuro).toBeDefined();
    expect(ikebukuro.nearestStation).toBe('池袋站');
    expect(ikebukuro.walkMinutes).toBeLessThanOrEqual(2);
  });

  it('3. 舎鈴各大以車站命名之門市應精準綁定自身車站，杜絕「周邊生活圈」或 30 分鐘以上錯位', () => {
    const cases = [
      { name: '登戸駅前店', expectedStation: '登戶站', maxWalk: 2 },
      { name: 'プレナ幕張店', expectedStation: '海濱幕張站', maxWalk: 3 },
      { name: '勝どき店', expectedStation: '勝鬨站', maxWalk: 5 },
      { name: 'グランツリー武蔵小杉店', expectedStation: '武藏小杉站', maxWalk: 5 },
      { name: '亀戸駅東口店', expectedStation: '龜戶站', maxWalk: 5 },
      { name: '西小山店', expectedStation: '西小山站', maxWalk: 5 },
      { name: '大山駅前店', expectedStation: '大山站', maxWalk: 3 },
      { name: 'Beans亀有店', expectedStation: '龜有站', maxWalk: 3 },
      { name: '西荻窪駅前店', expectedStation: '西荻窪站', maxWalk: 3 },
      { name: '大島駅前店', expectedStation: '大島站', maxWalk: 5 },
      { name: 'Beans武蔵浦和店', expectedStation: '武藏浦和站', maxWalk: 4 },
      { name: '小岩北口店', expectedStation: '小岩站', maxWalk: 5 },
      { name: '南柏店', expectedStation: '南柏站', maxWalk: 5 },
      { name: '北浦和駅前店', expectedStation: '北浦和站', maxWalk: 3 },
      { name: '稲田堤駅前店', expectedStation: '稻田堤站', maxWalk: 4 },
      { name: '国分寺店', expectedStation: '國分寺站', maxWalk: 5 },
      { name: '阪急西宮ガーデンズ店', expectedStation: '西宮北口站', maxWalk: 5 },
      { name: 'ボーノ相模大野', expectedStation: '相模大野站', maxWalk: 5 }
    ];

    for (const testCase of cases) {
      const match = spots.find(s => s.brand === '舎鈴' && s.name.includes(testCase.name));
      expect(match, `門市 ${testCase.name} 應存在`).toBeDefined();
      expect(match.nearestStation, `${testCase.name} 應配對至 ${testCase.expectedStation}`).toBe(testCase.expectedStation);
      expect(match.walkMinutes, `${testCase.name} 步行時間應小於等於 ${testCase.maxWalk} 分鐘`).toBeLessThanOrEqual(testCase.maxWalk);
    }
  });
});
