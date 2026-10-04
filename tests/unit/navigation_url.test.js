import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  cleanJapaneseAddress,
  buildNavigationQuery,
  formatStationOrigin,
  buildWalkingNavUrl,
  buildGoogleMapSearchUrl
} from '../../src/utils/navigation.js';

describe('Smart Navigation & Map URL Utilities Unit Tests', () => {
  describe('1. 文字清理與地址正規化 (Text & Address Normalization)', () => {
    it('應正確將全形空格與連續空白壓縮為單一空格', () => {
      expect(normalizeText('六厘舎　池袋店')).toBe('六厘舎 池袋店');
      expect(normalizeText('  舎鈴   登戸駅前店  ')).toBe('舎鈴 登戸駅前店');
      expect(normalizeText('')).toBe('');
      expect(normalizeText(null)).toBe('');
    });

    it('應自動剔除地址中的日本郵遞區號 (〒160-0022 或 160-0022)', () => {
      const addrWithPostal1 = '〒160-0022 東京都新宿区新宿3-1-1';
      expect(cleanJapaneseAddress(addrWithPostal1)).toBe('東京都新宿区新宿3-1-1');

      const addrWithPostal2 = '160-0022 東京都新宿区新宿3-1-1';
      expect(cleanJapaneseAddress(addrWithPostal2)).toBe('東京都新宿区新宿3-1-1');
    });

    it('若地址末端重複帶有店家名稱，應自動清理避免冗贅', () => {
      const raw = '東京都中央区丸の内1-9-1 六厘舎 東京ラーメンストリート店';
      expect(cleanJapaneseAddress(raw, '六厘舎 東京ラーメンストリート店')).toBe('東京都中央区丸の内1-9-1');
    });
  });

  describe('2. 導航搜尋字串四級降級演算法 (Four-Tier Fallback Query Builder)', () => {
    it('Tier 1: 完美資料應優先組合「日文官方店名 + 日本在地地址」', () => {
      const spot = {
        name: '六厘舎 東京一番街店',
        nameJa: '六厘舎 東京ラーメンストリート店',
        address: '東京都千代田区丸の内1-9-1 東京駅一番街B1F',
        lat: 35.680594,
        lng: 139.768080
      };
      const query = buildNavigationQuery(spot);
      expect(query).toBe('六厘舎 東京ラーメンストリート店 東京都千代田区丸の内1-9-1 東京駅一番街B1F');
    });

    it('Tier 2: 當地址缺漏或過短時，自動降級為「店名 + 都道府縣 + 車站名」', () => {
      const spot = {
        name: '松屋 某分店',
        address: '',
        prefecture: '東京都',
        nearestStation: '新宿站',
        lat: 35.69,
        lng: 139.70
      };
      const query = buildNavigationQuery(spot);
      expect(query).toBe('松屋 某分店 東京都 新宿站');
    });

    it('Tier 3: 無地址且無車站時，降級為「店名」', () => {
      const spot = {
        name: '神秘快閃店',
        address: '',
        lat: 35.69,
        lng: 139.70
      };
      const query = buildNavigationQuery(spot);
      expect(query).toBe('神秘快閃店');
    });

    it('Tier 4: 極端無店名無地址時，安全兜底為「物理坐標浮點數」', () => {
      const spot = {
        name: '',
        address: '',
        lat: 35.680594,
        lng: 139.768080
      };
      const query = buildNavigationQuery(spot);
      expect(query).toBe('35.680594,139.76808');
    });

    it('空物件或無效輸入應安全回傳空字串', () => {
      expect(buildNavigationQuery(null)).toBe('');
      expect(buildNavigationQuery({})).toBe('');
    });
  });

  describe('3. 起點車站日文標準化 (Station Origin Formatting)', () => {
    it('應將中文「站」自動校準為日文「駅」以利 Google Maps 日本路網識別', () => {
      expect(formatStationOrigin('東京站')).toBe('東京駅');
      expect(formatStationOrigin('新宿站')).toBe('新宿駅');
      expect(formatStationOrigin('池袋駅')).toBe('池袋駅');
      expect(formatStationOrigin('澀谷')).toBe('澀谷駅');
    });

    it('傳入車站物件時亦能精準解析', () => {
      expect(formatStationOrigin({ name: '上野站', nameJa: '上野駅' })).toBe('上野駅');
    });
  });

  describe('4. 步行導航 Universal URL 產製規格 (Walking Navigation URL Construction)', () => {
    it('未指定車站時，應省略 origin 參數以預設使用使用者手機目前 GPS 定位', () => {
      const spot = {
        nameJa: '舎鈴 登戸駅前店',
        address: '神奈川県川崎市多摩区登戸３４３５',
        lat: 35.62064,
        lng: 139.570496
      };
      const url = buildWalkingNavUrl(spot, null);
      expect(url).toContain('https://www.google.com/maps/dir/?api=1');
      expect(url).toContain('destination=' + encodeURIComponent('舎鈴 登戸駅前店 神奈川県川崎市多摩区登戸3435'));
      expect(url).toContain('travelmode=walking');
      expect(url).toContain('dir_action=navigate');
      expect(url).not.toContain('origin=');
    });

    it('指定車站時，應自動帶入起點車站參數', () => {
      const spot = {
        nameJa: '六厘舎 東京ラーメンストリート店',
        address: '東京都千代田区丸の内1-9-1 東京駅一番街B1F'
      };
      const station = { name: '東京站', nameJa: '東京駅' };
      const url = buildWalkingNavUrl(spot, station);
      expect(url).toContain('origin=' + encodeURIComponent('東京駅'));
      expect(url).toContain('destination=' + encodeURIComponent('六厘舎 東京ラーメンストリート店 東京都千代田区丸の内1-9-1 東京駅一番街B1F'));
    });

    it('支援特殊符號與括號之完整 URL 跳脫，杜絕 400 Bad Request', () => {
      const spot = {
        nameJa: 'アパホテル〈小伝馬町駅前〉',
        address: '東京都中央区日本橋大伝馬町14-20'
      };
      const url = buildWalkingNavUrl(spot);
      expect(url).toContain(encodeURIComponent('アパホテル〈小伝馬町駅前〉 東京都中央区日本橋大伝馬町14-20'));
    });

    it('產製 Google 商家搜尋 Universal URL 應符合規格', () => {
      const spot = {
        nameJa: 'しゃぶ葉 渋谷駅前店',
        address: '東京都渋谷区道玄坂2-3-1'
      };
      const url = buildGoogleMapSearchUrl(spot);
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('しゃぶ葉 渋谷駅前店 東京都渋谷区道玄坂2-3-1'));
    });
  });
});
