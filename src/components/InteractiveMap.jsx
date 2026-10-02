import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Locate, RotateCcw, ZoomIn, ZoomOut, Layers, Train } from 'lucide-react';

// Fix Leaflet default icon URL issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 100% Free, NO API Key Required, Zero Watermark Tile Providers
const TILE_PROVIDERS = {
  gsi_pale: {
    id: 'gsi_pale',
    name: '🗾 日本官方地理院 (詳細鐵道與出口)',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    subdomains: 'a',
    maxZoom: 18,
    attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">國土地理院</a>'
  },
  esri: {
    id: 'esri',
    name: '🗺️ Esri 全球高解析街道圖',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.esri.com" target="_blank">Esri</a>, HERE, USGS'
  },
  hot: {
    id: 'hot',
    name: '🌸 OpenStreetMap 法國人文圖',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
  },
  dark: {
    id: 'dark',
    name: '🌙 暗夜黑金模式',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: '&copy; <a href="https://www.esri.com" target="_blank">Esri</a>'
  }
};

function createCustomPin(spot) {
  let bgColor = '#00489d'; // Blue for Toyoko Inn
  let iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>`;

  if (spot.brand === 'APA飯店') {
    bgColor = '#d97706'; // Amber / Gold for APA Hotel
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1"/></svg>`;
  } else if (spot.brand === '唐吉訶德') {
    bgColor = '#ca8a04'; // Donki Yellow / Gold
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  } else if (spot.brand === '松本清') {
    bgColor = '#2563eb'; // Matsukiyo Blue
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`;
  } else if (spot.category === '美食餐廳') {
    bgColor = '#ea580c';
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v20M21 15a3 3 0 0 1-3 3M18 10a3 3 0 0 0-3-3M2 2v20M5 2v20M2 15a3 3 0 0 0 3 3M5 10a3 3 0 0 1-3-3"/></svg>`;
  } else if (spot.category === '便利商店') {
    bgColor = '#16a34a';
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  } else if (spot.category === '購物藥妝') {
    bgColor = '#9333ea';
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  }

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        ${iconSvg}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

function createStationPin(station) {
  const html = `
    <div style="
      background: #f59e0b;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.4), 0 6px 16px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="3" width="16" height="16" rx="2"/>
        <path d="M4 11h16M12 3v8M8 19l-2 3M16 19l2 3M8 15h.01M16 15h.01"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'station-leaflet-pin',
    html: html,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

export default function InteractiveMap({ spots = [], selectedSpot, selectedStation, onSelectSpot, theme = 'light' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const stationLayerRef = useRef(null);
  const markersMapRef = useRef(new Map());

  const [activeTileKey, setActiveTileKey] = useState(theme === 'dark' ? 'dark' : 'gsi_pale');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Sync active tile with theme
  useEffect(() => {
    setActiveTileKey(theme === 'dark' ? 'dark' : 'gsi_pale');
  }, [theme]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default view centered on Tokyo metropolitan area
    const map = L.map(mapContainerRef.current, {
      center: [35.6812, 139.7671],
      zoom: 11,
      zoomControl: false
    });

    const provider = TILE_PROVIDERS[activeTileKey] || TILE_PROVIDERS.gsi_pale;

    const tileLayer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom || 18,
      attribution: provider.attribution
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Cluster group with high-visibility modern badge design
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (c) {
        const count = c.getChildCount();
        let size = 42;
        let bgGrad = 'linear-gradient(135deg, #00489d, #1a68d1)';

        if (count > 25) {
          size = 48;
          bgGrad = 'linear-gradient(135deg, #1e3a8a, #00489d)';
        }
        if (count > 60) {
          size = 54;
          bgGrad = 'linear-gradient(135deg, #0f172a, #1e3a8a)';
        }

        return L.divIcon({
          html: `
            <div style="
              background: ${bgGrad};
              color: #ffffff;
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(0, 72, 157, 0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 14px;
              font-family: inherit;
            ">
              ${count}
            </div>
          `,
          className: 'custom-cluster-icon',
          iconSize: L.point(size, size)
        });
      }
    });

    map.addLayer(cluster);
    clusterGroupRef.current = cluster;
    stationLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch Tile Layers Dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const provider = TILE_PROVIDERS[activeTileKey] || TILE_PROVIDERS.gsi_pale;

    const newTileLayer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom || 18,
      attribution: provider.attribution
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [activeTileKey]);

  // 3. Render Spot Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const cluster = clusterGroupRef.current;
    if (!map || !cluster) return;

    cluster.clearLayers();
    markersMapRef.current.clear();

    spots.forEach(spot => {
      if (!spot.lat || !spot.lng) return;

      const marker = L.marker([spot.lat, spot.lng], {
        icon: createCustomPin(spot),
        title: spot.name
      });

      // Build rich popup content
      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=walking`;

      let brandColor = '#00489d';
      let brandBg = '#e0e7ff';
      let brandTextColor = '#1e40af';
      let actionLabel = '🏨 官方預約';

      if (spot.brand === 'APA飯店') {
        brandColor = '#d97706';
        brandBg = '#fef3c7';
        brandTextColor = '#92400e';
        actionLabel = '🏨 官方預約';
      } else if (spot.brand === '唐吉訶德') {
        brandColor = '#ca8a04';
        brandBg = '#fef9c3';
        brandTextColor = '#854d0e';
        actionLabel = '🛍️ 門市資訊';
      } else if (spot.brand === '松本清') {
        brandColor = '#2563eb';
        brandBg = '#eff6ff';
        brandTextColor = '#1d4ed8';
        actionLabel = '💊 官方門市';
      } else if (spot.category === '購物藥妝') {
        brandColor = '#9333ea';
        brandBg = '#f3e8ff';
        brandTextColor = '#7e22ce';
        actionLabel = '🛍️ 查看詳情';
      }

      const tagsList = spot.tags
        ? (Array.isArray(spot.tags) ? spot.tags : spot.tags.split(/[,，]/)).slice(0, 3)
        : [];

      const popupHtml = `
        <div style="font-family: inherit; width: 250px; padding: 4px;">
          ${spot.imageUrl ? `
            <img src="${spot.imageUrl}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" onerror="this.style.display='none'" />
          ` : ''}
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${brandBg}; color: ${brandTextColor}; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;">
              ${spot.brand || spot.category}
            </span>
            ${spot.walkMinutes ? `
              <span style="font-size: 10px; color: #10b981; font-weight: 700;">
                步行 ${spot.walkMinutes} 分
              </span>
            ` : ''}
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 2px 0 6px 0; line-height: 1.3;">
            ${spot.name}
          </div>
          <div style="font-size: 12px; color: ${brandColor}; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <span>🚉</span>
            <span>${spot.stationAccess || spot.nearestStation}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            📍 ${spot.address || spot.prefecture}
          </div>
          ${tagsList.length > 0 ? `
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
              ${tagsList.map(t => `<span style="font-size: 9.5px; background: #f1f5f9; color: #475569; padding: 1px 5px; border-radius: 3px;">${t.trim()}</span>`).join('')}
            </div>
          ` : ''}
          <div style="display: flex; gap: 6px;">
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #f1f5f9; color: #0f172a; font-size: 11px; font-weight: 700; padding: 7px 4px; border-radius: 6px; text-decoration: none; border: 1px solid #cbd5e1;">
              🚶 步行導航
            </a>
            ${spot.bookingUrl ? `
              <a href="${spot.bookingUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: ${brandColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 7px 4px; border-radius: 6px; text-decoration: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                ${actionLabel}
              </a>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 290 });

      marker.on('click', () => {
        onSelectSpot(spot);
      });

      cluster.addLayer(marker);
      markersMapRef.current.set(spot.id, marker);
    });
  }, [spots, onSelectSpot]);

  // 4. Handle Station Focus & Walking Radius Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const stationLayer = stationLayerRef.current;
    if (!map || !stationLayer) return;

    stationLayer.clearLayers();

    if (selectedStation && selectedStation.lat && selectedStation.lng) {
      const pos = [selectedStation.lat, selectedStation.lng];

      // 1. Station Pin
      const stMarker = L.marker(pos, {
        icon: createStationPin(selectedStation),
        zIndexOffset: 1000
      });
      stMarker.bindPopup(`
        <div style="font-family: inherit; padding: 6px; text-align: center;">
          <div style="font-size: 11px; color: #b45309; font-weight: 700;">主要樞紐車站</div>
          <div style="font-size: 17px; font-weight: 800; color: #0f172a;">${selectedStation.name}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">生活圈內有 ${selectedStation.count} 間東橫 INN / 店家</div>
        </div>
      `);
      stationLayer.addLayer(stMarker);

      // 2. 500m Walking Circle (approx. 6 mins walk)
      const circle500 = L.circle(pos, {
        radius: 500,
        color: '#10b981',
        weight: 2.5,
        dashArray: '6, 6',
        fillColor: '#10b981',
        fillOpacity: 0.12
      }).bindTooltip('500m 步行約 6 分鐘', { permanent: false, direction: 'top' });
      stationLayer.addLayer(circle500);

      // 3. 1000m Walking Circle (approx. 12 mins walk)
      const circle1000 = L.circle(pos, {
        radius: 1000,
        color: '#f59e0b',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#f59e0b',
        fillOpacity: 0.06
      }).bindTooltip('1000m 步行約 12 分鐘', { permanent: false, direction: 'top' });
      stationLayer.addLayer(circle1000);

      // Smooth fly to station
      map.flyTo(pos, 15, { duration: 1.2 });
    }
  }, [selectedStation]);

  // 5. Handle Spot Selection & Zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    const cluster = clusterGroupRef.current;
    if (!map || !cluster || !selectedSpot) return;

    const marker = markersMapRef.current.get(selectedSpot.id);
    if (marker) {
      cluster.zoomToShowLayer(marker, () => {
        marker.openPopup();
      });
    } else if (selectedSpot.lat && selectedSpot.lng) {
      map.flyTo([selectedSpot.lat, selectedSpot.lng], 16, { duration: 1 });
    }
  }, [selectedSpot]);

  // Controls Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetJapan = () => {
    mapInstanceRef.current?.flyTo([36.2048, 138.2529], 6, { duration: 1 });
  };
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('您的裝置不支援定位功能');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.flyTo([latitude, longitude], 15, { duration: 1.2 });
      },
      (err) => {
        alert('無法取得您的位置：' + err.message);
      }
    );
  };

  return (
    <div className="map-container" style={{ position: 'relative' }}>
      <div id="leaflet-map" ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Map Controls */}
      <div className="map-floating-panel">
        {/* Layer Switcher Button */}
        <div style={{ position: 'relative' }}>
          <button
            className="map-control-btn"
            onClick={() => setShowLayerMenu(prev => !prev)}
            title="切換地圖圖層樣式"
          >
            <Layers size={18} color="#00489d" />
          </button>

          {showLayerMenu && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: '48px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.4rem',
              width: '210px',
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, padding: '0.2rem 0.5rem' }}>
                選擇地圖圖資
              </div>
              {Object.values(TILE_PROVIDERS).map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveTileKey(p.id);
                    setShowLayerMenu(false);
                  }}
                  style={{
                    background: activeTileKey === p.id ? 'var(--primary-light)' : 'transparent',
                    color: activeTileKey === p.id ? 'var(--primary)' : 'var(--text-main)',
                    border: 'none',
                    textAlign: 'left',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: activeTileKey === p.id ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{p.name}</span>
                  {activeTileKey === p.id && <span style={{ fontSize: '0.75rem' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="map-control-btn" onClick={handleLocateMe} title="定位我的目前位置">
          <Locate size={18} color="#00489d" />
        </button>
        <button className="map-control-btn" onClick={handleResetJapan} title="重設地圖檢視全日本">
          <RotateCcw size={16} />
        </button>
        <button className="map-control-btn" onClick={handleZoomIn} title="放大">
          <ZoomIn size={18} />
        </button>
        <button className="map-control-btn" onClick={handleZoomOut} title="縮小">
          <ZoomOut size={18} />
        </button>
      </div>
    </div>
  );
}
