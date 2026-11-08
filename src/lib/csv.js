// Minimal dependency-free CSV/TSV parser with quoted-field support.
// Excel users: copy cells and paste (Excel's clipboard is TSV), or Save As CSV.
export function parseDelimited(text) {
  const firstLine = text.slice(0, text.indexOf('\n') + 1 || text.length);
  const delim = firstLine.includes('\t') ? '\t' : ',';
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delim) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((c) => c.trim() !== '')) rows.push(row); }
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.trim());
  return {
    headers,
    rows: rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()]))),
  };
}

const LAT_NAMES = /^(lat|latitude|y|decimallatitude)$/i;
const LON_NAMES = /^(lon|lng|long|longitude|x|decimallongitude)$/i;
const CAT_NAMES = /^(pop|population|stock|cluster|assignment|assigned_pop|group|lineage|haplotype|dps)$/i;
const ID_NAMES = /^(id|sample|sample_id|specimen|tag)$/i;
const SITE_NAMES = /^(site|station|location|locality|waterbody)$/i;

export function detectColumns(headers, rows) {
  const numericCols = headers.filter((h) =>
    rows.slice(0, 50).every((r) => r[h] === '' || Number.isFinite(parseFloat(r[h]))));
  const find = (re) => headers.find((h) => re.test(h));
  const lat = find(LAT_NAMES) || numericCols.find((h) => rows.slice(0, 50).every((r) => Math.abs(parseFloat(r[h])) <= 90));
  const lon = find(LON_NAMES) || numericCols.find((h) => h !== lat && rows.slice(0, 50).every((r) => Math.abs(parseFloat(r[h])) <= 180));
  const categoricalCols = headers.filter((h) => !numericCols.includes(h) || find(CAT_NAMES) === h);
  return {
    lat, lon,
    id: find(ID_NAMES) || headers[0],
    site: find(SITE_NAMES) || null,
    category: find(CAT_NAMES) || categoricalCols.find((h) => h !== lat && h !== lon && !ID_NAMES.test(h) && !SITE_NAMES.test(h)) || null,
    numericCols: numericCols.filter((h) => h !== lat && h !== lon),
    categoricalCols: categoricalCols.filter((h) => h !== lat && h !== lon && !ID_NAMES.test(h)),
  };
}
