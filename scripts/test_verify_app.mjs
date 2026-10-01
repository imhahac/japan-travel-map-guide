import fs from 'fs';

const spots = JSON.parse(fs.readFileSync('src/data/spots.json', 'utf8'));
const stations = JSON.parse(fs.readFileSync('src/data/stations.json', 'utf8'));

console.log(`✅ Loaded ${spots.length} spots.`);
console.log(`✅ Loaded ${stations.length} stations.`);

// 1. Verify schema completeness
let missingCoords = 0;
let missingStation = 0;
spots.forEach(s => {
  if (!s.lat || !s.lng) missingCoords++;
  if (!s.nearestStation) missingStation++;
});

console.log(`- Missing coordinates: ${missingCoords}`);
console.log(`- Missing stations: ${missingStation}`);

// 2. Test station search
const testQueries = ['新宿', '札幌', '博多', '難波', '京都', '東京'];
testQueries.forEach(q => {
  const matches = stations.filter(st => st.name.includes(q));
  console.log(`Search for "${q}": found ${matches.length} stations: ${matches.map(m => `${m.name} (${m.count}間)`).join(', ')}`);
});

// 3. Test distance calculation for Shinjuku Station
const shinjuku = stations.find(s => s.name === '新宿站');
if (shinjuku) {
  function getDist(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  const nearby = spots
    .map(s => ({ ...s, dist: getDist(shinjuku.lat, shinjuku.lng, s.lat, s.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5);

  console.log(`\nNearest 5 hotels to 新宿站 (${shinjuku.lat}, ${shinjuku.lng}):`);
  nearby.forEach(h => {
    console.log(`- ${h.name}: ${h.dist}m (walk ~${Math.round(h.dist / 80)} min) [${h.stationAccess}]`);
  });
}
