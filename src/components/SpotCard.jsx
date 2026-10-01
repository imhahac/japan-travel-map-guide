import React from 'react';
import { Train, Navigation, Phone, ExternalLink, MapPin, Coffee, Car } from 'lucide-react';

export default function SpotCard({ spot, isSelected, selectedStation, onSelect }) {
  // If selectedStation exists, calculate distance in meters and walking time
  let distText = '';
  if (selectedStation && spot.lat && spot.lng) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (selectedStation.lat * Math.PI) / 180;
    const phi2 = (spot.lat * Math.PI) / 180;
    const deltaPhi = ((spot.lat - selectedStation.lat) * Math.PI) / 180;
    const deltaLambda = ((spot.lng - selectedStation.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMeters = Math.round(R * c);

    const walkMin = Math.max(1, Math.round(distMeters / 80)); // 80m/min standard speed
    distText = distMeters < 1000
      ? `距 ${selectedStation.name} ${distMeters}m (步行約 ${walkMin} 分)`
      : `距 ${selectedStation.name} ${(distMeters / 1000).toFixed(1)}km (約 ${walkMin} 分)`;
  }

  // Google Maps Walking Navigation URL
  const navUrl = selectedStation
    ? `https://www.google.com/maps/dir/?api=1&origin=${selectedStation.lat},${selectedStation.lng}&destination=${spot.lat},${spot.lng}&travelmode=walking`
    : (spot.googleMapUrl || `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`);

  return (
    <div
      className={`spot-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(spot)}
    >
      <div className="card-image-box">
        <img
          src={spot.imageUrl || 'https://www.toyoko-inn.com/images/ogp/ogp_default.png'}
          alt={spot.name}
          className="card-img"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://www.toyoko-inn.com/images/ogp/ogp_default.png';
          }}
        />

        <div className="card-top-badges">
          <span className="badge-brand">{spot.brand || spot.category}</span>
          {spot.walkMinutes && (
            <span className="badge-walk">
              步行 {spot.walkMinutes} 分
            </span>
          )}
        </div>

        {distText && (
          <div className="card-distance-tag">
            <Navigation size={12} color="#10b981" />
            <span>{distText}</span>
          </div>
        )}
      </div>

      <div className="card-body">
        <div>
          <h3 className="card-title">{spot.name}</h3>
          {spot.nameJa && spot.nameJa !== spot.name && (
            <p className="card-subtext">{spot.nameJa}</p>
          )}
        </div>

        <div className="card-station-row">
          <Train size={15} />
          <span>{spot.stationAccess || `最鄰近：${spot.nearestStation}`}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <MapPin size={13} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {spot.address || spot.prefecture}
          </span>
        </div>

        {spot.tags && (
          <div className="card-tags">
            {(Array.isArray(spot.tags) ? spot.tags : spot.tags.split(/[,，]/)).map((t, i) => (
              <span key={i} className="tag-chip">
                {t.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-action btn-secondary"
            title="開啟 Google 地圖步行導航"
          >
            <Navigation size={14} color="#00489d" />
            <span>步行導航</span>
          </a>

          {spot.bookingUrl ? (
            <a
              href={spot.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-action btn-primary"
              title="前往官方預約"
            >
              <span>官方預約</span>
              <ExternalLink size={13} />
            </a>
          ) : spot.phone ? (
            <a
              href={`tel:${spot.phone}`}
              className="btn-action btn-primary"
              title="撥打電話"
            >
              <Phone size={13} />
              <span>{spot.phone}</span>
            </a>
          ) : (
            <a
              href={spot.googleMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-action btn-primary"
            >
              <span>查看詳情</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
