// Demo dataset: SYNTHETIC microsatellite stock-assignment records, modeled on
// the published mixed-stock structure of Atlantic striped bass (Morone
// saxatilis): coastal fisheries from southern New England to the mid-Atlantic
// are mixtures dominated by Chesapeake- and Hudson-origin fish, with a smaller
// Delaware contribution — structure resolved by microsatellite mixed-stock and
// individual-assignment analyses (Wirgin, Waldman and colleagues; ASMFC stock
// assessments). Values here are generated, not measured. Load real data to
// replace this set.
import { mulberry32 } from './rng';

const SITES = [
  //  name, lat, lon, n, mix as [Hudson, Chesapeake, Delaware]
  ['Buzzards Bay, MA', 41.57, -70.82, 9, [0.62, 0.34, 0.04]],
  ['Narragansett Bay, RI', 41.5, -71.35, 8, [0.58, 0.38, 0.04]],
  ['Montauk, NY', 41.06, -71.94, 9, [0.55, 0.4, 0.05]],
  ['Western LI Sound, NY', 40.96, -73.56, 8, [0.78, 0.18, 0.04]],
  ['NY Harbor / Hudson, NY', 40.63, -74.04, 10, [0.86, 0.1, 0.04]],
  ['Sandy Hook, NJ', 40.44, -73.99, 8, [0.64, 0.28, 0.08]],
  ['Barnegat Inlet, NJ', 39.76, -74.1, 8, [0.42, 0.44, 0.14]],
  ['Great Bay / Mullica, NJ', 39.52, -74.32, 7, [0.3, 0.5, 0.2]],
  ['Cape May, NJ', 38.94, -74.91, 8, [0.2, 0.56, 0.24]],
  ['Delaware Bay, DE', 39.18, -75.24, 8, [0.12, 0.42, 0.46]],
  ['Choptank River, MD', 38.61, -76.07, 9, [0.03, 0.94, 0.03]],
  ['Potomac mouth, VA', 37.99, -76.25, 8, [0.04, 0.92, 0.04]],
  ['James River, VA', 37.02, -76.44, 8, [0.05, 0.9, 0.05]],
];
const POPS = ['Hudson', 'Chesapeake', 'Delaware'];

function pick(mix, r) {
  const x = r();
  return x < mix[0] ? 0 : x < mix[0] + mix[1] ? 1 : 2;
}

function buildRows() {
  const r = mulberry32(20261108);
  const rows = [];
  let n = 1;
  for (const [site, lat, lon, count, mix] of SITES) {
    for (let i = 0; i < count; i++) {
      const p = pick(mix, r);
      rows.push({
        sample_id: `MSX-${String(n++).padStart(3, '0')}`,
        site,
        lat: (lat + (r() - 0.5) * 0.12).toFixed(4),
        lon: (lon + (r() - 0.5) * 0.12).toFixed(4),
        population: POPS[p],
        q_assignment: (0.62 + r() * 0.37).toFixed(2),
        obs_heterozygosity: (0.58 + r() * 0.28).toFixed(2),
        loci_typed: String(10 + Math.floor(r() * 5)),
      });
    }
  }
  return rows;
}

const rows = buildRows();

export const DEMO = {
  name: 'Striped bass demo — synthetic, modeled on published stock structure',
  headers: ['sample_id', 'site', 'lat', 'lon', 'population', 'q_assignment', 'obs_heterozygosity', 'loci_typed'],
  rows,
};

export const DEMO_SOURCES = [
  ['Wirgin et al. — microsatellite stock identification of Atlantic striped bass', 'https://scholar.google.com/scholar?q=Wirgin+microsatellite+striped+bass+stock+identification'],
  ['Waldman et al. — mixed-stock analysis of coastal striped bass fisheries', 'https://scholar.google.com/scholar?q=Waldman+striped+bass+mixed+stock+analysis'],
  ['ASMFC Atlantic striped bass stock assessments', 'https://asmfc.org/species/atlantic-striped-bass'],
  ['NOAA Fisheries — Atlantic striped bass', 'https://www.fisheries.noaa.gov/species/atlantic-striped-bass'],
];
