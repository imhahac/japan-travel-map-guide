import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Train, MapPin } from 'lucide-react';

export default function StationSearchBar({ stations = [], selectedStation, onSelectStation, onClearStation }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef(null);

  // Sync query if a station is selected externally
  useEffect(() => {
    if (selectedStation) {
      setQuery(selectedStation.name);
    } else {
      setQuery('');
    }
  }, [selectedStation]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStations = query.trim()
    ? stations.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.prefecture && s.prefecture.toLowerCase().includes(query.toLowerCase())) ||
        (s.line && s.line.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 10)
    : stations.slice(0, 8); // show top 8 stations when empty

  const handleSelect = (st) => {
    setQuery(st.name);
    setIsOpen(false);
    onSelectStation(st);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    onClearStation();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') setIsOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => (prev + 1) % filteredStations.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => (prev - 1 + filteredStations.length) % filteredStations.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < filteredStations.length) {
        handleSelect(filteredStations[highlightIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="search-container" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="搜尋車站 (例如: 新宿、札幌、博多、東京)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightIdx(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button className="search-clear-btn" onClick={handleClear} title="清除搜尋">
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="autocomplete-dropdown">
          <div style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
            {query.trim() ? `符合「${query}」的車站` : '熱門日本樞紐車站'}
          </div>

          {filteredStations.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              找不到符合的車站，請嘗試輸入如「新宿」、「上野」或「京都」
            </div>
          ) : (
            filteredStations.map((st, idx) => (
              <div
                key={st.name + idx}
                className={`autocomplete-item ${idx === highlightIdx ? 'active' : ''}`}
                onClick={() => handleSelect(st)}
              >
                <div className="station-suggest-left">
                  <Train size={16} color="#00489d" />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{st.name}</span>
                  <span className="station-badge">{st.prefecture}</span>
                </div>
                <div className="station-suggest-count">
                  {st.count} 間周邊飯店/店家
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
