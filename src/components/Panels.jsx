'use client';

import styles from '../app/atlas.module.css';

// Side panels: stats, composition by site (ordered north → south, i.e. coastline
// order), numeric trend vs latitude, and the spatial-genetic outlier list.

export function StatsPanel({ samples, categories, outliers, siteCount }) {
  return <section className={styles.panel}>
    <h2>Dataset</h2>
    <div className={styles.statGrid}>
      <div className={styles.stat}><b>{samples.length}</b><span>samples</span></div>
      <div className={styles.stat}><b>{siteCount || '—'}</b><span>sites</span></div>
      <div className={styles.stat}><b>{categories.length}</b><span>populations</span></div>
      <div className={styles.stat}><b>{outliers.size}</b><span>outliers</span></div>
    </div>
  </section>;
}

export function CompositionPanel({ samples, categories, colorOf, hasSite }) {
  if (!samples.length) return null;
  let rows;
  if (hasSite) {
    const bySite = new Map();
    for (const s of samples) {
      if (!bySite.has(s.site)) bySite.set(s.site, { lat: 0, n: 0, counts: {} });
      const e = bySite.get(s.site);
      e.lat += s.lat; e.n += 1;
      e.counts[s.category] = (e.counts[s.category] || 0) + 1;
    }
    rows = [...bySite.entries()]
      .map(([site, e]) => ({ label: site, lat: e.lat / e.n, counts: e.counts, n: e.n }))
      .sort((a, b) => b.lat - a.lat)
      .slice(0, 14);
  } else {
    const counts = {};
    for (const s of samples) counts[s.category] = (counts[s.category] || 0) + 1;
    rows = [{ label: 'All samples', counts, n: samples.length }];
  }
  return <section className={styles.panel}>
    <h2>Composition {hasSite ? '— north to south' : ''}</h2>
    {rows.map((r) => <div key={r.label} className={styles.compRow}>
      <span title={r.label}>{r.label.replace(/,.*$/, '')}</span>
      <div className={styles.compBar}>
        {categories.map((c) => {
          const n = r.counts[c] || 0;
          return n ? <div key={c} style={{ flex: n, background: colorOf(c) }} title={`${c}: ${n}/${r.n}`} /> : null;
        })}
      </div>
    </div>)}
  </section>;
}

const TW = 300;
const TH = 130;

export function TrendPanel({ samples, numericName, colorOf }) {
  const pts = samples.filter((s) => s.numeric != null);
  if (!numericName || pts.length < 4) return null;
  const lats = pts.map((p) => p.lat);
  const vals = pts.map((p) => p.numeric);
  const latMin = Math.min(...lats); const latMax = Math.max(...lats);
  const vMin = Math.min(...vals); const vMax = Math.max(...vals);
  const x = (lat) => 26 + ((lat - latMin) / (latMax - latMin || 1)) * (TW - 36);
  const y = (v) => TH - 22 - ((v - vMin) / (vMax - vMin || 1)) * (TH - 36);
  return <section className={styles.panel}>
    <h2>{numericName} vs latitude</h2>
    <svg className={styles.trendSvg} viewBox={`0 0 ${TW} ${TH}`} role="img"
      aria-label={`Scatter of ${numericName} against latitude`}>
      <line x1="26" x2={TW - 10} y1={TH - 22} y2={TH - 22} stroke="#2a303a" />
      {pts.map((p) => <circle key={p.key} cx={x(p.lat)} cy={y(p.numeric)} r="3.5"
        fill={colorOf(p.category)} stroke="#12151a" strokeWidth="1.2" />)}
      <text x="26" y={TH - 8}>{latMin.toFixed(1)}°N</text>
      <text x={TW - 10} y={TH - 8} textAnchor="end">{latMax.toFixed(1)}°N</text>
      <text x="4" y="14">{vMax}</text>
      <text x="4" y={TH - 24}>{vMin}</text>
    </svg>
    <p className={styles.trendNote}>South → north reads left → right; color is population assignment.</p>
  </section>;
}

export function OutlierPanel({ samples, outliers, detail, onHover }) {
  const flagged = samples.filter((s) => outliers.has(s.key));
  return <section className={styles.panel}>
    <h2>Spatial-genetic outliers</h2>
    {flagged.length === 0 ? <p className={styles.empty}>None — every sample matches its geographic neighborhood.</p>
      : <ul className={styles.outlierList}>
        {flagged.slice(0, 12).map((s) => <li key={s.key}
          onMouseEnter={() => onHover?.(s.key)} onMouseLeave={() => onHover?.(null)}>
          <b>{s.id}</b>
          <span>{s.category} caught among {detail.get(s.key)}{s.site ? ` · ${s.site}` : ''}</span>
        </li>)}
      </ul>}
    <p className={styles.trendNote}>A sample is flagged when ≥60% of its 5 nearest neighbors carry a different assignment.</p>
  </section>;
}
