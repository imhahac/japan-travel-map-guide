import React from 'react';
import {
  LayoutGrid,
  BedDouble,
  Utensils,
  Store,
  ShoppingBag,
  Building2,
  ShoppingCart,
  UtensilsCrossed,
  Tags,
  Coffee,
  Fish,
  Flame,
  Soup,
  Tv
} from 'lucide-react';

// =========================================================================
// 1. Tier 1: 頂層核心生活大分類
// =========================================================================
const CATEGORIES = [
  { id: 'all', label: '全部', icon: LayoutGrid },
  { id: '飯店', label: '飯店旅館', icon: BedDouble },
  { id: '購物藥妝', label: '購物藥妝', icon: ShoppingBag },
  { id: '美食餐廳', label: '在地美食', icon: Utensils },
  { id: '便利商店', label: '便利商店', icon: Store }
];

// =========================================================================
// 2. Tier 2: 次級業態 / 料理生活子分類
// =========================================================================
const SUBCATEGORIES_CONFIG = {
  飯店: [
    { id: 'all', label: '全部飯店' },
    { id: '商務飯店', label: '商務飯店' }
  ],
  購物藥妝: [
    { id: 'all', label: '全部購物' },
    { id: '藥妝量販', label: '綜合藥妝量販' },
    { id: '3C家電', label: '3C數位家電' }
  ],
  美食餐廳: [
    { id: 'all', label: '全部美食' },
    { id: '拉麵', label: '日式拉麵' },
    { id: '牛丼', label: '平價牛丼' },
    { id: '壽司', label: '迴轉壽司' },
    { id: '定食', label: '和風定食' },
    { id: '咖啡', label: '喫茶咖啡' }
  ],
  便利商店: [
    { id: 'all', label: '全部超商' },
    { id: '連鎖超商', label: '連鎖超商' }
  ],
  all: [
    { id: 'all', label: '全部業態' },
    { id: '商務飯店', label: '商務飯店' },
    { id: '藥妝量販', label: '藥妝量販' },
    { id: '3C家電', label: '3C家電' },
    { id: '拉麵', label: '日式拉麵' },
    { id: '牛丼', label: '平價牛丼' },
    { id: '壽司', label: '迴轉壽司' },
    { id: '定食', label: '和風定食' },
    { id: '咖啡', label: '喫茶咖啡' },
    { id: '連鎖超商', label: '連鎖超商' }
  ]
};

// =========================================================================
// 3. Tier 3: 具體連鎖品牌庫 (附帶 Tier 1 與 Tier 2 關聯)
// =========================================================================
const ALL_BRANDS_REGISTRY = [
  // 飯店旅館 (商務飯店)
  { id: '東橫INN', label: '東橫 INN', category: '飯店', subcategory: '商務飯店', color: '#00489d', dotBg: '#00489d', activeBg: '#eff6ff', activeText: '#1e40af' },
  { id: 'APA飯店', label: 'APA 飯店', category: '飯店', subcategory: '商務飯店', color: '#d97706', dotBg: '#d97706', activeBg: '#fef3c7', activeText: '#92400e' },

  // 購物藥妝 (綜合藥妝量販)
  { id: '唐吉訶德', label: '唐吉訶德 (Donki)', category: '購物藥妝', subcategory: '藥妝量販', color: '#ca8a04', dotBg: '#eab308', activeBg: '#fef9c3', activeText: '#854d0e' },
  { id: '松本清', label: '松本清 (Matsukiyo)', category: '購物藥妝', subcategory: '藥妝量販', color: '#2563eb', dotBg: '#3b82f6', activeBg: '#eff6ff', activeText: '#1d4ed8' },

  // 購物藥妝 (3C數位家電)
  { id: 'Bic Camera', label: 'Bic Camera', category: '購物藥妝', subcategory: '3C家電', color: '#dc2626', dotBg: '#ef4444', activeBg: '#fee2e2', activeText: '#b91c1c' },
  { id: '友都八喜', label: '友都八喜 (Yodobashi)', category: '購物藥妝', subcategory: '3C家電', color: '#0284c7', dotBg: '#0284c7', activeBg: '#e0f2fe', activeText: '#0369a1' },
  { id: 'Kojima', label: 'Kojima × Bic', category: '購物藥妝', subcategory: '3C家電', color: '#ea580c', dotBg: '#ea580c', activeBg: '#ffedd5', activeText: '#c2410c' },
  { id: 'Sofmap', label: 'Sofmap (索芙瑪)', category: '購物藥妝', subcategory: '3C家電', color: '#2563eb', dotBg: '#2563eb', activeBg: '#eff6ff', activeText: '#1d4ed8' },

  // 在地美食 (牛丼)
  { id: '吉野家', label: '吉野家', category: '美食餐廳', subcategory: '牛丼', color: '#ea580c', dotBg: '#ea580c', activeBg: '#ffedd5', activeText: '#c2410c' },
  { id: '松屋', label: '松屋', category: '美食餐廳', subcategory: '牛丼', color: '#0284c7', dotBg: '#0284c7', activeBg: '#e0f2fe', activeText: '#0369a1' },
  { id: 'すき家', label: 'すき家 (Sukiya)', category: '美食餐廳', subcategory: '牛丼', color: '#dc2626', dotBg: '#dc2626', activeBg: '#fee2e2', activeText: '#b91c1c' },

  // 在地美食 (拉麵)
  { id: '一蘭拉麵', label: '一蘭拉麵', category: '美食餐廳', subcategory: '拉麵', color: '#16a34a', dotBg: '#dc2626', activeBg: '#f0fdf4', activeText: '#15803d' },
  { id: '一風堂', label: '一風堂 (IPPUDO)', category: '美食餐廳', subcategory: '拉麵', color: '#b91c1c', dotBg: '#dc2626', activeBg: '#fef2f2', activeText: '#991b1b' },

  // 在地美食 (壽司)
  { id: '壽司郎', label: '壽司郎 (Sushiro)', category: '美食餐廳', subcategory: '壽司', color: '#dc2626', dotBg: '#ef4444', activeBg: '#fee2e2', activeText: '#b91c1c' },
  { id: '藏壽司', label: '藏壽司 (Kura)', category: '美食餐廳', subcategory: '壽司', color: '#0284c7', dotBg: '#0284c7', activeBg: '#e0f2fe', activeText: '#0369a1' },

  // 在地美食 (定食)
  { id: 'やよい軒', label: 'やよい軒 (彌生軒)', category: '美食餐廳', subcategory: '定食', color: '#d97706', dotBg: '#d97706', activeBg: '#fef3c7', activeText: '#92400e' },
  { id: '大戶屋', label: '大戶屋 (Ootoya)', category: '美食餐廳', subcategory: '定食', color: '#1e3a8a', dotBg: '#1e3a8a', activeBg: '#eff6ff', activeText: '#1e40af' },

  // 在地美食 (咖啡)
  { id: '客美多咖啡', label: '客美多咖啡', category: '美食餐廳', subcategory: '咖啡', color: '#78350f', dotBg: '#92400e', activeBg: '#fef3c7', activeText: '#78350f' },

  // 便利商店 (連鎖超商)
  { id: '7-Eleven', label: '7-Eleven', category: '便利商店', subcategory: '連鎖超商', color: '#16a34a', dotBg: '#ea580c', activeBg: '#f0fdf4', activeText: '#15803d' },
  { id: 'FamilyMart', label: '全家 FamilyMart', category: '便利商店', subcategory: '連鎖超商', color: '#0284c7', dotBg: '#16a34a', activeBg: '#e0f2fe', activeText: '#0369a1' },
  { id: 'Lawson', label: '羅森 Lawson', category: '便利商店', subcategory: '連鎖超商', color: '#0284c7', dotBg: '#2563eb', activeBg: '#eff6ff', activeText: '#1d4ed8' }
];

export default function CategoryFilter({
  currentCategory = 'all',
  onSelectCategory,
  categoryCounts = {},
  currentSubcategory = 'all',
  onSelectSubcategory = () => {},
  subcategoryCounts = {},
  currentBrand = 'all',
  onSelectBrand = () => {},
  brandCounts = {}
}) {
  // 1. 動態計算當前可選的 Tier 2 子分類清單
  const availableSubcategories = SUBCATEGORIES_CONFIG[currentCategory] || SUBCATEGORIES_CONFIG.all;

  // 2. 動態篩選當前可見的 Tier 3 品牌晶片
  let matchedBrands = ALL_BRANDS_REGISTRY;
  if (currentCategory !== 'all') {
    matchedBrands = matchedBrands.filter(b => b.category === currentCategory);
  }
  if (currentSubcategory !== 'all') {
    matchedBrands = matchedBrands.filter(b => b.subcategory === currentSubcategory);
  }

  // 3. 組合「全部品牌」按鈕標籤
  let allBrandLabel = '全部品牌';
  let allBrandCount = 0;
  if (currentCategory === '飯店') {
    allBrandLabel = '全部飯店品牌';
    allBrandCount = categoryCounts['飯店'] || 0;
  } else if (currentCategory === '購物藥妝') {
    allBrandLabel = currentSubcategory === '3C家電' ? '全部 3C 品牌' : '全部購物品牌';
    allBrandCount = currentSubcategory === '3C家電' ? (subcategoryCounts['3C家電'] || 0) : (categoryCounts['購物藥妝'] || 0);
  } else if (currentCategory === '美食餐廳') {
    allBrandLabel = currentSubcategory !== 'all' ? `全部${currentSubcategory}品牌` : '全部美食品牌';
    allBrandCount = currentSubcategory !== 'all' ? (subcategoryCounts[currentSubcategory] || 0) : (categoryCounts['美食餐廳'] || 0);
  } else if (currentCategory === '便利商店') {
    allBrandLabel = '全部超商品牌';
    allBrandCount = categoryCounts['便利商店'] || 0;
  } else {
    allBrandCount = categoryCounts.all || 0;
  }

  const displayBrandChips = [
    { id: 'all', label: allBrandLabel, color: '#64748b', isAll: true, totalCount: allBrandCount },
    ...matchedBrands
  ];

  return (
    <div className="filter-system-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.35rem' }}>
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 【Tier 1】 頂層生活大分類 Pills */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="category-pills">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const count = categoryCounts[cat.id] || 0;
          const isActive = currentCategory === cat.id;

          return (
            <button
              key={cat.id}
              className={`pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                onSelectCategory(cat.id);
                if (onSelectSubcategory) {
                  onSelectSubcategory('all');
                }
                if (onSelectBrand) {
                  onSelectBrand('all');
                }
              }}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: '0.72rem',
                  opacity: 0.85,
                  marginLeft: '0.15rem',
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-page)',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '10px'
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 【Tier 2】 業態與料理子分類 (Subcategory Pills) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {availableSubcategories.length > 1 && (
        <div className="subcategory-chips-row" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.25rem 0.4rem',
          background: 'var(--bg-page, #f8fafc)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            marginRight: '0.2rem',
            flexShrink: 0
          }}>
            <Tags size={12} color="var(--primary)" />
            <span>子類:</span>
          </span>

          {availableSubcategories.map(sub => {
            const isSubActive = currentSubcategory === sub.id;
            const subCount = sub.id === 'all'
              ? (categoryCounts[currentCategory] || categoryCounts.all || 0)
              : (subcategoryCounts[sub.id] || 0);

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  onSelectSubcategory(sub.id);
                  if (onSelectBrand) {
                    onSelectBrand('all');
                  }
                }}
                style={{
                  background: isSubActive ? 'var(--primary, #00489d)' : 'var(--bg-card, #ffffff)',
                  color: isSubActive ? '#ffffff' : 'var(--text-main)',
                  border: isSubActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.74rem',
                  fontWeight: isSubActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                <span>{sub.label}</span>
                {subCount > 0 && (
                  <span style={{
                    fontSize: '0.66rem',
                    opacity: isSubActive ? 0.9 : 0.65,
                    fontWeight: 600
                  }}>
                    {subCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 【Tier 3】 連鎖品牌篩選晶片 (Brand Chips) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {displayBrandChips.length > 0 && onSelectBrand && (
        <div className="brand-chips-row" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.35rem 0.5rem',
          background: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            marginRight: '0.2rem',
            flexShrink: 0
          }}>
            <Building2 size={12} />
            <span>品牌:</span>
          </span>

          {displayBrandChips.map(b => {
            const isBrandActive = currentBrand === b.id;
            const bCount = b.isAll ? b.totalCount : (brandCounts[b.id] || 0);

            return (
              <button
                key={b.id}
                type="button"
                className={`brand-chip-btn ${isBrandActive ? 'active' : ''}`}
                onClick={() => onSelectBrand(b.id)}
                style={{
                  background: isBrandActive ? (b.activeBg || 'var(--primary-light)') : 'transparent',
                  color: isBrandActive ? (b.activeText || 'var(--primary)') : 'var(--text-main)',
                  border: isBrandActive ? `1px solid ${b.color || 'var(--primary)'}` : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: isBrandActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                {!b.isAll && b.dotBg && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: b.dotBg,
                    display: 'inline-block'
                  }} />
                )}
                <span>{b.label}</span>
                {bCount !== undefined && bCount > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    opacity: 0.7,
                    fontWeight: 600,
                    marginLeft: '0.1rem'
                  }}>
                    {bCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
