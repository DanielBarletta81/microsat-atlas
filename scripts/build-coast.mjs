// Build a compact coastal-outline dataset for the Mid-Atlantic / southern New
// England window from the Census 5m state boundaries GeoJSON.
// Output: polyline segments in [lon, lat] pairs, simplified, clipped to BBOX.
// Run once: node scripts/build-coast.mjs /tmp/us-states.json
import { readFileSync, writeFileSync } from 'node:fs';

const BBOX = { lonMin: -77.8, lonMax: -69.4, latMin: 36.4, latMax: 42.3 };
const EPS = 0.012; // Douglas-Peucker tolerance in degrees (~1.2 km)

const src = JSON.parse(readFileSync(process.argv[2] || '/tmp/us-states.json', 'utf8'));
const inBox = ([x, y]) => x >= BBOX.lonMin && x <= BBOX.lonMax && y >= BBOX.latMin && y <= BBOX.latMax;

function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  // Closed ring: the chord is degenerate, so split at the midpoint first.
  if (a[0] === b[0] && a[1] === b[1]) {
    const mid = Math.floor(pts.length / 2);
    return [...simplify(pts.slice(0, mid + 1), eps).slice(0, -1), ...simplify(pts.slice(mid), eps)];
  }
  let maxD = 0; let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const dx = b[0] - a[0]; const dy = b[1] - a[1];
    const d = Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1e-12);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)];
}

const segments = [];
for (const f of src.features) {
  const geoms = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of geoms) {
    for (const ring of poly) {
      // split the ring into runs of in-box points (stroke-only coast segments)
      let run = [];
      for (const pt of ring) {
        if (inBox(pt)) run.push(pt);
        else if (run.length) { if (run.length > 2) segments.push(run); run = []; }
      }
      if (run.length > 2) segments.push(run);
    }
  }
}

const out = segments
  .map((s) => simplify(s, EPS).map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]))
  .filter((s) => s.length > 2);

writeFileSync(new URL('../src/data/coast.json', import.meta.url),
  JSON.stringify({ bbox: BBOX, segments: out }));
console.log('segments:', out.length, 'points:', out.reduce((n, s) => n + s.length, 0));
