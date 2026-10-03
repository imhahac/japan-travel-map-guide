import React from 'react';
import {
  LayoutGrid,
  BedDouble,
  ShoppingBag,
  Utensils,
  Store,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  CATEGORIES,
  SUBCATEGORIES_MAP,
  BRANDS_REGISTRY,
  isBrandMatch
} from '../constants/taxonomy.js';

const ICON_MAP = {
  LayoutGrid,
  BedDouble,
  ShoppingBag,
  Utensils,
  Store
};

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
  const availableSubcategories = SUBCATEGORIES_MAP[currentCategory] || [
    { id: 'all', label: '全部業態' },
    { id: '商務飯店', label: '商務飯店' },
    { id: '藥妝量販', label: '綜合藥妝' },
    { id: '3C家電', label: '3C數位家電' },
    { id: '拉麵', label: '日式拉麵' },
    { id: '牛丼', label: '平價牛丼' },
    { id: '壽司', label: '迴轉壽司' },
    { id: '定食', label: '和風定食' },
    { id: '咖啡', label: '喫茶咖啡' },
    { id: '連鎖超商', label: '連鎖超商' }
  ];

  // 2. 動態篩選當前可見的 Tier 3 品牌清單
  let matchedBrands = BRANDS_REGISTRY;
  if (currentCategory !== 'all') {
    matchedBrands = matchedBrands.filter(b => b.category === currentCategory);
  }
  if (currentSubcategory !== 'all') {
    matchedBrands = matchedBrands.filter(b => b.subcategory === currentSubcategory);
  }

  // 3. 組合「全部品牌」按鈕標籤與數量
  let allBrandLabel = '全部品牌';
  let allBrandCount = categoryCounts.all || 0;

  if (currentCategory === '飯店') {
    allBrandLabel = '全部飯店品牌';
    allBrandCount = categoryCounts['飯店'] || 0;
  } else if (currentCategory === '購物藥妝') {
    allBrandLabel = currentSubcategory === '3C家電' ? '全部 3C 品牌' : (currentSubcategory === '藥妝量販' ? '全部藥妝品牌' : '全部購物品牌');
    allBrandCount = currentSubcategory !== 'all' ? (subcategoryCounts[currentSubcategory] || 0) : (categoryCounts['購物藥妝'] || 0);
  } else if (currentCategory === '美食餐廳') {
    allBrandLabel = currentSubcategory !== 'all' ? `全部${currentSubcategory}品牌` : '全部美食品牌';
    allBrandCount = currentSubcategory !== 'all' ? (subcategoryCounts[currentSubcategory] || 0) : (categoryCounts['美食餐廳'] || 0);
  } else if (currentCategory === '便利商店') {
    allBrandLabel = '全部超商品牌';
    allBrandCount = categoryCounts['便利商店'] || 0;
  }

  // 計算每個品牌的實際門市數量 (透過健壯配對確保不會漏算)
  const getBrandTotal = (brandItem) => {
    let total = 0;
    // 直接比對 brandCounts 中的所有 key
    Object.keys(brandCounts).forEach(spotBrandKey => {
      if (isBrandMatch(spotBrandKey, brandItem.id) || isBrandMatch(spotBrandKey, brandItem.label)) {
        total += brandCounts[spotBrandKey] || 0;
      }
    });
    return total;
  };

  const displayBrandChips = [
    { id: 'all', label: allBrandLabel, isAll: true, totalCount: allBrandCount },
    ...matchedBrands.map(b => ({
      ...b,
      totalCount: getBrandTotal(b)
    }))
  ];

  return (
    <div className="filter-system-redesign" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.25rem' }}>
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 【Tier 1】 頂層大分類膠囊 (Category Navigation Bar) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="category-pills" style={{
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        paddingBottom: '0.2rem',
        scrollbarWidth: 'none'
      }}>
        {CATEGORIES.map(cat => {
          const Icon = ICON_MAP[cat.iconName] || LayoutGrid;
          const count = categoryCounts[cat.id] || 0;
          const isActive = currentCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              className={`pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                onSelectCategory(cat.id);
                onSelectSubcategory('all');
                onSelectBrand('all');
              }}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.42rem 0.75rem',
                borderRadius: '24px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                border: isActive ? '1.5px solid var(--primary, #00489d)' : '1px solid var(--border-color, #e2e8f0)',
                background: isActive ? 'var(--primary, #00489d)' : 'var(--bg-card, #ffffff)',
                color: isActive ? '#ffffff' : 'var(--text-main, #334155)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: isActive ? '0 2px 8px rgba(0, 72, 157, 0.22)' : 'none'
              }}
            >
              <Icon size={14} style={{ opacity: isActive ? 1 : 0.75 }} />
              <span>{cat.label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  opacity: isActive ? 0.95 : 0.85,
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-page, #f1f5f9)',
                  color: isActive ? '#ffffff' : 'var(--text-muted, #64748b)',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {count.toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 【Tier 2】 次級業態 / 料理生活子分類 (Subcategory Segmented Rail) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {availableSubcategories.length > 1 && (
        <div className="subcategory-rail" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.3rem 0.5rem',
          background: 'var(--bg-page, #f8fafc)',
          borderRadius: '10px',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--primary, #00489d)',
            paddingRight: '0.35rem',
            borderRight: '1px solid var(--border-color, #e2e8f0)',
            flexShrink: 0
          }}>
            <Layers size={13} />
            <span>子類</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
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
                    onSelectBrand('all');
                  }}
                  style={{
                    background: isSubActive ? 'var(--primary, #00489d)' : 'var(--bg-card, #ffffff)',
                    color: isSubActive ? '#ffffff' : 'var(--text-main, #334155)',
                    border: isSubActive ? '1px solid var(--primary, #00489d)' : '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '16px',
                    padding: '0.22rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: isSubActive ? 700 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    boxShadow: isSubActive ? '0 2px 6px rgba(0, 72, 157, 0.18)' : '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <span>{sub.label}</span>
                  {subCount > 0 && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      opacity: isSubActive ? 0.95 : 0.8,
                      background: isSubActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-page, #f1f5f9)',
                      color: isSubActive ? '#ffffff' : 'var(--text-muted, #64748b)',
                      padding: '1px 5px',
                      borderRadius: '8px'
                    }}>
                      {subCount.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 【Tier 3】 品牌晶片列 (Brand Chips Row) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="brand-chips-container" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.3rem 0.5rem',
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '10px',
        border: '1px solid var(--border-color, #e2e8f0)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.72rem',
          fontWeight: 800,
          color: 'var(--text-muted, #64748b)',
          paddingRight: '0.35rem',
          borderRight: '1px solid var(--border-color, #e2e8f0)',
          flexShrink: 0
        }}>
          <Sparkles size={13} color="var(--primary, #00489d)" />
          <span>品牌</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {displayBrandChips.map(brand => {
            const isChipActive = brand.isAll
              ? currentBrand === 'all'
              : (currentBrand === brand.id || isBrandMatch(currentBrand, brand.id));

            return (
              <button
                key={brand.id}
                type="button"
                className={`brand-chip-btn ${isChipActive ? 'active' : ''}`}
                onClick={() => onSelectBrand(brand.id)}
                style={{
                  background: isChipActive
                    ? (brand.activeBg || 'var(--primary-light, #eff6ff)')
                    : 'transparent',
                  color: isChipActive
                    ? (brand.activeText || 'var(--primary, #00489d)')
                    : 'var(--text-main, #334155)',
                  border: isChipActive
                    ? `1.5px solid ${brand.color || 'var(--primary, #00489d)'}`
                    : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '16px',
                  padding: '0.22rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: isChipActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: isChipActive ? '0 2px 6px rgba(0, 72, 157, 0.12)' : 'none'
                }}
              >
                {!brand.isAll && (
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: brand.dotBg || brand.color || 'var(--primary)',
                    display: 'inline-block',
                    flexShrink: 0
                  }} />
                )}
                <span>{brand.label}</span>
                {brand.totalCount > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    opacity: 0.85,
                    background: isChipActive ? 'rgba(0, 72, 157, 0.12)' : 'var(--bg-page, #f1f5f9)',
                    color: isChipActive ? (brand.activeText || 'var(--primary)') : 'var(--text-muted)',
                    padding: '1px 5px',
                    borderRadius: '8px'
                  }}>
                    {brand.totalCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
