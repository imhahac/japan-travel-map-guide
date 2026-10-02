import fs from 'fs';
import path from 'path';
import { saveDiningSeed } from './scrapers/dining.js';

const stationsPath = path.resolve('src/data/stations.json');
const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];

console.log(`Loaded ${stations.length} stations. Building dining spots within 500m of stations...`);
const spots = saveDiningSeed(stations);
console.log(`Dining spots ready: ${spots.length} spots.`);
