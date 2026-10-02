import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import StationSearchBar from './components/StationSearchBar';
import CategoryFilter from './components/CategoryFilter';
import RegionHierarchyFilter from './components/RegionHierarchyFilter';
import SpotCard from './components/SpotCard';
import InteractiveMap from './components/InteractiveMap';
import WelcomeExplorer from './components/WelcomeExplorer';
import SyncModal from './components/SyncModal';
import { Train, MapPin, RefreshCw, X, SlidersHorizontal, BedDouble, ChevronLeft } from 'lucide-react';

// Attempt to load generated spots and stations data
let initialSpots = [];
let initialStations = [];
try {
  initialSpots = (await import('./data/spots.json')).default;
} catch (_) {}
try {
  initialStations = (await import('./data/stations.json')).default;
} catch (_) {}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Distance in meters
}

export default function App() {
  const [spots, setSpots] = useState(initialSpots);
  const [stations, setStations] = useState(initialStations);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('全部地區');
  const [selectedPrefecture, setSelectedPrefecture] = useState('全部都道府縣');
  const [walkFilter, setWalkFilter] = useState('all');
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('japan_guide_theme') || 'light');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isMobileDrawerCollapsed, setIsMobileDrawerCollapsed] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(100);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const cardListRef = useRef(null);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('japan_guide_theme', theme);
  }, [theme]);

  // Compute Category Counts
  const categoryCounts = useMemo(() => {
    const counts = { all: spots.length };
    spots.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [spots]);

  // Compute Brand Counts for all brands across all categories
  const brandCounts = useMemo(() => {
    const counts = {};
    spots.forEach(s => {
      if (s.brand) {
        counts[s.brand] = (counts[s.brand] || 0) + 1;
      }
    });
    return counts;
  }, [spots]);

  // Filter and Sort Spots
  const filteredSpots = useMemo(() => {
    return spots
      .map(spot => {
        let dist = Infinity;
        if (selectedStation && spot.lat && spot.lng) {
          dist = calculateDistance(selectedStation.lat, selectedStation.lng, spot.lat, spot.lng);
        }
        return { ...spot, currentDistance: dist };
      })
      .filter(spot => {
        // Category Filter
        if (selectedCategory !== 'all' && spot.category !== selectedCategory) {
          return false;
        }

        // Brand Filter (when specified)
        if (selectedBrand !== 'all' && spot.brand !== selectedBrand) {
          return false;
        }

        // Region Filter
        if (selectedRegion !== '全部地區' && spot.region !== selectedRegion) {
          return false;
        }

        // Prefecture Filter
        if (selectedPrefecture !== '全部都道府縣' && spot.prefecture !== selectedPrefecture) {
          return false;
        }

        // Walk Minutes Filter
        if (walkFilter !== 'all') {
          const maxMinutes = parseInt(walkFilter, 10);
          if (spot.walkMinutes > maxMinutes) return false;
        }

        // Station Radius Filter (if a station is selected, filter within 3.5km, with distance priority)
        if (selectedStation && spot.currentDistance > 3500) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // When a station is selected, sort strictly by closest distance
        if (selectedStation) {
          return a.currentDistance - b.currentDistance;
        }
        // Otherwise sort by walk minutes or region
        return (a.walkMinutes || 5) - (b.walkMinutes || 5);
      });
  }, [spots, selectedCategory, selectedBrand, selectedRegion, selectedPrefecture, walkFilter, selectedStation]);

  // Reset visible limit back to 100 whenever filters change
  useEffect(() => {
    setVisibleLimit(100);
  }, [selectedCategory, selectedBrand, selectedRegion, selectedPrefecture, walkFilter, selectedStation]);

  // Handle Spot Selection
  const handleSelectSpot = (spot) => {
    setSelectedSpot(spot);
    if (!spot) return;

    // If spot is beyond currently loaded cards, expand visibleLimit to reveal it
    const index = filteredSpots.findIndex(s => s.id === spot.id);
    if (index >= 0 && index >= visibleLimit) {
      setVisibleLimit(Math.ceil((index + 1) / 100) * 100);
    }

    // Find spot's element and scroll into view in desktop sidebar
    setTimeout(() => {
      if (cardListRef.current) {
        const el = document.getElementById(`spot-card-${spot.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 60);
  };

  // 判斷當前是否已有任何主動篩選條件或使用者主動展開
  const hasActiveFilter = useMemo(() => {
    return Boolean(
      (selectedCategory && selectedCategory !== 'all') ||
      selectedBrand !== 'all' ||
      selectedRegion !== '全部地區' ||
      selectedPrefecture !== '全部都道府縣' ||
      walkFilter !== 'all' ||
      selectedStation ||
      selectedSpot
    );
  }, [selectedCategory, selectedBrand, selectedRegion, selectedPrefecture, walkFilter, selectedStation, selectedSpot]);

  const isExploreMode = !hasActiveFilter && !hasUserInteracted;

  // Reset all filters
  const handleResetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedRegion('全部地區');
    setSelectedPrefecture('全部都道府縣');
    setWalkFilter('all');
    setSelectedStation(null);
    setSelectedSpot(null);
    setVisibleLimit(100);
    setHasUserInteracted(false);
  };

  // Visible spots capped at 100 per load to optimize DOM & memory resources
  const visibleSpots = useMemo(() => {
    return filteredSpots.slice(0, visibleLimit);
  }, [filteredSpots, visibleLimit]);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        totalSpots={spots.length}
        currentCategory={selectedCategory}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Main Body */}
      <div className="main-content">
        {/* Left Sidebar: Controls and Spot Cards */}
        <aside className={`sidebar ${isMobileDrawerCollapsed ? 'collapsed' : ''}`}>
          {/* Mobile Drawer Grab Handle */}
          <div
            className="mobile-drawer-handle"
            onClick={() => setIsMobileDrawerCollapsed(prev => !prev)}
          />

          {isExploreMode ? (
            /* Mode 1: 探索首頁模式 (Google Maps / Airbnb 風格：上方搜尋，下方探索主頁，零冗餘！) */
            <div className="explore-mode-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
              <div style={{ padding: '0.85rem 1rem 0.65rem 1rem', borderBottom: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-card, #ffffff)' }}>
                <StationSearchBar
                  stations={stations}
                  selectedStation={selectedStation}
                  onSelectStation={(st) => {
                    setSelectedStation(st);
                    if (st.region) setSelectedRegion(st.region);
                    if (st.prefecture) setSelectedPrefecture(st.prefecture);
                    setHasUserInteracted(true);
                  }}
                  onClearStation={() => setSelectedStation(null)}
                />
              </div>

              <WelcomeExplorer
                totalSpots={spots.length}
                stations={stations}
                categoryCounts={categoryCounts}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setSelectedBrand('all');
                  setHasUserInteracted(true);
                }}
                onSelectStation={(st) => {
                  setSelectedStation(st);
                  if (st.region) setSelectedRegion(st.region);
                  if (st.prefecture) setSelectedPrefecture(st.prefecture);
                  setHasUserInteracted(true);
                }}
                onSelectPrefecture={(pref, reg) => {
                  setSelectedPrefecture(pref);
                  if (reg) setSelectedRegion(reg);
                  setHasUserInteracted(true);
                }}
                onBrowseAll={() => {
                  setHasUserInteracted(true);
                }}
              />
            </div>
          ) : (
            /* Mode 2: 結果瀏覽模式 (當使用者點擊分類、搜尋車站或都道府縣時，展示篩選控制列與店家卡片清單) */
            <>
              <div className="sidebar-header">
                {/* 0. Results Mode Navigation Bar (Google Maps style Back Header) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.45rem',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '0.1rem'
                }}>
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary, #00489d)',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0'
                    }}
                  >
                    <ChevronLeft size={16} />
                    <span>返回探索首頁</span>
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    共 <strong>{filteredSpots.length}</strong> 處地標
                  </span>
                </div>

                {/* 1. Station Smart Search Autocomplete */}
                <StationSearchBar
                  stations={stations}
                  selectedStation={selectedStation}
                  onSelectStation={(st) => {
                    setSelectedStation(st);
                    if (st.region) setSelectedRegion(st.region);
                    if (st.prefecture) setSelectedPrefecture(st.prefecture);
                    setHasUserInteracted(true);
                  }}
                  onClearStation={() => setSelectedStation(null)}
                />

                {/* 2. Two-tier Category & Brand Filter */}
                <CategoryFilter
                  currentCategory={selectedCategory}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setSelectedBrand('all');
                    setHasUserInteracted(true);
                  }}
                  categoryCounts={categoryCounts}
                  currentBrand={selectedBrand}
                  onSelectBrand={(b) => {
                    setSelectedBrand(b);
                    setHasUserInteracted(true);
                  }}
                  brandCounts={brandCounts}
                />

                {/* 3. Region, Prefecture & Walk Radius Filter */}
                <RegionHierarchyFilter
                  selectedRegion={selectedRegion}
                  selectedPrefecture={selectedPrefecture}
                  walkFilter={walkFilter}
                  onSelectRegion={(reg) => {
                    setSelectedRegion(reg);
                    if (reg !== '全部地區') setHasUserInteracted(true);
                  }}
                  onSelectPrefecture={(pref) => {
                    setSelectedPrefecture(pref);
                    if (pref !== '全部都道府縣') setHasUserInteracted(true);
                  }}
                  onSelectWalkFilter={(w) => {
                    setWalkFilter(w);
                    if (w !== 'all') setHasUserInteracted(true);
                  }}
                />

                {/* 4. Active Station Focus Banner (When a station is active) */}
                {selectedStation && (
                  <div className="active-station-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Train size={15} />
                      <span>已聚焦 <strong>{selectedStation.name}</strong> 步行生活圈（半徑 1km 內）</span>
                    </div>
                    <button
                      className="banner-reset-btn"
                      onClick={() => setSelectedStation(null)}
                    >
                      解除聚焦
                    </button>
                  </div>
                )}

                {/* Stats Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>
                    {filteredSpots.length > visibleSpots.length ? (
                      <>顯示前 <strong>{visibleSpots.length}</strong> / <strong>{filteredSpots.length}</strong> 處地標</>
                    ) : (
                      <>顯示 <strong>{filteredSpots.length}</strong> 處地標</>
                    )}
                    {selectedStation && ` (依距離排序)`}
                  </span>
                  <button
                    onClick={handleResetAllFilters}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <RefreshCw size={12} />
                    重設篩選
                  </button>
                </div>
              </div>

              {/* Cards List (Only renders up to 100 cards initially to save resources) */}
              <div className="cards-scroll-container" ref={cardListRef}>
                {filteredSpots.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <BedDouble size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <h4 style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      找不到符合條件的地標
                    </h4>
                    <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
                      請嘗試放寬步行距離、切換都道府縣或搜尋其他車站
                    </p>
                    <button
                      onClick={handleResetAllFilters}
                      className="btn-action btn-primary"
                      style={{ margin: '0 auto', padding: '0.45rem 1rem' }}
                    >
                      重設篩選條件
                    </button>
                  </div>
                ) : (
                  <>
                    {visibleSpots.map(spot => (
                      <div key={spot.id} id={`spot-card-${spot.id}`}>
                        <SpotCard
                          spot={spot}
                          isSelected={selectedSpot?.id === spot.id}
                          selectedStation={selectedStation}
                          onSelect={handleSelectSpot}
                        />
                      </div>
                    ))}

                    {/* 載入更多 100 筆按鈕 */}
                    {filteredSpots.length > visibleSpots.length && (
                      <div style={{ padding: '1rem 0.5rem 1.5rem 0.5rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setVisibleLimit(prev => Math.min(prev + 100, filteredSpots.length))}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg-card, #ffffff)',
                            border: '1.5px solid var(--primary, #00489d)',
                            color: 'var(--primary, #00489d)',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0, 72, 157, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.2rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 72, 157, 0.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card, #ffffff)'; }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>⬇️ 載入更多 100 筆地標</span>
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                            已顯示 {visibleSpots.length} / 共 {filteredSpots.length} 處（尚有 {filteredSpots.length - visibleSpots.length} 處未載入）
                          </span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Right Map View */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <InteractiveMap
            spots={isExploreMode ? [] : filteredSpots}
            selectedSpot={selectedSpot}
            selectedStation={selectedStation}
            onSelectSpot={handleSelectSpot}
            theme={theme}
          />
          {isExploreMode && (
            <div style={{
              position: 'absolute',
              top: '1.2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999,
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid var(--border-color, #e2e8f0)',
              borderRadius: '30px',
              padding: '0.55rem 1.25rem',
              boxShadow: '0 4px 16px rgba(0, 72, 157, 0.12)',
              color: 'var(--text-main, #1e293b)',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              pointerEvents: 'none'
            }}>
              <span>🔍</span>
              <span>請在左側搜尋車站、都道府縣或點選分類標籤，立即顯示在地生活圈店家</span>
            </div>
          )}
        </div>
      </div>

      {/* Google Sheet Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
}
