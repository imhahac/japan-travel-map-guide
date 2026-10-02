import React from 'react';
import { BedDouble, Utensils, ShoppingBag, Store, Train, Compass, MapPin } from 'lucide-react';

const QUICK_CATEGORIES = [
  {
    id: '飯店',
    name: '飯店旅館',
    icon: BedDouble,
    desc: '東橫 INN、APA 等車站商務旅館',
    color: '#00489d',
    bg: '#eff6ff',
    border: '#bfdbfe'
  },
  {
    id: '美食餐廳',
    name: '在地美食',
    icon: Utensils,
    desc: '一蘭、一風堂、牛丼、壽司、定食',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa'
  },
  {
    id: '購物藥妝',
    name: '購物藥妝',
    icon: ShoppingBag,
    desc: '唐吉訶德、松本清、Bic Camera',
    color: '#ca8a04',
    bg: '#fefce8',
    border: '#fef08a'
  },
  {
    id: '便利商店',
    name: '便利商店',
    icon: Store,
    desc: '7-11、全家、Lawson 車站生活圈',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0'
  }
];

const HOT_STATIONS = [
  { name: '新宿站', region: '關東', pref: '東京都' },
  { name: '東京站', region: '關東', pref: '東京都' },
  { name: '澀谷站', region: '關東', pref: '東京都' },
  { name: '池袋站', region: '關東', pref: '東京都' },
  { name: '上野站', region: '關東', pref: '東京都' },
  { name: '秋葉原站', region: '關東', pref: '東京都' },
  { name: '難波站', region: '近畿', pref: '大阪府' },
  { name: '梅田站', region: '近畿', pref: '大阪府' },
  { name: '京都站', region: '近畿', pref: '京都府' },
  { name: '博多站', region: '九州・沖繩', pref: '福岡縣' },
  { name: '札幌站', region: '北海道', pref: '北海道' },
  { name: '縣廳前站', region: '九州・沖繩', pref: '沖繩縣' }
];

const POPULAR_PREFECTURES = [
  { name: '東京都', region: '關東' },
  { name: '大阪府', region: '近畿' },
  { name: '京都府', region: '近畿' },
  { name: '北海道', region: '北海道' },
  { name: '福岡縣', region: '九州・沖繩' },
  { name: '沖繩縣', region: '九州・沖繩' }
];

export default function WelcomeExplorer({
  totalSpots = 0,
  stations = [],
  onSelectCategory,
  onSelectStation,
  onSelectPrefecture,
  onBrowseAll
}) {
  return (
    <div className="welcome-explorer-container" style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 探索指引橫幅 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 72, 157, 0.08), rgba(37, 99, 235, 0.04))',
        border: '1px solid rgba(0, 72, 157, 0.15)',
        borderRadius: '12px',
        padding: '1.1rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'var(--primary, #00489d)',
          color: '#ffffff',
          marginBottom: '0.6rem',
          boxShadow: '0 4px 10px rgba(0, 72, 157, 0.25)'
        }}>
          <Compass size={20} />
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          探索日本鐵道生活圈
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          請選擇下方分類或搜尋車站，系統將即時載入步行範圍內的連鎖名店與住宿點。
        </p>
      </div>

      {/* 1. 四大主題分類快速選擇 */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span>🎯 熱門分類快速探索</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
          {QUICK_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: `1px solid ${cat.border}`,
                  borderRadius: '10px',
                  padding: '0.75rem 0.6rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = cat.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                  e.currentTarget.style.borderColor = cat.border;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: cat.bg,
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={15} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {cat.name}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {cat.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 熱門樞紐車站生活圈 */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Train size={14} color="#00489d" />
          <span>熱門樞紐車站步行圈</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {HOT_STATIONS.map(st => {
            const fullStation = stations.find(s => s.name.includes(st.name.replace(/站$/, '')));
            return (
              <button
                key={st.name}
                type="button"
                onClick={() => {
                  if (fullStation) {
                    onSelectStation(fullStation);
                  } else {
                    onSelectStation({ name: st.name, lat: 35.6909, lng: 139.7000, region: st.region, prefecture: st.pref });
                  }
                }}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '20px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary, #00489d)';
                  e.currentTarget.style.color = 'var(--primary, #00489d)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
              >
                <span>{st.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 熱門都道府縣捷徑 */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <MapPin size={14} color="#ea580c" />
          <span>主要都道府縣</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {POPULAR_PREFECTURES.map(p => (
            <button
              key={p.name}
              type="button"
              onClick={() => onSelectPrefecture(p.name, p.region)}
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '6px',
                padding: '0.28rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#ea580c';
                e.currentTarget.style.color = '#ea580c';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. 次要操作：直接瀏覽全部 */}
      {totalSpots > 0 && onBrowseAll && (
        <div style={{ textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color, #e2e8f0)' }}>
          <button
            type="button"
            onClick={onBrowseAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary, #00489d)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '0.2rem 0.5rem'
            }}
          >
            直接瀏覽全日本所有地標（共 {totalSpots} 處）›
          </button>
        </div>
      )}
    </div>
  );
}
