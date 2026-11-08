'use client';

import { useMemo, useState } from 'react';
import COAST from '../data/coast.json';
import { computeView, project, kmPerDegLon } from '../lib/geo';
import styles from '../app/atlas.module.css';

const W = 920;
const H = 660;

export default function CoastMap({ samples, colorOf, outliers, onHover, hovered }) {
  const [tip, setTip] = useState(null);

  const view = useMemo(() => {
    // Fit to the data, but never tighter than the sample cloud + margin;
    // fall back to the full coast window when there is nothing to fit.
    const pts = samples.length ? samples : [{ lon: -76, lat: 37 }, { lon: -70.5, lat: 42 }];
    return computeView(pts, W, H, 0.1);
  }, [samples]);

  const coastPaths = useMemo(() => COAST.segments.map((seg) =>
    'M' + seg.map(([lon, lat]) => project(lon, lat, view).map((n) => n.toFixed(1)).join(',')).join('L')), [view]);

  const graticule = useMemo(() => {
    const lines = [];
    for (let lon = -78; lon <= -69; lon++) {
      const [x] = project(lon, view.midLat, view);
      if (x > 0 && x < W) lines.push({ d: `M${x.toFixed(1)},0V${H}`, label: `${-lon}°W`, x, y: H - 8 });
    }
    for (let lat = 36; lat <= 43; lat++) {
      const [, y] = project(view.lonMin, lat, view);
      if (y > 0 && y < H) lines.push({ d: `M0,${y.toFixed(1)}H${W}`, label: `${lat}°N`, x: 8, y: y - 5 });
    }
    return lines;
  }, [view]);

  // 50 km scale bar, bottom right
  const scale = useMemo(() => {
    const px = 50 / kmPerDegLon(view.midLat) * view.kx * view.scale;
    return { px, x: W - px - 30, y: H - 26 };
  }, [view]);

  const projected = useMemo(() => samples.map((s) => {
    const [x, y] = project(s.lon, s.lat, view);
    return { ...s, x, y };
  }), [samples, view]);

  function showTip(s) {
    setTip(s);
    onHover?.(s.key);
  }

  return <div className={styles.mapPane}
    onMouseLeave={() => { setTip(null); onHover?.(null); }}>
    <svg className={styles.mapSvg} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Coastal map plotting ${samples.length} samples by population assignment`}>
      {graticule.map((g, i) => <g key={i}>
        <path className={styles.graticule} d={g.d} />
        <text className={styles.gratLabel} x={g.x} y={g.y}>{g.label}</text>
      </g>)}
      {coastPaths.map((d, i) => <path key={i} className={styles.coast} d={d} />)}
      {projected.map((s) => <g key={s.key}>
        {outliers.has(s.key) && <circle className={styles.outlierRing} cx={s.x} cy={s.y} r="9.5" />}
        <circle className={styles.dot} cx={s.x} cy={s.y}
          r={hovered === s.key ? 7 : 5} fill={colorOf(s.category)}
          onMouseEnter={() => showTip(s)} onFocus={() => showTip(s)} tabIndex={-1} />
      </g>)}
      <line className={styles.scaleBar} x1={scale.x} x2={scale.x + scale.px} y1={scale.y} y2={scale.y} />
      <text className={styles.scaleLabel} x={scale.x} y={scale.y - 6}>50 km</text>
    </svg>
    {tip && <div className={styles.tooltip}
      style={{ left: `${Math.min((tip.x / W) * 100, 72)}%`, top: `${(tip.y / H) * 100}%` }}>
      <strong>{tip.id}</strong>{tip.site ? ` · ${tip.site}` : ''}<br />
      <em>{tip.category}</em>
      {outliers.has(tip.key) && <> · outlier (neighbors are not {tip.category})</>}<br />
      {tip.lat.toFixed(3)}°N, {Math.abs(tip.lon).toFixed(3)}°W
      {tip.numeric != null && <><br />{tip.numericName}: {tip.numeric}</>}
    </div>}
  </div>;
}
