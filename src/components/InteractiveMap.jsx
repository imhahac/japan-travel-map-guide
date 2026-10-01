import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Locate, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

// Fix Leaflet default icon URL issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createCustomPin(spot) {
  let bgColor = '#00489d'; // Blue for Toyoko Inn
  let iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>`;

  if (spot.category === '美食餐廳') {
    bgColor = '#ea580c';
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v20M21 15a3 3 0 0 1-3 3M18 10a3 3 0 0 0-3-3M2 2v20M5 2v20M2 15a3 3 0 0 0 3 3M5 10a3 3 0 0 1-3-3"/></svg>`;
  } else if (spot.category === '便利商店') {
    bgColor = '#16a34a';
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  } else if (spot.category === '購物藥妝') {
    bgColor = '#9333ea';
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  }

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
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
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.4), 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="3" width="16" height="16" rx="2"/>
        <path d="M4 11h16M12 3v8M8 19l-2 3M16 19l2 3M8 15h.01M16 15h.01"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'station-leaflet-pin',
    html: html,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19]
  });
}

export default function InteractiveMap({ spots = [], selectedSpot, selectedStation, onSelectSpot }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const stationLayerRef = useRef(null);
  const markersMapRef = useRef(new Map());

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [36.2048, 138.2529], // Center of Japan
      zoom: 6,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 42,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (c) {
        const count = c.getChildCount();
        let sizeClass = 'marker-cluster-small';
        if (count > 20) sizeClass = 'marker-cluster-medium';
        if (count > 50) sizeClass = 'marker-cluster-large';

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${sizeClass}`,
          iconSize: L.point(40, 40)
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

  // 2. Render Spot Markers
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

      // Build popup content
      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=walking`;
      const popupHtml = `
        <div style="font-family: inherit; width: 240px; padding: 4px;">
          ${spot.imageUrl ? `
            <img src="${spot.imageUrl}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" onerror="this.style.display='none'" />
          ` : ''}
          <div style="font-size: 11px; font-weight: 700; color: #00489d; text-transform: uppercase;">${spot.brand || spot.category}</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 2px 0 6px 0; line-height: 1.3;">${spot.name}</div>
          <div style="font-size: 12px; color: #00489d; font-weight: 600; margin-bottom: 4px;">🚉 ${spot.stationAccess || spot.nearestStation}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 10px;">📍 ${spot.address || spot.prefecture}</div>
          <div style="display: flex; gap: 6px;">
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #f1f5f9; color: #0f172a; font-size: 11px; font-weight: 600; padding: 6px; border-radius: 4px; text-decoration: none; border: 1px solid #cbd5e1;">🚶 步行導航</a>
            ${spot.bookingUrl ? `
              <a href="${spot.bookingUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #00489d; color: #ffffff; font-size: 11px; font-weight: 600; padding: 6px; border-radius: 4px; text-decoration: none;">🏨 官方訂房</a>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on('click', () => {
        onSelectSpot(spot);
      });

      cluster.addLayer(marker);
      markersMapRef.current.set(spot.id, marker);
    });
  }, [spots, onSelectSpot]);

  // 3. Handle Station Focus & Walking Radius Circles
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
        <div style="font-family: inherit; padding: 4px; text-align: center;">
          <div style="font-size: 11px; color: #b45309; font-weight: 700;">主要樞紐車站</div>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${selectedStation.name}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">周圍涵蓋 ${selectedStation.count} 間東橫 INN / 商店</div>
        </div>
      `);
      stationLayer.addLayer(stMarker);

      // 2. 500m Walking Circle (approx. 6 mins walk)
      const circle500 = L.circle(pos, {
        radius: 500,
        color: '#10b981',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#10b981',
        fillOpacity: 0.12
      }).bindTooltip('500m 步行約 6 分鐘', { permanent: false, direction: 'top' });
      stationLayer.addLayer(circle500);

      // 3. 1000m Walking Circle (approx. 12 mins walk)
      const circle1000 = L.circle(pos, {
        radius: 1000,
        color: '#f59e0b',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#f59e0b',
        fillOpacity: 0.05
      }).bindTooltip('1000m 步行約 12 分鐘', { permanent: false, direction: 'top' });
      stationLayer.addLayer(circle1000);

      // Smooth fly to station
      map.flyTo(pos, 15, { duration: 1.2 });
    }
  }, [selectedStation]);

  // 4. Handle Spot Selection & Zoom
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

  // Map Controls Handlers
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
    <div className="map-container">
      <div id="leaflet-map" ref={mapContainerRef} />

      {/* Floating Map Controls */}
      <div className="map-floating-panel">
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
