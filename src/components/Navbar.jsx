import React from 'react';
import { MapPin, Moon, Sun, Database, Sparkles, BedDouble } from 'lucide-react';

export default function Navbar({ totalSpots, currentCategory, theme, onToggleTheme, onOpenSyncModal }) {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-badge">
          <BedDouble size={16} />
          <span>INN</span>
        </div>
        <div>
          <h1 className="brand-title">
            日本在地導覽地圖
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent-pink)', background: '#fdf2f8', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #fbcfe8' }}>
              東橫 INN 旗艦版
            </span>
          </h1>
          <p className="brand-subtitle">
            依車站距離快速查找飯店、在地美食與便利生活圈
          </p>
        </div>
      </div>

      <div className="nav-actions">
        <button
          onClick={onOpenSyncModal}
          className="pill-btn"
          title="Google Sheet 資料庫設定"
          style={{ borderColor: '#cbd5e1' }}
        >
          <Database size={14} color="#00489d" />
          <span style={{ fontSize: '0.8rem' }}>Google Sheet 串接</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="map-control-btn"
          title="切換深淺色主題"
          style={{ width: '36px', height: '36px' }}
        >
          {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#475569" />}
        </button>
      </div>
    </header>
  );
}
