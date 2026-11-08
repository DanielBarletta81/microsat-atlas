// Geographic helpers: equirectangular projection fitted to a viewBox, and
// spatial-genetic outlier detection (sample category vs. k-nearest-neighbor majority).

export function computeView(points, width, height, padFrac = 0.08) {
  let lonMin = Infinity; let lonMax = -Infinity; let latMin = Infinity; let latMax = -Infinity;
  for (const p of points) {
    if (p.lon < lonMin) lonMin = p.lon;
    if (p.lon > lonMax) lonMax = p.lon;
    if (p.lat < latMin) latMin = p.lat;
    if (p.lat > latMax) latMax = p.lat;
  }
  const padLon = Math.max((lonMax - lonMin) * padFrac, 0.15);
  const padLat = Math.max((latMax - latMin) * padFrac, 0.15);
  lonMin -= padLon; lonMax += padLon; latMin -= padLat; latMax += padLat;
  const midLat = (latMin + latMax) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180); // shrink longitude at this latitude
  const spanX = (lonMax - lonMin) * kx;
  const spanY = latMax - latMin;
  const scale = Math.min(width / spanX, height / spanY);
  // center the fitted extent in the viewBox
  const ox = (width - spanX * scale) / 2;
  const oy = (height - spanY * scale) / 2;
  return { lonMin, latMax, kx, scale, ox, oy, midLat };
}

export function project(lon, lat, v) {
  return [
    v.ox + (lon - v.lonMin) * v.kx * v.scale,
    v.oy + (v.latMax - lat) * v.scale,
  ];
}

export function kmPerDegLon(lat) { return 111.32 * Math.cos((lat * Math.PI) / 180); }

function distSq(a, b, kx) {
  const dx = (a.lon - b.lon) * kx;
  const dy = a.lat - b.lat;
  return dx * dx + dy * dy;
}

// A sample is a spatial-genetic outlier when its category disagrees with the
// majority of its k nearest geographic neighbors. O(n^2) — fine to ~5k rows.
export function findOutliers(samples, kx, k = 5) {
  const flagged = new Set();
  const detail = new Map();
  if (samples.length < k + 2) return { flagged, detail };
  for (let i = 0; i < samples.length; i++) {
    const dists = [];
    for (let j = 0; j < samples.length; j++) {
      if (j !== i) dists.push([distSq(samples[i], samples[j], kx), j]);
    }
    dists.sort((a, b) => a[0] - b[0]);
    const counts = {};
    for (const [, j] of dists.slice(0, k)) {
      counts[samples[j].category] = (counts[samples[j].category] || 0) + 1;
    }
    const [majority, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (majority !== samples[i].category && n >= Math.ceil(k * 0.6)) {
      flagged.add(samples[i].key);
      detail.set(samples[i].key, majority);
    }
  }
  return { flagged, detail };
}
