import React from 'react';
import { LayoutGrid, BedDouble, Utensils, Store, ShoppingBag } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: '全部', icon: LayoutGrid },
  { id: '飯店', label: '飯店旅館', icon: BedDouble },
  { id: '美食餐廳', label: '在地美食', icon: Utensils },
  { id: '便利商店', label: '便利商店', icon: Store },
  { id: '購物藥妝', label: '購物藥妝', icon: ShoppingBag }
];

export default function CategoryFilter({ currentCategory, onSelectCategory, categoryCounts = {} }) {
  return (
    <div className="category-pills">
      {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        const count = categoryCounts[cat.id] || 0;
        const isActive = currentCategory === cat.id;

        return (
          <button
            key={cat.id}
            className={`pill-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
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
  );
}
