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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div className="filter-row">
        {/* Region Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
          <Compass size={14} color="#64748b" />
          <select
            className="select-compact"
            value={selectedRegion}
            onChange={(e) => {
              const val = e.target.value;
              onSelectRegion(val);
              onSelectPrefecture('全部都道府縣');
            }}
            style={{ width: '100%' }}
          >
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Prefecture Select (Conditional) */}
        {availablePrefectures.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
            <MapPin size={14} color="#64748b" />
            <select
              className="select-compact"
              value={selectedPrefecture}
              onChange={(e) => onSelectPrefecture(e.target.value)}
              style={{ width: '100%' }}
            >
              {availablePrefectures.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}

        {/* Walk Minutes Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <select
            className="select-compact"
            value={walkFilter}
            onChange={(e) => onSelectWalkFilter(e.target.value)}
          >
            <option value="all">不限距離</option>
            <option value="3">步行 3 分內</option>
            <option value="5">步行 5 分內</option>
            <option value="10">步行 10 分內</option>
          </select>
        </div>
      </div>
    </div>
  );
}
