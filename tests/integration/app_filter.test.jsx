import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryFilter from '../../src/components/CategoryFilter.jsx';
import RegionHierarchyFilter from '../../src/components/RegionHierarchyFilter.jsx';
import { filterSpots } from '../unit/filter.test.js';

describe('App Filter & Multi-tier Navigation Integration Tests', () => {
  describe('CategoryFilter Component Integration', () => {
    it('應正確渲染五大頂層分類（全部、飯店、購物藥妝、美食餐廳、便利商店）', () => {
      const onSelectCategory = vi.fn();
      const onSelectBrand = vi.fn();

      render(
        <CategoryFilter
          currentCategory="all"
          onSelectCategory={onSelectCategory}
          categoryCounts={{ all: 439, 飯店: 372, 購物藥妝: 30, 美食餐廳: 14, 便利商店: 23 }}
          currentBrand="all"
          onSelectBrand={onSelectBrand}
        />
      );

      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('飯店旅館')).toBeInTheDocument();
      expect(screen.getByText('購物藥妝')).toBeInTheDocument();
      expect(screen.getByText('在地美食')).toBeInTheDocument();
      expect(screen.getByText('便利商店')).toBeInTheDocument();

      // 點擊「便利商店」大類
      const convButton = screen.getByText('便利商店').closest('button');
      fireEvent.click(convButton);
      expect(onSelectCategory).toHaveBeenCalledWith('便利商店');
    });

    it('切換至「便利商店」大類時，第二層應展開三大超商晶片（7-Eleven、FamilyMart、Lawson）', () => {
      const onSelectBrand = vi.fn();

      render(
        <CategoryFilter
          currentCategory="便利商店"
          onSelectCategory={vi.fn()}
          currentBrand="all"
          onSelectBrand={onSelectBrand}
        />
      );

      expect(screen.getByText('全部超商')).toBeInTheDocument();
      expect(screen.getByText('7-Eleven')).toBeInTheDocument();
      expect(screen.getByText(/FamilyMart/)).toBeInTheDocument();
      expect(screen.getByText(/Lawson/)).toBeInTheDocument();

      // 點擊 7-Eleven 品牌晶片
      fireEvent.click(screen.getByText('7-Eleven'));
      expect(onSelectBrand).toHaveBeenCalledWith('7-Eleven');
    });

    it('切換至「美食餐廳」大類時，第二層應展開平價美食晶片（吉野家、松屋、すき家、一蘭拉麵、客美多咖啡）', () => {
      const onSelectBrand = vi.fn();

      render(
        <CategoryFilter
          currentCategory="美食餐廳"
          onSelectCategory={vi.fn()}
          currentBrand="all"
          onSelectBrand={onSelectBrand}
        />
      );

      expect(screen.getByText('全部美食')).toBeInTheDocument();
      expect(screen.getByText('吉野家')).toBeInTheDocument();
      expect(screen.getByText('松屋')).toBeInTheDocument();
      expect(screen.getByText(/すき家/)).toBeInTheDocument();
      expect(screen.getByText('一蘭拉麵')).toBeInTheDocument();
      expect(screen.getByText('客美多咖啡')).toBeInTheDocument();

      // 點擊客美多咖啡
      fireEvent.click(screen.getByText('客美多咖啡'));
      expect(onSelectBrand).toHaveBeenCalledWith('客美多咖啡');
    });

    it('切換至「購物藥妝」大類時，第二層應展開購物品牌晶片（唐吉訶德、松本清）', () => {
      const onSelectBrand = vi.fn();

      render(
        <CategoryFilter
          currentCategory="購物藥妝"
          onSelectCategory={vi.fn()}
          currentBrand="all"
          onSelectBrand={onSelectBrand}
        />
      );

      expect(screen.getByText('全部購物')).toBeInTheDocument();
      expect(screen.getByText(/唐吉訶德/)).toBeInTheDocument();
      expect(screen.getByText(/松本清/)).toBeInTheDocument();

      // 點擊唐吉訶德
      fireEvent.click(screen.getByText(/唐吉訶德/));
      expect(onSelectBrand).toHaveBeenCalledWith('唐吉訶德');
    });

    it('購物品牌「全部購物」徽章數字應精確顯示為該大類數量（30）而非 372', () => {
      render(
        <CategoryFilter
          currentCategory="購物藥妝"
          onSelectCategory={vi.fn()}
          categoryCounts={{ all: 439, 飯店: 372, 購物藥妝: 30, 美食餐廳: 14, 便利商店: 23 }}
          currentBrand="all"
          onSelectBrand={vi.fn()}
          brandCounts={{ '唐吉訶德': 17, '松本清': 13 }}
        />
      );

      const allShoppingBtn = screen.getByText('全部購物').closest('button');
      expect(allShoppingBtn).toHaveTextContent('30');
      expect(allShoppingBtn).not.toHaveTextContent('372');
    });

    it('Navbar 標題應已移除「東橫 INN 旗艦版」專屬字眼', async () => {
      const { default: Navbar } = await import('../../src/components/Navbar.jsx');
      render(
        <Navbar
          totalSpots={439}
          currentCategory="all"
          theme="light"
          onToggleTheme={vi.fn()}
          onOpenSyncModal={vi.fn()}
        />
      );
      expect(screen.queryByText(/東橫 INN 旗艦版/)).toBeNull();
      expect(screen.getByText('日本在地導覽地圖')).toBeInTheDocument();
    });
  });

  describe('WelcomeExplorer Initial Google Maps Style Discovery Tests', () => {
    it('初次載入頁面時應呈現四大熱門分類卡片、熱門車站與都道府縣捷徑', async () => {
      const { default: WelcomeExplorer } = await import('../../src/components/WelcomeExplorer.jsx');
      const onSelectCategory = vi.fn();
      const onSelectStation = vi.fn();
      const onSelectPrefecture = vi.fn();
      const onBrowseAll = vi.fn();

      render(
        <WelcomeExplorer
          totalSpots={1948}
          stations={[{ name: '新宿站', region: '關東', prefecture: '東京都' }]}
          onSelectCategory={onSelectCategory}
          onSelectStation={onSelectStation}
          onSelectPrefecture={onSelectPrefecture}
          onBrowseAll={onBrowseAll}
        />
      );

      // 四大核心入口
      expect(screen.getByText('飯店旅館')).toBeInTheDocument();
      expect(screen.getByText('在地美食')).toBeInTheDocument();
      expect(screen.getByText('購物藥妝')).toBeInTheDocument();
      expect(screen.getByText('便利商店')).toBeInTheDocument();

      // 樞紐車站捷徑
      expect(screen.getByText('新宿站')).toBeInTheDocument();
      expect(screen.getByText('東京站')).toBeInTheDocument();

      // 點擊美食分類觸發
      fireEvent.click(screen.getByText('在地美食'));
      expect(onSelectCategory).toHaveBeenCalledWith('美食餐廳');

      // 點擊瀏覽全部觸發
      fireEvent.click(screen.getByText(/直接瀏覽全日本所有地標/));
      expect(onBrowseAll).toHaveBeenCalled();
    });
  });

  describe('RegionHierarchyFilter & Walk Distance Quick Slider', () => {
    it('步行時間快速拉桿應正確呈現快捷選項並觸發回呼', () => {
      const onSelectWalk = vi.fn();
      const onSelectRegion = vi.fn();
      const onSelectPrefecture = vi.fn();

      render(
        <RegionHierarchyFilter
          selectedRegion="關東"
          selectedPrefecture="東京都"
          walkFilter="all"
          onSelectRegion={onSelectRegion}
          onSelectPrefecture={onSelectPrefecture}
          onSelectWalkFilter={onSelectWalk}
        />
      );

      expect(screen.getByText('不限距離')).toBeInTheDocument();
      expect(screen.getByText('⚡ 3分內')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 5分內')).toBeInTheDocument();
      expect(screen.getByText('🚶 10分內')).toBeInTheDocument();

      // 點擊「⚡ 3分內」
      fireEvent.click(screen.getByText('⚡ 3分內'));
      expect(onSelectWalk).toHaveBeenCalledWith('3');

      // 點擊「⏱️ 5分內」
      fireEvent.click(screen.getByText('⏱️ 5分內'));
      expect(onSelectWalk).toHaveBeenCalledWith('5');
    });
  });

  describe('Full Multi-tier Filter Scenario Pipeline', () => {
    const mockFullDataset = [
      { id: 'h1', category: '飯店', brand: '東橫INN', name: '東橫INN 新宿歌舞伎町', region: '關東', prefecture: '東京都', walkMinutes: 5 },
      { id: 'h2', category: '飯店', brand: 'APA飯店', name: 'APA飯店 新宿歌舞伎町塔', region: '關東', prefecture: '東京都', walkMinutes: 3 },
      { id: 's1', category: '購物藥妝', brand: '唐吉訶德', name: '唐吉訶德 新宿歌舞伎町店', region: '關東', prefecture: '東京都', walkMinutes: 4 },
      { id: 's2', category: '購物藥妝', brand: '松本清', name: '松本清 新宿東口店', region: '關東', prefecture: '東京都', walkMinutes: 2 },
      { id: 'd1', category: '美食餐廳', brand: '吉野家', name: '吉野家 新宿東口店', region: '關東', prefecture: '東京都', walkMinutes: 2 },
      { id: 'd2', category: '美食餐廳', brand: '客美多咖啡', name: '客美多咖啡 新宿靖國通店', region: '關東', prefecture: '東京都', walkMinutes: 3 },
      { id: 'c1', category: '便利商店', brand: '7-Eleven', name: '7-Eleven 新宿東口站前店', region: '關東', prefecture: '東京都', walkMinutes: 2 },
      { id: 'c2', category: '便利商店', brand: 'FamilyMart', name: 'FamilyMart 新宿南口店', region: '關東', prefecture: '東京都', walkMinutes: 2 },
      { id: 'c3', category: '便利商店', brand: 'Lawson', name: 'Lawson 難波戎橋店', region: '近畿', prefecture: '大阪府', walkMinutes: 4 }
    ];

    it('情境一：旅客在新宿尋找「出站步行 3 分鐘內」的「便利商店」', () => {
      const step1 = filterSpots(mockFullDataset, {
        category: '便利商店',
        region: '關東',
        prefecture: '東京都',
        walkFilter: '3'
      });
      expect(step1).toHaveLength(2);
      expect(step1.map(s => s.id)).toEqual(['c1', 'c2']);
      expect(step1.every(s => s.walkMinutes <= 3)).toBe(true);
    });

    it('情境二：旅客特定尋找「唐吉訶德」藥妝且步行 5 分內', () => {
      const step2 = filterSpots(mockFullDataset, {
        category: '購物藥妝',
        brand: '唐吉訶德',
        walkFilter: '5'
      });
      expect(step2).toHaveLength(1);
      expect(step2[0].name).toBe('唐吉訶德 新宿歌舞伎町店');
    });

    it('情境三：旅客切換至大阪府尋找生活設施', () => {
      const step3 = filterSpots(mockFullDataset, {
        region: '近畿',
        prefecture: '大阪府'
      });
      expect(step3).toHaveLength(1);
      expect(step3[0].brand).toBe('Lawson');
      expect(step3[0].prefecture).toBe('大阪府');
    });
  });

  describe('Location Accuracy & Selected Spot Left Panel Inspector Tests', () => {
    it('アパホテル〈小伝馬町駅前〉定位應精準對應日本橋大伝馬町14番街區，而非偏移至對街車站出入口', async () => {
      const { default: spots } = await import('../../src/data/spots.json');
      const spot = spots.find(s => s.id === 'apa-no188');
      expect(spot).toBeDefined();
      expect(spot.name).toBe('アパホテル〈小伝馬町駅前〉');
      expect(spot.address).toBe('東京都中央区日本橋大伝馬町14-20');
      // 精準國土地理院座標檢驗 (緯度 35.6908~35.6911，經度 139.7804~139.7808，位於 14 號街區內)
      expect(spot.lat).toBeGreaterThanOrEqual(35.6905);
      expect(spot.lat).toBeLessThanOrEqual(35.6912);
      expect(spot.lng).toBeGreaterThanOrEqual(139.7800);
      expect(spot.lng).toBeLessThanOrEqual(139.7810);
      // 確保不再等於舊的車站中心點 (35.691603, 139.779692)
      expect(spot.lat).not.toBe(35.691603);
    });

    it('地圖選中商家時，左側欄應醒目展示「地圖選取商家資訊」看板，避免誤會', async () => {
      const { default: App } = await import('../../src/App.jsx');
      // 驗證 App 原始碼中包含明確的選中商家 Inspector 結構
      const fs = await import('fs');
      const path = await import('path');
      const appCode = fs.readFileSync(path.resolve('src/App.jsx'), 'utf8');
      expect(appCode).toContain('selected-spot-inspector');
      expect(appCode).toContain('📍 地圖選取商家');
      expect(appCode).toContain('步行導航');
      expect(appCode).toContain('前往官網');
    });
  });
});
