import React from 'react';
import { LayoutGrid, BedDouble, Utensils, Store, ShoppingBag, Building2, ShoppingCart, UtensilsCrossed } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: '全部', icon: LayoutGrid },
  { id: '飯店', label: '飯店旅館', icon: BedDouble },
  { id: '購物藥妝', label: '購物藥妝', icon: ShoppingBag },
  { id: '美食餐廳', label: '在地美食', icon: Utensils },
  { id: '便利商店', label: '便利商店', icon: Store }
];

const HOTEL_BRANDS = [
  { id: 'all', label: '全部飯店', color: '#64748b' },
  { id: '東橫INN', label: '東橫 INN', color: '#00489d', dotBg: '#00489d', activeBg: '#eff6ff', activeText: '#1e40af' },
  { id: 'APA飯店', label: 'APA 飯店', color: '#d97706', dotBg: '#d97706', activeBg: '#fef3c7', activeText: '#92400e' }
];

const SHOPPING_BRANDS = [
  { id: 'all', label: '全部購物', color: '#64748b' },
  { id: '唐吉訶德', label: '唐吉訶德 (Donki)', color: '#ca8a04', dotBg: '#eab308', activeBg: '#fef9c3', activeText: '#854d0e' },
  { id: '松本清', label: '松本清 (Matsukiyo)', color: '#2563eb', dotBg: '#3b82f6', activeBg: '#eff6ff', activeText: '#1d4ed8' },
  { id: 'Bic Camera', label: 'Bic Camera', color: '#dc2626', dotBg: '#ef4444', activeBg: '#fee2e2', activeText: '#b91c1c' },
  { id: '友都八喜', label: '友都八喜 (Yodobashi)', color: '#0284c7', dotBg: '#0284c7', activeBg: '#e0f2fe', activeText: '#0369a1' },
  { id: 'Kojima', label: 'Kojima × Bic', color: '#ea580c', dotBg: '#ea580c', activeBg: '#ffedd5', activeText: '#c2410c' },
  { id: 'Sofmap', label: 'Sofmap (索芙瑪)', color: '#2563eb', dotBg: '#2563eb', activeBg: '#eff6ff', activeText: '#1d4ed8' }
];

const DINING_BRANDS = [
  { id: 'all', label: '全部美食', color: '#64748b' },
  { id: '吉野家', label: '吉野家', color: '#ea580c', dotBg: '#ea580c', activeBg: '#ffedd5', activeText: '#c2410c' },
  { id: '松屋', label: '松屋', color: '#0284c7', dotBg: '#0284c7', activeBg: '#e0f2fe', activeText: '#0369a1' },
  { id: 'すき家', label: 'すき家 (Sukiya)', color: '#dc2626', dotBg: '#dc2626', activeBg: '#fee2e2', activeText: '#b91c1c' },
  { id: '一蘭拉麵', label: '一蘭拉麵', color: '#16a34a', dotBg: '#dc2626', activeBg: '#f0fdf4', activeText: '#15803d' },
  { id: '一風堂', label: '一風堂 (IPPUDO)', color: '#b91c1c', dotBg: '#dc2626', activeBg: '#fef2f2', activeText: '#991b1b' },
  { id: '壽司郎', label: '壽司郎 (Sushiro)', color: '#dc2626', dotBg: '#ef4444', activeBg: '#fee2e2', activeText: '#b91c1c' },
  { id: '藏壽司', label: '藏壽司 (Kura)', color: '#0284c7', dotBg: '#0284c7', activeBg: '#e0f2fe', activeText: '#0369a1' },
  { id: 'やよい軒', label: 'やよい軒 (彌生軒)', color: '#d97706', dotBg: '#d97706', activeBg: '#fef3c7', activeText: '#92400e' },
  { id: '大戶屋', label: '大戶屋 (Ootoya)', color: '#1e3a8a', dotBg: '#1e3a8a', activeBg: '#eff6ff', activeText: '#1e40af' },
  { id: '客美多咖啡', label: '客美多咖啡', color: '#78350f', dotBg: '#92400e', activeBg: '#fef3c7', activeText: '#78350f' }
];

const CONVENIENCE_BRANDS = [
  { id: 'all', label: '全部超商', color: '#64748b' },
  { id: '7-Eleven', label: '7-Eleven', color: '#16a34a', dotBg: '#ea580c', activeBg: '#f0fdf4', activeText: '#15803d' },
  { id: 'FamilyMart', label: '全家 FamilyMart', color: '#0284c7', dotBg: '#16a34a', activeBg: '#e0f2fe', activeText: '#0369a1' },
  { id: 'Lawson', label: '羅森 Lawson', color: '#0284c7', dotBg: '#2563eb', activeBg: '#eff6ff', activeText: '#1d4ed8' }
];

export default function CategoryFilter({
  currentCategory,
  onSelectCategory,
  categoryCounts = {},
  currentBrand = 'all',
  onSelectBrand,
  brandCounts = {}
}) {
  let displayBrands = [];
  let brandSectionTitle = '品牌:';
  let BrandIcon = Building2;

  if (currentCategory === '飯店') {
    displayBrands = HOTEL_BRANDS;
    brandSectionTitle = '連鎖商旅:';
    BrandIcon = Building2;
  } else if (currentCategory === '購物藥妝') {
    displayBrands = SHOPPING_BRANDS;
    brandSectionTitle = '購物品牌:';
    BrandIcon = ShoppingCart;
  } else if (currentCategory === '美食餐廳') {
    displayBrands = DINING_BRANDS;
    brandSectionTitle = '平價美食:';
    BrandIcon = UtensilsCrossed;
  } else if (currentCategory === '便利商店') {
    displayBrands = CONVENIENCE_BRANDS;
    brandSectionTitle = '便利超商:';
    BrandIcon = Store;
  } else if (currentCategory === 'all') {
    displayBrands = [
      { id: 'all', label: '全部品牌', color: '#64748b' },
      HOTEL_BRANDS[1],
      HOTEL_BRANDS[2],
      SHOPPING_BRANDS[1],
      SHOPPING_BRANDS[2],
      DINING_BRANDS[1],
      DINING_BRANDS[2],
      DINING_BRANDS[4],
      DINING_BRANDS[5],
      CONVENIENCE_BRANDS[1],
      CONVENIENCE_BRANDS[2],
      CONVENIENCE_BRANDS[3]
    ];
    brandSectionTitle = '熱門品牌:';
    BrandIcon = Building2;
  }

  return (
    <div className="filter-system-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
      {/* 第一層：大分類 Pills */}
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

      {/* 第二層：品牌篩選晶片 (Level 2 Brand Chips) */}
      {displayBrands.length > 0 && onSelectBrand && (
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
            <BrandIcon size={12} />
            {brandSectionTitle}
          </span>

          {displayBrands.map(brand => {
            const count = brand.id === 'all'
              ? (categoryCounts[currentCategory] !== undefined ? categoryCounts[currentCategory] : (categoryCounts['all'] || 0))
              : (brandCounts[brand.id] || 0);
            const isBrandActive = currentBrand === brand.id;

            return (
              <button
                key={brand.id}
                onClick={() => onSelectBrand(brand.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  border: isBrandActive ? `1.5px solid ${brand.color}` : '1px solid var(--border-color)',
                  background: isBrandActive ? (brand.activeBg || 'var(--bg-hover)') : 'transparent',
                  color: isBrandActive ? (brand.activeText || 'var(--text-main)') : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: isBrandActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                {brand.dotBg && (
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: brand.dotBg,
                    display: 'inline-block'
                  }} />
                )}
                <span>{brand.label}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    opacity: 0.85,
                    padding: '0.05rem 0.25rem',
                    borderRadius: '4px',
                    background: isBrandActive ? 'rgba(0,0,0,0.06)' : 'var(--bg-page)'
                  }}>
                    {count}
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
