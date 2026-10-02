import React from 'react';
import { LayoutGrid, BedDouble, Utensils, Store, ShoppingBag, Sparkles, Building2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: '全部', icon: LayoutGrid },
  { id: '飯店', label: '飯店旅館', icon: BedDouble },
  { id: '購物藥妝', label: '購物藥妝', icon: ShoppingBag },
  { id: '美食餐廳', label: '在地美食', icon: Utensils },
  { id: '便利商店', label: '便利商店', icon: Store }
];

const HOTEL_BRANDS = [
  { id: 'all', label: '全部飯店', color: '#64748b' },
  { id: '東橫INN', label: '東橫 INN', color: '#00489d', dotBg: '#00489d' },
  { id: 'APA飯店', label: 'APA 飯店', color: '#d97706', dotBg: '#d97706' }
];

export default function CategoryFilter({
  currentCategory,
  onSelectCategory,
  categoryCounts = {},
  currentBrand = 'all',
  onSelectBrand,
  brandCounts = {}
}) {
  const showHotelBrands = currentCategory === 'all' || currentCategory === '飯店';

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
                // 當切換到非飯店時，自動重設品牌篩選
                if (cat.id !== '飯店' && cat.id !== 'all' && onSelectBrand) {
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
      {showHotelBrands && onSelectBrand && (
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
            marginRight: '0.2rem'
          }}>
            <Building2 size={12} />
            品牌:
          </span>

          {HOTEL_BRANDS.map(brand => {
            const count = brandCounts[brand.id] || 0;
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
                  background: isBrandActive ? (brand.id === 'APA飯店' ? '#fef3c7' : (brand.id === '東橫INN' ? '#eff6ff' : 'var(--bg-hover)')) : 'transparent',
                  color: isBrandActive ? (brand.id === 'APA飯店' ? '#92400e' : (brand.id === '東橫INN' ? '#1e40af' : 'var(--text-main)')) : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: isBrandActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
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
