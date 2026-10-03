import React from 'react';
import { MapPin, Moon, Sun, Sparkles } from 'lucide-react';

export default function Navbar({ totalSpots = 0, currentCategory, theme, onToggleTheme }) {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-badge">
          <MapPin size={16} />
          <span>MAP</span>
        </div>
        <div>
          <h1 className="brand-title">
            日本在地導覽地圖
          </h1>
          <p className="brand-subtitle">
            依車站距離快速查找飯店、在地美食與便利生活圈
          </p>
        </div>
      </div>

      <div className="nav-actions">
        {totalSpots > 0 && (
          <div className="nav-spots-badge desktop-only" title="日本全國已收錄門市總數">
            <Sparkles size={13} color="#00489d" />
            <span>{totalSpots.toLocaleString()} 處地標</span>
          </div>
        )}

        <button
          onClick={onToggleTheme}
          className="map-control-btn theme-toggle-btn"
          title="切換深淺色主題"
          aria-label="切換主題"
        >
          {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#475569" />}
        </button>
      </div>
    </header>
  );
}
