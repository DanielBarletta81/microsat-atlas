```bash
Microsat Atlas
```

**Explore population-genetic assignments as geographic patterns, not just as columns in a spreadsheet.**

Microsat Atlas is a client-side geographic visualization tool for examining sample-level microsatellite population assignments. It combines a map, a north-to-south site-composition view, and tables so a researcher or student can examine the same information at several levels of detail.

**Status:** Interactive portfolio prototype. The included samples are **synthetic**, not real genotyping results. The method illustrations are informed by published Atlantic striped bass mixed-stock literature, but the synthetic labels and assignments are not scientific findings.

## What you can examine

- Paste spreadsheet rows or load CSV/TSV records with geographic coordinates and an assignment column.
- Select the column used for population assignment.
- Inspect sample assignments spatially through a hand-built SVG map.
- Look for local assignment differences using a nearest-neighbor heuristic: a dashed ring denotes a sample whose five closest geographic neighbors have at least 60% different assignments.
- Compare site-level assignment composition in geographic north-to-south order.
- Use tabular alternatives to inspect the underlying displayed information.

## Why geography matters

Population assignments can appear tidy in a tabular dataset while telling a very different story in geographic context. A map can reveal geographic mixing, irregular samples and transitions that deserve closer inspection. **A visual outlier is a prompt for investigation, not proof of an error, migration event or population boundary.**

## Method and limitations

- The neighbor comparison is a **spatial heuristic**, not a population-genetic significance test.
- Sample density, geographic sampling design, assignment uncertainty, and the choice of five neighbors can all affect the visual pattern.
- Color represents the chosen assignment label; it is not a measure of genetic distance.
- Geographic coordinates are shown with a simplified equirectangular projection and a simplified U.S. Census coastline extract.
- The demo dataset is synthetic. Do not use these outputs to infer stock structure, management boundaries, or individual origin.

## Data handling

Parsing happens in the browser; the README for this version reports that data are not uploaded to a backend. Review the implementation and browser network behavior before using private or sensitive records.

## Tech stack

Next.js 14, React 18, JavaScript, custom SVG rendering. No external map or chart rendering libraries are declared in the project's `package.json`.

## Run locally

```bash
git clone https://github.com/DanielBarletta81/microsat-atlas.git
cd microsat-atlas
npm install
npm run dev
```

Open `http://localhost:3150`.

To regenerate the simplified coastline asset from its source GeoJSON, see the script in `scripts/build-coast.mjs` and run `npm run coast` after checking its expected inputs.

## Next improvements

- Document the input schema with a sample CSV.
- Add a visual screenshot or short demonstration GIF.
- Add input validation tests and sample-data provenance notes.
- Support an explicit legend for uncertainty and unassigned samples.
- Explore how neighbor-count and distance thresholds change the outlier view.

**Maintainer:** Daniel Barletta
