import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import StationSearchBar from './components/StationSearchBar';
import CategoryFilter from './components/CategoryFilter';
import RegionHierarchyFilter from './components/RegionHierarchyFilter';
import SpotCard from './components/SpotCard';
import InteractiveMap from './components/InteractiveMap';
import SyncModal from './components/SyncModal';
import { Train, MapPin, RefreshCw, X, SlidersHorizontal, BedDouble } from 'lucide-react';

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

  // Compute Brand Counts (especially for hotels)
  const brandCounts = useMemo(() => {
    const hotelSpots = spots.filter(s => s.category === '飯店');
    const counts = { all: hotelSpots.length };
    hotelSpots.forEach(s => {
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

  // Handle Spot Selection
  const handleSelectSpot = (spot) => {
    setSelectedSpot(spot);
    // Find spot's element and scroll into view in desktop sidebar
    if (cardListRef.current) {
      const el = document.getElementById(`spot-card-${spot.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Reset all filters
  const handleResetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedRegion('全部地區');
    setSelectedPrefecture('全部都道府縣');
    setWalkFilter('all');
    setSelectedStation(null);
    setSelectedSpot(null);
  };

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

          <div className="sidebar-header">
            {/* 1. Station Smart Search Autocomplete */}
            <StationSearchBar
              stations={stations}
              selectedStation={selectedStation}
              onSelectStation={(st) => {
                setSelectedStation(st);
                // Also auto set region if station has it
                if (st.region) setSelectedRegion(st.region);
                if (st.prefecture) setSelectedPrefecture(st.prefecture);
              }}
              onClearStation={() => setSelectedStation(null)}
            />

            {/* 2. Two-tier Category & Brand Filter */}
            <CategoryFilter
              currentCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setSelectedBrand('all');
              }}
              categoryCounts={categoryCounts}
              currentBrand={selectedBrand}
              onSelectBrand={setSelectedBrand}
              brandCounts={brandCounts}
            />

            {/* 3. Region, Prefecture & Walk Radius Filter */}
            <RegionHierarchyFilter
              selectedRegion={selectedRegion}
              selectedPrefecture={selectedPrefecture}
              walkFilter={walkFilter}
              onSelectRegion={setSelectedRegion}
              onSelectPrefecture={setSelectedPrefecture}
              onSelectWalkFilter={setWalkFilter}
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
                顯示 <strong>{filteredSpots.length}</strong> 處地標
                {selectedStation && ` (依距離排序)`}
              </span>
              {(selectedCategory !== 'all' || selectedRegion !== '全部地區' || walkFilter !== 'all' || selectedStation) && (
                <button
                  onClick={handleResetAllFilters}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <RefreshCw size={12} />
                  重設全部條件
                </button>
              )}
            </div>
          </div>

          {/* Cards List */}
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
              filteredSpots.map(spot => (
                <div key={spot.id} id={`spot-card-${spot.id}`}>
                  <SpotCard
                    spot={spot}
                    isSelected={selectedSpot?.id === spot.id}
                    selectedStation={selectedStation}
                    onSelect={handleSelectSpot}
                  />
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Map View */}
        <InteractiveMap
          spots={filteredSpots}
          selectedSpot={selectedSpot}
          selectedStation={selectedStation}
          onSelectSpot={handleSelectSpot}
          theme={theme}
        />
      </div>

      {/* Google Sheet Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
}
