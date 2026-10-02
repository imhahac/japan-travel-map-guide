import fs from 'fs';
import path from 'path';
import { saveConvenienceSeed } from './scrapers/convenience.js';

const stationsPath = path.resolve('src/data/stations.json');
const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];

console.log(`Loaded ${stations.length} stations. Building convenience spots within 500m of stations...`);
const spots = saveConvenienceSeed(stations);
console.log(`Convenience spots ready: ${spots.length} spots.`);
