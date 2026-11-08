'use client';

import { useMemo, useRef, useState } from 'react';
import { DEMO, DEMO_SOURCES } from '../data/demo';
import { detectColumns, parseDelimited } from '../lib/csv';
import { findOutliers, kmPerDegLon } from '../lib/geo';
import CoastMap from './CoastMap';
import { CompositionPanel, OutlierPanel, StatsPanel, TrendPanel } from './Panels';
import styles from '../app/atlas.module.css';

// Validated categorical palette (all-pairs CVD checks vs #12151a): 3 slots max,
// extra categories fold into "Other" gray with the outlier ring as backup encoding.
const PALETTE = ['#c97f33', '#2e9db6', '#a06ddb'];
const OTHER = '#8b8f98';
const MAX_ROWS = 5000;

function Mark() {
  return <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <g fill="#e9e4d9"><rect x="3" y="7" width="20" height="5" opacity=".92" /><rect x="3" y="15" width="20" height="5" opacity=".62" /><rect x="3" y="23" width="20" height="5" opacity=".4" /><rect x="3" y="31" width="20" height="5" opacity=".22" /><rect x="25" y="10" width="12" height="5" opacity=".92" /><rect x="25" y="18" width="12" height="5" opacity=".62" /><rect x="25" y="26" width="12" height="5" opacity=".4" /><rect x="25" y="34" width="12" height="5" opacity=".22" /></g>
    <line x1="24" y1="4" x2="24" y2="40" stroke="#c29b76" strokeWidth="1.6" />
  </svg>;
}

export default function AtlasApp() {
  const [dataset, setDataset] = useState(DEMO);
  const [overrides, setOverrides] = useState({});
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const fileRef = useRef(null);

  const detected = useMemo(() => detectColumns(dataset.headers, dataset.rows), [dataset]);
  const mapping = { ...detected, ...overrides };

  const samples = useMemo(() => {
    if (!mapping.lat || !mapping.lon) return [];
    return dataset.rows.slice(0, MAX_ROWS).flatMap((r, i) => {
      const lat = parseFloat(r[mapping.lat]);
      const lon = parseFloat(r[mapping.lon]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
      const numeric = mapping.numeric ? parseFloat(r[mapping.numeric]) : null;
      return [{
        key: `${i}`,
        id: r[mapping.id] || `row ${i + 1}`,
        site: mapping.site ? r[mapping.site] : null,
        category: mapping.category ? (r[mapping.category] || 'unassigned') : 'all samples',
        numeric: Number.isFinite(numeric) ? numeric : null,
        numericName: mapping.numeric,
        lat, lon,
      }];
    });
  }, [dataset, mapping.lat, mapping.lon, mapping.id, mapping.site, mapping.category, mapping.numeric]);

  const categories = useMemo(() => {
    const counts = {};
    for (const s of samples) counts[s.category] = (counts[s.category] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [samples]);

  const colorOf = useMemo(() => {
    const map = new Map(categories.slice(0, 3).map((c, i) => [c, PALETTE[i]]));
    return (c) => map.get(c) || OTHER;
  }, [categories]);

  const { flagged: outliers, detail } = useMemo(() => {
    if (!mapping.category || samples.length < 8) return { flagged: new Set(), detail: new Map() };
    const midLat = samples.reduce((a, s) => a + s.lat, 0) / samples.length;
    return findOutliers(samples, kmPerDegLon(midLat) / 111.32);
  }, [samples, mapping.category]);

  const siteCount = useMemo(() => mapping.site ? new Set(samples.map((s) => s.site)).size : 0,
    [samples, mapping.site]);

  function loadText(text, name) {
    try {
      const parsed = parseDelimited(text);
      if (!parsed.rows.length) throw new Error('No data rows found.');
      const cols = detectColumns(parsed.headers, parsed.rows);
      if (!cols.lat || !cols.lon) throw new Error('Could not find latitude/longitude columns (looked for lat/latitude, lon/longitude…).');
      setDataset({ ...parsed, name });
      setOverrides({});
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => loadText(t, file.name));
    e.target.value = '';
  }

  const select = (label, key, options) => <label>{label}
    <select value={mapping[key] || ''} onChange={(e) => setOverrides((o) => ({ ...o, [key]: e.target.value || null }))}>
      <option value="">—</option>
      {options.map((h) => <option key={h} value={h}>{h}</option>)}
    </select>
  </label>;

  return <div className={styles.app}>
    <header className={styles.header}>
      <Mark />
      <h1 className={styles.title}>Microsat Atlas<small>Population genetics on the map · a Strata Works instrument</small></h1>
      <span className={styles.headRight}>Buzzards Bay → Chesapeake</span>
    </header>

    <div className={styles.howTo}>
      <span><b>1.</b> Load a CSV/TSV with coordinates — or copy cells in Excel and paste below.</span>
      <span><b>2.</b> Pick the population column (STRUCTURE/GeneClass assignments, haplotypes, clusters).</span>
      <span><b>3.</b> Read structure as geography: color = assignment, dashed ring = spatial outlier.</span>
    </div>

    <div className={styles.toolbar}>
      <button className={styles.fileBtn} onClick={() => fileRef.current?.click()}>Load CSV / TSV</button>
      <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" hidden onChange={onFile} />
      <button className={styles.ghostBtn} onClick={() => { setDataset(DEMO); setOverrides({}); setError(null); }}>Demo data</button>
      {select('Population', 'category', mapping.categoricalCols || [])}
      {select('Numeric', 'numeric', mapping.numericCols || [])}
      <span className={styles.datasetName}>{dataset.name}</span>
      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>

    <div className={styles.main}>
      <div style={{ position: 'relative' }}>
        <CoastMap samples={samples} colorOf={colorOf} outliers={outliers}
          hovered={hovered} onHover={setHovered} />
        <div className={styles.legend}>
          <strong>{mapping.category || 'samples'}</strong>
          {categories.slice(0, 3).map((c) => <span key={c} className={styles.legendRow}>
            <i className={styles.swatch} style={{ background: colorOf(c) }} />{c}
          </span>)}
          {categories.length > 3 && <span className={styles.legendRow}><i className={styles.swatch} style={{ background: OTHER }} />other ({categories.length - 3})</span>}
          {outliers.size > 0 && <span className={styles.legendRow}><i className={`${styles.swatch} ${styles.legendOutlier}`} />spatial outlier</span>}
        </div>
      </div>
      <aside className={styles.side}>
        <StatsPanel samples={samples} categories={categories} outliers={outliers} siteCount={siteCount} />
        <CompositionPanel samples={samples} categories={categories} colorOf={colorOf} hasSite={!!mapping.site} />
        <TrendPanel samples={samples} numericName={mapping.numeric} colorOf={colorOf} />
        <OutlierPanel samples={samples} outliers={outliers} detail={detail} onHover={setHovered} />
      </aside>
    </div>

    <details className={styles.tableWrap}>
      <summary>Paste from Excel</summary>
      <textarea className={styles.paste} placeholder="Copy a range in Excel (including the header row) and paste here…"
        onPaste={(e) => { e.preventDefault(); loadText(e.clipboardData.getData('text'), 'Pasted data'); }} />
    </details>

    <details className={styles.tableWrap}>
      <summary>Table view — every value, no hover required ({samples.length} rows)</summary>
      <table>
        <thead><tr>{dataset.headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{dataset.rows.slice(0, 300).map((r, i) => <tr key={i}>
          {dataset.headers.map((h) => <td key={h}>{r[h]}</td>)}
        </tr>)}</tbody>
      </table>
    </details>

    <footer className={styles.footer}>
      <span><strong>Demo data are synthetic</strong> — generated to mirror the published mixed-stock structure of Atlantic striped bass; no measured genotypes are shown. Grounding literature:</span>
      <span>{DEMO_SOURCES.map(([t, href], i) => <span key={href}>{i > 0 && ' · '}<a href={href}>{t}</a></span>)}</span>
      <span>Coastline: US Census cartographic boundaries (5m), clipped and simplified. All parsing happens in your browser — uploaded data never leaves this page.</span>
    </footer>
  </div>;
}
