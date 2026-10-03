import React from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';

const REGION_PREFECTURE_MAP = {
  '北海道': ['北海道'],
  '東北': ['青森縣', '岩手縣', '宮城縣', '秋田縣', '山形縣', '福島縣'],
  '關東': ['東京都', '神奈川縣', '埼玉縣', '千葉縣', '茨城縣', '栃木縣', '群馬縣'],
  '東海・甲信越・北陸': ['愛知縣', '靜岡縣', '岐阜縣', '三重縣', '山梨縣', '長野縣', '新潟縣', '富山縣', '石川縣', '福井縣'],
  '近畿': ['大阪府', '京都府', '兵庫縣', '奈良縣', '滋賀縣', '和歌山縣'],
  '中國・四國': ['鳥取縣', '島根縣', '岡山縣', '廣島縣', '山口縣', '德島縣', '香川縣', '愛媛縣', '高知縣'],
  '九州・沖繩': ['福岡縣', '佐賀縣', '長崎縣', '熊本縣', '大分縣', '宮崎縣', '鹿兒島縣', '沖繩縣']
};

export default function RegionHierarchyFilter({
  selectedRegion,
  selectedPrefecture,
  walkFilter,
  onSelectRegion,
  onSelectPrefecture,
  onSelectWalkFilter
}) {
  const regions = ['全部地區', ...Object.keys(REGION_PREFECTURE_MAP)];
  const availablePrefectures = selectedRegion && selectedRegion !== '全部地區'
    ? ['全部都道府縣', ...(REGION_PREFECTURE_MAP[selectedRegion] || [])]
    : [];

  const walkOptions = [
    { id: 'all', label: '不限距離', title: '顯示所有步行範圍' },
    { id: '3', label: '⚡ 3分內', title: '出站即達（約 240 公尺）' },
    { id: '5', label: '⏱️ 5分內', title: '站前商圈（約 400 公尺）' },
    { id: '10', label: '🚶 10分內', title: '生活圈（約 800 公尺）' }
  ];

  return (
    <div className="region-walk-filter-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      background: 'var(--bg-page, #f8fafc)',
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '10px',
      padding: '0.45rem 0.6rem'
    }}>
      {/* 區域與都道府縣選單 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {/* Region Select */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          flex: 1,
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '8px',
          padding: '0.2rem 0.5rem'
        }}>
          <Compass size={13} color="var(--primary, #00489d)" style={{ flexShrink: 0 }} />
          <select
            className="select-compact-clean"
            value={selectedRegion}
            onChange={(e) => {
              const val = e.target.value;
              onSelectRegion(val);
              onSelectPrefecture('全部都道府縣');
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-main, #334155)',
              cursor: 'pointer'
            }}
          >
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Prefecture Select (Conditional) */}
        {availablePrefectures.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            flex: 1,
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            padding: '0.2rem 0.5rem'
          }}>
            <MapPin size={13} color="#ea580c" style={{ flexShrink: 0 }} />
            <select
              className="select-compact-clean"
              value={selectedPrefecture}
              onChange={(e) => onSelectPrefecture(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-main, #334155)',
                cursor: 'pointer'
              }}
            >
              {availablePrefectures.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 車站步行時間快捷切換 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.3rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          color: 'var(--text-muted, #64748b)',
          fontSize: '0.72rem',
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}>
          <Navigation size={11} color="var(--primary, #00489d)" />
          <span>步行時間:</span>
        </div>

        <div style={{ display: 'flex', gap: '3px', flex: 1, justifyContent: 'flex-end' }}>
          {walkOptions.map(opt => {
            const isActive = walkFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`walk-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectWalkFilter(opt.id)}
                title={opt.title}
                style={{
                  background: isActive ? 'var(--primary, #00489d)' : 'var(--bg-card, #ffffff)',
                  color: isActive ? '#ffffff' : 'var(--text-main, #334155)',
                  border: isActive ? '1px solid var(--primary, #00489d)' : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.7rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 4px rgba(0, 72, 157, 0.2)' : 'none'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
