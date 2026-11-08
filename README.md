# Microsat Atlas

**Population genetics on the map — a Strata Works instrument.**

Load microsatellite sample records (CSV/TSV, or paste straight from Excel) with
coordinates, pick the population-assignment column, and read structure as
geography: color = assignment, dashed copper ring = spatial-genetic outlier
(≥60% of a sample's 5 nearest neighbors carry a different assignment).
Composition panels order sites north → south so the table reads like the
coastline. All parsing is client-side; data never leaves the browser.

Demo data are **synthetic**, modeled on the published mixed-stock structure of
Atlantic striped bass (Wirgin, Waldman et al.; ASMFC). Coastline from US Census
cartographic boundaries (5m), clipped to Buzzards Bay → Chesapeake and
simplified to ~11 KB (`npm run coast` regenerates from a source GeoJSON).

```bash
npm install
npm run dev   # http://localhost:3150
```

No chart or map libraries — hand-built SVG, equirectangular projection,
validated colorblind-safe palette, table view behind every chart.
