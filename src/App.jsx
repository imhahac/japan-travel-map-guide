import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import StationSearchBar from './components/StationSearchBar';
import CategoryFilter from './components/CategoryFilter';
import RegionHierarchyFilter from './components/RegionHierarchyFilter';
import SpotCard from './components/SpotCard';
import InteractiveMap from './components/InteractiveMap';
import WelcomeExplorer from './components/WelcomeExplorer';
import { Train, MapPin, RefreshCw, X, SlidersHorizontal, BedDouble, ChevronLeft, ChevronUp, ChevronDown, ExternalLink, Navigation, Map, List } from 'lucide-react';
import { isBrandMatch } from './constants/taxonomy.js';
import { buildWalkingNavUrl } from './utils/navigation.js';

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
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('全部地區');
  const [selectedPrefecture, setSelectedPrefecture] = useState('全部都道府縣');
  const [walkFilter, setWalkFilter] = useState('all');
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('japan_guide_theme') || 'light');
  const [isMobileDrawerCollapsed, setIsMobileDrawerCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 860;
    }
    return false;
  });
  const [visibleLimit, setVisibleLimit] = useState(100);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [mapViewport, setMapViewport] = useState(null);
  const [syncWithMapBounds, setSyncWithMapBounds] = useState(true);

  const cardListRef = useRef(null);
  const mapControlsRef = useRef(null);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('japan_guide_theme', theme);
  }, [theme]);

  // Compute Category Counts (Tier 1)
  const categoryCounts = useMemo(() => {
    const counts = { all: spots.length };
    spots.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [spots]);

  // Compute Subcategory Counts (Tier 2)
  const subcategoryCounts = useMemo(() => {
    const counts = {};
    spots.forEach(s => {
      if (s.subcategory) {
        if (selectedCategory === 'all' || s.category === selectedCategory) {
          counts[s.subcategory] = (counts[s.subcategory] || 0) + 1;
        }
      }
    });
    return counts;
  }, [spots, selectedCategory]);

  // Compute Brand Counts for all brands across all categories (Tier 3)
  const brandCounts = useMemo(() => {
    const counts = {};
    spots.forEach(s => {
      if (s.brand) {
        if (selectedCategory === 'all' || s.category === selectedCategory) {
          if (selectedSubcategory === 'all' || s.subcategory === selectedSubcategory) {
            counts[s.brand] = (counts[s.brand] || 0) + 1;
          }
        }
      }
    });
    return counts;
  }, [spots, selectedCategory, selectedSubcategory]);

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
        // Category Filter (Tier 1)
        if (selectedCategory !== 'all' && spot.category !== selectedCategory) {
          return false;
        }

        // Subcategory Filter (Tier 2)
        if (selectedSubcategory !== 'all' && spot.subcategory !== selectedSubcategory) {
          return false;
        }

        // Brand Filter (Tier 3)
        if (selectedBrand !== 'all' && !isBrandMatch(spot.brand, selectedBrand)) {
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
  }, [spots, selectedCategory, selectedSubcategory, selectedBrand, selectedRegion, selectedPrefecture, walkFilter, selectedStation]);

  // Filter spots within visible map viewport when syncWithMapBounds is enabled
  const inBoundsSpots = useMemo(() => {
    if (!syncWithMapBounds || !mapViewport) {
      return filteredSpots;
    }

    const { north, south, east, west } = mapViewport;

    return filteredSpots
      .filter(spot => {
        if (!spot.lat || !spot.lng) return false;
        if (spot.lat < south || spot.lat > north) return false;
        if (west <= east) {
          return spot.lng >= west && spot.lng <= east;
        } else {
          return spot.lng >= west || spot.lng <= east;
        }
      })
      .map(spot => {
        let distCenter = Infinity;
        if (mapViewport.center && spot.lat && spot.lng) {
          distCenter = calculateDistance(mapViewport.center.lat, mapViewport.center.lng, spot.lat, spot.lng);
        }
        return { ...spot, distanceToCenter: distCenter };
      })
      .sort((a, b) => {
        // 1. If station is selected, prioritize distance to station
        if (selectedStation) {
          return a.currentDistance - b.currentDistance;
        }
        // 2. If syncWithMapBounds is on, sort by distance to visible map center
        if (mapViewport.center && a.distanceToCenter !== b.distanceToCenter) {
          return a.distanceToCenter - b.distanceToCenter;
        }
        // 3. Fallback to walk minutes
        return (a.walkMinutes || 5) - (b.walkMinutes || 5);
      });
  }, [filteredSpots, syncWithMapBounds, mapViewport, selectedStation]);

  // Reset visible limit back to 100 whenever filters or map viewport changes
  useEffect(() => {
    setVisibleLimit(100);
  }, [selectedCategory, selectedSubcategory, selectedBrand, selectedRegion, selectedPrefecture, walkFilter, selectedStation, mapViewport]);

  // Handle Spot Selection
  const handleSelectSpot = (spot) => {
    setSelectedSpot(spot);
    if (!spot) return;

    setHasUserInteracted(true);
    // On desktop, auto-expand drawer; on mobile, preserve map view if drawer is collapsed and show floating mini card
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 860;
    if (!isMobile) {
      setIsMobileDrawerCollapsed(false);
    }

    // If spot is beyond currently loaded cards, expand visibleLimit to reveal it
    const index = inBoundsSpots.findIndex(s => s.id === spot.id);
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
      (selectedSubcategory && selectedSubcategory !== 'all') ||
      selectedBrand !== 'all' ||
      selectedRegion !== '全部地區' ||
      selectedPrefecture !== '全部都道府縣' ||
      walkFilter !== 'all' ||
      selectedStation ||
      selectedSpot
    );
  }, [selectedCategory, selectedSubcategory, selectedBrand, selectedRegion, selectedPrefecture, walkFilter, selectedStation, selectedSpot]);

  const isExploreMode = !hasActiveFilter && !hasUserInteracted;

  // Reset all filters
  const handleResetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
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
    return inBoundsSpots.slice(0, visibleLimit);
  }, [inBoundsSpots, visibleLimit]);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        totalSpots={spots.length}
        currentCategory={selectedCategory}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
      />

      {/* Main Body */}
      <div className="main-content">
        {/* Left Sidebar: Controls and Spot Cards */}
        <aside className={`sidebar ${isMobileDrawerCollapsed ? 'collapsed' : ''}`}>
          {/* Mobile Drawer Grab Handle & Status Bar */}
          <div
            className="mobile-drawer-header-bar"
            onClick={() => setIsMobileDrawerCollapsed(prev => !prev)}
            role="button"
            tabIndex={0}
            aria-label={isMobileDrawerCollapsed ? '展開列表' : '收合列表'}
          >
            <div className="mobile-drawer-handle" />
            <div className="mobile-drawer-status-summary">
              <span className="drawer-status-text">
                {selectedStation ? (
                  <>🚉 已聚焦 <strong>{selectedStation.name}</strong> 生活圈 ({inBoundsSpots.length} 間)</>
                ) : syncWithMapBounds ? (
                  <>📍 視野內 <strong>{inBoundsSpots.length}</strong> 處地標</>
                ) : (
                  <>🗾 全國收錄 <strong>{filteredSpots.length}</strong> 處地標</>
                )}
              </span>
              <span className="drawer-status-action">
                {isMobileDrawerCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </div>
          </div>

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
                  setSelectedSubcategory('all');
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
                    {syncWithMapBounds ? (
                      <>視野內 <strong>{inBoundsSpots.length}</strong> / 全國 {filteredSpots.length} 處</>
                    ) : (
                      <>共 <strong>{filteredSpots.length}</strong> 處地標</>
                    )}
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

                {/* 2. Three-tier Category, Subcategory & Brand Filter */}
                <CategoryFilter
                  currentCategory={selectedCategory}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory('all');
                    setSelectedBrand('all');
                    setHasUserInteracted(true);
                  }}
                  categoryCounts={categoryCounts}
                  currentSubcategory={selectedSubcategory}
                  onSelectSubcategory={(sub) => {
                    setSelectedSubcategory(sub);
                    setSelectedBrand('all');
                    setHasUserInteracted(true);
                  }}
                  subcategoryCounts={subcategoryCounts}
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

                {/* Active Filter Tag Strip (允許使用者一目了然目前生效條件，並可單鍵移除) */}
                {hasActiveFilter && (
                  <div className="active-filters-strip" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.15rem 0 0.1rem 0'
                  }}>
                    {selectedCategory !== 'all' && (
                      <span className="filter-pill-tag">
                        <span>{selectedCategory}</span>
                        <button type="button" onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); setSelectedBrand('all'); }}>
                          <X size={11} />
                        </button>
                      </span>
                    )}
                    {selectedSubcategory !== 'all' && (
                      <span className="filter-pill-tag">
                        <span>{selectedSubcategory}</span>
                        <button type="button" onClick={() => { setSelectedSubcategory('all'); setSelectedBrand('all'); }}>
                          <X size={11} />
                        </button>
                      </span>
                    )}
                    {selectedBrand !== 'all' && (
                      <span className="filter-pill-tag brand-tag">
                        <span>{selectedBrand}</span>
                        <button type="button" onClick={() => setSelectedBrand('all')}>
                          <X size={11} />
                        </button>
                      </span>
                    )}
                    {selectedRegion !== '全部地區' && (
                      <span className="filter-pill-tag">
                        <span>{selectedRegion}</span>
                        <button type="button" onClick={() => { setSelectedRegion('全部地區'); setSelectedPrefecture('全部都道府縣'); }}>
                          <X size={11} />
                        </button>
                      </span>
                    )}
                    {selectedPrefecture !== '全部都道府縣' && (
                      <span className="filter-pill-tag">
                        <span>{selectedPrefecture}</span>
                        <button type="button" onClick={() => setSelectedPrefecture('全部都道府縣')}>
                          <X size={11} />
                        </button>
                      </span>
                    )}
                    {walkFilter !== 'all' && (
                      <span className="filter-pill-tag">
                        <span>步行 ≤{walkFilter}分</span>
                        <button type="button" onClick={() => setWalkFilter('all')}>
                          <X size={11} />
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {/* Stats & Viewport Control Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  flexWrap: 'wrap',
                  gap: '0.35rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>
                      {inBoundsSpots.length > visibleSpots.length ? (
                        <>顯示前 <strong>{visibleSpots.length}</strong> / <strong>{inBoundsSpots.length}</strong> 處</>
                      ) : (
                        <>共 <strong>{inBoundsSpots.length}</strong> 處地標</>
                      )}
                      {syncWithMapBounds ? (
                        <span style={{ color: 'var(--primary, #00489d)', fontWeight: 700, marginLeft: '4px' }}>
                          (地圖範圍內)
                        </span>
                      ) : (
                        <span style={{ marginLeft: '4px' }}>(全域模式)</span>
                      )}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => setSyncWithMapBounds(prev => !prev)}
                      title={syncWithMapBounds ? "點擊解除視野連動，檢視全部符合條件之店家" : "點擊鎖定僅顯示地圖當前視野範圍內之店家"}
                      style={{
                        background: syncWithMapBounds ? 'var(--primary-light, #e8f0fe)' : 'var(--bg-page, #f1f5f9)',
                        color: syncWithMapBounds ? 'var(--primary, #00489d)' : 'var(--text-muted, #64748b)',
                        border: `1.2px solid ${syncWithMapBounds ? 'var(--primary, #00489d)' : 'var(--border, #cbd5e1)'}`,
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{syncWithMapBounds ? '📍 依地圖範圍' : '🌐 顯示全區'}</span>
                      <span style={{
                        fontSize: '8.5px',
                        background: syncWithMapBounds ? 'var(--primary, #00489d)' : '#94a3b8',
                        color: '#ffffff',
                        borderRadius: '3px',
                        padding: '1px 3.5px',
                        fontWeight: 800
                      }}>
                        {syncWithMapBounds ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {hasActiveFilter && (
                      <button
                        onClick={handleResetAllFilters}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <RefreshCw size={12} />
                        重設
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Selected Spot Information Inspector (地圖點擊/選取商家詳細資訊 - 避免誤會) */}
              {selectedSpot && (
                <div className="selected-spot-inspector" style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-page, #f8fafc)',
                  borderBottom: '1px solid var(--border, #e2e8f0)',
                  boxShadow: '0 2px 8px rgba(0, 72, 157, 0.08)'
                }}>
                  <div style={{
                    background: 'var(--bg-card, #ffffff)',
                    border: '1.5px solid var(--primary, #00489d)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    boxShadow: '0 4px 14px rgba(0, 72, 157, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{
                        background: 'var(--primary, #00489d)',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <span>📍 地圖選取商家</span>
                        <span style={{ opacity: 0.85 }}>•</span>
                        <span>{selectedSpot.brand || selectedSpot.category}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSpot(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted, #64748b)',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                        title="解除聚焦"
                      >
                        <X size={14} />
                        <span>關閉</span>
                      </button>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0 0.4rem 0', lineHeight: 1.3 }}>
                      {selectedSpot.name}
                    </h3>

                    {/* 地址 */}
                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-main)',
                      marginBottom: '0.35rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.35rem',
                      lineHeight: 1.35
                    }}>
                      <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600 }}>{selectedSpot.address || `${selectedSpot.prefecture} (無詳細地址)`}</span>
                    </div>

                    {/* 車站與步行距離 */}
                    {selectedSpot.nearestStation && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#92400e',
                        background: '#fef3c7',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        marginBottom: '0.6rem',
                        fontWeight: 600
                      }}>
                        <Train size={13} />
                        <span>鄰近 <strong>{selectedSpot.nearestStation}</strong> (步行約 {selectedSpot.walkMinutes || 3} 分鐘)</span>
                      </div>
                    )}

                    {/* 行動按鈕 */}
                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      <a
                        href={buildWalkingNavUrl(selectedSpot, selectedStation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-action btn-primary"
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.6rem',
                          fontSize: '0.78rem',
                          textAlign: 'center',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          borderRadius: '8px'
                        }}
                      >
                        <Navigation size={13} />
                        <span>步行導航</span>
                      </a>
                      {selectedSpot.bookingUrl && (
                        <a
                          href={selectedSpot.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-action"
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.6rem',
                            fontSize: '0.78rem',
                            textAlign: 'center',
                            textDecoration: 'none',
                            background: 'var(--bg-page, #f8fafc)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            borderRadius: '8px'
                          }}
                        >
                          <ExternalLink size={13} />
                          <span>前往官網</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cards List (Only renders up to 100 cards initially to save resources) */}
              <div className="cards-scroll-container" ref={cardListRef}>
                {inBoundsSpots.length === 0 ? (
                  <div className="no-spots-empty-state" style={{
                    padding: '2.5rem 1.25rem',
                    textAlign: 'center',
                    background: 'var(--bg-card, #ffffff)',
                    margin: '1rem',
                    borderRadius: '16px',
                    border: '1.5px dashed var(--border-color, #cbd5e1)'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(0, 72, 157, 0.08)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary, #00489d)',
                      margin: '0 auto 0.85rem auto'
                    }}>
                      <SlidersHorizontal size={22} />
                    </div>
                    <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                      {filteredSpots.length > 0 && syncWithMapBounds ? '當前地圖視野內暫無符合店家' : '未找到符合條件的地標'}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                      {filteredSpots.length > 0 && syncWithMapBounds ? (
                        <>您目前檢視的地圖範圍內沒有符合條件的店家（在其他區域共有 <strong>{filteredSpots.length}</strong> 間），建議滑動地圖、縮小視野或切換為全區清單：</>
                      ) : (
                        <>當前條件收斂過細，建議點擊下方快速建議進行放寬：</>
                      )}
                    </p>

                    {/* 1-Click Rescue Suggestions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
                      {filteredSpots.length > 0 && syncWithMapBounds && (
                        <>
                          <button
                            type="button"
                            onClick={() => mapControlsRef.current?.zoomOut?.()}
                            className="rescue-suggestion-btn"
                          >
                            <span>🔍 縮小地圖視野以擴大搜尋範圍</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSyncWithMapBounds(false)}
                            className="rescue-suggestion-btn"
                          >
                            <span>🌐 檢視全部 {filteredSpots.length} 間店家清單（關閉地圖範圍鎖定）</span>
                          </button>
                        </>
                      )}
                      {walkFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setWalkFilter('all')}
                          className="rescue-suggestion-btn"
                        >
                          <span>⚡ 放寬步行時間限制（切換為不限距離）</span>
                        </button>
                      )}
                      {selectedPrefecture !== '全部都道府縣' && (
                        <button
                          type="button"
                          onClick={() => { setSelectedRegion('全部地區'); setSelectedPrefecture('全部都道府縣'); }}
                          className="rescue-suggestion-btn"
                        >
                          <span>🗾 展開至全日本 47 都道府縣門市</span>
                        </button>
                      )}
                      {selectedBrand !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrand('all')}
                          className="rescue-suggestion-btn"
                        >
                          <span>🏷️ 查看 {selectedSubcategory !== 'all' ? selectedSubcategory : selectedCategory} 的所有品牌</span>
                        </button>
                      )}
                      {selectedStation && (
                        <button
                          type="button"
                          onClick={() => setSelectedStation(null)}
                          className="rescue-suggestion-btn"
                        >
                          <span>🚉 解除 {selectedStation.name} 聚焦範圍</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleResetAllFilters}
                      className="btn-action btn-primary"
                      style={{ margin: '0 auto', padding: '0.55rem 1.25rem', fontSize: '0.84rem', borderRadius: '10px' }}
                    >
                      <RefreshCw size={14} style={{ marginRight: '0.35rem' }} />
                      <span>重設所有篩選條件</span>
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
                    {inBoundsSpots.length > visibleSpots.length && (
                      <div style={{ padding: '1rem 0.5rem 1.5rem 0.5rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setVisibleLimit(prev => Math.min(prev + 100, inBoundsSpots.length))}
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
                            已顯示 {visibleSpots.length} / 共 {inBoundsSpots.length} 處（尚有 {inBoundsSpots.length - visibleSpots.length} 處未載入）
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
            onViewportChange={(vp) => setMapViewport(vp)}
            syncWithMapBounds={syncWithMapBounds}
            mapControlsRef={mapControlsRef}
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

          {/* Mobile Spot Floating Mini Preview Card */}
          {selectedSpot && isMobileDrawerCollapsed && (
            <div
              className="mobile-spot-preview-card"
              onClick={() => setIsMobileDrawerCollapsed(false)}
              role="button"
              tabIndex={0}
            >
              <div className="preview-card-inner">
                <img
                  src={selectedSpot.imageUrl || 'https://www.toyoko-inn.com/images/ogp/ogp_default.png'}
                  alt={selectedSpot.name}
                  className="preview-card-thumb"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://www.toyoko-inn.com/images/ogp/ogp_default.png';
                  }}
                />
                <div className="preview-card-info">
                  <div className="preview-card-tags">
                    <span className="preview-badge-brand">{selectedSpot.brand || selectedSpot.category}</span>
                    {selectedSpot.walkMinutes && (
                      <span className="preview-badge-walk">步行 {selectedSpot.walkMinutes} 分</span>
                    )}
                  </div>
                  <h4 className="preview-card-title">{selectedSpot.name}</h4>
                  <p className="preview-card-sub">
                    {selectedSpot.nearestStation ? `最鄰近：${selectedSpot.nearestStation}` : selectedSpot.address}
                  </p>
                </div>
              </div>
              <div className="preview-card-actions">
                <a
                  href={buildWalkingNavUrl(selectedSpot, selectedStation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preview-nav-btn"
                  title="開啟 Google 步行導航"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Navigation size={13} />
                  <span>導航</span>
                </a>
                <button
                  type="button"
                  className="preview-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSpot(null);
                  }}
                  aria-label="關閉預覽"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Mobile Floating View Switcher (Google Maps / Airbnb style) */}
          <div className="mobile-floating-controls">
            <button
              type="button"
              className="mobile-view-switch-btn"
              onClick={() => setIsMobileDrawerCollapsed(prev => !prev)}
              aria-label={isMobileDrawerCollapsed ? '查看列表' : '查看地圖'}
            >
              {isMobileDrawerCollapsed ? (
                <>
                  <List size={16} />
                  <span>查看列表 ({inBoundsSpots.length})</span>
                </>
              ) : (
                <>
                  <Map size={16} />
                  <span>查看地圖</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
